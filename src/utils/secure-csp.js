/**
 * Secure CSP Implementation
 * Implements nonce-based Content Security Policy without unsafe directives
 */

/**
 * Generates a cryptographically secure random nonce
 * @returns {string} Base64 encoded random nonce
 */
export function generateNonce() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return array.reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');
  }
  
  // Fallback for environments without crypto API
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Secure CSP Builder
 * Builds CSP policies with nonce-based approach
 */
export class SecureCSPBuilder {
  constructor(options = {}) {
    this.options = {
      enableNonce: true,
      enableReporting: false,
      reportEndpoint: null,
      strictDynamic: false,
      ...options
    };
    
    this.nonce = this.options.enableNonce ? generateNonce() : null;
  }

  /**
   * Build secure CSP policy
   * @param {Object} config - Configuration object
   * @returns {string} Complete CSP policy string
   */
  buildPolicy(config = {}) {
    const {
      graphqlHttpUrl = process.env.VITE_GRAPHQL_HTTP_URL || process.env.REACT_APP_GRAPHQL_HTTP_URL || 'https://api.example.com',
      graphqlWsUrl = process.env.VITE_GRAPHQL_WS_URL || process.env.REACT_APP_GRAPHQL_WS_URL || 'wss://api.example.com',
      additionalDomains = [],
      enableReporting = this.options.enableReporting
    } = config;

    // Extract domains for CSP
    const httpDomain = new URL(graphqlHttpUrl).origin;
    const wsDomain = new URL(graphqlWsUrl).origin;

    // Build CSP directives
    const directives = [];

    // Default source directive
    directives.push("default-src 'self'");

    // Script source with nonce (replaces unsafe-inline and unsafe-eval)
    if (this.nonce) {
      directives.push(`script-src 'self' 'nonce-${this.nonce}'`);
    } else {
      // Fallback for environments without nonce support
      directives.push("script-src 'self'");
    }

    // Style source with nonce for styled-components compatibility
    if (this.nonce) {
      directives.push(`style-src 'self' 'nonce-${this.nonce}'`);
    } else {
      // Fallback - still more secure than unsafe-inline
      directives.push("style-src 'self'");
    }

    // Connect source for GraphQL and WebSocket connections
    const connectSources = [
      "'self'",
      httpDomain,
      wsDomain,
      'wss://*.example.com',
      'https://*.example.com',
      ...additionalDomains
    ].filter(Boolean);
    directives.push(`connect-src ${connectSources.join(' ')}`);

    // Image sources
    directives.push("img-src 'self' data: blob: https:");

    // Font sources
    directives.push("font-src 'self' data:");

    // Media sources
    directives.push("media-src 'self' blob:");

    // Object sources (disallow for security)
    directives.push("object-src 'none'");

    // Base URI
    directives.push("base-uri 'self'");

    // Form action
    directives.push("form-action 'self'");

    // Frame ancestors (prevent clickjacking)
    directives.push("frame-ancestors 'none'");

    // Upgrade insecure requests
    directives.push("upgrade-insecure-requests");

    // Worker sources
    directives.push("worker-src 'self' blob:");

    // Manifest sources
    directives.push("manifest-src 'self'");

    // Add reporting if enabled
    if (enableReporting && this.options.reportEndpoint) {
      directives.push(`report-uri ${this.options.reportEndpoint}`);
      directives.push(`report-to csp-endpoint`);
    }

    return directives.join('; ');
  }

  /**
   * Get the current nonce
   * @returns {string|null} Current nonce or null if not enabled
   */
  getNonce() {
    return this.nonce;
  }

  /**
   * Generate a new nonce
   * @returns {string} New nonce
   */
  refreshNonce() {
    this.nonce = this.options.enableNonce ? generateNonce() : null;
    return this.nonce;
  }

  /**
   * Create nonce meta tag for HTML
   * @returns {string} Meta tag HTML
   */
  createNonceMeta() {
    if (!this.nonce) {
      return '';
    }
    
    return `<meta name="csp-nonce" content="${this.nonce}">`;
  }

