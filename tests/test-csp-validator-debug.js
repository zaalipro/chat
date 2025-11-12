/**
 * Debug CSP Validator
 * Simple test to understand why validation is failing
 */

// Mock the CSPValidator logic directly with the updated logic
const CSPValidator = {
  parseCSP(cspString) {
    const directives = {};
    const parts = cspString.split(';').map(part => part.trim());
    
    parts.forEach(part => {
      if (part) {
        const [directive, ...values] = part.split(/\s+/);
        directives[directive] = values.join(' ');
      }
    });

    return directives;
  },

  validatePolicy(cspString) {
    const directives = this.parseCSP(cspString);
    const validation = {
      valid: true,
      warnings: [],
      recommendations: [],
      score: 0
    };

    console.log('Parsed directives:', directives);

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
      
      console.log(`Checking directive ${directive}: hasDirective=${hasDirective}`);
      
      if (!hasDirective) {
        validation.warnings.push(`Missing security directive: ${directive}`);
        validation.valid = false;
        console.log(`Missing directive: ${directive}`);
      }
    });

    console.log('Validation warnings:', validation.warnings);
    console.log('Validation valid:', validation.valid);

    return validation;
  }
};

// Test the secure CSP
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

console.log('Testing CSP:', secureCSP);
const validation = CSPValidator.validatePolicy(secureCSP);
console.log('Final validation result:', validation);