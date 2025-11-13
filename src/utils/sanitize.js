/**
 * Input Sanitization and Validation Module
 * 
 * This module provides backward compatibility while integrating with the enhanced
 * client-side validation system. It maintains the original API while adding
 * comprehensive security features.
 */

import DOMPurify from 'dompurify';
import { validateInputSecure, sanitizeMessage, sanitizeAuthor, sanitizeChatInput } from './enhanced-sanitize.js';

// Original DOMPurify configuration for backward compatibility
const DOM_PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'span', 'div',
    'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
  ],
  ALLOWED_ATTR: ['href', 'title', 'alt', 'class', 'id'],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  ADD_ATTR: ['target'],
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
  FORBID_ATTR: ['onclick', 'onload', 'onerror'],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  SANITIZE_DOM: true,
  SANITIZE_NAMED_PROPS: true,
  WHOLE_DOCUMENT: false
};

// Security patterns for basic validation (original patterns)
const SECURITY_PATTERNS = {
  xss: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  sqlInjection: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|WHERE)\b)/gi,
  codeInjection: /<\?php|<%|<%@/gi,
  pathTraversal: /\.\.[\/\\]/gi,
  commandInjection: /;\s*(rm|del|format)/gi
};

// Rate limiting configuration (simplified for backward compatibility)
const RATE_LIMIT_CONFIG = {
  maxMessages: 10,
  timeWindow: 60000, // 1 minute
  maxRetries: 3
};

// Rate limiter instance (simplified)
const rateLimiter = {
  attempts: new Map(),
  
  checkLimit(userId) {
    const now = Date.now();
    const userAttempts = this.attempts.get(userId) || { count: 0, resetTime: now + RATE_LIMIT_CONFIG.timeWindow };
    
    if (now > userAttempts.resetTime) {
      userAttempts.count = 0;
      userAttempts.resetTime = now + RATE_LIMIT_CONFIG.timeWindow;
    }
    
    if (userAttempts.count >= RATE_LIMIT_CONFIG.maxMessages) {
      const resetIn = Math.ceil((userAttempts.resetTime - now) / 1000);
      throw new Error(`Rate limit exceeded. Please try again in ${resetIn} seconds.`);
    }
    
    userAttempts.count++;
    this.attempts.set(userId, userAttempts);
    return true;
  },
  
  reset(userId) {
    this.attempts.delete(userId);
  }
};

/**
 * Enhanced validation function with backward compatibility
 * @param {string} input - Input to validate
 * @param {Object} options - Validation options
 * @returns {string} Sanitized input
 */
export const validateInput = async (input, options = {}) => {
  const { 
    useEnhanced = true, 
    userId = 'anonymous',
    action = 'default',
    maxLength = 10000 
  } = options;

  try {
    // Input validation
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }

    if (input.length === 0) {
      throw new Error('Input cannot be empty');
    }

    if (input.length > maxLength) {
      throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
    }

    // Use enhanced validation if enabled
    if (useEnhanced) {
      const result = await validateInputSecure(input, { userId, action });
      return result.sanitizedInput;
    }

    // Fallback to basic validation
    return validateInputBasic(input);
    
  } catch (error) {
    console.error('Input validation failed:', error);
    throw error;
  }
};

/**
 * Basic validation function (original implementation)
 * @param {string} input - Input to validate
 * @returns {string} Sanitized input
 */
const validateInputBasic = (input) => {
  // Check for security threats
  for (const [threatType, pattern] of Object.entries(SECURITY_PATTERNS)) {
    if (pattern.test(input)) {
      console.warn(`Potential ${threatType} attack detected`);
      // For backward compatibility, we still sanitize but log the threat
    }
  }

  // Sanitize with DOMPurify
  const sanitized = DOMPurify.sanitize(input, DOM_PURIFY_CONFIG);
  
  if (sanitized.length === 0 && input.length > 0) {
    throw new Error('Input contained only disallowed content');
  }

  return sanitized;
};

/**
 * Enhanced message sanitization
 * @param {string} message - Message to sanitize
 * @param {string} userId - User ID for rate limiting
 * @returns {Promise<string>} Sanitized message
 */
export const sanitizeMessageEnhanced = async (message, userId = 'anonymous') => {
  try {
    // Check rate limit
    rateLimiter.checkLimit(userId);
    
    // Use enhanced validation
    const result = await sanitizeMessage(message, userId);
    return result.sanitizedInput || result;
    
  } catch (error) {
    console.error('Message sanitization failed:', error);
    throw error;
  }
};

/**
 * Enhanced author sanitization
 * @param {string} author - Author name to sanitize
 * @param {string} userId - User ID for tracking
 * @returns {Promise<string>} Sanitized author name
 */
export const sanitizeAuthorEnhanced = async (author, userId = 'anonymous') => {
  try {
    const result = await sanitizeAuthor(author, userId);
    return result.sanitizedInput || result;
    
  } catch (error) {
    console.error('Author sanitization failed:', error);
    throw error;
  }
};

/**
 * Enhanced chat input sanitization
 * @param {string} input - Chat input to sanitize
 * @param {string} userId - User ID for rate limiting
 * @returns {Promise<string>} Sanitized chat input
 */
