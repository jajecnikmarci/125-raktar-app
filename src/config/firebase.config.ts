/**
 * Firebase Configuration
 * 
 * These values are safe to expose publicly as Firebase security is enforced
 * through Firestore Security Rules and Firebase Authentication settings.
 */

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCVtQvdEyGfjDJ5lbP83a9UJ_koJftSP90",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "raktar-app-b8086.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "raktar-app-b8086",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "raktar-app-b8086.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "543395083178",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:543395083178:web:b0764f72784596b9b2f1d3"
};
