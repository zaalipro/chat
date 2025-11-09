import React, { useCallback, useRef, useEffect } from 'react';
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
import ApolloCacheMonitor from './utils/apollo-cache-monitor';

// ✅ CUSTOM HOOK FOR ROBUST EVENT LISTENER MANAGEMENT
const useEventListener = (target, event, handler, options = {}) => {
  const savedHandler = useRef(handler);
  const savedTarget = useRef(target);
  const savedOptions = useRef(options);

  // Update refs if dependencies change
  useEffect(() => {
    savedHandler.current = handler;
    savedTarget.current = target;
    savedOptions.current = options;
  }, [handler, target, options]);

  useEffect(() => {
    if (!savedTarget.current) return;

    const eventListener = (event) => {
      try {
        const startTime = performance.now();
        savedHandler.current(event);
        const endTime = performance.now();
        
        // Log performance metrics in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`Event ${event.type} handled in ${(endTime - startTime).toFixed(2)}ms`);
        }
      } catch (error) {
        console.error(`Error in ${event.type} event handler:`, error);
      }
    };

    // Add event listener with options
    savedTarget.current.addEventListener(event, eventListener, savedOptions.current);
    
    // Return cleanup function
    return () => {
      savedTarget.current.removeEventListener(event, eventListener, savedOptions.current);
      console.log(`Widget: ${event} event listener cleaned up`);
    };
  }, [event]);
};

// ✅ ENHANCED MEDIA QUERY MANAGER WITH LEGACY FALLBACKS
class MediaQueryManager {
  constructor() {
    this.listeners = new Map(); // Track all listeners for cleanup
    this.legacyFallbacks = new Map(); // Track legacy fallbacks
  }

