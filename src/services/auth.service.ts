/**
 * Firebase Authentication Service
 * Handles Google Sign-In and user authentication
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

class AuthService {
  private app: FirebaseApp;
  private auth: Auth;
  private provider: GoogleAuthProvider;
  private currentUser: User | null = null;

  constructor() {
    // Initialize Firebase with environment variables
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

    this.app = initializeApp(firebaseConfig);
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
   * Handle user login - sync with MongoDB
   */
  private async handleUserLogin(firebaseUser: FirebaseUser): Promise<void> {
    try {
      // Get or create user in MongoDB
      const { MongoDBService } = await import('./mongodb.service');
      const mongoService = MongoDBService.getInstance();
      
      // Check if user exists in our database
      let user = await mongoService.getUserByUid(firebaseUser.uid);
      
      if (!user) {
        // Create new user with default role
        user = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'User',
          photoURL: firebaseUser.photoURL || undefined,
          role: UserRole.USER, // Default role
          createdAt: new Date(),
          lastLogin: new Date(),
          isActive: true,
        };
        
        await mongoService.createUser(user);
      } else {
        // Update last login
        await mongoService.updateUserLastLogin(firebaseUser.uid);
      }

      this.currentUser = user;
      this.onAuthStateChange(user);
    } catch (error) {
      console.error('Error handling user login:', error);
      throw error;
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<User> {
    try {
      const result = await signInWithPopup(this.auth, this.provider);
      const firebaseUser = result.user;

      // Get ID token for API calls
      const token = await firebaseUser.getIdToken();
      localStorage.setItem('authToken', token);

      // User will be handled by onAuthStateChanged listener
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Authentication timeout'));
        }, 5000);

        const checkUser = () => {
          if (this.currentUser) {
            clearTimeout(timeout);
            resolve(this.currentUser);
          } else {
            setTimeout(checkUser, 100);
          }
        };
        checkUser();
      });
    } catch (error) {
      console.error('Error signing in with Google:', error);
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
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.currentUser?.role === UserRole.ADMIN;
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
