/**
 * Chat Widget Embed Script
 * 
 * This script can be embedded in any HTML page to add the chat widget.
 * Usage:
 * <script src="https://yourdomain.com/embed.js"></script>
 * <script>
 *   ChatWidget.init({
 *     containerId: 'chat-widget-container', // optional, defaults to creating floating widget
 *     apiUrl: 'https://your-api.com/graphql',
 *     publicKey: 'your-public-key'
 *   });
 * </script>
 */

(function(window) {
  'use strict';

  // Prevent multiple initializations
  if (window.ChatWidget) {
    return;
  }

  // Widget configuration
  let config = {
    containerId: null,
    apiUrl: '',
    publicKey: '',
    position: 'bottom-right', // bottom-right, bottom-left, top-right, top-left
    theme: {
      primaryColor: 'rgba(39, 175, 96, 1)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }
  };

  // Create widget container
  function createWidgetContainer() {
    const container = document.createElement('div');
    container.id = 'chat-widget-root';
    
    if (config.containerId) {
      // Embed in existing container
      const targetContainer = document.getElementById(config.containerId);
      if (targetContainer) {
        targetContainer.appendChild(container);
      } else {
        console.error('ChatWidget: Container with ID "' + config.containerId + '" not found');
        return null;
      }
    } else {
      // Create floating widget
      container.className = 'chat-widget-embed';
      
      // Apply positioning
      const positions = {
        'bottom-right': { bottom: '20px', right: '20px' },
        'bottom-left': { bottom: '20px', left: '20px' },
        'top-right': { top: '20px', right: '20px' },
        'top-left': { top: '20px', left: '20px' }
      };
      
      const pos = positions[config.position] || positions['bottom-right'];
      Object.assign(container.style, pos);
      
      document.body.appendChild(container);
    }
    
    return container;
  }

  // Load CSS if not already loaded
  function loadCSS() {
    if (document.getElementById('chat-widget-css')) {
      return;
    }

    const link = document.createElement('link');
    link.id = 'chat-widget-css';
    link.rel = 'stylesheet';
    link.href = getBaseUrl() + '/static/css/main.css'; // Adjust path as needed
    document.head.appendChild(link);
  }

  // Get base URL from script src
  function getBaseUrl() {
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].src;
      if (src.includes('embed.js')) {
        return src.replace('/embed.js', '');
      }
    }
    return '';
  }

  // Load React app bundle
  function loadReactApp(container) {
    // Set environment variables for the React app
    window.REACT_APP_GRAPHQL_HTTP_URL = config.apiUrl;
    window.REACT_APP_GRAPHQL_WS_URL = config.apiUrl.replace('http', 'ws');
    window.REACT_APP_PUBLIC_KEY = config.publicKey;

    // Load React bundle (adjust paths as needed)
    const reactScript = document.createElement('script');
    reactScript.src = getBaseUrl() + '/static/js/main.js'; // Path to built React bundle
    reactScript.onload = function() {
      // React app should automatically render into the container
      console.log('ChatWidget: Loaded successfully');
    };
    reactScript.onerror = function() {
      console.error('ChatWidget: Failed to load React bundle');
    };
    
    document.head.appendChild(reactScript);
  }

  // Widget API
  window.ChatWidget = {
    init: function(options) {
      // Merge configuration
      Object.assign(config, options || {});
      
      // Validation
      if (!config.apiUrl || !config.publicKey) {
        console.error('ChatWidget: apiUrl and publicKey are required');
        return;
      }

      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
          window.ChatWidget.init(options);
        });
        return;
      }

      // Load CSS
      loadCSS();

      // Create container
      const container = createWidgetContainer();
      if (!container) {
        return;
      }

      // Load React app
      loadReactApp(container);
    },

    show: function() {
      const container = document.getElementById('chat-widget-root');
      if (container) {
        container.style.display = 'block';
      }
    },

    hide: function() {
      const container = document.getElementById('chat-widget-root');
      if (container) {
        container.style.display = 'none';
      }
    },

    destroy: function() {
      const container = document.getElementById('chat-widget-root');
      if (container) {
        container.remove();
      }
      
      const css = document.getElementById('chat-widget-css');
      if (css) {
        css.remove();
      }
    },

    updateConfig: function(newConfig) {
      Object.assign(config, newConfig);
    }
  };

  // Auto-initialize if data attributes are present on script tag
  const scriptTag = document.querySelector('script[src*="embed.js"]');
  if (scriptTag) {
    const autoConfig = {
      apiUrl: scriptTag.getAttribute('data-api-url'),
      publicKey: scriptTag.getAttribute('data-public-key'),
      containerId: scriptTag.getAttribute('data-container-id'),
      position: scriptTag.getAttribute('data-position') || 'bottom-right'
    };
    
    if (autoConfig.apiUrl && autoConfig.publicKey) {
      window.ChatWidget.init(autoConfig);
    }
  }

})(window);
