/**
 * Enhanced Client-Side Input Validation and Sanitization
 * 
 * This module provides comprehensive input validation and sanitization
 * without requiring server-side API endpoints. It implements multiple
 * layers of security using advanced client-side techniques.
 */

import DOMPurify from 'dompurify';

// Enhanced security patterns for comprehensive threat detection
const ENHANCED_SECURITY_PATTERNS = {
  // XSS attack patterns - more comprehensive than original
  xss: [
    // Script tag variations
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<script\b[^>]*>/gi,
    /<\/script>/gi,
    
    // Event handlers (very common XSS vectors)
    /on\w+\s*=\s*["']?[^"']*["']?/gi,
    /on\w+\s*=\s*\w+/gi,
    /on\w+\s*=\s*\([^)]*\)/gi,
    
    // JavaScript protocols
    /javascript:/gi,
    /data\s*:\s*text\/html/gi,
    /vbscript:/gi,
    
    // Dangerous tags and attributes
    /<iframe\b[^>]*>/gi,
    /<object\b[^>]*>/gi,
    /<embed\b[^>]*>/gi,
    /<applet\b[^>]*>/gi,
    /<meta\b[^>]*>/gi,
    /<link\b[^>]*>/gi,
    /<style\b[^>]*>/gi,
    
    // CSS-based XSS
    /expression\s*\(/gi,
    /@import/gi,
    /behavior\s*:/gi,
    /binding\s*:/gi,
    
    // HTML5 dangerous attributes
    /autofocus\s*=\s*["']?autofocus["']?/gi,
    /formaction\s*=/gi,
    /formmethod\s*=/gi,
    
    // SVG-based XSS
    /<svg\b[^>]*>.*?<\/svg>/gi,
    /<use\b[^>]*xlink:href\s*=/gi,
    
    // Data URIs
    /data\s*:\s*[^;]*;base64/gi,
    
    // Script-like content in various contexts
    /eval\s*\(/gi,
    /setTimeout\s*\(/gi,
    /setInterval\s*\(/gi,
    /Function\s*\(/gi,
    
    // Angular template injection
    /\{\{\s*\$.*?\}\}/gi,
    /\{\{\s*.*?\|\s*.*?\}\}/gi
  ],

  // SQL injection patterns - enhanced with more variations
  sqlInjection: [
    // Basic SQL keywords
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|WHERE|HAVING|GROUP BY|ORDER BY)\b)/gi,
    
    // SQL operators and functions
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(\b(OR|AND)\s+['"]?\w+['"]?\s*=\s*['"]?\w+['"]?)/gi,
    /(\b(OR|AND)\s+\w+\s*LIKE\s*['"][^'"]*['"])/gi,
    
    // SQL comments and delimiters
    /(--|\#|\/\*|\*\/)/gi,
    /;\s*(DROP|DELETE|UPDATE|INSERT|CREATE|ALTER)/gi,
    
    // Advanced SQL injection patterns
    /(\b(UNION|INTERSECT|EXCEPT)\s+SELECT)/gi,
    /(\b(INNER|LEFT|RIGHT|FULL|CROSS)\s+JOIN)/gi,
    /(\b(HAVING|GROUP BY|ORDER BY)\s+\w+)/gi,
    
    // SQL functions that can be abused
    /(\b(LOAD_FILE|INTO OUTFILE|DUMPFILE|BENCHMARK|SLEEP)\b)/gi,
    /(\b(USER|VERSION|DATABASE|@@)\b)/gi,
    
    // Boolean-based injection
    /(\b(AND|OR)\s+\d+\s*(<|>|=|!=|<>|<=|>=)\s*\d+)/gi,
    /(\b(AND|OR)\s+['"]?\w+['"]?\s*(<|>|=|!=|<>|<=|>=)\s*['"]?\w+['"]?)/gi,
    
    // Time-based injection
    /(\b(WAITFOR|DELAY|pg_sleep|SLEEP)\s*\()/gi,
    
    // Stacked queries
    /;\s*(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)/gi
  ],

  // Code injection patterns - multiple languages
  codeInjection: [
    // PHP code injection
    /<\?php/gi,
    /<\?=/gi,
    /\?>/gi,
    /eval\s*\(\s*['"]?\$_/gi,
    
    // ASP code injection
    /<%/gi,
    /%>/gi,
    /Response\.Write/gi,
    /Server\.Execute/gi,
    
    // JSP code injection
    /<%@/gi,
    /<jsp:/gi,
    
    // Shell command injection
    /(\b(system|exec|shell_exec|passthru|popen|proc_open)\s*\()/gi,
    /(\b(cmd|command|powershell|bash|sh)\s+['"]?)/gi,
    
    // Template injection
    /\{\{\s*.*?\}\}/gi,
    /\{%\s*.*?%\}/gi,
    /\{\#\s*.*?\#\}/gi,
    
    // XPath injection
    /(\b(document|node)\s*\(\s*['"]?\/)/gi,
    
    // LDAP injection
    /(\b(ldap_search|ldap_list|ldap_read)\s*\()/gi,
    /[()=,*&|!~]/gi, // LDAP operators
    
    // NoSQL injection
    /\$\w+/gi, // MongoDB operators
    /(\b(where|find|findOne)\s*\(\s*\{)/gi,
    /(\b(db\.collection|collection)\s*\(\s*['"]?\w+['"]?\s*\)\s*\.\s*(find|findOne|insert|update|remove))/gi
  ],

  // Path traversal patterns
  pathTraversal: [
    /\.\.[\/\\]/gi,
    /\.\.%2f/gi,
    /\.\.%5c/gi,
    /%2e%2e[\/\\]/gi,
    /\.\.%c0%af/gi,
    /\.\.%c1%9c/gi,
    /file:\/\/\/\//gi,
    /\/etc\/passwd/gi,
    /\/proc\//gi,
    /windows\/system32/gi,
    /c:\\windows/gi
  ],

  // Command injection patterns
  commandInjection: [
    /;\s*(rm|del|format|fdisk|mkfs)/gi,
    /\|\s*(cat|type|more|less)/gi,
    /&&\s*(netstat|ipconfig|ifconfig)/gi,
    /`\s*[^`]*`/gi,
    /\$\([^)]*\)/gi,
    /(\b(curl|wget|nc|telnet)\s+)/gi,
    /(\b(python|perl|ruby|node)\s+)/gi
  ],

  // File inclusion patterns
  fileInclusion: [
    /include\s*\(\s*['"]?\$_/gi,
    /require\s*\(\s*['"]?\$_/gi,
    /file_get_contents\s*\(/gi,
    /fopen\s*\(\s*['"]?\$_/gi,
    /readfile\s*\(\s*['"]?\$_/gi
  ],

  // HTTP header injection
  headerInjection: [
    /\r\n/gi,
    /\n/gi,
    /\r/gi,
    /Location\s*:/gi,
    /Refresh\s*:/gi,
    /Set-Cookie\s*:/gi
  ],

  // Log injection
  logInjection: [
    /\n/gi,
    /\r/gi,
    /\t/gi,
    /\[.*?\]/gi, // Log format patterns
    /<script\b[^>]*>.*?<\/script>/gi // XSS in logs
  ]
};

// Client-side rate limiting with localStorage persistence
class ClientRateLimiter {
  constructor() {
    this.storageKey = 'chat_widget_rate_limit';
    this.maxRequests = {
      message: 10,      // 10 messages per minute
      chat_creation: 3, // 3 chat creations per minute
      default: 20       // 20 other actions per minute
    };
    this.windowMs = 60 * 1000; // 1 minute window
  }

  getStorageData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.warn('Failed to read rate limit data:', error);
      return {};
    }
  }

  setStorageData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to write rate limit data:', error);
    }
  }

  checkRateLimit(userId, action = 'default') {
    const now = Date.now();
    const data = this.getStorageData();
    const key = `${userId}_${action}`;
    
    // Initialize if not exists
    if (!data[key]) {
      data[key] = { count: 0, resetTime: now + this.windowMs };
    }

    // Reset window if expired
    if (now > data[key].resetTime) {
      data[key] = { count: 0, resetTime: now + this.windowMs };
    }

    // Check limit
    const maxRequests = this.maxRequests[action] || this.maxRequests.default;
    if (data[key].count >= maxRequests) {
      const resetIn = Math.ceil((data[key].resetTime - now) / 1000);
      return {
        allowed: false,
        reason: `Rate limit exceeded. Try again in ${resetIn} seconds.`,
        resetTime: data[key].resetTime,
        count: data[key].count,
        maxRequests
      };
    }

    // Increment counter
    data[key].count++;
    this.setStorageData(data);

    return {
      allowed: true,
      remaining: maxRequests - data[key].count,
      resetTime: data[key].resetTime,
      count: data[key].count,
      maxRequests
    };
  }

  reset(userId, action = 'default') {
    const data = this.getStorageData();
    const key = `${userId}_${action}`;
    delete data[key];
    this.setStorageData(data);
  }

  cleanup() {
    const now = Date.now();
    const data = this.getStorageData();
    let hasChanges = false;

    for (const key in data) {
      if (now > data[key].resetTime) {
        delete data[key];
        hasChanges = true;
      }
    }

    if (hasChanges) {
      this.setStorageData(data);
    }
  }
}

// Enhanced DOMPurify configuration
const getEnhancedDOMPurifyConfig = () => ({
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'i', 'b',
    'span', 'div'
  ],
  ALLOWED_ATTR: [
    'class', 'id'
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  ADD_ATTR: ['target'],
  FORBID_TAGS: [
    'script', 'style', 'iframe', 'object', 'embed',
    'applet', 'meta', 'link', 'form', 'input',
    'button', 'textarea', 'select', 'option'
  ],
  FORBID_ATTR: [
    'onclick', 'onload', 'onerror', 'onmouseover',
    'onfocus', 'onblur', 'onchange', 'onsubmit',
    'style', 'src', 'href', 'action', 'method'
  ],
  KEEP_CONTENT: false,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  SANITIZE_DOM: true,
  SANITIZE_NAMED_PROPS: true,
  WHOLE_DOCUMENT: false,
  CUSTOM_ELEMENT_HANDLING: {
    tagNameCheck: null,
    attributeNameCheck: null,
    allowCustomizedBuiltInElements: false
  }
});

// Security event monitoring (client-side only)
class SecurityEventMonitor {
  constructor() {
    this.events = [];
    this.maxEvents = 1000; // Keep last 1000 events
    this.storageKey = 'chat_widget_security_events';
    this.loadEvents();
  }

  loadEvents() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.events = JSON.parse(stored);
        // Keep only recent events (last 24 hours)
        const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
        this.events = this.events.filter(event => event.timestamp > dayAgo);
      }
    } catch (error) {
      console.warn('Failed to load security events:', error);
      this.events = [];
    }
  }

  saveEvents() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.events));
    } catch (error) {
      console.warn('Failed to save security events:', error);
    }
  }

  addEvent(event) {
    const securityEvent = {
      ...event,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.events.push(securityEvent);
    
    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    this.saveEvents();

    // Log to console for debugging
    console.warn('Security event detected:', securityEvent);
  }

  getEvents(limit = 50) {
    return this.events.slice(-limit);
  }

  getStatistics() {
    const stats = {
      total: this.events.length,
      byType: {},
      byHour: {},
      recent: this.events.filter(e => Date.now() - e.timestamp < 3600000).length
    };

    this.events.forEach(event => {
      stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;
      
      const hour = new Date(event.timestamp).getHours();
      stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
    });

    return stats;
  }

  clear() {
    this.events = [];
    this.saveEvents();
  }
}

// MessageValidator class for testing and direct use
class MessageValidator {
  constructor() {
    this.rateLimiter = new ClientRateLimiter();
    this.securityMonitor = new SecurityEventMonitor();
  }

  validate(message, userId = null) {
    // Input validation
    if (typeof message !== 'string') {
      throw new Error('Invalid message format');
    }

    if (!message.trim()) {
      throw new Error('Message cannot be empty');
    }

    if (message.length > 2000) {
      throw new Error('Message too long');
    }

    if (message.split('\n').length > 50) {
      throw new Error('Too many lines');
    }

    if (message.split(/\s+/).length > 300) {
      throw new Error('Too many words');
    }

    // Check for threats
    for (const [category, patterns] of Object.entries(ENHANCED_SECURITY_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(message)) {
          const threatType = category.replace(/([A-Z])/g, ' $1').toLowerCase();
          throw new Error(`prohibited content: ${threatType}`);
        }
      }
    }

    // Additional checks
    if (/(.)\1{50,}/.test(message)) {
      throw new Error('prohibited content: excessive Repetition');
    }

    // Check for sensitive information
    if (/\b\d{3}-\d{2}-\d{4}\b/.test(message)) {
      console.warn('Potential phone number detected in message');
    }

    if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(message)) {
      console.warn('Email address detected in message');
    }

    if (/\b\d{3}-\d{2}-\d{4}\b/.test(message) && /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/.test(message)) {
      throw new Error('sensitive personal information');
    }

    // Rate limiting
    if (userId) {
      const rateLimitCheck = this.rateLimiter.checkRateLimit(userId, 'message');
      if (!rateLimitCheck.allowed) {
        throw new Error('Rate limit exceeded');
      }
    }

    return message;
  }

  getRateLimitStatus(userId) {
    return this.rateLimiter.checkRateLimit(userId, 'message');
  }

  clearRateLimit(userId = null) {
    if (userId) {
      this.rateLimiter.reset(userId, 'message');
    } else {
      // Clear all rate limits
      const data = this.rateLimiter.getStorageData();
      for (const key in data) {
        if (key.endsWith('_message')) {
          const userId = key.replace('_message', '');
          this.rateLimiter.reset(userId, 'message');
        }
      }
    }
  }

  static get rateLimits() {
    // This is a static property for testing
    return new Map();
  }
}

// Global instances
const rateLimiter = new ClientRateLimiter();
const securityMonitor = new SecurityEventMonitor();

// Enhanced client-side validation function
const validateClientSide = async (input) => {
  const threats = [];
  const detectedPatterns = {};

  // Check each category of threats
  for (const [category, patterns] of Object.entries(ENHANCED_SECURITY_PATTERNS)) {
    detectedPatterns[category] = [];
    
    for (const pattern of patterns) {
      const matches = input.match(pattern);
      if (matches) {
        detectedPatterns[category].push({
          pattern: pattern.toString(),
          matches: matches.slice(0, 3), // Limit to prevent memory issues
          count: matches.length
        });
        
        threats.push({
          type: category,
          pattern: pattern.toString(),
          matches: matches.slice(0, 3),
          severity: getSeverity(category)
        });
      }
    }
  }

  // Additional validation checks
  const additionalChecks = {
    hasNullBytes: /\0/g.test(input),
    hasControlChars: /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g.test(input),
    hasUnicodeExploits: /[\u202E\u202D\u200F\u200E]/g.test(input),
    hasExcessiveRepetition: /(.)\1{50,}/g.test(input),
    hasMixedEncodings: /%[0-9A-Fa-f]{2}/g.test(input) && /&#\d+;/g.test(input)
  };

  // Add additional threats
  Object.entries(additionalChecks).forEach(([check, detected]) => {
    if (detected) {
      threats.push({
        type: 'additional',
        check,
        detected: true,
        severity: 'medium'
      });
    }
  });

  return {
    isValid: threats.length === 0,
    threats,
    detectedPatterns,
    additionalChecks,
    timestamp: Date.now()
  };
};

// Get severity level for threat type
const getSeverity = (category) => {
  const severityMap = {
    xss: 'critical',
    sqlInjection: 'critical',
    codeInjection: 'high',
    commandInjection: 'critical',
    pathTraversal: 'high',
    fileInclusion: 'high',
    headerInjection: 'medium',
    logInjection: 'low'
  };
  return severityMap[category] || 'medium';
};

// Generate client fingerprint (without canvas API issues)
const generateClientFingerprint = () => {
  try {
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages?.join(',') || '',
      platform: navigator.platform,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1,
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack || 'unspecified',
      sessionStorage: typeof sessionStorage !== 'undefined',
      localStorage: typeof localStorage !== 'undefined',
      indexedDb: typeof indexedDB !== 'undefined',
      webGL: (() => {
        try {
          const canvas = document.createElement('canvas');
          return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
          return false;
        }
      })()
    };

    // Create hash from fingerprint
    const fingerprintString = Object.values(fingerprint).join('|');
    let hash = 0;
    for (let i = 0; i < fingerprintString.length; i++) {
      const char = fingerprintString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  } catch (error) {
    // Fallback to simple timestamp-based ID
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
};

// Main enhanced validation function
export const validateInputSecure = async (input, context = {}) => {
  const startTime = Date.now();
  
  try {
    // Input validation
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }

    if (input.length === 0) {
      throw new Error('Input cannot be empty');
    }

    if (input.length > 50000) { // 50KB limit
      throw new Error('Input too large');
    }

    // 1. Client-side comprehensive validation
    const clientValidation = await validateClientSide(input);
    
    // 2. Rate limiting check
    const userId = context.userId || generateClientFingerprint();
    const action = context.action || 'default';
    const rateLimitCheck = rateLimiter.checkRateLimit(userId, action);
    
    if (!rateLimitCheck.allowed) {
      const event = {
        type: 'rate_limit_exceeded',
        userId,
        action,
        details: rateLimitCheck
      };
      securityMonitor.addEvent(event);
      
      throw new Error(rateLimitCheck.reason);
    }

    // 3. Security threat detection
    if (!clientValidation.isValid) {
      const criticalThreats = clientValidation.threats.filter(t => t.severity === 'critical');
      const highThreats = clientValidation.threats.filter(t => t.severity === 'high');
      
      // Log security events
      clientValidation.threats.forEach(threat => {
        securityMonitor.addEvent({
          type: 'security_threat',
          threatType: threat.type,
          severity: threat.severity,
          pattern: threat.pattern,
          context
        });
      });

      // Block critical threats
      if (criticalThreats.length > 0) {
        throw new Error(`Security threat detected: ${criticalThreats[0].type}`);
      }

      // Allow high threats but with warning (could be configured to block)
      if (highThreats.length > 0) {
        console.warn('High severity security threat detected:', highThreats);
      }
    }

    // 4. Enhanced DOMPurify sanitization
    const sanitizedInput = DOMPurify.sanitize(input, getEnhancedDOMPurifyConfig());

    // 5. Final validation
    if (sanitizedInput.length === 0 && input.length > 0) {
      throw new Error('Input contained only disallowed content');
    }

    const processingTime = Date.now() - startTime;

    // Log successful validation
    securityMonitor.addEvent({
      type: 'validation_success',
      inputLength: input.length,
      sanitizedLength: sanitizedInput.length,
      processingTime,
      threatsDetected: clientValidation.threats.length,
      context
    });

    return {
      sanitizedInput,
      isValid: true,
      threats: clientValidation.threats,
      processingTime,
      rateLimitInfo: rateLimitCheck
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    // Log validation failure
    securityMonitor.addEvent({
      type: 'validation_error',
      error: error.message,
      processingTime,
      context
    });

    throw error;
  }
};

// Convenience functions for specific use cases
export const sanitizeMessage = async (message, userId) => {
  return validateInputSecure(message, {
    userId,
    action: 'message',
    contentType: 'message'
  });
};

export const sanitizeAuthor = async (author, userId) => {
  return validateInputSecure(author, {
    userId,
    action: 'author',
    contentType: 'author'
  });
};

export const sanitizeChatInput = async (input, userId) => {
  return validateInputSecure(input, {
    userId,
    action: 'chat_creation',
    contentType: 'chat_input'
  });
};

// Utility functions for monitoring and management
export const getSecurityStatistics = () => {
  return securityMonitor.getStatistics();
};

export const getRecentSecurityEvents = (limit = 50) => {
  return securityMonitor.getEvents(limit);
};

export const clearSecurityEvents = () => {
  securityMonitor.clear();
};

export const resetRateLimit = (userId, action = 'default') => {
  rateLimiter.reset(userId, action);
};

export const getRateLimitStatus = (userId, action = 'default') => {
  return rateLimiter.checkRateLimit(userId, action);
};

// Cleanup old data
export const cleanupOldData = () => {
  rateLimiter.cleanup();
  securityMonitor.saveEvents();
};

// Auto-cleanup on module load
setTimeout(cleanupOldData, 1000);

// Export convenience functions for backward compatibility
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/\s+/g, ' ');
};

export const sanitizeFileName = (fileName) => {
  if (!fileName || typeof fileName !== 'string') return 'unknown-file';
  
  // Remove invalid characters and directory traversal
  const sanitized = fileName
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\.\./g, '')
    .replace(/^\./, '');
  
  return sanitized || 'unknown-file';
};

export const validateUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const parsed = new URL(url);
    
    // Block dangerous protocols
    if (['javascript:', 'data:', 'vbscript:'].includes(parsed.protocol)) {
      return false;
    }
    
    // Block suspicious domains
    const suspiciousDomains = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl'];
    if (suspiciousDomains.some(domain => parsed.hostname.includes(domain))) {
      return false;
    }
    
    // Block localhost in production
    if (process.env.NODE_ENV === 'production') {
      const localhostPatterns = ['localhost', '127.0.0.1', '192.168.', '10.0.'];
      if (localhostPatterns.some(pattern => parsed.hostname.includes(pattern))) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

// Rate limit utilities
export const rateLimitUtils = {
  clearRateLimit: (userId, action = 'default') => {
    rateLimiter.reset(userId, action);
  },
  getRateLimitStatus: (userId, action = 'default') => {
    return rateLimiter.checkRateLimit(userId, action);
  },
  clearAllRateLimits: () => {
    const data = rateLimiter.getStorageData();
    for (const key in data) {
      const [userId, action] = key.split('_');
      rateLimiter.reset(userId, action);
    }
  }
};

// Export classes and utilities for testing
export { MessageValidator, ENHANCED_SECURITY_PATTERNS, ClientRateLimiter, SecurityEventMonitor };