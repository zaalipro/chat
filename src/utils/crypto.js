/**
 * Cryptographic utilities for secure token storage and encryption
 * 
 * This module provides secure encryption/decryption functions for sensitive data
 * like JWT tokens, using the Web Crypto API which is available in modern browsers.
 * 
 * @since 1.0.0
 * @author Chat Widget Team
 */

/**
 * Configuration for encryption
 * Uses a combination of localStorage and session-based keys for security
 */
const ENCRYPTION_CONFIG = {
  // Key derivation parameters
  KEY_DERIVATION: {
    algorithm: 'PBKDF2',
    iterations: 100000,
    hash: 'SHA-256',
    keyLength: 256 // bits
  },
  // Encryption algorithm
  ENCRYPTION: {
    algorithm: 'AES-GCM',
    ivLength: 12 // bytes
  },
  // Storage keys
  STORAGE_KEYS: {
    encryptedData: 'secure_data',
    salt: 'secure_salt',
    iv: 'secure_iv'
  }
};

/**
 * Generates a cryptographically secure random salt
 * @returns {string} Base64 encoded salt
 */
const generateSalt = () => {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return btoa(String.fromCharCode(...salt));
};

/**
 * Generates a cryptographically secure random IV
 * @returns {Uint8Array} Initialization vector
 */
const generateIV = () => {
  const iv = new Uint8Array(ENCRYPTION_CONFIG.ENCRYPTION.ivLength);
  crypto.getRandomValues(iv);
  return iv;
};

/**
 * Derives an encryption key from a password and salt
 * @param {string} password - The password to derive from
 * @param {string} salt - Base64 encoded salt
 * @returns {Promise<CryptoKey>} Derived encryption key
 */
const deriveKey = async (password, salt) => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const saltBuffer = new Uint8Array(atob(salt).split('').map(c => c.charCodeAt(0)));

  return crypto.subtle.deriveKey(
    {
      name: ENCRYPTION_CONFIG.KEY_DERIVATION.algorithm,
      salt: saltBuffer,
      iterations: ENCRYPTION_CONFIG.KEY_DERIVATION.iterations,
      hash: ENCRYPTION_CONFIG.KEY_DERIVATION.hash
    },
    keyMaterial,
    { name: ENCRYPTION_CONFIG.ENCRYPTION.algorithm, length: ENCRYPTION_CONFIG.KEY_DERIVATION.keyLength },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * Encrypts data using AES-GCM
 * @param {string} data - The data to encrypt
 * @param {CryptoKey} encryptionKey - The encryption key
 * @returns {Promise<{encrypted: string, iv: string}>} Encrypted data with IV
 */
const encryptData = async (data, encryptionKey) => {
  const encoder = new TextEncoder();
  const iv = generateIV();
  
  const encrypted = await crypto.subtle.encrypt(
    {
      name: ENCRYPTION_CONFIG.ENCRYPTION.algorithm,
      iv
    },
    encryptionKey,
    encoder.encode(data)
  );

  return {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv))
  };
};

/**
 * Decrypts data using AES-GCM
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @param {string} iv - Base64 encoded initialization vector
 * @param {CryptoKey} decryptionKey - The decryption key
 * @returns {Promise<string>} Decrypted data
 */
const decryptData = async (encryptedData, iv, decryptionKey) => {
  const encryptedBuffer = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
  const ivBuffer = new Uint8Array(atob(iv).split('').map(c => c.charCodeAt(0)));

  const decrypted = await crypto.subtle.decrypt(
    {
      name: ENCRYPTION_CONFIG.ENCRYPTION.algorithm,
      iv: ivBuffer
    },
    decryptionKey,
    encryptedBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
};

/**
 * Gets or creates a browser fingerprint for key derivation
 * This creates a consistent but unique key per browser/session
 * @returns {string} Browser fingerprint
 */
const getBrowserFingerprint = () => {
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    // Add session-specific component
    sessionStorage.getItem('chatSession') || Date.now().toString()
  ].join('|');
  
  // Store session identifier for consistency
  if (!sessionStorage.getItem('chatSession')) {
    sessionStorage.setItem('chatSession', Date.now().toString());
  }
  
  return fingerprint;
};

/**
 * Secure storage interface with encryption
 */