  addListener(query, handler) {
    const mediaQuery = window.matchMedia(query);
    const listenerId = `${query}_${Date.now()}`;
    
    // Modern approach with addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      this.listeners.set(listenerId, {
        mediaQuery,
        handler,
        type: 'modern'
      });
    } else {
      // Legacy fallback for older browsers
      mediaQuery.addListener(handler);
      this.legacyFallbacks.set(listenerId, {
        mediaQuery,
        handler,
        type: 'legacy'
      });
      console.warn('Widget: Using legacy addListener fallback for MediaQuery');
    }
    
    // Initial call
    handler(mediaQuery);
    
    return listenerId;
  }

  removeListener(listenerId) {
    // Try modern cleanup first
    if (this.listeners.has(listenerId)) {
      const { mediaQuery, handler } = this.listeners.get(listenerId);
      mediaQuery.removeEventListener('change', handler);
      this.listeners.delete(listenerId);
      return true;
    }
    
    // Try legacy cleanup
    if (this.legacyFallbacks.has(listenerId)) {
      const { mediaQuery, handler } = this.legacyFallbacks.get(listenerId);
      mediaQuery.removeListener(handler);
      this.legacyFallbacks.delete(listenerId);
      return true;
    }
    
    return false;
  }

  cleanup() {
    // Clean up all modern listeners
    this.listeners.forEach(({ mediaQuery, handler }, listenerId) => {
      mediaQuery.removeEventListener('change', handler);
      console.log(`Widget: Modern MediaQuery listener ${listenerId} cleaned up`);
    });
    this.listeners.clear();
    
    // Clean up all legacy listeners
    this.legacyFallbacks.forEach(({ mediaQuery, handler }, listenerId) => {
      mediaQuery.removeListener(handler);
      console.log(`Widget: Legacy MediaQuery listener ${listenerId} cleaned up`);
    });
    this.legacyFallbacks.clear();
    
    console.log('Widget: All MediaQuery listeners cleaned up');
  }
}

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

  // Create cache with enhanced memory management and type policies
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
    // Add cache cleanup hooks with enhanced monitoring
    onCacheInit: (cache) => {
      console.log('Widget: Apollo cache initialized with enhanced memory management');
      
      // Initialize advanced cache monitor
      const cacheMonitor = new ApolloCacheMonitor(cache, {
        monitoringInterval: 60000, // 1 minute
        maxCacheSize: 1024 * 1024 * 10, // 10MB
        warningThreshold: 1024 * 1024 * 5, // 5MB
        criticalThreshold: 1024 * 1024 * 8, // 8MB
        enablePerformanceMetrics: true,
        enableMemoryLeakDetection: true
      });
      
      // Start monitoring
      cacheMonitor.startMonitoring();
      
      // Store monitor instance for cleanup
      cache._cacheMonitor = cacheMonitor;
      
      // Set up periodic cache cleanup as fallback
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
          console.log(`Widget: Current cache size: ${(estimatedSize / 1024).toFixed(2)}KB`);
          
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
      
      // Generate and log initial cache report
      setTimeout(() => {
        const report = cacheMonitor.generateReport();
        console.log('🔍 Initial Cache Report:', report);
      }, 2000);
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
  let mediaQueryManager = null;
  let mobileViewListenerId = null;
  
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
    
    // ✅ ENHANCED RESPONSIVE HANDLING WITH PROPER CLEANUP
    mediaQueryManager = new MediaQueryManager();
    
    const handleMobileView = (e) => {
      try {
        if (e.matches) {
          container.style.width = '100%';
          container.style.height = '100%';
        } else {
          container.style.width = '400px';
          container.style.height = '700px';
        }
      } catch (error) {
        console.error('Widget: Error in mobile view handler:', error);
      }
    };
    
    // Add listener with proper cleanup tracking
    mobileViewListenerId = mediaQueryManager.addListener('(max-width: 450px)', handleMobileView);
    
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
      attemptLogin,
      // Expose cache monitoring utilities for debugging
      getCacheReport: () => {
        if (client.cache._cacheMonitor) {
          return client.cache._cacheMonitor.generateReport();
        }
        return null;
      },
      getCacheMetrics: () => {
        if (client.cache._cacheMonitor) {
          return client.cache._cacheMonitor.getMetrics();
        }
        return null;
      }
    }
  }

  renderApp(null, null);

  // ✅ ENHANCED CLEANUP FUNCTION WITH COMPREHENSIVE EVENT LISTENER CLEANUP
  return () => {
    console.log('Widget: Starting comprehensive cleanup...');
    
    // ✅ CLEAN UP MEDIA QUERY MANAGER AND ALL LISTENERS
    if (mediaQueryManager) {
      mediaQueryManager.cleanup();
      console.log('Widget: MediaQuery manager and all listeners cleaned up');
    }
    
    // ✅ CLEAN UP ADVANCED CACHE MONITOR
    try {
      if (client.cache._cacheMonitor) {
        // Generate final cache report before cleanup
        const finalReport = client.cache._cacheMonitor.generateReport();
        console.log('🔍 Final Cache Report:', finalReport);
        
        // Stop monitoring and destroy monitor
        client.cache._cacheMonitor.destroy();
        console.log('Widget: Advanced cache monitor stopped and destroyed');
      }
      
      // Clean up legacy cleanup interval
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
    
    // ✅ CLEAN UP LOGIN CLIENT CACHE
    try {
      loginClient.cache.reset();
      console.log('Widget: Login client cache reset on cleanup');
    } catch (error) {
      console.error('Widget: Error during login client cache cleanup:', error);
    }
    
    // ✅ CLEAN UP REACT ROOT
    root.unmount();
    
    // ✅ CLEAN UP DOM ELEMENTS
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    
    // ✅ CLEAN UP STYLE ELEMENT
    if (style && style.parentNode) {
      style.parentNode.removeChild(style);
    }
    
    // ✅ CLEAN UP GLOBAL REFERENCES
    window.ChatWidget = null;
    window.chatInitialization = null;
    
    console.log('Widget: All resources cleaned up successfully');
  };
}

// Auto-initialize if config is provided via window
if (typeof window !== 'undefined' && window.ChatWidgetConfig) {
  initChatWidget(window.ChatWidgetConfig);
}

// Export for manual initialization
export default { initChatWidget };