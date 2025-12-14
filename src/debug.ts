/**
 * Troubleshooting & Debugging Script
 * Run this in the browser console to diagnose authentication issues
 */

// Check environment variables
console.group('🔍 Environment Variables Check');
console.log('Firebase API Key:', import.meta.env.VITE_FIREBASE_API_KEY ? '✓ Set' : '✗ Missing');
console.log('Firebase Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✓ Set' : '✗ Missing');
console.log('Firebase Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✓ Set' : '✗ Missing');
console.log('MongoDB Data API URL:', import.meta.env.VITE_MONGODB_DATA_API_URL ? '✓ Set' : '✗ Missing');
console.log('MongoDB API Key:', import.meta.env.VITE_MONGODB_API_KEY ? '✓ Set' : '✗ Missing');
console.groupEnd();

// Test Firebase initialization
console.group('🔥 Firebase Configuration Test');
try {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  
  const hasAllValues = Object.entries(firebaseConfig).every(([key, value]) => {
    const result = value && value !== 'undefined' && value !== 'your_';
    console.log(`  ${key}:`, result ? '✓' : '✗');
    return result;
  });
  
  if (hasAllValues) {
    console.log('✓ All Firebase config values present');
  } else {
    console.error('✗ Some Firebase config values missing or invalid');
  }
} catch (error) {
  console.error('✗ Firebase config error:', error);
}
console.groupEnd();

export {};