export const secureStorage = {
  /**
   * Stores data securely with encryption
   * @param {string} storageKey - Storage key
   * @param {string} value - Value to store
   * @returns {Promise<void>}
   */
  set: async (storageKey, value) => {
    try {
      // Generate or retrieve salt
      let salt = localStorage.getItem(ENCRYPTION_CONFIG.STORAGE_KEYS.salt);
      if (!salt) {
        salt = generateSalt();
        localStorage.setItem(ENCRYPTION_CONFIG.STORAGE_KEYS.salt, salt);
      }

      // Derive encryption key
      const password = getBrowserFingerprint();
      const encryptionKey = await deriveKey(password, salt);

      // Encrypt the data
      const { encrypted, iv } = await encryptData(JSON.stringify(value), encryptionKey);

      // Store encrypted data and IV
      localStorage.setItem(`${ENCRYPTION_CONFIG.STORAGE_KEYS.encryptedData}_${storageKey}`, encrypted);
      localStorage.setItem(`${ENCRYPTION_CONFIG.STORAGE_KEYS.iv}_${storageKey}`, iv);

    } catch (error) {
      console.error('Failed to securely store data:', error);
      // Fallback to regular storage for non-critical errors
      localStorage.setItem(storageKey, value);
    }
  },

  /**
   * Retrieves and decrypts stored data
   * @param {string} storageKey - Storage key
   * @returns {Promise<string|null>} Decrypted value or null
   */
  get: async (storageKey) => {
    try {
      const encrypted = localStorage.getItem(`${ENCRYPTION_CONFIG.STORAGE_KEYS.encryptedData}_${storageKey}`);
      const iv = localStorage.getItem(`${ENCRYPTION_CONFIG.STORAGE_KEYS.iv}_${storageKey}`);
      const salt = localStorage.getItem(ENCRYPTION_CONFIG.STORAGE_KEYS.salt);

      if (!encrypted || !iv || !salt) {
        return null;
      }

      // Derive decryption key
      const password = getBrowserFingerprint();
      const decryptionKey = await deriveKey(password, salt);

      // Decrypt the data
      const decrypted = await decryptData(encrypted, iv, decryptionKey);
      
      return JSON.parse(decrypted);

    } catch (error) {
      console.error('Failed to retrieve secure data:', error);
      // Try fallback to regular storage
      const fallback = localStorage.getItem(storageKey);
      return fallback || null;
    }
  },

  /**
   * Removes stored data securely
   * @param {string} storageKey - Storage key
   */
  remove: (storageKey) => {
    try {
      localStorage.removeItem(`${ENCRYPTION_CONFIG.STORAGE_KEYS.encryptedData}_${storageKey}`);
      localStorage.removeItem(`${ENCRYPTION_CONFIG.STORAGE_KEYS.iv}_${storageKey}`);
      // Also remove fallback storage
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Failed to remove secure data:', error);
    }
  },

  /**
   * Clears all secure storage data
   */
  clear: () => {
    try {
      // Clear all secure storage keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(ENCRYPTION_CONFIG.STORAGE_KEYS.encryptedData) ||
            key.startsWith(ENCRYPTION_CONFIG.STORAGE_KEYS.iv)) {
          localStorage.removeItem(key);
        }
      });
      // Clear salt
      localStorage.removeItem(ENCRYPTION_CONFIG.STORAGE_KEYS.salt);
      // Clear session
      sessionStorage.removeItem('chatSession');
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
    }
  }
};

/**
 * Legacy compatibility functions for gradual migration
 * These provide the same interface as the original store2 library
 * but with encryption enabled for sensitive data
 */
export const secureStore = {
  /**
   * Securely stores a value (encrypts sensitive keys like 'token')
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @returns {Promise<void>}
   */
  set: async (key, value) => {
    // Encrypt sensitive keys
    const sensitiveKeys = ['token', 'jwt', 'auth'];
    const isSensitive = sensitiveKeys.some(sensitive => 
      key.toLowerCase().includes(sensitive.toLowerCase())
    );

    if (isSensitive) {
      await secureStorage.set(key, value);
    } else {
      // Use regular storage for non-sensitive data
      localStorage.setItem(key, JSON.stringify(value));
    }
  },

  /**
   * Retrieves a value (decrypts if sensitive)
   * @param {string} key - Storage key
   * @returns {Promise<any>} Retrieved value
   */
  get: async (key) => {
    const sensitiveKeys = ['token', 'jwt', 'auth'];
    const isSensitive = sensitiveKeys.some(sensitive => 
      key.toLowerCase().includes(sensitive.toLowerCase())
    );

    if (isSensitive) {
      return await secureStorage.get(key);
    } else {
      // Use regular storage for non-sensitive data
      const value = localStorage.getItem(key);
      try {
        return value ? JSON.parse(value) : null;
      } catch {
        return value;
      }
    }
  },

  /**
   * Removes a value from storage
   * @param {string} key - Storage key
   */
  remove: (key) => {
    const sensitiveKeys = ['token', 'jwt', 'auth'];
    const isSensitive = sensitiveKeys.some(sensitive => 
      key.toLowerCase().includes(sensitive.toLowerCase())
    );

    if (isSensitive) {
      secureStorage.remove(key);
    } else {
      localStorage.removeItem(key);
    }
  },

  /**
   * Clears all storage
   */
  clear: () => {
    secureStorage.clear();
    // Also clear regular localStorage
    localStorage.clear();
  }
};

/**
 * Utility function to check if encryption is available
 * @returns {boolean} True if Web Crypto API is available
 */
export const isEncryptionAvailable = () => {
  return typeof crypto !== 'undefined' && 
         typeof crypto.subtle !== 'undefined' &&
         typeof TextEncoder !== 'undefined' &&
         typeof TextDecoder !== 'undefined';
};

/**
 * Fallback for environments without encryption support
 */
export const fallbackStorage = {
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  get: (key) => {
    const value = localStorage.getItem(key);
    try {
      return value ? JSON.parse(value) : null;
    } catch {
      return value;
    }
  },
  remove: (key) => localStorage.removeItem(key),
  clear: () => localStorage.clear()
};

// Export the appropriate storage interface
export default isEncryptionAvailable() ? secureStore : fallbackStorage;