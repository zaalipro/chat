import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { secureStorage, secureStore, isEncryptionAvailable, fallbackStorage } from '../crypto.js';

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
    }),
    key: vi.fn((index) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

// Mock sessionStorage
const sessionStorageMock = (() => {
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

// Mock crypto API for testing
const cryptoMock = {
  subtle: {
    importKey: vi.fn().mockResolvedValue({}),
    deriveKey: vi.fn().mockResolvedValue({}),
    encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    decrypt: vi.fn().mockResolvedValue(new TextEncoder().encode('test-data').buffer)
  },
  getRandomValues: vi.fn((array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  })
};

// Mock navigator
const navigatorMock = {
  userAgent: 'Test Browser',
  language: 'en-US'
};

// Mock screen
const screenMock = {
  width: 1920,
  height: 1080
};

describe('Crypto Utils', () => {
  let originalCrypto;

  beforeEach(() => {
    // Store original crypto
    originalCrypto = global.crypto;
    
    // Setup mocks
    global.localStorage = localStorageMock;
    global.sessionStorage = sessionStorageMock;
    global.navigator = navigatorMock;
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
    global.screen = screenMock;
    
    // Mock crypto properly
    Object.defineProperty(global, 'crypto', {
      value: cryptoMock,
      writable: true,
      configurable: true
    });
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup
    localStorageMock.clear();
    sessionStorageMock.clear();
    
    // Restore original crypto
    if (originalCrypto) {
      Object.defineProperty(global, 'crypto', {
        value: originalCrypto,
        writable: true,
        configurable: true
      });
    }
  });

  describe('isEncryptionAvailable', () => {
    it('should return true when crypto API is available', () => {
      expect(isEncryptionAvailable()).toBe(true);
    });

    it('should return false when crypto API is not available', () => {
      Object.defineProperty(global, 'crypto', {
        value: undefined,
        writable: true,
        configurable: true
      });
      expect(isEncryptionAvailable()).toBe(false);
    });
  });

  describe('secureStorage', () => {
    beforeEach(() => {
      // Mock successful crypto operations
      cryptoMock.subtle.importKey.mockResolvedValue({});
      cryptoMock.subtle.deriveKey.mockResolvedValue({});
      cryptoMock.subtle.encrypt.mockResolvedValue(new ArrayBuffer(8));
      cryptoMock.subtle.decrypt.mockResolvedValue(new TextEncoder().encode('test-data').buffer);
    });

    it('should store and retrieve encrypted data', async () => {
      const testData = { token: 'jwt-token-123', userId: 'user-456' };
      
      await secureStorage.set('token', testData);
      const retrieved = await secureStorage.get('token');
      
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent data', async () => {
      const result = await secureStorage.get('non-existent');
      expect(result).toBeNull();
    });

    it('should remove stored data', async () => {
      await secureStorage.set('test-key', 'test-value');
      await secureStorage.remove('test-key');
      
      const result = await secureStorage.get('test-key');
      expect(result).toBeNull();
    });

    it('should clear all secure storage', async () => {
      await secureStorage.set('key1', 'value1');
      await secureStorage.set('key2', 'value2');
      
      await secureStorage.clear();
      
      expect(await secureStorage.get('key1')).toBeNull();
      expect(await secureStorage.get('key2')).toBeNull();
    });

    it('should handle encryption errors gracefully', async () => {
      // Mock encryption failure
      cryptoMock.subtle.encrypt.mockRejectedValue(new Error('Encryption failed'));
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      await secureStorage.set('token', 'test-token');
      
      // Should fallback to regular storage
      expect(localStorageMock.getItem).toHaveBeenCalledWith('token');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to securely store data:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle decryption errors gracefully', async () => {
      // Set up encrypted data
      await secureStorage.set('token', 'test-token');
      
      // Mock decryption failure
      cryptoMock.subtle.decrypt.mockRejectedValue(new Error('Decryption failed'));
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await secureStorage.get('token');
      
      // Should fallback to regular storage
      expect(result).toBe('test-token');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to retrieve secure data:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('secureStore', () => {
    beforeEach(() => {
      // Mock successful crypto operations
      cryptoMock.subtle.importKey.mockResolvedValue({});
      cryptoMock.subtle.deriveKey.mockResolvedValue({});
      cryptoMock.subtle.encrypt.mockResolvedValue(new ArrayBuffer(8));
      cryptoMock.subtle.decrypt.mockResolvedValue(new TextEncoder().encode('test-data').buffer);
    });

    it('should encrypt sensitive keys', async () => {
      const sensitiveData = { token: 'jwt-token-123' };
      
      await secureStore.set('token', sensitiveData);
      
      // Should use secure storage for sensitive keys
      expect(localStorageMock.getItem).toHaveBeenCalledWith('secure_data_token');
    });

    it('should use regular storage for non-sensitive keys', async () => {
      const nonSensitiveData = { theme: 'dark', language: 'en' };
      
      await secureStore.set('preferences', nonSensitiveData);
      
      // Should use regular localStorage for non-sensitive keys
      expect(localStorageMock.getItem).toHaveBeenCalledWith('preferences');
    });

    it('should retrieve and decrypt sensitive keys', async () => {
      const sensitiveData = { token: 'jwt-token-123' };
      
      await secureStore.set('token', sensitiveData);
      const retrieved = await secureStore.get('token');
      
      expect(retrieved).toEqual(sensitiveData);
    });

    it('should retrieve non-sensitive keys from regular storage', async () => {
      const nonSensitiveData = { theme: 'dark' };
      
      await secureStore.set('theme', nonSensitiveData);
      const retrieved = await secureStore.get('theme');
      
      expect(retrieved).toEqual(nonSensitiveData);
    });

    it('should handle case-insensitive sensitive key detection', async () => {
      const testCases = [
        'token',
        'TOKEN',
        'jwt',
        'JWT',
        'auth',
        'AUTH',
        'userToken',
        'accessToken'
      ];
      
      for (const key of testCases) {
        await secureStore.set(key, 'test-value');
        // Should call secure storage methods for sensitive keys
        expect(localStorageMock.getItem).toHaveBeenCalledWith(
          expect.stringContaining('secure_data_')
        );
      }
    });
  });

  describe('fallbackStorage', () => {
    it('should store and retrieve data without encryption', () => {
      const testData = { key: 'value' };
      
      fallbackStorage.set('test', testData);
      const retrieved = fallbackStorage.get('test');
      
      expect(retrieved).toEqual(testData);
    });

    it('should handle string values', () => {
      const testString = 'simple-string';
      
      fallbackStorage.set('string-test', testString);
      const retrieved = fallbackStorage.get('string-test');
      
      expect(retrieved).toBe(testString);
    });

    it('should return null for non-existent keys', () => {
      const result = fallbackStorage.get('non-existent');
      expect(result).toBeNull();
    });

    it('should remove keys', () => {
      fallbackStorage.set('test', 'value');
      fallbackStorage.remove('test');
      
      const result = fallbackStorage.get('test');
      expect(result).toBeNull();
    });

    it('should clear all storage', () => {
      fallbackStorage.set('key1', 'value1');
      fallbackStorage.set('key2', 'value2');
      
      fallbackStorage.clear();
      
      expect(fallbackStorage.get('key1')).toBeNull();
      expect(fallbackStorage.get('key2')).toBeNull();
    });

    it('should handle invalid JSON gracefully', () => {
      localStorageMock.setItem('invalid-json', 'invalid-json-string');
      
      const result = fallbackStorage.get('invalid-json');
      expect(result).toBe('invalid-json-string');
    });
  });

  describe('Browser Fingerprinting', () => {
    it('should generate consistent fingerprint', async () => {
      const testData = { token: 'test-token' };
      
      await secureStorage.set('test', testData);
      const retrieved1 = await secureStorage.get('test');
      
      // Clear session to test consistency
      sessionStorageMock.clear();
      
      const retrieved2 = await secureStorage.get('test');
      
      // Should be able to retrieve data even without session
      expect(retrieved1).toEqual(testData);
      expect(retrieved2).toEqual(testData);
    });
  });
});