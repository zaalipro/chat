/**
 * CSP Monitor Tests
 * Tests for CSP monitoring and validation utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CSPViolationReporter, CSPValidator } from '../csp-monitor.js';

// Mock document and window objects
const mockDocument = {
  addEventListener: vi.fn(),
  createElement: vi.fn(),
  head: {
    appendChild: vi.fn()
  }
};

const mockWindow = {
  location: {
    href: 'http://localhost:3006'
  },
  fetch: vi.fn()
};

const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Test Browser)'
};

describe('CSPViolationReporter', () => {
  let reporter;

  beforeEach(() => {
    // Mock global objects
    global.document = mockDocument;
    global.window = mockWindow;
    global.navigator = mockNavigator;
    global.setInterval = vi.fn();
    global.console = {
      group: vi.fn(),
      groupEnd: vi.fn(),
      error: vi.fn()
    };

    // Mock global fetch to resolve successfully
    global.fetch = mockWindow.fetch;
    mockWindow.fetch.mockResolvedValue({ ok: true });

    reporter = new CSPViolationReporter({
      maxViolations: 10,
      reportToConsole: false,
      reportToService: false
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      const defaultReporter = new CSPViolationReporter();
      expect(defaultReporter.options.maxViolations).toBe(100);
      expect(defaultReporter.options.reportToConsole).toBe(true);
      expect(defaultReporter.options.reportToService).toBe(false);
    });

    it('should initialize with custom options', () => {
      const customReporter = new CSPViolationReporter({
        maxViolations: 50,
        reportToConsole: false,
        reportToService: true,
        serviceEndpoint: 'https://api.example.com/csp-report'
      });

      expect(customReporter.options.maxViolations).toBe(50);
      expect(customReporter.options.reportToConsole).toBe(false);
      expect(customReporter.options.reportToService).toBe(true);
      expect(customReporter.options.serviceEndpoint).toBe('https://api.example.com/csp-report');
    });

    it('should set up event listener for CSP violations', () => {
      expect(mockDocument.addEventListener).toHaveBeenCalledWith(
        'securitypolicyviolation',
        expect.any(Function)
      );
    });

    it('should set up cleanup interval', () => {
      expect(global.setInterval).toHaveBeenCalledWith(
        expect.any(Function),
        60000
      );
    });
  });

  describe('Violation Handling', () => {
    it('should handle CSP violation events', () => {
      const mockEvent = {
        violatedDirective: 'script-src',
        blockedURI: 'https://evil.com/malicious.js',
        originalPolicy: "script-src 'self'",
        referrer: 'http://localhost:3006',
        documentURI: 'http://localhost:3006/',
        effectiveDirective: 'script-src',
        statusCode: 200,
        sample: 'alert("xss")',
        sourceFile: 'http://localhost:3006/app.js',
        lineNumber: 42,
        columnNumber: 15,
        disposition: 'enforce'
      };

      reporter.handleViolation(mockEvent);

      expect(reporter.violations).toHaveLength(1);
      expect(reporter.violations[0].violatedDirective).toBe('script-src');
      expect(reporter.violations[0].blockedURI).toBe('https://evil.com/malicious.js');
    });

    it('should limit stored violations', () => {
      const mockEvent = {
        violatedDirective: 'script-src',
        blockedURI: 'https://evil.com/malicious.js',
        originalPolicy: "script-src 'self'",
        referrer: 'http://localhost:3006',
        documentURI: 'http://localhost:3006/',
        effectiveDirective: 'script-src',
        statusCode: 200
      };

      // Add more violations than the limit
      for (let i = 0; i < 15; i++) {
        reporter.handleViolation(mockEvent);
      }

      expect(reporter.violations.length).toBeLessThanOrEqual(10);
    });

    it('should update violation counts', () => {
      const mockEvent = {
        violatedDirective: 'script-src',
        blockedURI: 'https://evil.com/malicious.js',
        originalPolicy: "script-src 'self'",
        referrer: 'http://localhost:3006',
        documentURI: 'http://localhost:3006/',
        effectiveDirective: 'script-src',
        statusCode: 200
      };

      reporter.handleViolation(mockEvent);
      reporter.handleViolation(mockEvent);

      const counts = reporter.getViolationCounts();
      expect(counts['script-src:https://evil.com/malicious.js']).toBe(2);
    });
  });

  describe('Reporting', () => {
    it('should log violations to console when enabled', () => {
      const consoleReporter = new CSPViolationReporter({
        reportToConsole: true,
        reportToService: false
      });

      const mockEvent = {
        violatedDirective: 'script-src',
        blockedURI: 'https://evil.com/malicious.js',
        originalPolicy: "script-src 'self'",
        referrer: 'http://localhost:3006',
        documentURI: 'http://localhost:3006/',
        effectiveDirective: 'script-src',
        statusCode: 200
      };

      consoleReporter.handleViolation(mockEvent);

      expect(global.console.group).toHaveBeenCalledWith('🚨 CSP Violation Detected');
      expect(global.console.error).toHaveBeenCalledWith('Directive:', 'script-src');
      expect(global.console.error).toHaveBeenCalledWith('Blocked URI:', 'https://evil.com/malicious.js');
      expect(global.console.groupEnd).toHaveBeenCalled();
    });

    it('should send violations to service when enabled', async () => {
      const serviceReporter = new CSPViolationReporter({
        reportToConsole: false,
        reportToService: true,
        serviceEndpoint: 'https://api.example.com/csp-report'
      });

      const mockEvent = {
        violatedDirective: 'script-src',
        blockedURI: 'https://evil.com/malicious.js',
        originalPolicy: "script-src 'self'",
        referrer: 'http://localhost:3006',
        documentURI: 'http://localhost:3006/',
        effectiveDirective: 'script-src',
        statusCode: 200
      };

      // Call the method directly instead of through handleViolation
      await serviceReporter.sendToService(mockEvent);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/csp-report',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"type":"csp_violation"')
        }
      );
    });
  });

  describe('Public API', () => {
    beforeEach(() => {
      const mockEvent = {
        violatedDirective: 'script-src',
        blockedURI: 'https://evil.com/malicious.js',
        originalPolicy: "script-src 'self'",
        referrer: 'http://localhost:3006',
        documentURI: 'http://localhost:3006/',
        effectiveDirective: 'script-src',
        statusCode: 200
      };

      reporter.handleViolation(mockEvent);
    });

    it('should return violations', () => {
      const violations = reporter.getViolations();
      expect(violations).toHaveLength(1);
      expect(violations[0].violatedDirective).toBe('script-src');
    });

    it('should return violation counts', () => {
      const counts = reporter.getViolationCounts();
      expect(counts['script-src:https://evil.com/malicious.js']).toBe(1);
    });

    it('should filter violations by directive', () => {
      const scriptViolations = reporter.getViolationsByDirective('script-src');
      expect(scriptViolations).toHaveLength(1);
      expect(scriptViolations[0].violatedDirective).toBe('script-src');

      const styleViolations = reporter.getViolationsByDirective('style-src');
      expect(styleViolations).toHaveLength(0);
    });

    it('should filter violations by URI', () => {
      const uriViolations = reporter.getViolationsByURI('https://evil.com/malicious.js');
      expect(uriViolations).toHaveLength(1);
      expect(uriViolations[0].blockedURI).toBe('https://evil.com/malicious.js');

      const otherViolations = reporter.getViolationsByURI('https://other.com/script.js');
      expect(otherViolations).toHaveLength(0);
    });

    it('should clear violations', () => {
      reporter.clearViolations();
      expect(reporter.getViolations()).toHaveLength(0);
      expect(reporter.getViolationCounts()).toEqual({});
    });

    it('should generate summary', () => {
      const summary = reporter.getSummary();
      expect(summary.total).toBe(1);
      expect(summary.byDirective['script-src']).toBe(1);
      expect(summary.byURI['https://evil.com/malicious.js']).toBe(1);
      expect(summary.recent).toHaveLength(1);
    });
  });
});

describe('CSPValidator', () => {
  describe('Policy Parsing', () => {
    it('should parse CSP string correctly', () => {
      const cspString = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'";
      const directives = CSPValidator.parseCSP(cspString);

      expect(directives['default-src']).toBe("'self'");
      expect(directives['script-src']).toBe("'self' 'unsafe-inline'");
      expect(directives['style-src']).toBe("'self' 'unsafe-inline'");
    });

    it('should handle empty CSP string', () => {
      const directives = CSPValidator.parseCSP('');
      expect(Object.keys(directives)).toHaveLength(0);
    });

    it('should handle CSP with extra whitespace', () => {
      const cspString = "  default-src  'self'  ;  script-src  'self'  ";
      const directives = CSPValidator.parseCSP(cspString);

      expect(directives['default-src']).toBe("'self'");
      expect(directives['script-src']).toBe("'self'");
    });
  });

  describe('Policy Validation', () => {
    it('should validate secure CSP policy', () => {
      const secureCSP = [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self'",
        "connect-src 'self'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "media-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests"
      ].join('; ');

      const validation = CSPValidator.validatePolicy(secureCSP);
      expect(validation.valid).toBe(true);
      expect(validation.warnings).toHaveLength(0);
      expect(validation.score).toBeGreaterThan(80);
    });

    it('should identify missing security directives', () => {
      const incompleteCSP = "default-src 'self'; script-src 'self'";
      const validation = CSPValidator.validatePolicy(incompleteCSP);

      expect(validation.valid).toBe(false);
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings.some(w => w.includes('style-src'))).toBe(true);
    });

    it('should warn about unsafe directives', () => {
      const unsafeCSP = "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'";
      const validation = CSPValidator.validatePolicy(unsafeCSP);

      expect(validation.warnings.some(w => w.includes('unsafe-eval'))).toBe(true);
      expect(validation.warnings.some(w => w.includes('unsafe-inline'))).toBe(true);
      expect(validation.score).toBeLessThan(50);
    });

    it('should provide security recommendations', () => {
      const weakCSP = "default-src 'self'; script-src 'self'; object-src 'self'";
      const validation = CSPValidator.validatePolicy(weakCSP);

      expect(validation.recommendations.some(r => r.includes('object-src'))).toBe(true);
      expect(validation.score).toBeLessThan(80);
    });

    it('should validate complete CSP with all required directives', () => {
      // Create a CSP that includes all required directives
      const completeCSP = [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self'",
        "connect-src 'self'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "media-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests"
      ].join('; ');

      const validation = CSPValidator.validatePolicy(completeCSP);
      expect(validation.valid).toBe(true);
      expect(validation.warnings).toHaveLength(0);
    });
  });

  describe('Report Generation', () => {
    it('should generate comprehensive CSP report', () => {
      const cspString = "default-src 'self'; script-src 'self' 'unsafe-inline'";
      const report = CSPValidator.generateReport(cspString);

      expect(report.timestamp).toBeDefined();
      expect(report.csp).toBe(cspString);
      expect(report.directives).toBeDefined();
      expect(report.validation).toBeDefined();
      expect(report.summary).toBeDefined();

      expect(report.summary.totalDirectives).toBe(2);
      expect(report.summary.securityScore).toBeLessThan(100);
      expect(report.summary.warningCount).toBeGreaterThan(0);
    });
  });
});