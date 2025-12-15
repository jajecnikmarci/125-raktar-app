/**
 * Firebase Configuration
 * 
 * These values are safe to expose publicly as Firebase security is enforced
 * through Firestore Security Rules and Firebase Authentication settings.
 */

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD9fH_Q5vCxYWL-9UNRqGzOaznE_2MOXJY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "raktar-app-b8086.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "raktar-app-b8086",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "raktar-app-b8086.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "752603825349",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:752603825349:web:8e62c6c91f5d67a2b36f33"
};
