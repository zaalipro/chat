import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import prefixwrap from 'postcss-prefixwrap'
import { SecureCSPBuilder } from './src/utils/secure-csp.js'

// Secure CSP Plugin for Vite
const secureCspPlugin = {
  name: 'vite-plugin-secure-csp',
  transformIndexHtml(html) {
    // Initialize secure CSP builder
    const cspBuilder = new SecureCSPBuilder({
      enableNonce: true,
      enableReporting: process.env.NODE_ENV === 'production',
      reportEndpoint: process.env.CSP_REPORT_ENDPOINT || '/csp-violation-report'
    });

    // Get environment variables for dynamic CSP configuration
    const graphqlHttpUrl = process.env.VITE_GRAPHQL_HTTP_URL || process.env.REACT_APP_GRAPHQL_HTTP_URL || 'https://api.example.com';
    const graphqlWsUrl = process.env.VITE_GRAPHQL_WS_URL || process.env.REACT_APP_GRAPHQL_WS_URL || 'wss://api.example.com';
    
    // Build secure CSP policy
    const cspContent = cspBuilder.buildPolicy({
      graphqlHttpUrl,
      graphqlWsUrl,
      additionalDomains: [
        // Add any additional trusted domains here
        'https://cdnjs.cloudflare.com',
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com'
      ]
    });

    // Get nonce for inline scripts and styles
    const nonce = cspBuilder.getNonce();
    
    // Add nonce meta tag and CSP meta tag to HTML
    const nonceMeta = cspBuilder.createNonceMeta();
    const cspMeta = cspBuilder.createCSPMeta({
      graphqlHttpUrl,
      graphqlWsUrl
    });

    // Inject CSP headers and nonce into HTML
    let modifiedHtml = html;
    
    // Add nonce meta tag
    modifiedHtml = modifiedHtml.replace(
      '<head>',
      `<head>\n    ${nonceMeta}`
    );
    
    // Add CSP meta tag
    modifiedHtml = modifiedHtml.replace(
      '</head>',
      `  ${cspMeta}\n    </head>`
    );

    // For development, also set global nonce variable for React access
    if (process.env.NODE_ENV === 'development') {
      modifiedHtml = modifiedHtml.replace(
        '</head>',
        `  <script>window.CSP_NONCE = '${nonce}';</script>\n    </head>`
      );
    }

    return modifiedHtml;
  }
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      include: "**/*.{jsx,tsx,js,ts}",
    }),
    secureCspPlugin // Add secure CSP plugin
  ],
  css: {
    modules: {
      // Enable CSS modules for .module.css files
      localsConvention: 'camelCase',
      generateScopedName: 'chat-widget__[name]__[local]__[hash:base64:5]'
    },
    preprocessorOptions: {
      css: {
        // Add prefix to all CSS rules for scoping
        additionalData: `.chat-widget { `
      }
    },
    postcss: {
      plugins: [
        prefixwrap('.chat-widget', {
          ignoredSelectors: [':root', 'html', 'body', /^\.chat-widget/]
        })
      ]
    }
  },
  server: {
    port: 3006,
    host: 'localhost',
    // Add secure CSP headers to development server
    headers: {
      // Initialize CSP builder for development
      'Content-Security-Policy': (() => {
        const cspBuilder = new SecureCSPBuilder({
          enableNonce: false, // Disable nonce in development headers for simplicity
          enableReporting: false
        });

        // Build secure CSP policy for development
        return cspBuilder.buildPolicy({
          graphqlHttpUrl: 'ws://localhost:3006',
          graphqlWsUrl: 'wss://localhost:3006'
        });
      })(),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    }
  },
  publicDir: 'public',
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.ico', '**/*.woff', '**/*.woff2', '**/*.ttf', '**/*.eot'],
  // Load environment variables from .env file
  envPrefix: ['VITE_', 'REACT_APP_'],
  define: {
    // Ensure compatibility with existing environment variables during migration
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.env.PUBLIC_URL': JSON.stringify(''),
    // Map REACT_APP variables to process.env for backward compatibility
    'process.env.REACT_APP_API_URL': JSON.stringify(process.env.VITE_API_URL || process.env.REACT_APP_API_URL),
    'process.env.REACT_APP_GRAPHQL_HTTP_URL': JSON.stringify(process.env.VITE_GRAPHQL_HTTP_URL || process.env.REACT_APP_GRAPHQL_HTTP_URL),
    'process.env.REACT_APP_GRAPHQL_WS_URL': JSON.stringify(process.env.VITE_GRAPHQL_WS_URL || process.env.REACT_APP_GRAPHQL_WS_URL),
    'process.env.REACT_APP_COMPANY_LOGO_URL': JSON.stringify(process.env.VITE_COMPANY_LOGO_URL || process.env.REACT_APP_COMPANY_LOGO_URL),
    
    'process.env.REACT_APP_DEFAULT_WEBSITE_ID': JSON.stringify(process.env.VITE_DEFAULT_WEBSITE_ID || process.env.REACT_APP_DEFAULT_WEBSITE_ID),
    'process.env.REACT_APP_IPIFY_URL': JSON.stringify(process.env.VITE_IPIFY_URL || process.env.REACT_APP_IPIFY_URL),
    'process.env.REACT_APP_PUBLIC_KEY': JSON.stringify(process.env.VITE_PUBLIC_KEY || process.env.REACT_APP_PUBLIC_KEY),
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.[jt]sx?$/,
    exclude: []
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    css: true,
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/widget.js'),
      name: 'ChatWidget',
      formats: ['umd', 'es'],
      fileName: (format) => `chat-widget.${format}.js`
    },
    rollupOptions: {
      // Bundle all dependencies for embedding
      external: [],
      output: {
        globals: {},
        exports: 'named',
        // Ensure assets are properly handled for embedding
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },
    // Optimize for embedding
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    sourcemap: true,
    // Inline small assets to reduce HTTP requests for embedded widget
    assetsInlineLimit: 4096,
    // Optimize chunk splitting for better caching
    chunkSizeWarningLimit: 1000,
    // Additional optimizations
    target: 'es2015',
    cssCodeSplit: false
  }
})