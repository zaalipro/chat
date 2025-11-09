import React, { Suspense } from 'react';
import ReactDOM from "react-dom/client";
import * as serviceWorker from './serviceWorker';
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
import { WebsiteProvider } from './context/WebsiteContext';

const httpLink = createHttpLink({ uri: import.meta.env.VITE_GRAPHQL_HTTP_URL })

const authLink = setContext(async (_, { headers }) => {
  let token = null;
  
  // Try to get token from secure storage first
  try {
    token = await secureStore.get("token");
    console.log('Token retrieved successfully from secure storage');
  } catch (error) {
    console.error('Failed to retrieve token from secure storage:', error);
    // Fallback to regular storage
    try {
      token = store("token");
      console.log('Token retrieved from fallback storage');
    } catch (fallbackError) {
      console.error('Failed to retrieve token from fallback storage:', fallbackError);
      token = null;
    }
  }
  
  // Ensure token is a string and not null/undefined
  if (!token || typeof token !== 'string') {
    console.log('No valid token available, proceeding without authentication');
    return headers;
  }
  
  console.log('Adding authorization header with token');
  return {
    headers: {
      ...headers,
      authorization: `Bearer ${token}`
    }
  };
});

const wsLink = new GraphQLWsLink(createClient({
  url: import.meta.env.VITE_GRAPHQL_WS_URL,
  options: {
    reconnect: true,
    connectionParams: async () => {
      let authToken = null;
      
      // Try to get token from secure storage first
      try {
        authToken = await secureStore.get("token");
        console.log('Auth token retrieved successfully from secure storage for WebSocket');
      } catch (error) {
        console.error('Failed to retrieve auth token from secure storage for WebSocket:', error);
        // Fallback to regular storage
        try {
          authToken = store("token");
          console.log('Auth token retrieved from fallback storage for WebSocket');
        } catch (fallbackError) {
          console.error('Failed to retrieve auth token from fallback storage for WebSocket:', fallbackError);
          authToken = null;
        }
      }
      
      // Ensure authToken is a string and not null/undefined
      if (!authToken || typeof authToken !== 'string') {
        console.log('No valid auth token available for WebSocket connection');
        return {};
      }
      
      console.log('Adding auth token to WebSocket connection params');
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
      <Suspense fallback={
        <div className="segment dimmer active">
          <div className="loader-container">
            <div className="loader"></div>
          </div>
        </div>
      }>
        <WebsiteProvider>
          <App error={error} />
        </WebsiteProvider>
      </Suspense>
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

const root = ReactDOM.createRoot(document.getElementById("root"));

const renderApp = async (token, error, targetElement = null) => {
  try {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        store('websiteId', decodedToken.user_id)
        
        // Store token securely
        try {
          await secureStore.set("token", token);
          console.log('Token stored securely in renderApp');
        } catch (storageError) {
          console.error('Failed to store token securely in renderApp, using fallback:', storageError);
          // Fallback to regular storage
          store("token", token);
          console.log('Token stored using fallback storage in renderApp');
        }
        
      } catch (tokenError) {
        console.error('Failed to decode token:', tokenError)
      }
    }

    const renderTarget = targetElement ? ReactDOM.createRoot(targetElement) : root;

    renderTarget.render(
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
      publicKey: import.meta.env.VITE_PUBLIC_KEY
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
  window.ChatApp = {
    render: renderApp,
    client: loginClient,
    attemptLogin
  };
}

renderApp(null, null);

serviceWorker.unregister();


// Hot Module Replacement
if (import.meta.hot) {
  import.meta.hot.accept();
}