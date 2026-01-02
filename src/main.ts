/**
 * Main Application Entry Point
 * Handles routing, authentication flow, and component initialization
 */

import { getAuthService } from './services/auth.service';
import { DashboardComponent } from './components/dashboard.component';
import { AdminPanelComponent } from './components/admin-panel.component';
import { MyLoansComponent } from './components/my-loans.component';
import { SettingsComponent } from './components/settings.component';
import { User } from './types/models';

class App {
  private authService = getAuthService();
  private currentView: 'dashboard' | 'admin' | 'my-loans' | 'settings' = 'dashboard';

  constructor() {
    this.init();
  }

  /**
   * Initialize application
   */
  private init(): void {
    // Set up authentication listeners
    window.addEventListener('authStateChanged', ((e: CustomEvent) => {
      this.handleAuthStateChange(e.detail.user);
    }) as EventListener);

    // Set up UI event listeners
    this.setupUIListeners();

    // Check initial auth state
    if (this.authService.isAuthenticated()) {
      this.showApp();
      this.loadView(this.currentView);
    } else {
      this.showLogin();
    }
  }

  /**
   * Set up UI event listeners
   */
  private setupUIListeners(): void {
    // Google Sign In
    const signInBtn = document.getElementById('googleSignInBtn');
    signInBtn?.addEventListener('click', () => this.handleSignIn());

    // Sign Out
    const signOutBtn = document.getElementById('signOutBtn');
    signOutBtn?.addEventListener('click', () => this.handleSignOut());

    // Navigation
    document.querySelectorAll('[data-view]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = (e.currentTarget as HTMLElement).dataset.view as 'dashboard' | 'admin' | 'my-loans' | 'settings';
        this.navigate(view);
      });
    });
  }

  /**
   * Handle authentication state change
   */
  private handleAuthStateChange(user: User | null): void {
    if (user) {
      this.showApp();
      this.updateUserDisplay(user);
      this.loadView(this.currentView);
    } else {
      this.showLogin();
    }
  }

  /**
   * Handle sign in
   */
  private async handleSignIn(): Promise<void> {
    const signInBtn = document.getElementById('googleSignInBtn') as HTMLButtonElement;
    const errorDiv = document.getElementById('loginError') as HTMLDivElement;

    try {
      signInBtn.disabled = true;
      signInBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing in...';
      errorDiv.style.display = 'none';

      await this.authService.signInWithGoogle();
      
      // Auth state change will handle the rest
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // Use custom error message if available
      const errorMessage = error.userMessage || error.message || 'Failed to sign in. Please try again.';
      
      errorDiv.innerHTML = `
        <strong>Sign-in Failed</strong><br>
        ${errorMessage}
        <br><br>
        <small>
          <a href="TROUBLESHOOTING.md" target="_blank" class="text-white">
            <i class="bi bi-question-circle"></i> View Troubleshooting Guide
          </a>
          | Check browser console (F12) for details
        </small>
      `;
      errorDiv.style.display = 'block';
      signInBtn.disabled = false;
      signInBtn.innerHTML = '<i class="bi bi-google me-2"></i>Sign in with Google';
    }
  }

  /**
   * Handle sign out
   */
  private async handleSignOut(): Promise<void> {
    try {
      await this.authService.signOut();
      this.showLogin();
    } catch (error) {
      console.error('Sign out error:', error);
      alert('Failed to sign out. Please try again.');
    }
  }

  /**
   * Show login screen
   */
  private showLogin(): void {
    const loginScreen = document.getElementById('loginScreen');
    const appContent = document.getElementById('appContent');
    
    if (loginScreen) loginScreen.style.display = 'flex';
    if (appContent) appContent.style.display = 'none';
  }

  /**
   * Show main app
   */
  private showApp(): void {
    const loginScreen = document.getElementById('loginScreen');
    const appContent = document.getElementById('appContent');
    
    if (loginScreen) loginScreen.style.display = 'none';
    if (appContent) appContent.style.display = 'block';
  }

  /**
   * Update user display
   */
  private updateUserDisplay(user: User): void {
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar') as HTMLImageElement;
    const adminLink = document.getElementById('adminLink');

    if (userName) userName.textContent = user.displayName;
    if (userAvatar) {
      userAvatar.src = user.photoURL || 'https://via.placeholder.com/32';
      userAvatar.alt = user.displayName;
    }

    // Show admin links if user is admin
    const isAdmin = this.authService.isAdmin();
    if (adminLink) {
      adminLink.style.display = isAdmin ? 'block' : 'none';
    }
  }

  /**
   * Navigate to view
   */
  public navigate(view: 'dashboard' | 'admin' | 'my-loans' | 'settings'): void {
    // Update active nav link
    document.querySelectorAll('[data-view]').forEach(link => {
      link.classList.remove('active');
      if ((link as HTMLElement).dataset.view === view) {
        link.classList.add('active');
      }
    });

    this.currentView = view;
    this.loadView(view);
  }

  /**
   * Load view
   */
  private async loadView(view: 'dashboard' | 'admin' | 'my-loans' | 'settings'): Promise<void> {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    // Show loading spinner
    mainContent.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
    `;

    try {
      if (view === 'dashboard') {
        mainContent.innerHTML = '<div id="dashboardContainer"></div>';
        const dashboard = new DashboardComponent('dashboardContainer');
        await dashboard.init();
      } else if (view === 'admin') {
        if (!this.authService.isAdmin()) {
          mainContent.innerHTML = `
            <div class="alert alert-danger">
              <i class="bi bi-exclamation-triangle"></i>
              Access Denied: Admin privileges required.
            </div>
          `;
          return;
        }
        
        mainContent.innerHTML = '<div id="adminContainer"></div>';
        const adminPanel = new AdminPanelComponent('adminContainer');
        await adminPanel.init();
      } else if (view === 'my-loans') {
        mainContent.innerHTML = '<div id="myLoansContainer"></div>';
        const myLoans = new MyLoansComponent('myLoansContainer');
        await myLoans.init();
      } else if (view === 'settings') {
        mainContent.innerHTML = '<div id="settingsContainer"></div>';
        const settings = new SettingsComponent('settingsContainer');
        await settings.init();
      }
    } catch (error) {
      console.error('Error loading view:', error);
      mainContent.innerHTML = `
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle"></i>
          Error loading content. Please refresh the page.
        </div>
      `;
    }
  }
}

// Initialize app when DOM is ready
let appInstance: App;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    appInstance = new App();
    (window as any).app = appInstance;
  });
} else {
  appInstance = new App();
  (window as any).app = appInstance;
}
