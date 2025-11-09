import DOMPurify from 'dompurify';

/**
 * Comprehensive message validator with security checks
 * Implements pattern matching, content filtering, and rate limiting
 */
class MessageValidator {
  static patterns = {
    // Block common attack patterns
    xss: /script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    sqlInjection: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|WHERE)\b)/gi,
    javascript: /javascript:/gi,
    dataUri: /data:(?:(?!image\/png|image\/jpeg|image\/gif|image\/webp)[\w\/-]+)/gi,
    // Block suspicious patterns
    excessiveRepetition: /(.)\1{50,}/gi,
    suspiciousLinks: /\b(bit\.ly|tinyurl|t\.co|goo\.gl|short\.link|cutt\.ly|bit\.do)\b/gi,
    // Block potential code injection
    phpTags: /<\?php|<\?=/gi,
    aspTags: /<%|<%=/gi,
    // Block markdown that could be dangerous
    markdownImage: /!\[.*?\]\(.*?\)/gi,
    // Block base64 encoded content that might be malicious
    base64Suspicious: /[A-Za-z0-9+\/]{100,}={0,2}/gi
  };
  
  static limits = {
    maxLength: 2000,
    maxLines: 50,
    maxWords: 300,
    allowedChars: /^[a-zA-Z0-9\s\.\,\!\?\-\_\@\#\$\%\^\&\*\(\)\[\]\{\}\|\\\/\+\=\:\;\"\'\<\>\,\.\?\!\-\_\~\`\n\r]+$/
  };
  
  static rateLimits = new Map();
  
  /**
   * Validates and sanitizes a message with comprehensive security checks
   * @param {string} message - The message to validate
   * @param {string} userId - Optional user ID for rate limiting
   * @returns {string} - The sanitized message
   * @throws {Error} - If validation fails
   */
  static validate(message, userId = null) {
    if (!message || typeof message !== 'string') {
      throw new Error('Invalid message format');
    }
    
    const trimmed = message.trim();
    
    // Basic validation
    if (trimmed.length === 0) {
      throw new Error('Message cannot be empty');
    }
    
    // Rate limiting check
    if (userId) {
      this.checkRateLimit(userId);
    }
    
    // Length validation
    if (trimmed.length > this.limits.maxLength) {
      throw new Error(`Message too long (max ${this.limits.maxLength} characters)`);
    }
    
    // Content structure validation
    if (trimmed.split('\n').length > this.limits.maxLines) {
      throw new Error(`Too many lines (max ${this.limits.maxLines})`);
    }
    
    if (trimmed.split(/\s+/).length > this.limits.maxWords) {
      throw new Error(`Too many words (max ${this.limits.maxWords})`);
    }
    
    // Pattern validation for security threats
    for (const [name, pattern] of Object.entries(this.patterns)) {
      if (pattern.test(trimmed)) {
        // Log security event for monitoring
        this.logSecurityEvent(name, trimmed, userId);
        throw new Error(`Message contains prohibited content: ${name.replace(/([A-Z])/g, ' $1').trim()}`);
      }
    }
    
    // Character validation
    if (!this.limits.allowedChars.test(trimmed)) {
      throw new Error('Message contains invalid characters');
    }
    
    // Additional content checks
    this.validateContentPatterns(trimmed);
    
    return this.sanitize(trimmed);
  }
  
  /**
   * Checks rate limiting for a specific user
   * @param {string} userId - User identifier
   */
  static checkRateLimit(userId) {
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    const maxMessages = 10; // Max 10 messages per minute
    
    if (!this.rateLimits.has(userId)) {
      this.rateLimits.set(userId, []);
    }
    
    const userMessages = this.rateLimits.get(userId);
    
    // Clean old messages outside the time window
    const recentMessages = userMessages.filter(timestamp => now - timestamp < windowMs);
    
    if (recentMessages.length >= maxMessages) {
      throw new Error('Rate limit exceeded. Please wait before sending another message.');
    }
    
    // Add current message timestamp
    recentMessages.push(now);
    this.rateLimits.set(userId, recentMessages);
  }
  
  /**
   * Validates content patterns for additional security
   * @param {string} content - Content to validate
   */
  static validateContentPatterns(content) {
    // Check for potential phone number exposure
    const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
    if (phonePattern.test(content)) {
      // Allow but log for monitoring
      console.warn('Potential phone number detected in message');
    }
    
    // Check for email addresses
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    if (emailPattern.test(content)) {
      // Allow but log for monitoring
      console.warn('Email address detected in message');
    }
    
    // Check for potential SSN or credit card patterns
    const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/g;
    const ccPattern = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
    
    if (ssnPattern.test(content) || ccPattern.test(content)) {
      throw new Error('Message contains potentially sensitive personal information');
    }
  }
  
  /**
   * Sanitizes content using DOMPurify with enhanced security
   * @param {string} input - Input to sanitize
   * @returns {string} - Sanitized content
   */
  static sanitize(input) {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
      RETURN_TRUSTED_TYPE: false,
      SANITIZE_DOM: true,
      SANITIZE_NAMED_PROPS: true,
      WHOLE_DOCUMENT: false,
      CUSTOM_ELEMENT_HANDLING: {
        tagNameCheck: null,
        attributeNameCheck: null,
        allowCustomizedBuiltInElements: false
      }
    });
  }
  
  /**
   * Logs security events for monitoring
   * @param {string} threatType - Type of threat detected
   * @param {string} content - The content that triggered the alert
   * @param {string} userId - User identifier if available
   */
  static logSecurityEvent(threatType, content, userId = null) {
    const securityEvent = {
      timestamp: new Date().toISOString(),
      threatType,
      userId,
      contentLength: content.length,
      contentPreview: content.substring(0, 100) + (content.length > 100 ? '...' : '')
    };
    
    // In production, this would send to a security monitoring service
    console.warn('Security Event Detected:', securityEvent);
    
    // Store recent security events for analysis
    if (typeof window !== 'undefined' && window.chatSecurityEvents) {
      window.chatSecurityEvents.push(securityEvent);
      // Keep only last 100 events
      if (window.chatSecurityEvents.length > 100) {
        window.chatSecurityEvents.shift();
      }
    }
  }
  
  /**
   * Clears rate limiting data for a user or all users
   * @param {string} userId - User ID to clear, or null to clear all
   */
  static clearRateLimit(userId = null) {
    if (userId) {
      this.rateLimits.delete(userId);
    } else {
      this.rateLimits.clear();
    }
  }
  
  /**
   * Gets rate limit status for a user
   * @param {string} userId - User identifier
   * @returns {Object} - Rate limit status
   */
  static getRateLimitStatus(userId) {
    const userMessages = this.rateLimits.get(userId) || [];
    const now = Date.now();
    const windowMs = 60000;
    const recentMessages = userMessages.filter(timestamp => now - timestamp < windowMs);
    
    return {
      currentCount: recentMessages.length,
      maxCount: 10,
      windowMs,
      resetTime: Math.max(...recentMessages, now) + windowMs
    };
  }
}