export const sanitizeChatInputEnhanced = async (input, userId = 'anonymous') => {
  try {
    // Check rate limit for chat creation
    rateLimiter.checkLimit(userId);
    
    const result = await sanitizeChatInput(input, userId);
    return result.sanitizedInput || result;
    
  } catch (error) {
    console.error('Chat input sanitization failed:', error);
    throw error;
  }
};

/**
 * Legacy sanitize function for backward compatibility
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
export const sanitize = (input) => {
  try {
    return validateInputBasic(input);
  } catch (error) {
    console.error('Sanitization failed:', error);
    return ''; // Return empty string on error for backward compatibility
  }
};

/**
 * Legacy message sanitization for backward compatibility
 * @param {string} message - Message to sanitize
 * @param {string} userId - User ID for rate limiting
 * @returns {string} Sanitized message
 */
export const sanitizeMessageLegacy = (message, userId = 'anonymous') => {
  try {
    rateLimiter.checkLimit(userId);
    return validateInputBasic(message);
  } catch (error) {
    console.error('Legacy message sanitization failed:', error);
    return '';
  }
};

/**
 * Legacy author sanitization for backward compatibility
 * @param {string} author - Author name to sanitize
 * @returns {string} Sanitized author name
 */
export const sanitizeAuthorLegacy = (author) => {
  try {
    return validateInputBasic(author);
  } catch (error) {
    console.error('Legacy author sanitization failed:', error);
    return '';
  }
};

/**
 * Check if input is safe (backward compatibility)
 * @param {string} input - Input to check
 * @returns {boolean} True if input is safe
 */
export const isInputSafe = (input) => {
  try {
    validateInputBasic(input);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get security statistics (enhanced feature)
 * @returns {Object} Security statistics
 */
export const getSecurityStats = () => {
  try {
    // Import dynamically to avoid circular dependencies
    const { getSecurityStatistics } = require('./enhanced-sanitize.js');
    return getSecurityStatistics();
  } catch (error) {
    return {
      total: 0,
      byType: {},
      recent: 0,
      error: 'Enhanced security monitoring not available'
    };
  }
};

/**
 * Get recent security events (enhanced feature)
 * @param {number} limit - Maximum number of events to return
 * @returns {Array} Recent security events
 */
export const getRecentSecurityEvents = (limit = 50) => {
  try {
    const { getRecentSecurityEvents: getEvents } = require('./enhanced-sanitize.js');
    return getEvents(limit);
  } catch (error) {
    return [];
  }
};

/**
 * Clear security events (enhanced feature)
 */
export const clearSecurityEvents = () => {
  try {
    const { clearSecurityEvents: clearEvents } = require('./enhanced-sanitize.js');
    clearEvents();
  } catch (error) {
    console.warn('Failed to clear security events:', error);
  }
};

/**
 * Reset rate limit for a user
 * @param {string} userId - User ID to reset
 */
export const resetUserRateLimit = (userId) => {
  rateLimiter.reset(userId);
  
  try {
    const { resetRateLimit } = require('./enhanced-sanitize.js');
    resetRateLimit(userId);
  } catch (error) {
    console.warn('Failed to reset enhanced rate limit:', error);
  }
};

/**
 * Get rate limit status for a user
 * @param {string} userId - User ID to check
 * @param {string} action - Action type
 * @returns {Object} Rate limit status
 */
export const getUserRateLimitStatus = (userId, action = 'default') => {
  try {
    const { getRateLimitStatus } = require('./enhanced-sanitize.js');
    return getRateLimitStatus(userId, action);
  } catch (error) {
    // Fallback to basic rate limiter
    const userAttempts = rateLimiter.attempts.get(userId);
    if (userAttempts) {
      const remaining = Math.max(0, RATE_LIMIT_CONFIG.maxMessages - userAttempts.count);
      const resetIn = Math.ceil((userAttempts.resetTime - Date.now()) / 1000);
      
      return {
        allowed: remaining > 0,
        remaining,
        resetTime: userAttempts.resetTime,
        count: userAttempts.count,
        maxRequests: RATE_LIMIT_CONFIG.maxMessages,
        resetIn: resetIn > 0 ? resetIn : 0
      };
    }
    
    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG.maxMessages,
      resetTime: Date.now() + RATE_LIMIT_CONFIG.timeWindow,
      count: 0,
      maxRequests: RATE_LIMIT_CONFIG.maxMessages,
      resetIn: 60
    };
  }
};

// Export the enhanced functions as default for modern usage
export default {
  // Enhanced functions (recommended)
  validateInput,
  sanitizeMessageEnhanced,
  sanitizeAuthorEnhanced,
  sanitizeChatInputEnhanced,
  
  // Legacy functions (backward compatibility)
  sanitize,
  sanitizeMessageLegacy,
  sanitizeAuthorLegacy,
  isInputSafe,
  
  // Utility functions
  getSecurityStats,
  getRecentSecurityEvents,
  clearSecurityEvents,
  resetUserRateLimit,
  getUserRateLimitStatus,
  
  // Configuration
  DOM_PURIFY_CONFIG,
  SECURITY_PATTERNS,
  RATE_LIMIT_CONFIG
};