import React, { Suspense } from 'react';
import styled from 'styled-components';

// Loading fallback component
const LoadingFallback = ({ message = 'Loading...' }) => (
  <LoadingContainer>
    <LoadingSpinner />
    <LoadingText>{message}</LoadingText>
  </LoadingContainer>
);

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  min-height: 200px;
`;

const LoadingSpinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  color: #666;
  font-size: 14px;
  text-align: center;
`;

// Error boundary for lazy loaded components
class LazyComponentError extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy component loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <ErrorTitle>Unable to load component</ErrorTitle>
          <ErrorMessage>Please refresh the page and try again.</ErrorMessage>
          <RetryButton onClick={() => window.location.reload()}>
            Refresh Page
          </RetryButton>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  min-height: 200px;
  text-align: center;
`;

const ErrorTitle = styled.h3`
  color: #e74c3c;
  margin-bottom: 8px;
  font-size: 18px;
`;

const ErrorMessage = styled.p`
  color: #666;
  margin-bottom: 20px;
  font-size: 14px;
`;

const RetryButton = styled.button`
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background: #2980b9;
  }
`;

// ✅ LAZY LOADED COMPONENTS
export const LazyChatContainer = React.lazy(() => import('../ChatContainer'));
export const LazyMessageForm = React.lazy(() => import('../MessageForm'));
export const LazyChatHeader = React.lazy(() => import('../ChatHeader'));
export const LazyChatMessage = React.lazy(() => import('../ChatMessage'));
export const LazyCreateChat = React.lazy(() => import('../CreateChat'));
export const LazyEndChat = React.lazy(() => import('../EndChat'));
export const LazyRate = React.lazy(() => import('../Rate'));
export const LazyWaitingForAgent = React.lazy(() => import('../WaitingForAgent'));
export const LazyOffline = React.lazy(() => import('../Offline'));

// ✅ DYNAMIC IMPORTS FOR HEAVY LIBRARIES
export const loadMoment = async () => {
  try {
    const moment = await import('moment');
    return moment.default;
  } catch (error) {
    console.error('Failed to load moment:', error);
    // Fallback to native Date if moment fails to load
    return {
      now: () => new Date(),
      format: (date, format) => date.toLocaleString(),
      fromNow: (date) => 'just now'
    };
  }
};

export const loadAxios = async () => {
  try {
    const axios = await import('axios');
    return axios.default;
  } catch (error) {
    console.error('Failed to load axios:', error);
    // Fallback to fetch API
    return {
      get: (url, options) => fetch(url, options).then(res => res.json()),
      post: (url, data, options) => fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        ...options
      }).then(res => res.json())
    };
  }
};

export const loadFormik = async () => {
  try {
    const formik = await import('formik');
    return formik;
  } catch (error) {
    console.error('Failed to load formik:', error);
    throw error; // Formik is critical, so we don't provide a fallback
  }
};

// ✅ NATIVE DATE UTILITIES (no external dependencies)
export const loadDateUtils = async () => {
  // Return native date utilities without external dependencies
  return {
    format: (date, formatStr) => {
      if (!date) return '';
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      
      // Simple format handling
      switch (formatStr) {
        case 'YYYY-MM-DD':
          return d.toISOString().split('T')[0];
        case 'MM/DD/YYYY':
          return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
        default:
          return d.toLocaleString();
      }
    },
    isAfter: (date, dateToCompare) => new Date(date) > new Date(dateToCompare),
    isBefore: (date, dateToCompare) => new Date(date) < new Date(dateToCompare),
    addDays: (date, amount) => {
      const d = new Date(date);
      d.setDate(d.getDate() + amount);
      return d;
    },
    subDays: (date, amount) => {
      const d = new Date(date);
      d.setDate(d.getDate() - amount);
      return d;
    },
    fromNow: (date) => {
      const now = new Date();
      const past = new Date(date);
      const diffMs = now - past;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins} minutes ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays < 7) return `${diffDays} days ago`;
      return past.toLocaleDateString();
    }
  };
};

// ✅ UTILITY FUNCTIONS FOR LAZY LOADING
export const createLazyComponent = (importFunction, fallback = LoadingFallback) => {
  const LazyComponent = React.lazy(importFunction);
  
  return (props) => (
    <LazyComponentError>
      <Suspense fallback={<fallback />}>
        <LazyComponent {...props} />
      </Suspense>
    </LazyComponentError>
  );
};

// ✅ PRELOADING UTILITIES
export const preloadComponent = (importFunction) => {
  // Start loading the component in the background
  const componentPromise = importFunction();
  
  // Return a promise that resolves when the component is loaded
  return componentPromise.then(module => module.default || module);
};

// ✅ PREFETCHING STRATEGIES
export const prefetchOnIdle = (importFunction) => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      preloadComponent(importFunction);
    });
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(() => {
      preloadComponent(importFunction);
    }, 1000);
  }
};

export const prefetchOnHover = (importFunction, element) => {
  if (element && typeof element.addEventListener === 'function') {
    const handleMouseEnter = () => {
      preloadComponent(importFunction);
      element.removeEventListener('mouseenter', handleMouseEnter);
    };
    
    element.addEventListener('mouseenter', handleMouseEnter);
  }
};

// ✅ CHUNK LOADING MONITORING
export const monitorChunkLoading = () => {
  // Monitor chunk loading performance
  if ('performance' in window && 'getEntriesByType' in performance) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name.includes('.js') && entry.duration > 1000) {
          console.warn(`Slow chunk loading detected: ${entry.name} took ${entry.duration}ms`);
        }
      });
    });
    
    observer.observe({ entryTypes: ['resource'] });
  }
};

// ✅ BUNDLE SIZE TRACKING
export const trackBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    // Track bundle size in development
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
      if (script.src.includes('chunk')) {
        fetch(script.src)
          .then(response => response.text())
          .then(content => {
            const sizeKB = (new Blob([content]).size / 1024).toFixed(2);
            console.log(`Chunk ${script.src}: ${sizeKB} KB`);
          })
          .catch(error => {
            console.error('Error tracking chunk size:', error);
          });
      }
    });
  }
};

// ✅ ERROR HANDLING FOR CHUNK LOADING
export const handleChunkLoadingError = (error) => {
  console.error('Chunk loading error:', error);
  
  // Try to recover by reloading the page
  if (error.message && error.message.includes('Loading chunk')) {
    // Clear any cached chunks and reload
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  }
};

// ✅ PERFORMANCE METRICS
export const getLoadingMetrics = () => {
  if ('performance' in window && 'getEntriesByType' in performance) {
    const navigationEntries = performance.getEntriesByType('navigation');
    const navigation = navigationEntries[0];
    
    if (navigation) {
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime,
        firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime
      };
    }
  }
  return null;
};

// ✅ INITIALIZATION
export const initializeLazyLoading = () => {
  // Initialize monitoring and tracking
  monitorChunkLoading();
  trackBundleSize();
  
  // Log initialization
  console.log('🚀 Lazy loading system initialized');
};

// Export the loading fallback for use in other components
export { LoadingFallback };

// Export the error boundary for use in other components
export { LazyComponentError };