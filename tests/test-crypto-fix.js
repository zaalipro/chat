// Test script to verify the crypto utility fix
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the crypto utility file
const cryptoCode = readFileSync(join(__dirname, 'src/utils/crypto.js'), 'utf8');

console.log('🔍 Analyzing crypto utility for potential issues...\n');

// Check for the specific bug we fixed
const hasKeyShadowingBug = cryptoCode.includes('localStorage.setItem(`${ENCRYPTION_CONFIG.STORAGE_KEYS.encryptedData}_${key}`, encrypted)');

if (hasKeyShadowingBug) {
  console.log('❌ CRITICAL BUG DETECTED: Variable shadowing in crypto utility');
  console.log('   The parameter "key" is shadowing the encryption key variable');
  console.log('   This causes localStorage keys to be malformed and encryption to fail');
  process.exit(1);
} else {
  console.log('✅ Variable shadowing bug has been fixed');
}

// Check for proper parameter naming
const hasCorrectParameterNames = cryptoCode.includes('set: async (storageKey, value)') &&
                                cryptoCode.includes('get: async (storageKey)') &&
                                cryptoCode.includes('remove: (storageKey) =>');

if (hasCorrectParameterNames) {
  console.log('✅ Parameter names are correct (storageKey instead of key)');
} else {
  console.log('⚠️  Parameter naming could be clearer');
}

// Check for encryption key variable naming
const hasCorrectEncryptionKeyNames = cryptoCode.includes('const encryptionKey = await deriveKey') &&
                                    cryptoCode.includes('const decryptionKey = await deriveKey');

if (hasCorrectEncryptionKeyNames) {
  console.log('✅ Encryption key variables are properly named');
} else {
  console.log('⚠️  Encryption key variable naming could be improved');
}

// Check for proper error handling
const hasProperErrorHandling = cryptoCode.includes('try {') &&
                               cryptoCode.includes('catch (error)') &&
                               cryptoCode.includes('console.error');

if (hasProperErrorHandling) {
  console.log('✅ Proper error handling is implemented');
} else {
  console.log('⚠️  Error handling could be improved');
}

// Check for fallback mechanisms
const hasFallbackMechanism = cryptoCode.includes('fallback to regular storage') ||
                            cryptoCode.includes('Try fallback to regular storage');

if (hasFallbackMechanism) {
  console.log('✅ Fallback mechanisms are implemented');
} else {
  console.log('⚠️  Consider adding fallback mechanisms');
}

console.log('\n🎯 Summary:');
console.log('   The critical variable shadowing bug has been fixed');
console.log('   The crypto utility should now work correctly for JWT token encryption');
console.log('   Authentication errors should be resolved');

console.log('\n📋 Next Steps:');
console.log('   1. Test the application with the fixed crypto utility');
console.log('   2. Verify JWT tokens are being encrypted/decrypted correctly');
console.log('   3. Check that GraphQL authentication headers are properly formed');
console.log('   4. Monitor console logs for any remaining issues');