/**
 * Enhanced input sanitizer with comprehensive validation
 * @param {string} input - The input string to sanitize
 * @returns {string} - The sanitized input string
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return '';
  }
  
  return MessageValidator.sanitize(input.trim());
};

/**
 * Validates and sanitizes message text with comprehensive security checks
 * @param {string} message - The message text to validate and sanitize
 * @param {string} userId - Optional user ID for rate limiting
 * @returns {string} - The sanitized message text
 */
export const sanitizeMessage = (message, userId = null) => {
  return MessageValidator.validate(message, userId);
};

/**
 * Validates and sanitizes author name with enhanced security
 * @param {string} author - The author name to validate and sanitize
 * @returns {string} - The sanitized author name
 */
export const sanitizeAuthor = (author) => {
  if (!author || typeof author !== 'string') {
    return 'Anonymous';
  }
  
  // Sanitize the input
  const sanitized = sanitizeInput(author);
  
  // Enhanced validation for author names
  const cleaned = sanitized
    .replace(/[<>]/g, '') // Remove literal angle brackets
    .replace(/</g, '') // Remove escaped <
    .replace(/>/g, '') // Remove escaped >
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/data:/gi, '') // Remove data protocol
    .trim();
  
  if (cleaned.length === 0) {
    return 'Anonymous';
  }
  
  if (cleaned.length > 50) {
    return cleaned.substring(0, 50).trim();
  }
  
  // Additional validation for author names
  if (!/^[a-zA-Z0-9\s\.\-\_]+$/.test(cleaned)) {
    // If contains invalid characters, return a safe version
    return cleaned.replace(/[^a-zA-Z0-9\s\.\-\_]/g, '').trim() || 'Anonymous';
  }
  
  return cleaned;
};

