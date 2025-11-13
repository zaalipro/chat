/**
 * Sanitization Tests
 * 
 * Tests for the backward-compatible sanitization module that integrates
 * with the enhanced client-side validation system.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  validateInput,
  sanitizeMessageEnhanced,
  sanitizeAuthorEnhanced,
  sanitizeChatInputEnhanced,
  sanitize,
  sanitizeMessageLegacy,
  sanitizeAuthorLegacy,
  isInputSafe,
  getSecurityStats,
  getRecentSecurityEvents,
  clearSecurityEvents,
  resetUserRateLimit,
  getUserRateLimitStatus
} from '../sanitize.js';

// Mock DOMPurify
vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn((input, config) => {
      // Basic sanitization for testing
      if (typeof input === 'string') {
        return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                   .replace(/<[^>]*>/g, '');
      }
      return input;
    })
  }
}));

// Mock localStorage for testing
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock enhanced-sanitize module
vi.mock('../enhanced-sanitize.js', () => ({
  validateInputSecure: vi.fn(async (input, context) => {
    // Mock enhanced validation
    if (input.includes('<script>') || input.includes('DROP TABLE')) {
      throw new Error('Security threat detected');
    }
    return {
      sanitizedInput: input.replace(/<[^>]*>/g, ''),
      isValid: true,
      threats: [],
      processingTime: 5
    };
  }),
  sanitizeMessage: vi.fn(async (message, userId) => {
    if (message.includes('<script>')) {
      throw new Error('Security threat detected: xss');
    }
    return {
      sanitizedInput: message.replace(/<[^>]*>/g, ''),
      isValid: true,
      threats: []
    };
  }),
  sanitizeAuthor: vi.fn(async (author, userId) => ({
    sanitizedInput: author.replace(/<[^>]*>/g, ''),
    isValid: true,
    threats: []
  })),
  sanitizeChatInput: vi.fn(async (input, userId) => ({
    sanitizedInput: input.replace(/<[^>]*>/g, ''),
    isValid: true,
    threats: []
  })),
  getSecurityStatistics: vi.fn(() => ({
    total: 5,
    byType: { xss: 2, sqlInjection: 1, codeInjection: 2 },
    recent: 1
  })),
  getRecentSecurityEvents: vi.fn(() => [
    { type: 'xss', timestamp: Date.now() },
    { type: 'sqlInjection', timestamp: Date.now() - 1000 }
  ]),
  clearSecurityEvents: vi.fn(),
  resetRateLimit: vi.fn(),
  getRateLimitStatus: vi.fn((userId, action) => ({
    allowed: true,
    remaining: 8,
    resetTime: Date.now() + 60000,
    count: 2,
    maxRequests: 10,
    resetIn: 60
  }))
}));

describe('Sanitization Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateInput', () => {
    it('should validate input with enhanced validation by default', async () => {
      const result = await validateInput('Hello world', { userId: 'test-user' });
      
      expect(result).toBe('Hello world');
    });

    it('should use basic validation when enhanced is disabled', async () => {
      const result = await validateInput('Hello world', { 
        userId: 'test-user', 
        useEnhanced: false 
      });
      
      expect(result).toBe('Hello world');
    });

    it('should handle empty input', async () => {
      await expect(validateInput('', { userId: 'test-user' }))
        .rejects.toThrow('Input cannot be empty');
    });

    it('should handle non-string input', async () => {
      await expect(validateInput(123, { userId: 'test-user' }))
        .rejects.toThrow('Input must be a string');
    });

    it('should handle oversized input', async () => {
      const largeInput = 'a'.repeat(10001);
      await expect(validateInput(largeInput, { userId: 'test-user' }))
        .rejects.toThrow('Input exceeds maximum length');
    });

    it('should handle custom maxLength', async () => {
      const input = 'a'.repeat(101);
      await expect(validateInput(input, { userId: 'test-user', maxLength: 100 }))
        .rejects.toThrow('Input exceeds maximum length');
    });
  });

  describe('Enhanced Sanitization Functions', () => {
    it('sanitizeMessageEnhanced should work correctly', async () => {
      const result = await sanitizeMessageEnhanced('Hello world', 'test-user');
      
      expect(result).toBe('Hello world');
    });

    it('sanitizeMessageEnhanced should detect threats', async () => {
      await expect(sanitizeMessageEnhanced('<script>alert("xss")</script>', 'test-user'))
        .rejects.toThrow('Security threat detected: xss');
    });

    it('sanitizeAuthorEnhanced should work correctly', async () => {
      const result = await sanitizeAuthorEnhanced('John Doe', 'test-user');
      
      expect(result).toBe('John Doe');
    });

    it('sanitizeChatInputEnhanced should work correctly', async () => {
      const result = await sanitizeChatInputEnhanced('Hello', 'test-user');
      
      expect(result).toBe('Hello');
    });
  });

  describe('Legacy Functions', () => {
    it('sanitize should work with basic validation', () => {
      const result = sanitize('Hello <b>world</b>');
      
      expect(result).toBe('Hello world');
    });

    it('sanitize should handle errors gracefully', async () => {
      // Import the mock directly
      const dompurify = await vi.importMock('dompurify');
      dompurify.default.sanitize.mockImplementation(() => {
        throw new Error('Sanitization failed');
      });

      const result = sanitize('test');
      expect(result).toBe('');
    });

    it('sanitizeMessageLegacy should work correctly', () => {
      const result = sanitizeMessageLegacy('Hello world', 'test-user');
      
      expect(result).toBe('Hello world');
    });

    it('sanitizeMessageLegacy should handle rate limiting', () => {
      // Test multiple calls to trigger rate limiting
      for (let i = 0; i < 12; i++) {
        sanitizeMessageLegacy('test', 'rate-limit-user');
      }
      
      const result = sanitizeMessageLegacy('test', 'rate-limit-user');
      expect(result).toBe(''); // Should return empty string when rate limited
    });

    it('sanitizeAuthorLegacy should work correctly', () => {
      const result = sanitizeAuthorLegacy('John <script>alert("xss")</script>');
      
      expect(result).toBe('John ');
    });

    it('sanitizeAuthorLegacy should handle errors gracefully', async () => {
      const dompurify = await vi.importMock('dompurify');
      dompurify.default.sanitize.mockImplementation(() => {
        throw new Error('Sanitization failed');
      });

      const result = sanitizeAuthorLegacy('test');
      expect(result).toBe('');
    });
  });

  describe('isInputSafe', () => {
    it('should return true for safe input', () => {
      const result = isInputSafe('Hello world');
      expect(result).toBe(true);
    });

    it('should return false for unsafe input', () => {
      const result = isInputSafe('<script>alert("xss")</script>');
      expect(result).toBe(false);
    });

    it('should return false for empty input', () => {
      const result = isInputSafe('');
      expect(result).toBe(false);
    });
  });

  describe('Security Statistics Functions', () => {
    it('getSecurityStats should return statistics', () => {
      const stats = getSecurityStats();
      
      expect(stats).toHaveProperty('total', 5);
      expect(stats).toHaveProperty('byType');
      expect(stats).toHaveProperty('recent', 1);
    });

    it('getRecentSecurityEvents should return events', () => {
      const events = getRecentSecurityEvents(10);
      
      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBe(2);
      expect(events[0]).toHaveProperty('type', 'xss');
    });

    it('clearSecurityEvents should not throw', () => {
      expect(() => clearSecurityEvents()).not.toThrow();
    });
  });

  describe('Rate Limiting Functions', () => {
    it('resetUserRateLimit should work', () => {
      expect(() => resetUserRateLimit('test-user')).not.toThrow();
    });

    it('getUserRateLimitStatus should return status', () => {
      const status = getUserRateLimitStatus('test-user', 'message');
      
      expect(status).toHaveProperty('allowed', true);
      expect(status).toHaveProperty('remaining', 8);
      expect(status).toHaveProperty('resetTime');
      expect(status).toHaveProperty('count', 2);
      expect(status).toHaveProperty('maxRequests', 10);
      expect(status).toHaveProperty('resetIn', 60);
    });

    it('getUserRateLimitStatus should fallback to basic rate limiter', async () => {
      // Mock enhanced function to throw error
      const enhancedModule = await vi.importMock('../enhanced-sanitize.js');
      enhancedModule.getRateLimitStatus.mockImplementation(() => {
        throw new Error('Enhanced not available');
      });

      const status = getUserRateLimitStatus('test-user');
      
      expect(status).toHaveProperty('allowed');
      expect(status).toHaveProperty('remaining');
      expect(status).toHaveProperty('maxRequests');
    });
  });

  describe('Error Handling', () => {
    it('should handle enhanced validation errors gracefully', async () => {
      const enhancedModule = await vi.importMock('../enhanced-sanitize.js');
      enhancedModule.validateInputSecure.mockImplementation(() => {
        throw new Error('Enhanced validation failed');
      });

      await expect(validateInput('test', { userId: 'test-user' }))
        .rejects.toThrow('Enhanced validation failed');
    });

    it('should handle localStorage errors', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Should not throw, should handle gracefully
      await expect(validateInput('test', { userId: 'test-user' }))
        .resolves.toBeDefined();
    });

    it('should handle network-like errors in enhanced functions', async () => {
      const enhancedModule = await vi.importMock('../enhanced-sanitize.js');
      enhancedModule.sanitizeMessage.mockRejectedValue(new Error('Network error'));

      await expect(sanitizeMessageEnhanced('test', 'test-user'))
        .rejects.toThrow('Network error');
    });
  });

  describe('Backward Compatibility', () => {
    it('legacy functions should maintain original behavior', () => {
      // Test that legacy functions still work as expected
      expect(sanitize('Hello <b>world</b>')).toBe('Hello world');
      expect(sanitizeAuthorLegacy('John Doe')).toBe('John Doe');
      expect(isInputSafe('Hello')).toBe(true);
      expect(isInputSafe('<script>')).toBe(false);
    });

    it('enhanced functions should provide additional security', async () => {
      // Enhanced functions should catch more threats
      const legacyResult = sanitize('<script>alert("xss")</script>');
      const enhancedResult = await sanitizeMessageEnhanced('<script>alert("xss")</script>', 'test-user');
      
      expect(legacyResult).toBe('alert("xss")'); // Basic sanitization
      expect(enhancedResult).toBe(''); // Enhanced should block completely
    });
  });

  describe('Configuration', () => {
    it('should export configuration objects', () => {
      const { DOM_PURIFY_CONFIG, SECURITY_PATTERNS, RATE_LIMIT_CONFIG } = require('../sanitize.js');
      
      expect(DOM_PURIFY_CONFIG).toHaveProperty('ALLOWED_TAGS');
      expect(SECURITY_PATTERNS).toHaveProperty('xss');
      expect(RATE_LIMIT_CONFIG).toHaveProperty('maxMessages');
    });
  });

  describe('Integration', () => {
    it('should work with both enhanced and legacy functions', async () => {
      const input = 'Hello world';
      const userId = 'integration-test';
      
      // Enhanced function
      const enhancedResult = await sanitizeMessageEnhanced(input, userId);
      
      // Legacy function
      const legacyResult = sanitizeMessageLegacy(input, userId);
      
      expect(enhancedResult).toBe(input);
      expect(legacyResult).toBe(input);
    });

    it('should maintain rate limiting across functions', async () => {
      const userId = 'rate-integration-test';
      
      // Use enhanced function
      await sanitizeMessageEnhanced('test1', userId);
      await sanitizeMessageEnhanced('test2', userId);
      
      // Check rate limit status
      const status = getUserRateLimitStatus(userId, 'message');
      expect(status.count).toBeGreaterThan(0);
    });
  });
});