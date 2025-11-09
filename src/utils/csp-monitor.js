/**
 * CSP Monitoring Utility
 * Monitors Content Security Policy violations and provides reporting
 */

/**
 * CSP Violation Reporter
 * Tracks and reports CSP violations for debugging and security monitoring
 */
class CSPViolationReporter {
  constructor(options = {}) {
    this.options = {
      maxViolations: 100, // Maximum violations to store in memory
      reportToConsole: true,
      reportToService: false,
      serviceEndpoint: null,
      ...options
    };
    
    this.violations = [];
    this.violationCounts = {};
    this.init();
  }

  init() {
    // Listen for CSP violations
    if (typeof document !== 'undefined') {
      document.addEventListener('securitypolicyviolation', this.handleViolation.bind(this));
    }

    // Set up periodic cleanup
    if (typeof setInterval !== 'undefined') {
      setInterval(() => {
        this.cleanup();
      }, 60000); // Cleanup every minute
    }
  }

  handleViolation(event) {
    const violation = {
      timestamp: new Date().toISOString(),
      violatedDirective: event.violatedDirective,
      blockedURI: event.blockedURI,
      originalPolicy: event.originalPolicy,
      referrer: event.referrer,
      documentURI: event.documentURI,
      effectiveDirective: event.effectiveDirective,
      statusCode: event.statusCode,
      sample: event.sample,
      sourceFile: event.sourceFile,
      lineNumber: event.lineNumber,
      columnNumber: event.columnNumber,
      disposition: event.disposition
    };

    // Store violation
    this.storeViolation(violation);

    // Report violation
    this.reportViolation(violation);

    // Update counts
    this.updateViolationCounts(violation);
  }

  storeViolation(violation) {
    this.violations.push(violation);
    
    // Limit stored violations
    if (this.violations.length > this.options.maxViolations) {
      this.violations.shift();
    }
  }

  reportViolation(violation) {
    // Console reporting
    if (this.options.reportToConsole) {
      console.group('🚨 CSP Violation Detected');
      console.error('Directive:', violation.violatedDirective);
      console.error('Blocked URI:', violation.blockedURI);
      console.error('Document URI:', violation.documentURI);
      console.error('Timestamp:', violation.timestamp);
      
      if (violation.sourceFile) {
        console.error('Source:', `${violation.sourceFile}:${violation.lineNumber}:${violation.columnNumber}`);
      }
      
      if (violation.sample) {
        console.error('Sample:', violation.sample);
      }
      
      console.groupEnd();
    }

    // Service reporting
    if (this.options.reportToService && this.options.serviceEndpoint) {
      this.sendToService(violation);
    }
  }

  async sendToService(violation) {
    try {
      await fetch(this.options.serviceEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'csp_violation',
          violation,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          url: typeof window !== 'undefined' ? window.location.href : 'unknown'
        })
      });
    } catch (error) {
      console.error('Failed to report CSP violation to service:', error);
    }
  }

  updateViolationCounts(violation) {
    const key = `${violation.violatedDirective}:${violation.blockedURI}`;
    this.violationCounts[key] = (this.violationCounts[key] || 0) + 1;
  }

  cleanup() {
    // Remove old violations (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 3600000);
    this.violations = this.violations.filter(v => 
      new Date(v.timestamp) > oneHourAgo
    );
  }

  // Public API methods
  getViolations() {
    return [...this.violations];
  }

  getViolationCounts() {
    return { ...this.violationCounts };
  }

  getViolationsByDirective(directive) {
    return this.violations.filter(v => v.violatedDirective === directive);
  }

  getViolationsByURI(uri) {
    return this.violations.filter(v => v.blockedURI === uri);
  }

  clearViolations() {
    this.violations = [];
    this.violationCounts = {};
  }

  getSummary() {
    const summary = {
      total: this.violations.length,
      byDirective: {},
      byURI: {},
      recent: this.violations.slice(-10)
    };

    this.violations.forEach(violation => {
      // Count by directive
      summary.byDirective[violation.violatedDirective] = 
        (summary.byDirective[violation.violatedDirective] || 0) + 1;
      
      // Count by URI
      summary.byURI[violation.blockedURI] = 
        (summary.byURI[violation.blockedURI] || 0) + 1;
    });

    return summary;
  }
}

