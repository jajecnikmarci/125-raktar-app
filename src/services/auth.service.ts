/**
 * Firebase Authentication Service
 * Handles Google Sign-In, user authentication, and Firestore integration
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { User, UserRole } from '../types/models';
import { firebaseConfig } from '../config/firebase.config';

// Export app instance for use in Firestore service
export let app: FirebaseApp;

class AuthService {
  private app: FirebaseApp;
  private auth: Auth;
  private provider: GoogleAuthProvider;
  private currentUser: User | null = null;

  constructor() {
    // Initialize Firebase with configuration (with fallback values for GitHub Pages)
    console.log('✓ Firebase configuration loaded');

    this.app = initializeApp(firebaseConfig);
    app = this.app; // Export for Firestore service
    this.auth = getAuth(this.app);
    this.provider = new GoogleAuthProvider();

    // Listen to auth state changes
    this.initAuthListener();
  }

  /**
   * Initialize authentication state listener
   */
  private initAuthListener(): void {
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        await this.handleUserLogin(firebaseUser);
      } else {
        // User is signed out
        this.currentUser = null;
        this.onAuthStateChange(null);
      }
    });
  }

  /**
   * Handle user login - sync with Firestore
   */
  private async handleUserLogin(firebaseUser: FirebaseUser): Promise<void> {
    try {
      console.log('🔥 Initializing Firestore connection...');
      
      // Import and initialize Firestore service
      const { firestoreService } = await import('./firestore.service');
      
      // Initialize Firestore
      await firestoreService.initialize();
      
      // Try to get user, but if it fails due to permissions, create them first
      let user: User | null = null;
      
      try {
        user = await firestoreService.getUserByUid(firebaseUser.uid);
      } catch (error: any) {
        if (error?.code === 'permission-denied') {
          console.log('📝 User not found, creating new user in Firestore...');
          // User doesn't exist yet, create them
          user = null;
        } else {
          throw error; // Re-throw other errors
        }
      }
      
      if (!user) {
        console.log('📝 Creating new user in Firestore...');
        // Create new user with default role
        const newUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'User',
          photoURL: firebaseUser.photoURL || undefined,
          role: UserRole.USER, // Default role
          createdAt: new Date(),
          lastLogin: new Date(),
          isActive: true,
        };
        
        user = await firestoreService.createUser(newUser);
        console.log('✓ New user created in Firestore');
      } else {
        console.log('✓ Existing user found in Firestore');
        // Update user data if needed
        user.lastLogin = new Date();
      }

      this.currentUser = user;
      this.onAuthStateChange(user);
      console.log('✓ User sync complete:', user.email, `(${user.role})`);
    } catch (error) {
      console.error('❌ Error syncing user with Firestore:', error);
      console.error('This may indicate Firestore is not configured correctly.');
      
      // Fallback to bypass mode - allow user to use app without database
      console.warn('⚠️  Falling back to bypass mode');
      console.warn('   User roles will default to ADMIN for testing');
      console.warn('   Configure Firestore to enable full functionality');
      
      const user: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'User',
        photoURL: firebaseUser.photoURL || undefined,
        role: UserRole.ADMIN, // Default to ADMIN in bypass mode
        createdAt: new Date(),
        lastLogin: new Date(),
        isActive: true,
      };
      
      this.currentUser = user;
      this.onAuthStateChange(user);
      console.log('✓ Signed in (bypass mode):', user.email, '(ADMIN - temporary)');
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<User> {
    try {
      console.log('🔐 Starting Google Sign-In...');
      const result = await signInWithPopup(this.auth, this.provider);
      const firebaseUser = result.user;

      console.log('✓ Google authentication successful:', firebaseUser.email);

      // Get ID token for API calls
      const token = await firebaseUser.getIdToken();
      localStorage.setItem('authToken', token);

      // User will be handled by onAuthStateChanged listener
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.error('❌ Timeout waiting for user data from Firestore');
          reject(new Error('Authentication timeout - Firestore may not be configured'));
        }, 10000); // 10 seconds timeout

        const checkUser = () => {
          if (this.currentUser) {
            clearTimeout(timeout);
            console.log('✓ User authentication complete');
            resolve(this.currentUser);
          } else {
            setTimeout(checkUser, 100);
          }
        };
        checkUser();
      });
    } catch (error: any) {
      console.error('❌ Sign-in error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to sign in. Please try again.';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in cancelled. Please try again.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup blocked. Please allow popups for this site.';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'Domain not authorized. Please check Firebase settings.';
      } else if (error.code === 'auth/invalid-api-key') {
        errorMessage = 'Invalid Firebase API key. Please check your .env file.';
      } else if (error.message?.includes('Firestore')) {
        errorMessage = 'Authentication successful but database connection failed. Please check Firestore configuration.';
      }
      
      error.userMessage = errorMessage;
      throw error;
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(this.auth);
      localStorage.removeItem('authToken');
      this.currentUser = null;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get Firebase ID token
   */
  async getIdToken(): Promise<string | null> {
    const user = this.auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Check if user is admin or keeper
   */
  isAdmin(): boolean {
    return this.currentUser?.role === UserRole.ADMIN || this.currentUser?.role === UserRole.KEEPER;
  }

  /**
   * Callback for auth state changes
   * Override this in your app to handle UI updates
   */
  onAuthStateChange(user: User | null): void {
    // Dispatch custom event that UI can listen to
    window.dispatchEvent(
      new CustomEvent('authStateChanged', { detail: { user } })
    );
  }
}

// Singleton instance
let authServiceInstance: AuthService | null = null;

export const getAuthService = (): AuthService => {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService();
  }
  return authServiceInstance;
};

export default AuthService;
