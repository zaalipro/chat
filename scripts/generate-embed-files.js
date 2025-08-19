#!/usr/bin/env node

/**
 * Generate embed files for the chat widget
 * This script creates the embed.js and embed-example.html files in the dist directory
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, '..', 'dist');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Get the CSS filename from the build (it has a hash)
const assetsDir = path.join(distDir, 'assets');
let cssFileName = 'chat.css'; // fallback
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  const cssFile = files.find(file => file.startsWith('chat-') && file.endsWith('.css'));
  if (cssFile) {
    cssFileName = cssFile;
  }
}

// Generate embed.js
const embedJs = `/**
 * Chat Widget Embed Script - Vite Build Version
 * 
 * This script loads the Vite-built chat widget and can be embedded in any HTML page.
 * 
 * Usage Options:
 * 
 * 1. UMD Build (Recommended for most cases):
 * <script src="https://yourdomain.com/chat-widget.umd.js"></script>
 * <link rel="stylesheet" href="https://yourdomain.com/assets/${cssFileName}">
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
    
    // Load CSS first
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = baseUrl + '/assets/${cssFileName}';
    document.head.appendChild(cssLink);

    // Load UMD bundle
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
`;

// Generate embed-example.html
const embedExampleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat Widget Embed Example</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-bottom: 1rem;
        }
        .example {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 4px;
            margin: 1rem 0;
            border-left: 4px solid #27af60;
        }
        .code {
            background: #2d3748;
            color: #e2e8f0;
            padding: 1rem;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 14px;
            overflow-x: auto;
        }
        .inline-container {
            border: 2px dashed #27af60;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            min-height: 400px;
            background: #f9f9f9;
            position: relative;
        }
        .inline-container::before {
            content: "Inline Chat Widget Container";
            position: absolute;
            top: -12px;
            left: 10px;
            background: white;
            padding: 0 10px;
            color: #27af60;
            font-weight: bold;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Chat Widget Integration Examples</h1>
        
        <p>This page demonstrates different ways to integrate the chat widget into your website.</p>

        <div class="example">
            <h3>1. Floating Widget (Bottom Right)</h3>
            <p>The simplest integration - adds a floating chat widget to the bottom right corner of your page.</p>
            
            <div class="code">
&lt;!-- Include the widget script --&gt;
&lt;script src="https://yourdomain.com/embed.js"&gt;&lt;/script&gt;

&lt;script&gt;
  ChatWidget.init({
    apiUrl: 'https://your-api.com/graphql',
    publicKey: 'your-public-key-here'
  });
&lt;/script&gt;
            </div>
        </div>

        <div class="example">
            <h3>2. Auto-Initialize with Data Attributes</h3>
            <p>Even simpler - just add data attributes to the script tag:</p>
            
            <div class="code">
&lt;script 
  src="https://yourdomain.com/embed.js"
  data-api-url="https://your-api.com/graphql"
  data-public-key="your-public-key-here"
  data-position="bottom-right"&gt;
&lt;/script&gt;
            </div>
        </div>

        <div class="example">
            <h3>3. Direct UMD Bundle Usage</h3>
            <p>For more control, use the UMD bundle directly:</p>
            
            <div class="code">
&lt;link rel="stylesheet" href="https://yourdomain.com/assets/${cssFileName}"&gt;
&lt;script src="https://yourdomain.com/chat-widget.umd.js"&gt;&lt;/script&gt;
&lt;script&gt;
  ChatWidget.initChatWidget({
    publicKey: 'your-public-key',
    graphqlHttpUrl: 'https://your-api.com/graphql',
    graphqlWsUrl: 'wss://your-api.com/graphql'
  });
&lt;/script&gt;
            </div>
        </div>

        <div class="example">
            <h3>4. ES Module Usage</h3>
            <p>For modern browsers with ES module support:</p>
            
            <div class="code">
&lt;script type="module"&gt;
  import { initChatWidget } from 'https://yourdomain.com/chat-widget.es.js';
  initChatWidget({
    publicKey: 'your-public-key',
    graphqlHttpUrl: 'https://your-api.com/graphql',
    graphqlWsUrl: 'wss://your-api.com/graphql'
  });
&lt;/script&gt;
            </div>
        </div>

        <div class="example">
            <h3>5. Inline Widget in Container</h3>
            <p>Embed the chat widget directly into a specific container on your page:</p>
            
            <div class="code">
&lt;div id="my-chat-container"&gt;&lt;/div&gt;

&lt;script src="https://yourdomain.com/embed.js"&gt;&lt;/script&gt;
&lt;script&gt;
  ChatWidget.init({
    containerId: 'my-chat-container',
    apiUrl: 'https://your-api.com/graphql',
    publicKey: 'your-public-key-here'
  });
&lt;/script&gt;
            </div>

            <div id="inline-chat-widget" class="inline-container">
                <!-- Chat widget will be embedded here -->
            </div>
        </div>
    </div>

    <script>
        // Demo functionality would go here
        console.log('Chat Widget Examples loaded');
    </script>
</body>
</html>
`;

// Write files
fs.writeFileSync(path.join(distDir, 'embed.js'), embedJs);
fs.writeFileSync(path.join(distDir, 'embed-example.html'), embedExampleHtml);

console.log('✅ Generated embed files:');
console.log('  - dist/embed.js');
console.log('  - dist/embed-example.html');
console.log('  - CSS file referenced:', cssFileName);