/**
 * Validates file names for security
 * @param {string} fileName - The file name to validate
 * @returns {string} - The sanitized file name
 */
export const sanitizeFileName = (fileName) => {
  if (!fileName || typeof fileName !== 'string') {
    return 'unknown-file';
  }
  
  const sanitized = fileName
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid file name characters
    .replace(/\.\./g, '') // Remove directory traversal
    .replace(/^\./, '') // Remove leading dot (hidden files)
    .toLowerCase()
    .trim();
  
  if (sanitized.length === 0) {
    return 'unknown-file';
  }
  
  if (sanitized.length > 255) {
    return sanitized.substring(0, 255).trim();
  }
  
  return sanitized;
};

/**
 * Validates URLs for security
 * @param {string} url - The URL to validate
 * @returns {boolean} - Whether the URL is safe
 */
export const validateUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    const parsedUrl = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }
    
    // Block localhost and private IP ranges in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = parsedUrl.hostname;
      if (hostname === 'localhost' || 
          hostname.startsWith('127.') || 
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.includes('.local')) {
        return false;
      }
    }
    
    // Block suspicious domains
    const suspiciousDomains = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl'];
    if (suspiciousDomains.some(domain => hostname.includes(domain))) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Rate limiting utilities
 */
export const rateLimitUtils = {
  clearRateLimit: (userId) => MessageValidator.clearRateLimit(userId),
  getRateLimitStatus: (userId) => MessageValidator.getRateLimitStatus(userId),
  clearAllRateLimits: () => MessageValidator.clearRateLimit()
};

/**
 * Initialize security monitoring
 */
export const initializeSecurityMonitoring = () => {
  if (typeof window !== 'undefined') {
    window.chatSecurityEvents = window.chatSecurityEvents || [];
  }
};

/**
 * Get security statistics
 * @returns {Object} - Security monitoring statistics
 */
export const getSecurityStats = () => {
  if (typeof window !== 'undefined' && window.chatSecurityEvents) {
    const events = window.chatSecurityEvents;
    const lastHour = Date.now() - (60 * 60 * 1000);
    const recentEvents = events.filter(event => new Date(event.timestamp).getTime() > lastHour);
    
    const threatCounts = recentEvents.reduce((acc, event) => {
      acc[event.threatType] = (acc[event.threatType] || 0) + 1;
      return acc;
    }, {});
    
    return {
      totalEvents: events.length,
      recentEvents: recentEvents.length,
      threatCounts,
      rateLimitedUsers: MessageValidator.rateLimits.size
    };
  }
  
  return {
    totalEvents: 0,
    recentEvents: 0,
    threatCounts: {},
    rateLimitedUsers: 0
  };
};

// Export the validator class for advanced usage
export { MessageValidator };

// Initialize security monitoring when module is loaded
initializeSecurityMonitoring();