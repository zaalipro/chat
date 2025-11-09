import React from 'react';
import ReactDOM from "react-dom/client";
import { ApolloClient, createHttpLink, InMemoryCache, ApolloProvider, split, gql } from "@apollo/client";
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from 'graphql-ws';
import App from './App';
import store from 'store2'
import secureStore from './utils/crypto';
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

  const authLink = setContext(async (_, { headers }) => {
    let token = null;
    
    // Try to get token from secure storage first
    try {
      token = await secureStore.get("token");
      console.log('Widget: Token retrieved successfully from secure storage');
    } catch (error) {
      console.error('Widget: Failed to retrieve token from secure storage:', error);
      // Fallback to regular storage
      try {
        token = store("token");
        console.log('Widget: Token retrieved from fallback storage');
      } catch (fallbackError) {
        console.error('Widget: Failed to retrieve token from fallback storage:', fallbackError);
        token = null;
      }
    }
    
    // Ensure token is a string and not null/undefined
    if (!token || typeof token !== 'string') {
      console.log('Widget: No valid token available, proceeding without authentication');
      return headers;
    }
    
    console.log('Widget: Adding authorization header with token');
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
      connectionParams: async () => {
        let authToken = null;
        
        // Try to get token from secure storage first
        try {
          authToken = await secureStore.get("token");
          console.log('Widget: Auth token retrieved successfully from secure storage for WebSocket');
        } catch (error) {
          console.error('Widget: Failed to retrieve auth token from secure storage for WebSocket:', error);
          // Fallback to regular storage
          try {
            authToken = store("token");
            console.log('Widget: Auth token retrieved from fallback storage for WebSocket');
          } catch (fallbackError) {
            console.error('Widget: Failed to retrieve auth token from fallback storage for WebSocket:', fallbackError);
            authToken = null;
          }
        }
        
        // Ensure authToken is a string and not null/undefined
        if (!authToken || typeof authToken !== 'string') {
          console.log('Widget: No valid auth token available for WebSocket connection');
          return {};
        }
        
        console.log('Widget: Adding auth token to WebSocket connection params');
        return { authToken };
      }
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
  let mediaQuery = null;
  let handleMobileView = null;
  
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
    
    // Add responsive styles for mobile with proper event listener cleanup
    mediaQuery = window.matchMedia('(max-width: 450px)');
    handleMobileView = (e) => {
      if (e.matches) {
        container.style.width = '100%';
        container.style.height = '100%';
      } else {
        container.style.width = '400px';
        container.style.height = '700px';
      }
    };
    
    // Use modern addEventListener with cleanup
    mediaQuery.addEventListener('change', handleMobileView);
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

  const renderApp = async (token, error) => {
    try {
      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          store('websiteId', decodedToken.user_id)
          
          // Store token securely
          try {
            await secureStore.set("token", token);
            console.log('Widget: Token stored securely in renderApp');
          } catch (storageError) {
            console.error('Widget: Failed to store token securely in renderApp, using fallback:', storageError);
            // Fallback to regular storage
            store("token", token);
            console.log('Widget: Token stored using fallback storage in renderApp');
          }
          
        } catch (tokenError) {
          console.error('Widget: Failed to decode token:', tokenError)
        }
      }

      root.render(
        <React.StrictMode>
          <ClientApp error={error} />
        </React.StrictMode>
      );

    } catch (renderError) {
      console.error('Widget: Failed to render app even with fallbacks:', renderError)
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
      console.error("Widget: Login mutation failed", error);
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

  // Return cleanup function with proper event listener cleanup
  return () => {
    // Clean up media query event listener if it exists
    if (mediaQuery && handleMobileView) {
      mediaQuery.removeEventListener('change', handleMobileView);
      console.log('Widget: MediaQuery event listener cleaned up');
    }
    
    root.unmount();
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    
    // Clean up the style element
    if (style && style.parentNode) {
      style.parentNode.removeChild(style);
    }
    
    window.ChatWidget = null;
    console.log('Widget: All resources cleaned up successfully');
  };
}

// Auto-initialize if config is provided via window
if (typeof window !== 'undefined' && window.ChatWidgetConfig) {
  initChatWidget(window.ChatWidgetConfig);
}

// Export for manual initialization
export default { initChatWidget };