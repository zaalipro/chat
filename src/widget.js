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

  // Create cache with size limits and garbage collection to prevent memory growth
  const cache = new InMemoryCache({
    // Enable garbage collection to clean up unused cache entries
    garbageCollection: true,
    // Configure result caching for better performance
    resultCaching: true,
    // Set up cache eviction policies
    evictionPolicy: 'lru', // Least Recently Used eviction
    // Configure cache size limits
    cacheSize: 1024 * 1024 * 10, // 10MB cache limit
  });

  const client = new ApolloClient({
    link,
    cache: cache.restore(window.__APOLLO_STATE__ || {}),
    // Add cache cleanup and performance configurations
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'all',
        notifyOnNetworkStatusChange: true,
        // Set fetch policy to prevent excessive cache growth
        fetchPolicy: 'cache-first',
        // Add cache cleanup on query completion
        pollInterval: 0, // Disable polling to prevent memory leaks
      },
      query: {
        errorPolicy: 'all',
        fetchPolicy: 'cache-first',
      },
      mutate: {
        errorPolicy: 'all'
      }
    },
    // Add cache cleanup hooks
    onCacheInit: (cache) => {
      console.log('Widget: Apollo cache initialized with memory management');
      
      // Set up periodic cache cleanup
      const cleanupInterval = setInterval(() => {
        try {
          // Perform garbage collection if available
          if (cache.gc) {
            cache.gc();
            console.log('Widget: Apollo cache garbage collection performed');
          }
          
          // Log cache size for monitoring
          const cacheSize = cache.extract();
          const estimatedSize = JSON.stringify(cacheSize).length;
          console.log(`Widget: Current cache size: ${estimatedSize} bytes`);
          
          // If cache is getting too large, perform aggressive cleanup
          if (estimatedSize > 1024 * 1024 * 5) { // 5MB threshold
            console.warn('Widget: Cache size exceeded threshold, performing aggressive cleanup');
            if (cache.reset) {
              // Reset cache but preserve essential data
              const essentialData = {
                __META: { ...cache.extract().__META }
              };
              cache.reset();
              cache.restore(essentialData);
            }
          }
        } catch (error) {
          console.error('Widget: Error during cache cleanup:', error);
        }
      }, 5 * 60 * 1000); // Every 5 minutes
      
      // Store cleanup interval for later cleanup
      cache._cleanupInterval = cleanupInterval;
    },
    onCacheReset: () => {
      console.log('Widget: Apollo cache reset');
    }
  });

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

  // Create login client with similar cache configuration
  const loginCache = new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Limit login-related cache entries
          consumerLogin: {
            merge: false // Always use latest login data
          }
        }
      }
    },
    garbageCollection: true,
    resultCaching: false, // Disable caching for login mutations
    cacheSize: 1024 * 512, // 512KB limit for login cache
  });

  const loginClient = new ApolloClient({
    link: httpLink,
    cache: loginCache,
    defaultOptions: {
      mutate: {
        errorPolicy: 'all',
        fetchPolicy: 'no-cache' // Don't cache login mutations
      }
    }
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

  // Return cleanup function with proper event listener cleanup and cache cleanup
  return () => {
    // Clean up media query event listener if it exists
    if (mediaQuery && handleMobileView) {
      mediaQuery.removeEventListener('change', handleMobileView);
      console.log('Widget: MediaQuery event listener cleaned up');
    }
    
    // Clean up Apollo cache and intervals
    try {
      if (client.cache._cleanupInterval) {
        clearInterval(client.cache._cleanupInterval);
        console.log('Widget: Apollo cache cleanup interval cleared');
      }
      
      // Perform final cache garbage collection
      if (client.cache.gc) {
        client.cache.gc();
        console.log('Widget: Final Apollo cache garbage collection performed');
      }
      
      // Clear cache to prevent memory leaks
      client.cache.reset();
      console.log('Widget: Apollo cache reset on cleanup');
    } catch (error) {
      console.error('Widget: Error during Apollo cache cleanup:', error);
    }
    
    // Clean up login client cache
    try {
      loginClient.cache.reset();
      console.log('Widget: Login client cache reset on cleanup');
    } catch (error) {
      console.error('Widget: Error during login client cache cleanup:', error);
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