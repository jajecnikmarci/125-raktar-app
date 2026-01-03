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
import { i18nService } from './services/i18n.service';

import { firestoreService } from './services/firestore.service';

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
    // Translate static UI elements
    i18nService.translatePage();

    // Set up authentication listeners
    window.addEventListener('authStateChanged', ((e: CustomEvent) => {
      this.handleAuthStateChange(e.detail.user);
    }) as EventListener);

    // Set up UI event listeners
    this.setupUIListeners();
    this.setupProfileListeners();

    // Check initial auth state
    if (this.authService.isAuthenticated()) {
      this.showApp();
      this.loadView(this.currentView);
    } else {
      this.showLogin();
    }
  }

  /**
   * Set up Profile UI listeners
   */
  private setupProfileListeners(): void {
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
      profileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openProfileModal();
      });
    }

    const roleRequestForm = document.getElementById('roleRequestForm');
    if (roleRequestForm) {
      roleRequestForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleRoleRequest();
      });
    }
  }

  /**
   * Open profile modal
   */
  private async openProfileModal(): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    // Populate user data
    const avatar = document.getElementById('profileAvatar') as HTMLImageElement;
    const name = document.getElementById('profileName');
    const email = document.getElementById('profileEmail');
    const role = document.getElementById('profileRole');
    
    if (avatar) avatar.src = user.photoURL || 'https://via.placeholder.com/100';
    if (name) name.textContent = user.displayName;
    if (email) email.textContent = user.email;
    if (role) {
      role.textContent = i18nService.t(`common.roles.${user.role}`);
      role.className = `badge ${user.role === 'admin' || user.role === 'keeper' ? 'bg-danger' : 'bg-primary'}`;
    }

    // Load role request history
    const historySection = document.getElementById('roleRequestHistory');
    const historyBody = document.getElementById('roleRequestTableBody');
    
    if (historySection && historyBody) {
      historyBody.innerHTML = `<tr><td colspan="3" class="text-center">${i18nService.t('common.loading')}</td></tr>`;
      historySection.style.display = 'block';
      
      try {
        const requests = await firestoreService.getUserRoleRequests(user._id!);
        
        if (requests.length === 0) {
          historySection.style.display = 'none';
        } else {
          historyBody.innerHTML = requests.map(req => `
            <tr>
              <td>${i18nService.t(`common.roles.${req.requestedRole}`)}</td>
              <td>
                <span class="badge bg-${req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'danger' : 'warning'}">
                  ${i18nService.t(`common.statuses.${req.status}`)}
                </span>
              </td>
              <td>${new Date(req.requestedAt).toLocaleDateString()}</td>
            </tr>
          `).join('');
        }
      } catch (error) {
        console.error('Error loading role requests:', error);
        historyBody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">${i18nService.t('common.error')}</td></tr>`;
      }
    }

    // Show modal
    const modal = new (window as any).bootstrap.Modal(document.getElementById('profileModal'));
    modal.show();
  }

  /**
   * Handle role request submission
   */
  private async handleRoleRequest(): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    const roleSelect = document.getElementById('requestedRole') as HTMLSelectElement;
    const reasonInput = document.getElementById('requestReason') as HTMLTextAreaElement;
    const submitBtn = document.querySelector('#roleRequestForm button[type="submit"]') as HTMLButtonElement;

    if (!roleSelect.value) {
      alert(i18nService.t('common.error'));
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = i18nService.t('common.loading');

      await firestoreService.createRoleRequest({
        userId: user._id!,
        userName: user.displayName,
        userEmail: user.email,
        requestedRole: roleSelect.value as any,
        reason: reasonInput.value
      });

      alert(i18nService.t('auth.roleRequestSubmitted'));
      
      const modal = (window as any).bootstrap.Modal.getInstance(document.getElementById('profileModal'));
      modal?.hide();
      
      roleSelect.value = '';
      reasonInput.value = '';
    } catch (error) {
      console.error('Error submitting role request:', error);
      alert(i18nService.t('auth.roleRequestFailed'));
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = i18nService.t('common.submit');
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
      signInBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${i18nService.t('auth.signingIn')}`;
      errorDiv.style.display = 'none';

      await this.authService.signInWithGoogle();
      
      // Auth state change will handle the rest
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // Use custom error message if available
      const errorMessage = error.userMessage || error.message || i18nService.t('auth.failedSignIn');
      
      errorDiv.innerHTML = `
        <strong>${i18nService.t('auth.loginError')}</strong><br>
        ${errorMessage}
        <br><br>
        <small>
          <a href="TROUBLESHOOTING.md" target="_blank" class="text-white">
            <i class="bi bi-question-circle"></i> ${i18nService.t('auth.troubleshooting')}
          </a>
          | Check browser console (F12) for details
        </small>
      `;
      errorDiv.style.display = 'block';
      signInBtn.disabled = false;
      signInBtn.innerHTML = `<i class="bi bi-google me-2"></i>${i18nService.t('auth.signIn')}`;
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
      alert(i18nService.t('auth.failedSignOut'));
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
    const mobileAdminLink = document.getElementById('mobileAdminLink');
    const settingsLink = document.getElementById('settingsLink');
    const mobileSettingsLink = document.getElementById('mobileSettingsLink');

    if (userName) userName.textContent = user.displayName;
    if (userAvatar) {
      userAvatar.src = user.photoURL || 'https://via.placeholder.com/32';
      userAvatar.alt = user.displayName;
    }

    // Show admin and settings links if user is admin
    const isAdmin = this.authService.isAdmin();
    
    if (adminLink) adminLink.style.display = isAdmin ? 'block' : 'none';
    if (mobileAdminLink) mobileAdminLink.style.display = isAdmin ? 'block' : 'none';
    if (settingsLink) settingsLink.style.display = isAdmin ? 'block' : 'none';
    if (mobileSettingsLink) mobileSettingsLink.style.display = isAdmin ? 'block' : 'none';
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
          <span class="visually-hidden">${i18nService.t('common.loading')}</span>
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
              ${i18nService.t('common.accessDenied')}: ${i18nService.t('common.adminRequired')}
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
          ${i18nService.t('common.error')}
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
