import React from 'react';
import ReactDOM from "react-dom/client";
import { ApolloClient, createHttpLink, InMemoryCache, ApolloProvider, split, gql } from "@apollo/client";
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from 'graphql-ws';
import App from './App';
import store from 'store2'
import { jwtDecode } from 'jwt-decode'
import ThemeProvider from './components/styled/design-system/ThemeProvider';
import GlobalStyles from './components/styled/design-system/GlobalStyles';

// Widget initialization function
export function initChatWidget(config = {}) {
  const {
    containerId = 'chat-widget-root',
    publicKey,
    graphqlHttpUrl,
    graphqlWsUrl,
    apiUrl,
    ipifyUrl
  } = config;

  // Set environment variables from config
  if (publicKey) window.REACT_APP_PUBLIC_KEY = publicKey;
  if (graphqlHttpUrl) window.REACT_APP_GRAPHQL_HTTP_URL = graphqlHttpUrl;
  if (graphqlWsUrl) window.REACT_APP_GRAPHQL_WS_URL = graphqlWsUrl;
  if (apiUrl) window.REACT_APP_API_URL = apiUrl;
  if (ipifyUrl) window.REACT_APP_IPIFY_URL = ipifyUrl;

  const httpLink = createHttpLink({ 
    uri: graphqlHttpUrl || import.meta.env.VITE_GRAPHQL_HTTP_URL 
  });

  const authLink = setContext((_, { headers }) => {
    const token = store("token");
    if (token === null) {
      return headers;
    }
    return {
      headers: {
        ...headers,
        authorization: `Bearer ${token}`
      }
    };
  });

  const wsLink = new GraphQLWsLink(createClient({
    url: graphqlWsUrl || import.meta.env.VITE_GRAPHQL_WS_URL,
    options: {
      reconnect: true,
      connectionParams: () => ({
        authToken: store("token")
      })
    }
  }));

  const link = split(
    ({ query }) => {
      const { kind, operation } = getMainDefinition(query)
      return kind === 'OperationDefinition' && operation === 'subscription'
    },
    wsLink,
    authLink.concat(httpLink),
  )

  const client = new ApolloClient({
    link,
    cache: new InMemoryCache().restore(window.__APOLLO_STATE__),
  })

  const ClientApp = ({ error }) => (
    <ApolloProvider client={client}>
      <ThemeProvider>
        <GlobalStyles />
        <App error={error} />
      </ThemeProvider>
    </ApolloProvider>
  );

  const CONSUMER_LOGIN = gql`
    mutation consumerLogin($publicKey: UUID!) {
      consumerLogin(input: {
        publicKey: $publicKey
      }) {
        jwtToken
      }
    }
  `;

  const loginClient = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
  });

  // Find or create container
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    
    // Add consistent styling to the widget container
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 400px;
      height: 700px;
      z-index: 9999;
      pointer-events: none;
    `;
    
    // Add responsive styles for mobile
    const mediaQuery = window.matchMedia('(max-width: 450px)');
    const handleMobileView = (e) => {
      if (e.matches) {
        container.style.width = '100%';
        container.style.height = '100%';
      } else {
        container.style.width = '400px';
        container.style.height = '700px';
      }
    };
    
    mediaQuery.addListener(handleMobileView);
    handleMobileView(mediaQuery);
    
    document.body.appendChild(container);
  }
  
  // Ensure pointer events work for interactive elements
  container.style.pointerEvents = 'none';
  const style = document.createElement('style');
  style.textContent = `
    #${containerId} * {
      pointer-events: auto;
    }
  `;
  document.head.appendChild(style);

  const root = ReactDOM.createRoot(container);

  const renderApp = (token, error) => {
    try {
      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          store('websiteId', decodedToken.user_id)
          store("token", token);
        } catch (tokenError) {
          console.error('Failed to decode token:', tokenError)
        }
      }

      root.render(
        <React.StrictMode>
          <ClientApp error={error} />
        </React.StrictMode>
      );

    } catch (renderError) {
      console.error('Failed to render app even with fallbacks:', renderError)
    }
  }

  const attemptLogin = () => {
    loginClient.mutate({
      mutation: CONSUMER_LOGIN,
      variables: {
        publicKey: publicKey || import.meta.env.VITE_PUBLIC_KEY
      }
    }).then(response => {
      const token = response?.data?.consumerLogin?.jwtToken;
      renderApp(token, null);
    }).catch(error => {
      console.error("Login mutation failed", error);
      renderApp(null, new Error("Failed to initialize chat. Please try again."));
    });
  }

  if (typeof window !== 'undefined') {
    window.chatInitialization = { attemptLogin };
    window.ChatWidget = {
      init: initChatWidget,
      attemptLogin
    }
  }

  renderApp(null, null);

  // Return cleanup function
  return () => {
    root.unmount();
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    window.ChatWidget = null;
  };
}

// Auto-initialize if config is provided via window
if (typeof window !== 'undefined' && window.ChatWidgetConfig) {
  initChatWidget(window.ChatWidgetConfig);
}

// Export for manual initialization
export default { initChatWidget };