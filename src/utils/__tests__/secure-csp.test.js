/**
 * Secure CSP Implementation Tests
 * Tests for the nonce-based Content Security Policy implementation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SecureCSPBuilder, generateNonce, useCSPNonce, addNonceToScript, addNonceToStyle } from '../secure-csp.js';

describe('Secure CSP Implementation', () => {
  beforeEach(() => {
    // Mock crypto API using Object.defineProperty
    const mockCrypto = {
      getRandomValues: vi.fn((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      })
    };
    
    Object.defineProperty(global, 'crypto', {
      value: mockCrypto,
      writable: true,
      configurable: true
    });
    
    // Mock DOM elements
    global.document = {
      createElement: vi.fn((tagName) => ({
        tagName: tagName.toUpperCase(),
        setAttribute: vi.fn(),
        getAttribute: vi.fn(),
        textContent: '',
        appendChild: vi.fn(),
        parentNode: null
      })),
      head: {
        appendChild: vi.fn()
      },
      body: {
        appendChild: vi.fn()
      },
      querySelector: vi.fn()
    };
    
    global.window = {
      CSP_NONCE: null
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Nonce Generation', () => {
    it('should generate a nonce with crypto API', () => {
      const nonce = generateNonce();
      expect(nonce).toBeDefined();
      expect(typeof nonce).toBe('string');
      expect(nonce.length).toBeGreaterThan(0);
    });

    it('should generate different nonces each time', () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();
      expect(nonce1).not.toBe(nonce2);
    });

    it('should fallback to Math.random when crypto is unavailable', () => {
      // Remove crypto temporarily
      const originalCrypto = global.crypto;
      delete global.crypto;
      
      const nonce = generateNonce();
      expect(nonce).toBeDefined();
      expect(typeof nonce).toBe('string');
      expect(nonce.length).toBeGreaterThan(0);
      
      // Restore crypto
      global.crypto = originalCrypto;
    });
  });

  describe('SecureCSPBuilder', () => {
    let cspBuilder;

    beforeEach(() => {
      cspBuilder = new SecureCSPBuilder({
        enableNonce: true,
        enableReporting: false
      });
    });

    it('should initialize with correct options', () => {
      expect(cspBuilder.options.enableNonce).toBe(true);
      expect(cspBuilder.options.enableReporting).toBe(false);
      expect(cspBuilder.nonce).toBeDefined();
    });

    it('should build secure CSP policy', () => {
      const policy = cspBuilder.buildPolicy({
        graphqlHttpUrl: 'https://api.example.com/graphql',
        graphqlWsUrl: 'wss://api.example.com/graphql'
      });

      expect(policy).toContain("default-src 'self'");
      expect(policy).toContain("script-src 'self'");
      expect(policy).toContain("style-src 'self'");
      expect(policy).toContain("connect-src 'self' https://api.example.com wss://api.example.com");
      expect(policy).toContain("object-src 'none'");
      expect(policy).toContain("frame-ancestors 'none'");
      expect(policy).toContain("upgrade-insecure-requests");
    });

    it('should include nonce in CSP when enabled', () => {
      const policy = cspBuilder.buildPolicy();
      expect(policy).toContain(`'nonce-${cspBuilder.nonce}'`);
    });

    it('should not include nonce when disabled', () => {
      const noNonceBuilder = new SecureCSPBuilder({ enableNonce: false });
      const policy = noNonceBuilder.buildPolicy();
      expect(policy).not.toContain("'nonce-");
    });

    it('should handle additional domains', () => {
      const policy = cspBuilder.buildPolicy({
        additionalDomains: ['https://cdn.example.com', 'https://fonts.googleapis.com']
      });

      expect(policy).toContain('https://cdn.example.com');
      expect(policy).toContain('https://fonts.googleapis.com');
    });

    it('should refresh nonce', () => {
      const originalNonce = cspBuilder.getNonce();
      const newNonce = cspBuilder.refreshNonce();
      
      expect(newNonce).toBeDefined();
      expect(newNonce).not.toBe(originalNonce);
      expect(cspBuilder.getNonce()).toBe(newNonce);
    });

    it('should create nonce meta tag', () => {
      const metaTag = cspBuilder.createNonceMeta();
      expect(metaTag).toContain('<meta name="csp-nonce"');
      expect(metaTag).toContain(`content="${cspBuilder.nonce}"`);
    });

    it('should create CSP meta tag', () => {
      const metaTag = cspBuilder.createCSPMeta();
      expect(metaTag).toContain('<meta http-equiv="Content-Security-Policy"');
      expect(metaTag).toContain('content=');
    });

    it('should get CSP header', () => {
      const header = cspBuilder.getCSPHeader();
      expect(header).toContain("default-src 'self'");
      expect(header).toContain("script-src 'self'");
    });
  });

  describe('CSP Validation', () => {
    it('should validate secure CSP policy', () => {
      const securePolicy = "default-src 'self'; script-src 'self' 'nonce-abc123'; style-src 'self' 'nonce-abc123'; object-src 'none'";
      const validation = SecureCSPBuilder.validatePolicy(securePolicy);

      expect(validation.valid).toBe(true);
      expect(validation.score).toBeGreaterThan(90);
      expect(validation.warnings).toHaveLength(0);
    });

    it('should detect unsafe-eval in CSP', () => {
      const unsafePolicy = "default-src 'self'; script-src 'self' 'unsafe-eval'";
      const validation = SecureCSPBuilder.validatePolicy(unsafePolicy);

      expect(validation.valid).toBe(false);
      expect(validation.warnings).toContain("CSP contains 'unsafe-eval' - critical security risk");
      expect(validation.score).toBeLessThan(80);
    });

    it('should detect unsafe-inline in CSP', () => {
      const unsafePolicy = "default-src 'self'; script-src 'self' 'unsafe-inline'";
      const validation = SecureCSPBuilder.validatePolicy(unsafePolicy);

      expect(validation.valid).toBe(false);
      expect(validation.warnings).toContain("CSP contains 'unsafe-inline' - security risk");
      expect(validation.score).toBeLessThan(85);
    });

    it('should reward nonce usage', () => {
      const noncePolicy = "default-src 'self'; script-src 'self' 'nonce-abc123'";
      const validation = SecureCSPBuilder.validatePolicy(noncePolicy);

      expect(validation.score).toBeGreaterThan(50); // Base score + nonce reward
    });

    it('should check essential security directives', () => {
      const incompletePolicy = "default-src 'self'; script-src 'self'";
      const validation = SecureCSPBuilder.validatePolicy(incompletePolicy);

      expect(validation.recommendations.length).toBeGreaterThan(0);
      expect(validation.score).toBeLessThan(100);
    });
  });

  describe('Nonce Utilities', () => {
    it('should get nonce from meta tag', () => {
      const mockMeta = {
        getAttribute: vi.fn((attr) => attr === 'content' ? 'test-nonce-123' : null)
      };
      global.document.querySelector.mockReturnValue(mockMeta);

      const nonce = useCSPNonce();
      expect(nonce).toBe('test-nonce-123');
    });

    it('should get nonce from global variable', () => {
      global.window.CSP_NONCE = 'global-nonce-456';
      global.document.querySelector.mockReturnValue(null);

      const nonce = useCSPNonce();
      expect(nonce).toBe('global-nonce-456');
    });

    it('should return null when no nonce found', () => {
      global.document.querySelector.mockReturnValue(null);
      global.window.CSP_NONCE = null;

      const nonce = useCSPNonce();
      expect(nonce).toBeNull();
    });

    it('should add nonce to script tag', () => {
      const scriptContent = 'console.log("test");';
      const nonce = 'test-nonce-789';
      
      const scriptTag = addNonceToScript(scriptContent, nonce);
      
      expect(scriptTag).toContain('<script');
      expect(scriptTag).toContain(`nonce="${nonce}"`);
      expect(scriptTag).toContain(scriptContent);
      expect(scriptTag).toContain('</script>');
    });

    it('should add nonce to style tag', () => {
      const styleContent = 'body { color: red; }';
      const nonce = 'test-nonce-789';
      
      const styleTag = addNonceToStyle(styleContent, nonce);
      
      expect(styleTag).toContain('<style');
      expect(styleTag).toContain(`nonce="${nonce}"`);
      expect(styleTag).toContain(styleContent);
      expect(styleTag).toContain('</style>');
    });

    it('should handle script without nonce', () => {
      const scriptContent = 'console.log("test");';
      
      const scriptTag = addNonceToScript(scriptContent, null);
      
      expect(scriptTag).toContain('<script>');
      expect(scriptTag).toContain(scriptContent);
      expect(scriptTag).toContain('</script>');
      expect(scriptTag).not.toContain('nonce');
    });

    it('should handle style without nonce', () => {
      const styleContent = 'body { color: red; }';
      
      const styleTag = addNonceToStyle(styleContent, null);
      
      expect(styleTag).toContain('<style>');
      expect(styleTag).toContain(styleContent);
      expect(styleTag).toContain('</style>');
      expect(styleTag).not.toContain('nonce');
    });
  });

  describe('CSP Builder Configuration', () => {
    it('should handle reporting configuration', () => {
      const reportingBuilder = new SecureCSPBuilder({
        enableReporting: true,
        reportEndpoint: '/csp-violation-report'
      });

      const policy = reportingBuilder.buildPolicy();
      
      expect(policy).toContain('report-uri /csp-violation-report');
      expect(policy).toContain('report-to csp-endpoint');
    });

    it('should handle strict dynamic configuration', () => {
      const strictBuilder = new SecureCSPBuilder({
        strictDynamic: true
      });

      expect(strictBuilder.options.strictDynamic).toBe(true);
    });

    it('should use default configuration', () => {
      const defaultBuilder = new SecureCSPBuilder();
      
      expect(defaultBuilder.options.enableNonce).toBe(true);
      expect(defaultBuilder.options.enableReporting).toBe(false);
      expect(defaultBuilder.options.strictDynamic).toBe(false);
    });
  });

  describe('Environment Handling', () => {
    let cspBuilder;

    beforeEach(() => {
      cspBuilder = new SecureCSPBuilder({
        enableNonce: true,
        enableReporting: false
      });
    });

    it('should handle missing environment variables', () => {
      const policy = cspBuilder.buildPolicy({});
      
      // Check that it uses default fallback URLs
      expect(policy).toContain('http://localhost:5001');
      expect(policy).toContain('ws://localhost:5001');
      expect(policy).toContain('wss://*.example.com');
      expect(policy).toContain('https://*.example.com');
    });

    it('should use custom environment variables', () => {
      const originalEnv = process.env;
      
      // Mock environment variables
      const mockEnv = {
        ...originalEnv,
        VITE_GRAPHQL_HTTP_URL: 'https://custom-api.example.com',
        VITE_GRAPHQL_WS_URL: 'wss://custom-api.example.com'
      };
      
      // Mock process.env
      Object.defineProperty(process, 'env', {
        value: mockEnv,
        writable: true,
        configurable: true
      });

      const policy = cspBuilder.buildPolicy({});
      
      expect(policy).toContain('https://custom-api.example.com');
      expect(policy).toContain('wss://custom-api.example.com');
      
      // Restore environment
      Object.defineProperty(process, 'env', {
        value: originalEnv,
        writable: true,
        configurable: true
      });
    });
  });

  describe('Security Features', () => {
    let cspBuilder;

    beforeEach(() => {
      cspBuilder = new SecureCSPBuilder({
        enableNonce: true,
        enableReporting: false
      });
    });

    it('should include all security directives', () => {
      const policy = cspBuilder.buildPolicy();
      
      const securityDirectives = [
        "object-src 'none'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests",
        "base-uri 'self'",
        "form-action 'self'",
        "worker-src 'self' blob:",
        "manifest-src 'self'"
      ];

      securityDirectives.forEach(directive => {
        expect(policy).toContain(directive);
      });
    });

    it('should allow necessary resources for chat widget', () => {
      const policy = cspBuilder.buildPolicy();
      
      expect(policy).toContain("img-src 'self' data: blob: https:");
      expect(policy).toContain("font-src 'self' data:");
      expect(policy).toContain("media-src 'self' blob:");
    });

    it('should prevent dangerous resource types', () => {
      const policy = cspBuilder.buildPolicy();
      
      expect(policy).toContain("object-src 'none'");
      expect(policy).not.toContain("'unsafe-eval'");
      expect(policy).not.toContain("'unsafe-inline'");
    });
  });
});