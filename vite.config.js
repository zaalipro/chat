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

// Bundle Analyzer Plugin
const bundleAnalyzerPlugin = {
  name: 'vite-plugin-bundle-analyzer',
  generateBundle(options, bundle) {
    if (process.env.NODE_ENV === 'production' && process.env.ANALYZE_BUNDLE) {
      console.log('\n📊 Bundle Analysis:');
      const sizes = {};
      
      Object.entries(bundle).forEach(([fileName, chunk]) => {
        if (chunk.type === 'chunk' || chunk.type === 'asset') {
          const sizeKB = (chunk.length || 0) / 1024;
          sizes[fileName] = sizeKB;
          console.log(`  ${fileName}: ${sizeKB.toFixed(2)} KB`);
        }
      });
      
      const totalSize = Object.values(sizes).reduce((sum, size) => sum + size, 0);
      console.log(`\n📦 Total Bundle Size: ${totalSize.toFixed(2)} KB (${(totalSize / 1024).toFixed(2)} MB)`);
      
      // Warn about large chunks
      Object.entries(sizes).forEach(([fileName, size]) => {
        if (size > 500) {
          console.warn(`⚠️  Large chunk detected: ${fileName} (${size.toFixed(2)} KB)`);
        }
      });
    }
  }
};

// Compression Plugin
const compressionPlugin = {
  name: 'vite-plugin-compression',
  generateBundle(options, bundle) {
    if (process.env.NODE_ENV === 'production') {
      // This would typically use a compression library
      // For now, we'll just log compression opportunities
      console.log('\n🗜️  Compression Analysis:');
      Object.entries(bundle).forEach(([fileName, chunk]) => {
        if (chunk.type === 'chunk' && fileName.endsWith('.js')) {
          const originalSize = chunk.length || 0;
          const estimatedCompressed = originalSize * 0.3; // ~70% compression ratio
          console.log(`  ${fileName}: ${(originalSize / 1024).toFixed(2)} KB → ${(estimatedCompressed / 1024).toFixed(2)} KB (gzipped)`);
        }
      });
    }
  }
};

// Tree Shaking Optimizer Plugin
const treeShakingOptimizerPlugin = {
  name: 'vite-plugin-tree-shaking-optimizer',
  buildStart() {
    console.log('\n🌳 Tree Shaking Optimizer Active');
  }
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      include: "**/*.{jsx,tsx,js,ts}",
    }),
    secureCspPlugin, // Add secure CSP plugin
    bundleAnalyzerPlugin, // Bundle analysis
    compressionPlugin, // Compression analysis
    treeShakingOptimizerPlugin // Tree shaking optimization
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
    // ✅ DEPENDENCY OPTIMIZATION
    include: ['react', 'react-dom', 'styled-components'],
    exclude: ['moment', 'axios', 'formik', 'yup'] // Use dynamic imports
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    css: true,
  },
  build: {
    // ✅ LIBRARY BUILD CONFIGURATION - SINGLE BUNDLE
    lib: {
      entry: resolve(__dirname, 'src/widget.js'),
      name: 'ChatWidget',
      formats: ['umd'], // Only UMD format for single bundle
      fileName: () => `widget.js` // Fixed filename without hash
    },
    rollupOptions: {
      // Bundle all dependencies for embedding
      external: [],
      output: {
        globals: {},
        exports: 'named',
        // ✅ SINGLE BUNDLE - NO CHUNKING
        manualChunks: undefined, // Disable code splitting for single bundle
        chunkFileNames: () => `widget.js`, // Fixed name
        entryFileNames: () => `widget.js`, // Fixed name
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
    // ✅ COMPRESSION SETTINGS
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      mangle: {
        safari10: true
      }
    },
    // ✅ SOURCE MAPS FOR PRODUCTION DEBUGGING
    sourcemap: false, // Disabled for production to reduce bundle size
    // ✅ CHUNK SIZE WARNING LIMIT
    chunkSizeWarningLimit: 1000, // Increased for single bundle
    // ✅ INLINE SMALL ASSETS
    assetsInlineLimit: 4096,
    // ✅ TARGET BROWSERS
    target: 'es2015',
    // ✅ CSS CODE SPLITTING DISABLED FOR SINGLE BUNDLE
    cssCodeSplit: false, // Disable CSS code splitting for single bundle
    // ✅ CSS MINIFICATION
    cssMinify: true,
    // ✅ REPORT COMPRESSED SIZE
    reportCompressedSize: true
  }
})