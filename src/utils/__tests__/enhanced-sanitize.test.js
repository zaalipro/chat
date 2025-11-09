import { 
  sanitizeInput, 
  sanitizeMessage, 
  sanitizeAuthor, 
  sanitizeFileName,
  validateUrl,
  rateLimitUtils,
  getSecurityStats,
  MessageValidator 
} from '../sanitize';

import { vi, describe, test, expect, beforeEach } from 'vitest';

// Mock DOMPurify with proper default export
vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn((input) => input)
  }
}));

// Mock window object for security events
Object.defineProperty(window, 'chatSecurityEvents', {
  value: [],
  writable: true
});

describe('Enhanced Input Validation System', () => {
  beforeEach(() => {
    // Clear rate limits before each test
    MessageValidator.clearRateLimit();
    // Clear security events
    if (typeof window !== 'undefined') {
      window.chatSecurityEvents = [];
    }
  });

  describe('MessageValidator.validate', () => {
    test('should accept valid messages', () => {
      const validMessage = 'Hello, this is a normal message!';
      const result = MessageValidator.validate(validMessage);
      expect(result).toBe(validMessage);
    });

    test('should reject empty messages', () => {
      expect(() => MessageValidator.validate('')).toThrow('Message cannot be empty');
      expect(() => MessageValidator.validate('   ')).toThrow('Message cannot be empty');
    });

    test('should reject non-string inputs', () => {
      expect(() => MessageValidator.validate(null)).toThrow('Invalid message format');
      expect(() => MessageValidator.validate(undefined)).toThrow('Invalid message format');
      expect(() => MessageValidator.validate(123)).toThrow('Invalid message format');
      expect(() => MessageValidator.validate({})).toThrow('Invalid message format');
    });

    test('should enforce maximum length limit', () => {
      const longMessage = 'a'.repeat(2001);
      expect(() => MessageValidator.validate(longMessage)).toThrow('Message too long');
    });

    test('should enforce maximum lines limit', () => {
      const manyLinesMessage = 'line\n'.repeat(51);
      expect(() => MessageValidator.validate(manyLinesMessage)).toThrow('Too many lines');
    });

    test('should enforce maximum words limit', () => {
      const manyWordsMessage = 'word '.repeat(301);
      expect(() => MessageValidator.validate(manyWordsMessage)).toThrow('Too many words');
    });

    test('should detect and block XSS patterns', () => {
      const xssPatterns = [
        '<script>alert("xss")</script>',
        '<SCRIPT SRC="evil.js"></SCRIPT>',
        '<img src=x onerror=alert(1)>',
        '<svg onload=alert(1)>'
      ];

      xssPatterns.forEach(pattern => {
        expect(() => MessageValidator.validate(pattern)).toThrow('prohibited content: xss');
      });
    });

    test('should detect and block SQL injection patterns', () => {
      const sqlPatterns = [
        'SELECT * FROM users',
        'DROP TABLE users',
        'INSERT INTO users',
        'UPDATE password SET',
        'DELETE FROM users',
        'CREATE TABLE',
        'ALTER TABLE',
        'EXEC sp_helpdb',
        'UNION SELECT'
      ];

      sqlPatterns.forEach(pattern => {
        expect(() => MessageValidator.validate(pattern)).toThrow('prohibited content: sql Injection');
      });
    });

    test('should detect and block JavaScript protocol', () => {
      const jsPatterns = [
        'javascript:alert(1)',
        'JAVASCRIPT:document.cookie',
        'JavaScript:void(0)'
      ];

      jsPatterns.forEach(pattern => {
        expect(() => MessageValidator.validate(pattern)).toThrow('prohibited content: javascript');
      });
    });

    test('should detect and block suspicious data URIs', () => {
      const suspiciousDataUris = [
        'data:text/html,<script>alert(1)</script>',
        'data:application/javascript,alert(1)'
      ];

      suspiciousDataUris.forEach(uri => {
        expect(() => MessageValidator.validate(uri)).toThrow('prohibited content: data Uri');
      });
    });

    test('should detect excessive character repetition', () => {
      const repetitiveMessage = 'a'.repeat(51);
      expect(() => MessageValidator.validate(repetitiveMessage)).toThrow('prohibited content: excessive Repetition');
    });

    test('should detect suspicious link shorteners', () => {
      const suspiciousLinks = [
        'Check this out: bit.ly/abc123',
        'Visit tinyurl.com/xyz',
        'Click t.co/short',
        'Go to goo.gl/link'
      ];

      suspiciousLinks.forEach(link => {
        expect(() => MessageValidator.validate(link)).toThrow('prohibited content: suspicious Links');
      });
    });

    test('should detect PHP tags', () => {
      const phpPatterns = [
        '<?php echo "hello"; ?>',
        '<?= $variable ?>'
      ];

      phpPatterns.forEach(pattern => {
        expect(() => MessageValidator.validate(pattern)).toThrow('prohibited content: php Tags');
      });
    });

    test('should detect ASP tags', () => {
      const aspPatterns = [
        '<% Response.Write("hello") %>',
        '<%= variable %>'
      ];

      aspPatterns.forEach(pattern => {
        expect(() => MessageValidator.validate(pattern)).toThrow('prohibited content: asp Tags');
      });
    });

    test('should detect suspicious base64 content', () => {
      const longBase64 = 'A'.repeat(100) + '==';
      expect(() => MessageValidator.validate(longBase64)).toThrow('prohibited content: base64 Suspicious');
    });

    test('should validate character patterns', () => {
      const invalidChars = '\x00\x01\x02'; // Null bytes and control characters
      expect(() => MessageValidator.validate(invalidChars)).toThrow('invalid characters');
    });

    test('should detect potential SSN patterns', () => {
      const ssnPatterns = [
        '123-45-6789',
        '987-65-4321'
      ];

      ssnPatterns.forEach(pattern => {
        expect(() => MessageValidator.validate(pattern)).toThrow('sensitive personal information');
      });
    });

    test('should detect potential credit card patterns', () => {
      const ccPatterns = [
        '1234-5678-9012-3456',
        '1234 5678 9012 3456',
        '1234567890123456'
      ];

      ccPatterns.forEach(pattern => {
        expect(() => MessageValidator.validate(pattern)).toThrow('sensitive personal information');
      });
    });

    test('should allow phone numbers but log warning', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const phoneMessage = 'Call me at 123-456-7890';
      const result = MessageValidator.validate(phoneMessage);
      
      expect(result).toBe(phoneMessage);
      expect(consoleSpy).toHaveBeenCalledWith('Potential phone number detected in message');
      
      consoleSpy.mockRestore();
    });

    test('should allow emails but log warning', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const emailMessage = 'Contact me at user@example.com';
      const result = MessageValidator.validate(emailMessage);
      
      expect(result).toBe(emailMessage);
      expect(consoleSpy).toHaveBeenCalledWith('Email address detected in message');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Rate Limiting', () => {
    test('should allow messages within rate limit', () => {
      const userId = 'user123';
      
      // Should allow first message
      expect(() => MessageValidator.validate('Hello', userId)).not.toThrow();
      
      // Should allow up to 10 messages
      for (let i = 0; i < 9; i++) {
        expect(() => MessageValidator.validate(`Message ${i}`, userId)).not.toThrow();
      }
    });

    test('should block messages exceeding rate limit', () => {
      const userId = 'user123';
      
      // Send 10 messages (should be allowed)
      for (let i = 0; i < 10; i++) {
        MessageValidator.validate(`Message ${i}`, userId);
      }
      
      // 11th message should be blocked
      expect(() => MessageValidator.validate('Message 11', userId))
        .toThrow('Rate limit exceeded');
    });

    test('should provide rate limit status', () => {
      const userId = 'user123';
      
      // Send a few messages
      MessageValidator.validate('Message 1', userId);
      MessageValidator.validate('Message 2', userId);
      
      const status = MessageValidator.getRateLimitStatus(userId);
      
      expect(status.currentCount).toBe(2);
      expect(status.maxCount).toBe(10);
      expect(status.windowMs).toBe(60000);
      expect(status.resetTime).toBeGreaterThan(Date.now());
    });

    test('should clear rate limits', () => {
      const userId = 'user123';
      
      // Send some messages
      MessageValidator.validate('Message 1', userId);
      expect(MessageValidator.getRateLimitStatus(userId).currentCount).toBe(1);
      
      // Clear rate limit
      MessageValidator.clearRateLimit(userId);
      expect(MessageValidator.getRateLimitStatus(userId).currentCount).toBe(0);
    });

    test('should clear all rate limits', () => {
      MessageValidator.validate('Message 1', 'user1');
      MessageValidator.validate('Message 2', 'user2');
      
      expect(MessageValidator.rateLimits.size).toBe(2);
      
      MessageValidator.clearRateLimit();
      expect(MessageValidator.rateLimits.size).toBe(0);
    });
  });

  describe('sanitizeInput', () => {
    test('should sanitize basic input', () => {
      const input = '  Hello World  ';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello World');
    });

    test('should handle non-string inputs', () => {
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
      expect(sanitizeInput(123)).toBe('');
      expect(sanitizeInput({})).toBe('');
    });
  });

  describe('sanitizeMessage', () => {
    test('should validate and sanitize messages', () => {
      const message = 'Hello, this is a test message!';
      const result = sanitizeMessage(message);
      expect(result).toBe(message);
    });

    test('should apply rate limiting when userId provided', () => {
      const userId = 'user123';
      
      // Should work with userId
      expect(() => sanitizeMessage('Hello', userId)).not.toThrow();
      
      // Should exceed rate limit
      for (let i = 0; i < 10; i++) {
        sanitizeMessage(`Message ${i}`, userId);
      }
      
      expect(() => sanitizeMessage('Message 11', userId))
        .toThrow('Rate limit exceeded');
    });
  });

  describe('sanitizeAuthor', () => {
    test('should sanitize valid author names', () => {
      expect(sanitizeAuthor('John Doe')).toBe('John Doe');
      expect(sanitizeAuthor('  Jane Smith  ')).toBe('Jane Smith');
    });

    test('should handle invalid author names', () => {
      expect(sanitizeAuthor('')).toBe('Anonymous');
      expect(sanitizeAuthor(null)).toBe('Anonymous');
      expect(sanitizeAuthor(undefined)).toBe('Anonymous');
      expect(sanitizeAuthor(123)).toBe('Anonymous');
    });

    test('should remove dangerous characters', () => {
      expect(sanitizeAuthor('John<script>alert(1)</script>')).toBe('Johnalert1');
      expect(sanitizeAuthor('Jane<>Doe')).toBe('JaneDoe');
    });

    test('should truncate long author names', () => {
      const longName = 'A'.repeat(60);
      const result = sanitizeAuthor(longName);
      expect(result.length).toBe(50);
    });

    test('should handle invalid characters in author names', () => {
      expect(sanitizeAuthor('John@Doe#123')).toBe('JohnDoe123');
      expect(sanitizeAuthor('Jane$%^&*Smith')).toBe('JaneSmith');
    });
  });

  describe('sanitizeFileName', () => {
    test('should sanitize valid file names', () => {
      expect(sanitizeFileName('document.pdf')).toBe('document.pdf');
      expect(sanitizeFileName('image.jpeg')).toBe('image.jpeg');
    });

    test('should remove invalid characters', () => {
      expect(sanitizeFileName('file<name>.pdf')).toBe('filename.pdf');
      expect(sanitizeFileName('doc:ument.txt')).toBe('document.txt');
    });

    test('should handle directory traversal attempts', () => {
      expect(sanitizeFileName('../../../etc/passwd')).toBe('etcpasswd');
      expect(sanitizeFileName('..\\..\\windows\\system32')).toBe('windowssystem32');
    });

    test('should handle hidden files', () => {
      expect(sanitizeFileName('.hidden')).toBe('hidden');
    });

    test('should provide default for invalid inputs', () => {
      expect(sanitizeFileName('')).toBe('unknown-file');
      expect(sanitizeFileName(null)).toBe('unknown-file');
      expect(sanitizeFileName('<>:"/\\|?*')).toBe('unknown-file');
    });
  });

  describe('validateUrl', () => {
    test('should validate safe URLs', () => {
      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl('http://example.com')).toBe(true);
      expect(validateUrl('https://www.google.com')).toBe(true);
    });

    test('should reject unsafe URLs', () => {
      expect(validateUrl('javascript:alert(1)')).toBe(false);
      expect(validateUrl('data:text/html,<script>')).toBe(false);
      expect(validateUrl('ftp://example.com')).toBe(false);
    });

    test('should reject suspicious domains', () => {
      expect(validateUrl('https://bit.ly/abc')).toBe(false);
      expect(validateUrl('https://tinyurl.com/xyz')).toBe(false);
    });

    test('should reject localhost in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      expect(validateUrl('http://localhost:3000')).toBe(false);
      expect(validateUrl('http://127.0.0.1')).toBe(false);
      expect(validateUrl('http://192.168.1.1')).toBe(false);
      
      process.env.NODE_ENV = originalEnv;
    });

    test('should handle invalid URLs', () => {
      expect(validateUrl('not-a-url')).toBe(false);
      expect(validateUrl('')).toBe(false);
      expect(validateUrl(null)).toBe(false);
    });
  });

  describe('Security Monitoring', () => {
    test('should log security events', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      try {
        MessageValidator.validate('<script>alert(1)</script>');
      } catch (e) {
        // Expected to throw
      }
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Security Event Detected:',
        expect.objectContaining({
          threatType: 'xss',
          contentLength: expect.any(Number),
          contentPreview: expect.any(String)
        })
      );
      
      consoleSpy.mockRestore();
    });

    test('should track security events in window', () => {
      try {
        MessageValidator.validate('<script>alert(1)</script>');
      } catch (e) {
        // Expected to throw
      }
      
      expect(window.chatSecurityEvents).toHaveLength(1);
      expect(window.chatSecurityEvents[0].threatType).toBe('xss');
    });

    test('should provide security statistics', () => {
      const stats = getSecurityStats();
      
      expect(stats).toHaveProperty('totalEvents');
      expect(stats).toHaveProperty('recentEvents');
      expect(stats).toHaveProperty('threatCounts');
      expect(stats).toHaveProperty('rateLimitedUsers');
      
      expect(typeof stats.totalEvents).toBe('number');
      expect(typeof stats.recentEvents).toBe('number');
      expect(typeof stats.threatCounts).toBe('object');
      expect(typeof stats.rateLimitedUsers).toBe('number');
    });
  });

  describe('Rate Limit Utilities', () => {
    test('should export rate limit utilities', () => {
      expect(rateLimitUtils.clearRateLimit).toBeInstanceOf(Function);
      expect(rateLimitUtils.getRateLimitStatus).toBeInstanceOf(Function);
      expect(rateLimitUtils.clearAllRateLimits).toBeInstanceOf(Function);
    });

    test('should clear rate limits through utility', () => {
      const userId = 'user123';
      MessageValidator.validate('Hello', userId);
      
      expect(rateLimitUtils.getRateLimitStatus(userId).currentCount).toBe(1);
      
      rateLimitUtils.clearRateLimit(userId);
      expect(rateLimitUtils.getRateLimitStatus(userId).currentCount).toBe(0);
    });

    test('should clear all rate limits through utility', () => {
      MessageValidator.validate('Hello', 'user1');
      MessageValidator.validate('World', 'user2');
      
      rateLimitUtils.clearAllRateLimits();
      expect(MessageValidator.rateLimits.size).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle ASCII characters', () => {
      const asciiMessage = 'Hello World!';
      const result = MessageValidator.validate(asciiMessage);
      expect(result).toBe(asciiMessage);
    });

    test('should handle mixed case attack patterns', () => {
      expect(() => MessageValidator.validate('JAVASCRIPT:alert(1)')).toThrow('javascript');
      expect(() => MessageValidator.validate('SELECT * FROM users')).toThrow('sql Injection');
    });

    test('should handle whitespace variations', () => {
      const messageWithWhitespace = 'Hello\n\tWorld\r\n  Test';
      const result = MessageValidator.validate(messageWithWhitespace);
      expect(result).toBe(messageWithWhitespace);
    });

    test('should handle extremely long words', () => {
      const longWord = 'a'.repeat(2000);
      const message = `Start ${longWord} end`;
      
      // Should be rejected because the message is too long
      expect(() => MessageValidator.validate(message)).toThrow('Message too long');
    });
  });
});