import axios from 'axios';

/**
 * Server-side validation API client
 * Provides secure validation endpoints that cannot be bypassed by client manipulation
 */

class ValidationAPI {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL;
    this.timeout = 5000;
  }

  /**
   * Validates input content on the server
   * @param {string} input - The input to validate
   * @param {Object} context - Validation context (userId, chatId, etc.)
   * @returns {Promise<Object>} - Validation result
   */
  async validateInput(input, context = {}) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/validate-input`,
        {
          input,
          context: {
            ...context,
            timestamp: Date.now(),
            origin: window.location.origin
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Validation-Version': '2.0',
            'X-Client-Fingerprint': this.generateFingerprint()
          },
          timeout: this.timeout
        }
      );

      return {
        isValid: response.data.isValid,
        sanitizedInput: response.data.sanitizedInput,
        reason: response.data.reason,
        threatLevel: response.data.threatLevel,
        serverTime: response.data.serverTime
      };
    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      if (error.response?.status === 400) {
        throw new Error(error.response.data.reason || 'Invalid input detected');
      }

      if (error.code === 'ECONNABORTED') {
        throw new Error('Validation request timed out');
      }

      // Fallback response for network errors
      console.warn('Server validation unavailable, using fallback:', error.message);
      return this.getFallbackValidation(input);
    }
  }

  /**
   * Checks rate limiting on the server
   * @param {string} userId - User identifier
   * @param {string} action - Action type (message, chat_creation, etc.)
   * @returns {Promise<Object>} - Rate limit status
   */
  async checkRateLimit(userId, action = 'message') {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/check-rate-limit`,
        {
          userId,
          action,
          clientFingerprint: this.generateFingerprint(),
          timestamp: Date.now()
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Fingerprint': this.generateFingerprint()
          },
          timeout: 3000
        }
      );

      return {
        allowed: response.data.allowed,
        remaining: response.data.remaining,
        resetTime: response.data.resetTime,
        reason: response.data.reason
      };
    } catch (error) {
      if (error.response?.status === 429) {
        const resetTime = error.response.data.resetTime;
        const waitTime = Math.ceil((resetTime - Date.now()) / 1000);
        throw new Error(`Rate limit exceeded. Try again in ${waitTime} seconds.`);
      }

      // Fallback to client-side rate limiting
      return this.getClientRateLimit(userId, action);
    }
  }

  /**
   * Reports a security event to the server
   * @param {Object} eventData - Security event data
   * @returns {Promise<Object>} - Report result
   */
  async reportSecurityEvent(eventData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/security-event`,
        {
          ...eventData,
          clientFingerprint: this.generateFingerprint(),
          timestamp: Date.now()
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Fingerprint': this.generateFingerprint()
          },
          timeout: 3000
        }
      );

      return response.data;
    } catch (error) {
      console.warn('Failed to report security event:', error.message);
      return { success: false, reason: 'Network error' };
    }
  }

  /**
   * Gets security statistics from the server
   * @param {Object} filters - Optional filters for stats
   * @returns {Promise<Object>} - Security statistics
   */
  async getSecurityStats(filters = {}) {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/security-stats`,
        {
          params: filters,
          headers: {
            'X-Client-Fingerprint': this.generateFingerprint()
          },
          timeout: 5000
        }
      );

      return response.data;
    } catch (error) {
      console.warn('Failed to get security stats:', error.message);
      return this.getClientSecurityStats();
    }
  }

  /**
   * Generates a client fingerprint for security tracking
   * @returns {string} - Client fingerprint
   */
  generateFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Fingerprint', 2, 2);
      
      const components = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        canvas.toDataURL().slice(-50),
        navigator.hardwareConcurrency || 'unknown',
        navigator.deviceMemory || 'unknown'
      ];
      
      return this.hashString(components.join('|'));
    } catch (error) {
      // Fallback fingerprint if canvas is blocked
      const fallbackComponents = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset()
      ];
      
      return this.hashString(fallbackComponents.join('|'));
    }
  }

  /**
   * Simple hash function for fingerprinting
   * @param {string} str - String to hash
   * @returns {string} - Hashed string
   */
  hashString(str) {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Fallback validation when server is unavailable
   * @param {string} input - Input to validate
   * @returns {Object} - Fallback validation result
   */
  getFallbackValidation(input) {
    // Basic client-side validation as fallback
    if (!input || typeof input !== 'string') {
      return {
        isValid: false,
        reason: 'Invalid input format',
        sanitizedInput: '',
        threatLevel: 'high'
      };
    }

    const trimmed = input.trim();
    
    if (trimmed.length === 0) {
      return {
        isValid: false,
        reason: 'Input cannot be empty',
        sanitizedInput: '',
        threatLevel: 'low'
      };
    }

    if (trimmed.length > 2000) {
      return {
        isValid: false,
        reason: 'Input too long',
        sanitizedInput: '',
        threatLevel: 'medium'
      };
    }

    // Basic XSS check
    if (/<script|javascript:|on\w+=/i.test(trimmed)) {
      return {
        isValid: false,
        reason: 'Potentially malicious content detected',
        sanitizedInput: '',
        threatLevel: 'high'
      };
    }

    return {
      isValid: true,
      sanitizedInput: trimmed,
      reason: 'Fallback validation passed',
      threatLevel: 'low'
    };
  }

  /**
   * Client-side rate limiting as fallback
   * @param {string} userId - User identifier
   * @param {string} action - Action type
   * @returns {Object} - Rate limit status
   */
  getClientRateLimit(userId, action) {
    const storageKey = `rateLimit_${userId}_${action}`;
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = action === 'message' ? 10 : 5;
    
    try {
      const data = localStorage.getItem(storageKey);
      const requests = data ? JSON.parse(data) : [];
      
      // Clean old requests
      const recentRequests = requests.filter(timestamp => now - timestamp < windowMs);
      
      if (recentRequests.length >= maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: Math.min(...recentRequests) + windowMs,
          reason: 'Client rate limit exceeded'
        };
      }
      
      // Add current request
      recentRequests.push(now);
      localStorage.setItem(storageKey, JSON.stringify(recentRequests));
      
      return {
        allowed: true,
        remaining: maxRequests - recentRequests.length,
        resetTime: now + windowMs,
        reason: 'Client rate limit check'
      };
    } catch (error) {
      console.warn('Client rate limiting failed:', error.message);
      return {
        allowed: true,
        remaining: maxRequests,
        resetTime: now + windowMs,
        reason: 'Rate limiting unavailable'
      };
    }
  }

  /**
   * Client-side security stats as fallback
   * @returns {Object} - Security statistics
   */
  getClientSecurityStats() {
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
        lastEvent: events[events.length - 1]?.timestamp || null,
        source: 'client'
      };
    }
    
    return {
      totalEvents: 0,
      recentEvents: 0,
      threatCounts: {},
      lastEvent: null,
      source: 'client'
    };
  }
}

// Create singleton instance
const validationAPI = new ValidationAPI();

export default validationAPI;

// Export individual methods for convenience
export const validateInputServer = (input, context) => validationAPI.validateInput(input, context);
export const checkRateLimitServer = (userId, action) => validationAPI.checkRateLimit(userId, action);
export const reportSecurityEvent = (eventData) => validationAPI.reportSecurityEvent(eventData);
export const getSecurityStats = (filters) => validationAPI.getSecurityStats(filters);