/**
 * CSP Validation Utility
 * Validates CSP configuration and provides recommendations
 */
class CSPValidator {
  static validatePolicy(cspString) {
    const directives = this.parseCSP(cspString);
    const validation = {
      valid: true,
      warnings: [],
      recommendations: [],
      score: 50 // Start with base score of 50
    };

    // Check for essential security directives
    const securityDirectives = [
      'default-src',
      'script-src',
      'style-src',
      'connect-src',
      'img-src',
      'font-src',
      'media-src',
      'object-src',
      'base-uri',
      'form-action',
      'frame-ancestors',
      'upgrade-insecure-requests'
    ];

    securityDirectives.forEach(directive => {
      // Check if directive exists (either as key or if it's a directive without value)
      const hasDirective = directives.hasOwnProperty(directive) || 
                          cspString.includes(directive);
      
      if (!hasDirective) {
        validation.warnings.push(`Missing security directive: ${directive}`);
        validation.valid = false;
        validation.score -= 5; // Penalize missing directives
      } else {
        validation.score += 2; // Reward present directives
      }
    });

    // Check for unsafe directives
    if (directives['script-src'] && directives['script-src'].includes("'unsafe-eval'")) {
      validation.warnings.push("script-src includes 'unsafe-eval' - consider removing if possible");
      validation.score -= 10;
    }

    if (directives['script-src'] && directives['script-src'].includes("'unsafe-inline'")) {
      validation.warnings.push("script-src includes 'unsafe-inline' - consider using nonce or hash");
      validation.score -= 5;
    }

    if (directives['style-src'] && directives['style-src'].includes("'unsafe-inline'")) {
      validation.warnings.push("style-src includes 'unsafe-inline' - required for styled-components");
      validation.score -= 2; // Less severe for styles
    }

    // Check for security best practices
    if (directives['object-src'] && !directives['object-src'].includes("'none'")) {
      validation.recommendations.push("Set object-src to 'none' for better security");
      validation.score -= 5;
    } else if (directives['object-src'] && directives['object-src'].includes("'none'")) {
      validation.score += 5; // Reward secure object-src
    }

    if (directives['frame-ancestors'] && !directives['frame-ancestors'].includes("'none'")) {
      validation.recommendations.push("Set frame-ancestors to 'none' to prevent clickjacking");
      validation.score -= 5;
    } else if (directives['frame-ancestors'] && directives['frame-ancestors'].includes("'none'")) {
      validation.score += 5; // Reward secure frame-ancestors
    }

    if (cspString.includes('upgrade-insecure-requests')) {
      validation.score += 3; // Reward HTTPS upgrade
    } else {
      validation.recommendations.push("Add upgrade-insecure-requests for HTTPS enforcement");
      validation.score -= 3;
    }

    // Calculate final score (0-100)
    validation.score = Math.max(0, Math.min(100, validation.score));

    return validation;
  }

  static parseCSP(cspString) {
    const directives = {};
    const parts = cspString.split(';').map(part => part.trim());
    
    parts.forEach(part => {
      if (part) {
        const [directive, ...values] = part.split(/\s+/);
        directives[directive] = values.join(' ');
      }
    });

    return directives;
  }

  static generateReport(cspString) {
    const validation = this.validatePolicy(cspString);
    const directives = this.parseCSP(cspString);

    return {
      timestamp: new Date().toISOString(),
      csp: cspString,
      directives,
      validation,
      summary: {
        totalDirectives: Object.keys(directives).length,
        securityScore: validation.score,
        isValid: validation.valid,
        warningCount: validation.warnings.length,
        recommendationCount: validation.recommendations.length
      }
    };
  }
}

// Export for use in components
export { CSPViolationReporter, CSPValidator };

// Default export for convenience
export default CSPViolationReporter;