  /**
   * Create CSP meta tag for HTML
   * @param {Object} config - CSP configuration
   * @returns {string} Meta tag HTML
   */
  createCSPMeta(config = {}) {
    const policy = this.buildPolicy(config);
    return `<meta http-equiv="Content-Security-Policy" content="${policy}">`;
  }

  /**
   * Get CSP headers for server configuration
   * @param {Object} config - CSP configuration
   * @returns {string} CSP header value
   */
  getCSPHeader(config = {}) {
    return this.buildPolicy(config);
  }

  /**
   * Validate CSP policy
   * @param {string} policy - CSP policy to validate
   * @returns {Object} Validation result
   */
  static validatePolicy(policy) {
    const validation = {
      valid: true,
      warnings: [],
      recommendations: [],
      score: 100
    };

    // Check for unsafe directives
    if (policy.includes("'unsafe-eval'")) {
      validation.valid = false;
      validation.warnings.push("CSP contains 'unsafe-eval' - critical security risk");
      validation.score -= 20;
    }

    if (policy.includes("'unsafe-inline'")) {
      validation.valid = false;
      validation.warnings.push("CSP contains 'unsafe-inline' - security risk");
      validation.score -= 15;
    }

    // Check for nonce usage
    if (policy.includes("'nonce-")) {
      validation.score += 10;
    } else {
      validation.recommendations.push("Consider using nonce-based CSP for better security");
    }

    // Check for essential security directives
    const essentialDirectives = [
      "object-src 'none'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ];

    essentialDirectives.forEach(directive => {
      if (!policy.includes(directive)) {
        validation.recommendations.push(`Add ${directive} for better security`);
        validation.score -= 5;
      }
    });

    return validation;
  }
}

/**
 * CSP Middleware for Express/Server
 * Middleware to add CSP headers to server responses
 */
export function cspMiddleware(options = {}) {
  const cspBuilder = new SecureCSPBuilder(options);
  
  return (req, res, next) => {
    // Generate new nonce for each request
    cspBuilder.refreshNonce();
    
    // Set CSP header
    const cspHeader = cspBuilder.getCSPHeader();
    res.setHeader('Content-Security-Policy', cspHeader);
    
    // Make nonce available to templates/views
    if (cspBuilder.getNonce()) {
      res.locals.cspNonce = cspBuilder.getNonce();
    }
    
    next();
  };
}

/**
 * React Hook for CSP Nonce
 * Custom hook to access CSP nonce in React components
 */
export function useCSPNonce() {
  // Try to get nonce from meta tag
  if (typeof document !== 'undefined') {
    const nonceMeta = document.querySelector('meta[name="csp-nonce"]');
    if (nonceMeta) {
      return nonceMeta.getAttribute('content');
    }
  }
  
  // Fallback to global variable (set by server)
  if (typeof window !== 'undefined' && window.CSP_NONCE) {
    return window.CSP_NONCE;
  }
  
  return null;
}

/**
 * Utility to add nonce to inline scripts
 * @param {string} scriptContent - Script content
 * @param {string} nonce - CSP nonce
 * @returns {string} Script tag with nonce
 */
export function addNonceToScript(scriptContent, nonce) {
  if (!nonce) {
    return `<script>${scriptContent}</script>`;
  }
  
  return `<script nonce="${nonce}">${scriptContent}</script>`;
}

/**
 * Utility to add nonce to inline styles
 * @param {string} styleContent - CSS content
 * @param {string} nonce - CSP nonce
 * @returns {string} Style tag with nonce
 */
export function addNonceToStyle(styleContent, nonce) {
  if (!nonce) {
    return `<style>${styleContent}</style>`;
  }
  
  return `<style nonce="${nonce}">${styleContent}</style>`;
}

// Export default SecureCSPBuilder
export default SecureCSPBuilder;