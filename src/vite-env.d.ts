# Environment Variables Declaration for TypeScript

/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Firebase Configuration
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;

  // MongoDB Realm Configuration
  readonly VITE_MONGODB_REALM_APP_ID: string;
  readonly VITE_MONGODB_CLUSTER_NAME: string;
  readonly VITE_MONGODB_DATABASE_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
