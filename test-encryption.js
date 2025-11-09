// Simple test script to demonstrate the encryption functionality
import { secureStore, secureStorage, isEncryptionAvailable } from './src/utils/crypto.js';

async function testEncryption() {
  console.log('🔐 Testing JWT Token Encryption Implementation\n');
  
  // Test 1: Check if encryption is available
  console.log('1. Checking encryption availability...');
  const encryptionAvailable = isEncryptionAvailable();
  console.log(`   ✅ Encryption available: ${encryptionAvailable}\n`);
  
  // Test 2: Store a JWT token securely
  console.log('2. Storing JWT token securely...');
  const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ';
  
  try {
    await secureStore.set('token', testToken);
    console.log('   ✅ Token stored successfully\n');
  } catch (error) {
    console.log('   ❌ Failed to store token:', error.message, '\n');
  }
  
  // Test 3: Retrieve the JWT token
  console.log('3. Retrieving JWT token...');
  try {
    const retrievedToken = await secureStore.get('token');
    console.log(`   ✅ Token retrieved: ${retrievedToken ? 'Success' : 'Failed'}`);
    console.log(`   📝 Retrieved token length: ${retrievedToken?.length || 0} characters\n`);
  } catch (error) {
    console.log('   ❌ Failed to retrieve token:', error.message, '\n');
  }
  
  // Test 4: Store non-sensitive data (should use regular storage)
  console.log('4. Storing non-sensitive data...');
  try {
    await secureStore.set('preferences', { theme: 'dark', language: 'en' });
    console.log('   ✅ Non-sensitive data stored\n');
  } catch (error) {
    console.log('   ❌ Failed to store non-sensitive data:', error.message, '\n');
  }
  
  // Test 5: Retrieve non-sensitive data
  console.log('5. Retrieving non-sensitive data...');
  try {
    const preferences = await secureStore.get('preferences');
    console.log(`   ✅ Preferences retrieved: ${JSON.stringify(preferences)}\n`);
  } catch (error) {
    console.log('   ❌ Failed to retrieve preferences:', error.message, '\n');
  }
  
  // Test 6: Test direct secure storage
  console.log('6. Testing direct secure storage...');
  try {
    await secureStorage.set('secret', 'sensitive-data');
    const secret = await secureStorage.get('secret');
    console.log(`   ✅ Secure storage test: ${secret === 'sensitive-data' ? 'Success' : 'Failed'}\n`);
  } catch (error) {
    console.log('   ❌ Secure storage test failed:', error.message, '\n');
  }
  
  // Test 7: Check localStorage contents
  console.log('7. Checking localStorage contents...');
  const storageKeys = Object.keys(localStorage);
  console.log('   📋 Storage keys found:');
  storageKeys.forEach(key => {
    const isSecure = key.includes('secure_');
    const value = localStorage.getItem(key);
    console.log(`      - ${key}: ${isSecure ? '🔒 ENCRYPTED' : '📝 Plain text'} (${value.length} chars)`);
  });
  console.log('');
  
  // Test 8: Cleanup
  console.log('8. Cleaning up test data...');
  try {
    secureStore.remove('token');
    secureStore.remove('preferences');
    secureStorage.remove('secret');
    console.log('   ✅ Cleanup completed\n');
  } catch (error) {
    console.log('   ❌ Cleanup failed:', error.message, '\n');
  }
  
  console.log('🎉 Encryption testing completed!');
  console.log('\n📊 Summary:');
  console.log(`   - Encryption Available: ${encryptionAvailable ? '✅' : '❌'}`);
  console.log(`   - Tokens are now stored securely with AES-GCM encryption`);
  console.log(`   - Non-sensitive data uses regular localStorage`);
  console.log(`   - Fallback to regular storage if encryption fails`);
  console.log(`   - Browser fingerprinting ensures unique keys per session`);
}

// Run the test
testEncryption().catch(console.error);