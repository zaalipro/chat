/**
 * Chat Widget Embed Script - Vite Build Version
 * 
 * This script loads the Vite-built chat widget and can be embedded in any HTML page.
 * 
 * Usage Options:
 * 
 * 1. UMD Build (Recommended for most cases):
 * <script src="https://yourdomain.com/chat-widget.umd.js"></script>
 * <link rel="stylesheet" href="https://yourdomain.com/assets/null">
 * <script>
 *   ChatWidget.initChatWidget({
 *     publicKey: 'your-public-key',
 *     graphqlHttpUrl: 'https://your-api.com/graphql',
 *     graphqlWsUrl: 'wss://your-api.com/graphql'
 *   });
 * </script>
 * 
 * 2. ES Module Build:
 * <script type="module">
 *   import { initChatWidget } from 'https://yourdomain.com/chat-widget.es.js';
 *   initChatWidget({
 *     publicKey: 'your-public-key',
 *     graphqlHttpUrl: 'https://your-api.com/graphql',
 *     graphqlWsUrl: 'wss://your-api.com/graphql'
 *   });
 * </script>
 * 
 * 3. Legacy Embed Script (this file):
 * <script src="https://yourdomain.com/embed.js"></script>
 * <script>
 *   ChatWidget.init({
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
      container.style.position = 'fixed';
      container.style.zIndex = '9999';
      
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

  // Load Vite-built widget bundle
  function loadViteWidget(container) {
    const baseUrl = getBaseUrl();
    
    // Load UMD bundle (CSS is now bundled with JS)
    const widgetScript = document.createElement('script');
    widgetScript.src = baseUrl + '/chat-widget.umd.js';
    widgetScript.onload = function() {
      // Initialize the widget using the UMD global
      if (window.ChatWidget && window.ChatWidget.initChatWidget) {
        window.ChatWidget.initChatWidget({
          containerId: container.id,
          publicKey: config.publicKey,
          graphqlHttpUrl: config.apiUrl,
          graphqlWsUrl: config.apiUrl.replace('http', 'ws'),
          defaultContractId: config.defaultContractId,
          companyLogoUrl: config.companyLogoUrl,
          apiUrl: config.apiUrl,
          ipifyUrl: config.ipifyUrl
        });
        console.log('ChatWidget: Loaded successfully');
      } else {
        console.error('ChatWidget: UMD global not found');
      }
    };
    widgetScript.onerror = function() {
      console.error('ChatWidget: Failed to load Vite widget bundle');
    };
    
    document.head.appendChild(widgetScript);
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

      // Create container
      const container = createWidgetContainer();
      if (!container) {
        return;
      }

      // Load Vite widget
      loadViteWidget(container);
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
