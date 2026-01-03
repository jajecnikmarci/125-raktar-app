/**
 * Admin Panel Component
 * Handles loan request approvals, rejections, and returns
 */

import { Loan, LoanStatus, RoleRequest, UserRole, User } from '../types/models';
import { firestoreService } from '../services/firestore.service';
import { getAuthService } from '../services/auth.service';
import { i18nService } from '../services/i18n.service';

export class AdminPanelComponent {
  private authService = getAuthService();
  private pendingLoans: Loan[] = [];
  private activeLoans: Loan[] = [];
  private returnedLoans: Loan[] = [];
  private roleRequests: RoleRequest[] = [];
  private users: User[] = [];
  private container: HTMLElement;

  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Container ${containerId} not found`);
    }
    this.container = element;
  }

  /**
   * Initialize admin panel
   */
  async init(): Promise<void> {
    // Check if user is admin
    if (!this.authService.isAdmin()) {
      this.container.innerHTML = `
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle"></i>
          ${i18nService.t('common.accessDenied')}: ${i18nService.t('common.adminRequired')}
        </div>
      `;
      return;
    }

    await this.loadLoans();
    this.render();
    this.attachEventListeners();
  }

  /**
   * Load loans from database
   */
  async loadLoans(): Promise<void> {
    try {
      // Load loans
      const [pending, active, returned] = await Promise.all([
        firestoreService.getLoans(LoanStatus.PENDING),
        firestoreService.getLoans(LoanStatus.APPROVED),
        firestoreService.getLoans(LoanStatus.RETURNED)
      ]);
      
      this.pendingLoans = pending;
      this.activeLoans = active;
      this.returnedLoans = returned;

      // Load role requests separately to avoid blocking
      try {
        this.roleRequests = await firestoreService.getRoleRequests();
      } catch (error) {
        console.error('Error loading role requests:', error);
        // Don't show global error, just log it. Admin might not see requests yet if index is building.
        this.roleRequests = []; 
      }

      // Load users if full admin
      if (this.authService.getCurrentUser()?.role === UserRole.ADMIN) {
        try {
          this.users = await firestoreService.getAllUsers();
        } catch (error) {
          console.error('Error loading users:', error);
          this.users = [];
        }
      }
    } catch (error) {
      console.error('Error loading loans:', error);
      this.showError(i18nService.t('common.error'));
    }
  }

  /**
   * Render admin panel
   */
  render(): void {
    const user = this.authService.getCurrentUser();
    const isFullAdmin = user?.role === UserRole.ADMIN;

    this.container.innerHTML = `
      <div class="container-fluid py-4">
        <!-- Header -->
        <div class="row mb-4">
          <div class="col">
            <h2><i class="bi bi-shield-check"></i> ${i18nService.t('admin.title')}</h2>
          </div>
        </div>

        <!-- Statistics Cards -->
        <div class="row mb-4">
          <div class="col-md-4 mb-3">
            <div class="card bg-warning text-white">
              <div class="card-body">
                <h5 class="card-title"><i class="bi bi-clock-history"></i> ${i18nService.t('admin.pendingRequests')}</h5>
                <h2 class="mb-0">${this.pendingLoans.length}</h2>
              </div>
            </div>
          </div>
          <div class="col-md-4 mb-3">
            <div class="card bg-info text-white">
              <div class="card-body">
                <h5 class="card-title"><i class="bi bi-box-arrow-right"></i> ${i18nService.t('admin.activeLoans')}</h5>
                <h2 class="mb-0">${this.activeLoans.length}</h2>
              </div>
            </div>
          </div>
          <div class="col-md-4 mb-3">
            <div class="card bg-success text-white">
              <div class="card-body">
                <h5 class="card-title"><i class="bi bi-check-circle"></i> ${i18nService.t('admin.returnedLoans')}</h5>
                <h2 class="mb-0">${this.returnedLoans.length}</h2>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <ul class="nav nav-tabs mb-3" id="adminTabs" role="tablist">
          <li class="nav-item" role="presentation">
            <button class="nav-link active" id="pending-tab" data-bs-toggle="tab" 
                    data-bs-target="#pending" type="button" role="tab">
              ${i18nService.t('admin.pendingRequests')}
              ${this.pendingLoans.length > 0 ? `<span class="badge bg-danger ms-2">${this.pendingLoans.length}</span>` : ''}
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" id="active-tab" data-bs-toggle="tab" 
                    data-bs-target="#active" type="button" role="tab">
              ${i18nService.t('admin.activeLoans')}
              ${this.activeLoans.length > 0 ? `<span class="badge bg-info ms-2">${this.activeLoans.length}</span>` : ''}
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" id="returned-tab" data-bs-toggle="tab" 
                    data-bs-target="#returned" type="button" role="tab">
              ${i18nService.t('admin.returnedLoans')}
              ${this.returnedLoans.length > 0 ? `<span class="badge bg-success ms-2">${this.returnedLoans.length}</span>` : ''}
            </button>
          </li>
          ${isFullAdmin ? `
          <li class="nav-item" role="presentation">
            <button class="nav-link" id="roles-tab" data-bs-toggle="tab" 
                    data-bs-target="#roles" type="button" role="tab">
              ${i18nService.t('admin.roleRequests')}
              ${this.roleRequests.length > 0 ? `<span class="badge bg-warning ms-2">${this.roleRequests.length}</span>` : ''}
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" id="users-tab" data-bs-toggle="tab" 
                    data-bs-target="#users" type="button" role="tab">
              ${i18nService.t('admin.userManagement')}
            </button>
          </li>
          ` : ''}
        </ul>

        <!-- Tab Content -->
        <div class="tab-content" id="adminTabsContent">
          <!-- Pending Requests Tab -->
          <div class="tab-pane fade show active" id="pending" role="tabpanel">
            ${this.renderPendingRequests()}
          </div>

          <!-- Active Loans Tab -->
          <div class="tab-pane fade" id="active" role="tabpanel">
            ${this.renderActiveLoans()}
          </div>

          <!-- Returned Loans Tab -->
          <div class="tab-pane fade" id="returned" role="tabpanel">
            ${this.renderReturnedLoans()}
          </div>

          ${isFullAdmin ? `
          <!-- Role Requests Tab -->
          <div class="tab-pane fade" id="roles" role="tabpanel">
            ${this.renderRoleRequests()}
          </div>

          <!-- User Management Tab -->
          <div class="tab-pane fade" id="users" role="tabpanel">
            ${this.renderUserManagement()}
          </div>
          ` : ''}
        </div>
      </div>

      <!-- Rejection Modal -->
      ${this.renderRejectionModal()}

      <!-- Note Modal -->
      ${this.renderNoteModal()}
    `;
  }

  /**
   * Render Note Modal
   */
  renderNoteModal(): string {
    return `
      <div class="modal fade" id="adminNoteModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${i18nService.t('common.notes')}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
              <p id="adminNoteContent" class="text-break"></p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${i18nService.t('common.close')}</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Open Note Modal
   */
  openNoteModal(note: string): void {
    const modalEl = document.getElementById('adminNoteModal');
    const contentEl = document.getElementById('adminNoteContent');
    
    if (modalEl && contentEl) {
      contentEl.textContent = note;
      const modal = new (window as any).bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  /**
   * Render pending requests
   */
  renderPendingRequests(): string {
    if (this.pendingLoans.length === 0) {
      return `
        <div class="alert alert-info">
          <i class="bi bi-info-circle"></i> ${i18nService.t('admin.noPending')}
        </div>
      `;
    }

    return `
      <div class="card shadow">
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover align-middle">
              <thead class="table-light">
                <tr>
                  <th>${i18nService.t('common.item')}</th>
                  <th>${i18nService.t('admin.requestedBy')}</th>
                  <th>${i18nService.t('common.quantity')}</th>
                  <th>${i18nService.t('admin.requestedDate')}</th>
                  <th>${i18nService.t('dashboard.expectedReturnDate')}</th>
                  <th>${i18nService.t('common.notes')}</th>
                  <th>${i18nService.t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                ${this.pendingLoans.map(loan => this.renderPendingRow(loan)).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render single pending request row
   */
  renderPendingRow(loan: Loan): string {
    return `
      <tr data-loan-id="${loan._id}">
        <td>
          <strong>${this.escapeHtml(loan.itemName)}</strong>
        </td>
        <td>
          <div>${this.escapeHtml(loan.userName)}</div>
          <small class="text-muted">${this.escapeHtml(loan.userEmail)}</small>
        </td>
        <td><span class="badge bg-secondary">${loan.quantity}</span></td>
        <td>${this.formatDate(loan.requestedAt)}</td>
        <td>${loan.expectedReturnDate ? this.formatDate(loan.expectedReturnDate) : 'N/A'}</td>
        <td>
          ${loan.notes ? `
            <button class="btn btn-sm btn-outline-info view-note-btn" 
                    data-note="${this.escapeHtml(loan.notes)}">
              <i class="bi bi-sticky"></i> ${i18nService.t('common.notes')}
            </button>
          ` : '<span class="text-muted">-</span>'}
        </td>
        <td>
          <div class="btn-group" role="group">
            <button class="btn btn-sm btn-success approve-btn" 
                    data-loan-id="${loan._id}" 
                    title="${i18nService.t('admin.approve')}">
              <i class="bi bi-check-circle"></i> ${i18nService.t('admin.approve')}
            </button>
            <button class="btn btn-sm btn-danger reject-btn" 
                    data-loan-id="${loan._id}" 
                    title="${i18nService.t('admin.reject')}">
              <i class="bi bi-x-circle"></i> ${i18nService.t('admin.reject')}
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  /**
   * Render active loans
   */
  renderActiveLoans(): string {
    if (this.activeLoans.length === 0) {
      return `
        <div class="alert alert-info">
          <i class="bi bi-info-circle"></i> ${i18nService.t('admin.noActive')}
        </div>
      `;
    }

    return `
      <div class="card shadow">
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover align-middle">
              <thead class="table-light">
                <tr>
                  <th>${i18nService.t('common.item')}</th>
                  <th>${i18nService.t('admin.borrowedBy')}</th>
                  <th>${i18nService.t('common.quantity')}</th>
                  <th>${i18nService.t('admin.approvedDate')}</th>
                  <th>${i18nService.t('dashboard.expectedReturnDate')}</th>
                  <th>${i18nService.t('admin.daysOut')}</th>
                  <th>${i18nService.t('common.notes')}</th>
                  <th>${i18nService.t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                ${this.activeLoans.map(loan => this.renderActiveRow(loan)).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render single active loan row
   */
  renderActiveRow(loan: Loan): string {
    const daysOut = this.calculateDaysOut(loan.approvedAt || loan.requestedAt);
    const isOverdue = loan.expectedReturnDate && 
                      new Date(loan.expectedReturnDate) < new Date();

    return `
      <tr data-loan-id="${loan._id}" ${isOverdue ? 'class="table-danger"' : ''}>
        <td>
          <strong>${this.escapeHtml(loan.itemName)}</strong>
        </td>
        <td>
          <div>${this.escapeHtml(loan.userName)}</div>
          <small class="text-muted">${this.escapeHtml(loan.userEmail)}</small>
        </td>
        <td><span class="badge bg-secondary">${loan.quantity}</span></td>
        <td>${this.formatDate(loan.approvedAt || loan.requestedAt)}</td>
        <td>
          ${loan.expectedReturnDate ? this.formatDate(loan.expectedReturnDate) : 'N/A'}
          ${isOverdue ? `<span class="badge bg-danger ms-2">${i18nService.t('admin.overdue')}</span>` : ''}
        </td>
        <td><span class="badge bg-info">${daysOut} ${i18nService.t('admin.daysOut')}</span></td>
        <td>
          ${loan.notes ? `
            <button class="btn btn-sm btn-outline-info view-note-btn" 
                    data-note="${this.escapeHtml(loan.notes)}">
              <i class="bi bi-sticky"></i> ${i18nService.t('common.notes')}
            </button>
          ` : '<span class="text-muted">-</span>'}
        </td>
        <td>
          <button class="btn btn-sm btn-primary return-btn" 
                  data-loan-id="${loan._id}" 
                  title="${i18nService.t('admin.markReturned')}">
            <i class="bi bi-box-arrow-in-left"></i> ${i18nService.t('admin.markReturned')}
          </button>
        </td>
      </tr>
    `;
  }

  /**
   * Render returned loans
   */
  renderReturnedLoans(): string {
    if (this.returnedLoans.length === 0) {
      return `
        <div class="alert alert-info">
          <i class="bi bi-info-circle"></i> ${i18nService.t('admin.noReturned')}
        </div>
      `;
    }

    return `
      <div class="card shadow">
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover align-middle">
              <thead class="table-light">
                <tr>
                  <th>${i18nService.t('common.item')}</th>
                  <th>${i18nService.t('admin.borrowedBy')}</th>
                  <th>${i18nService.t('common.quantity')}</th>
                  <th>${i18nService.t('dashboard.requested')}</th>
                  <th>${i18nService.t('admin.approvedDate')}</th>
                  <th>${i18nService.t('dashboard.returned')}</th>
                  <th>${i18nService.t('admin.duration')}</th>
                  <th>${i18nService.t('common.notes')}</th>
                </tr>
              </thead>
              <tbody>
                ${this.returnedLoans.map(loan => this.renderReturnedRow(loan)).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render single returned loan row
   */
  renderReturnedRow(loan: Loan): string {
    const duration = this.calculateDuration(loan.approvedAt || loan.requestedAt, loan.returnedAt);
    const wasOverdue = loan.expectedReturnDate && loan.returnedAt &&
                       new Date(loan.returnedAt) > new Date(loan.expectedReturnDate);

    return `
      <tr data-loan-id="${loan._id}">
        <td>
          <strong>${this.escapeHtml(loan.itemName)}</strong>
        </td>
        <td>
          <div>${this.escapeHtml(loan.userName)}</div>
          <small class="text-muted">${this.escapeHtml(loan.userEmail)}</small>
        </td>
        <td><span class="badge bg-secondary">${loan.quantity}</span></td>
        <td><small>${this.formatDate(loan.requestedAt)}</small></td>
        <td><small>${this.formatDate(loan.approvedAt || loan.requestedAt)}</small></td>
        <td>
          ${loan.returnedAt ? this.formatDate(loan.returnedAt) : 'N/A'}
          ${wasOverdue ? `<span class="badge bg-warning ms-2">${i18nService.t('admin.wasOverdue')}</span>` : ''}
        </td>
        <td><span class="badge bg-success">${duration}</span></td>
        <td>
          ${loan.notes ? `
            <button class="btn btn-sm btn-outline-info view-note-btn" 
                    data-note="${this.escapeHtml(loan.notes)}">
              <i class="bi bi-sticky"></i> ${i18nService.t('common.notes')}
            </button>
          ` : '<span class="text-muted">-</span>'}
        </td>
      </tr>
    `;
  }

  /**
   * Render role requests
   */
  renderRoleRequests(): string {
    if (this.roleRequests.length === 0) {
      return `
        <div class="alert alert-info">
          <i class="bi bi-info-circle"></i> ${i18nService.t('admin.noRoleRequests')}
        </div>
      `;
    }

    return `
      <div class="card shadow">
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover align-middle">
              <thead class="table-light">
                <tr>
                  <th>${i18nService.t('common.user')}</th>
                  <th>${i18nService.t('admin.currentRole')}</th>
                  <th>${i18nService.t('admin.requestedRole')}</th>
                  <th>${i18nService.t('common.reason')}</th>
                  <th>${i18nService.t('admin.requestedDate')}</th>
                  <th>${i18nService.t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                ${this.roleRequests.map(req => `
                  <tr>
                    <td>
                      <div>${this.escapeHtml(req.userName)}</div>
                      <small class="text-muted">${this.escapeHtml(req.userEmail)}</small>
                    </td>
                    <td><span class="badge bg-secondary">User</span></td>
                    <td><span class="badge bg-primary">${req.requestedRole.toUpperCase()}</span></td>
                    <td>${this.escapeHtml(req.reason || '-')}</td>
                    <td>${this.formatDate(req.requestedAt)}</td>
                    <td>
                      <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-success approve-role-btn" 
                                data-request-id="${req._id}" 
                                title="${i18nService.t('admin.approve')}">
                          <i class="bi bi-check-circle"></i> ${i18nService.t('admin.approve')}
                        </button>
                        <button class="btn btn-sm btn-danger reject-role-btn" 
                                data-request-id="${req._id}" 
                                title="${i18nService.t('admin.reject')}">
                          <i class="bi bi-x-circle"></i> ${i18nService.t('admin.reject')}
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render user management tab
   */
  renderUserManagement(): string {
    return `
      <div class="card shadow">
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover align-middle">
              <thead class="table-light">
                <tr>
                  <th>${i18nService.t('common.user')}</th>
                  <th>${i18nService.t('common.email')}</th>
                  <th>${i18nService.t('admin.currentRole')}</th>
                  <th>${i18nService.t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                ${this.users.map(user => `
                  <tr>
                    <td>
                      <div class="d-flex align-items-center">
                        <img src="${user.photoURL || 'https://via.placeholder.com/32'}" class="rounded-circle me-2" width="32" height="32">
                        <strong>${this.escapeHtml(user.displayName)}</strong>
                      </div>
                    </td>
                    <td>${this.escapeHtml(user.email)}</td>
                    <td>
                      <span class="badge bg-${user.role === 'admin' ? 'danger' : user.role === 'keeper' ? 'warning' : 'secondary'}">
                        ${user.role.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div class="dropdown">
                        <button class="btn btn-sm btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                          ${i18nService.t('admin.changeRole')}
                        </button>
                        <ul class="dropdown-menu">
                          <li><a class="dropdown-item user-role-action" href="#" data-user-id="${user._id}" data-role="user">User</a></li>
                          <li><a class="dropdown-item user-role-action" href="#" data-user-id="${user._id}" data-role="keeper">Keeper</a></li>
                          <li><a class="dropdown-item user-role-action" href="#" data-user-id="${user._id}" data-role="admin">Admin</a></li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Handle user role change
   */
  async handleUserRoleChange(userId: string, newRole: UserRole): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    if (!confirm(`${i18nService.t('admin.confirmRoleChange')} ${newRole.toUpperCase()}?`)) return;

    try {
      await firestoreService.adminUpdateUserRole(userId, newRole, currentUser.uid, currentUser.displayName);
      this.showSuccess(`${i18nService.t('admin.roleUpdated')} ${newRole.toUpperCase()}`);
      await this.loadLoans(); // Reloads all data including users
      this.render();
      this.attachEventListeners();
    } catch (error: any) {
      console.error('Error updating user role:', error);
      this.showError(i18nService.t('common.error'));
    }
  }

  /**
   * Render rejection modal
   */
  renderRejectionModal(): string {
    return `
      <div class="modal fade" id="rejectModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-danger text-white">
              <h5 class="modal-title">${i18nService.t('admin.rejectLoan')}</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
              <input type="hidden" id="rejectLoanId">
              <div class="mb-3">
                <label for="rejectReason" class="form-label">
                  ${i18nService.t('admin.rejectReason')}
                </label>
                <textarea class="form-control" id="rejectReason" rows="3" 
                          placeholder="${i18nService.t('admin.rejectReason')}..."></textarea>
              </div>
              <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle"></i>
                ${i18nService.t('admin.rejectWarning')}
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${i18nService.t('common.cancel')}</button>
              <button type="button" class="btn btn-danger" id="confirmRejectBtn">
                ${i18nService.t('admin.confirmReject')}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners(): void {
    // Approve buttons - use onclick to avoid duplicates
    document.querySelectorAll('.approve-btn').forEach(btn => {
      const loanId = (btn as HTMLElement).dataset.loanId;
      (btn as HTMLElement).onclick = () => {
        if (loanId) this.handleApprove(loanId);
      };
    });

    // Reject buttons - use onclick to avoid duplicates
    document.querySelectorAll('.reject-btn').forEach(btn => {
      const loanId = (btn as HTMLElement).dataset.loanId;
      (btn as HTMLElement).onclick = () => {
        if (loanId) this.openRejectModal(loanId);
      };
    });

    // Return buttons - use onclick to avoid duplicates
    document.querySelectorAll('.return-btn').forEach(btn => {
      const loanId = (btn as HTMLElement).dataset.loanId;
      (btn as HTMLElement).onclick = () => {
        if (loanId) this.handleReturn(loanId);
      };
    });

    // Confirm reject - remove old listeners
    const confirmRejectBtn = document.getElementById('confirmRejectBtn');
    if (confirmRejectBtn) {
      const newConfirmRejectBtn = confirmRejectBtn.cloneNode(true);
      confirmRejectBtn.parentNode?.replaceChild(newConfirmRejectBtn, confirmRejectBtn);
      newConfirmRejectBtn.addEventListener('click', () => {
        this.handleReject();
      });
    }

    // View note buttons
    document.querySelectorAll('.view-note-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const note = (e.currentTarget as HTMLElement).dataset.note;
        if (note) this.openNoteModal(note);
      });
    });

    // Approve Role buttons
    document.querySelectorAll('.approve-role-btn').forEach(btn => {
      const requestId = (btn as HTMLElement).dataset.requestId;
      (btn as HTMLElement).onclick = () => {
        if (requestId) this.handleApproveRole(requestId);
      };
    });

    // Reject Role buttons
    document.querySelectorAll('.reject-role-btn').forEach(btn => {
      const requestId = (btn as HTMLElement).dataset.requestId;
      (btn as HTMLElement).onclick = () => {
        if (requestId) this.handleRejectRole(requestId);
      };
    });

    // User Role Actions
    document.querySelectorAll('.user-role-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const userId = (e.currentTarget as HTMLElement).dataset.userId;
        const role = (e.currentTarget as HTMLElement).dataset.role as UserRole;
        if (userId && role) this.handleUserRoleChange(userId, role);
      });
    });
  }

  /**
   * Handle role approval
   */
  async handleApproveRole(requestId: string): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    if (!confirm(i18nService.t('common.confirm'))) return;

    try {
      await firestoreService.approveRoleRequest(requestId, currentUser.uid);
      this.showSuccess(i18nService.t('admin.roleApproved'));
      await this.loadLoans(); // reloads requests too
      this.render();
      this.attachEventListeners();
    } catch (error: any) {
      console.error('Error approving role:', error);
      this.showError(i18nService.t('common.error'));
    }
  }

  /**
   * Handle role rejection
   */
  async handleRejectRole(requestId: string): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    if (!confirm(i18nService.t('common.confirm'))) return;

    try {
      await firestoreService.rejectRoleRequest(requestId, currentUser.uid);
      this.showSuccess(i18nService.t('admin.roleRejected'));
      await this.loadLoans(); // reloads requests too
      this.render();
      this.attachEventListeners();
    } catch (error: any) {
      console.error('Error rejecting role:', error);
      this.showError(i18nService.t('common.error'));
    }
  }

  /**
   * Handle approve action
   */
  async handleApprove(loanId: string): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    if (!confirm(i18nService.t('common.confirm'))) return;

    try {
      await firestoreService.approveLoan(loanId, currentUser.uid);
      this.showSuccess(i18nService.t('admin.loanApproved'));
      await this.loadLoans();
      this.render();
      this.attachEventListeners();
    } catch (error: any) {
      console.error('Error approving loan:', error);
      this.showError(error?.message || i18nService.t('common.error'));
    }
  }

  /**
   * Open reject modal
   */
  openRejectModal(loanId: string): void {
    (document.getElementById('rejectLoanId') as HTMLInputElement).value = loanId;
    (document.getElementById('rejectReason') as HTMLTextAreaElement).value = '';

    const modal = new (window as any).bootstrap.Modal(document.getElementById('rejectModal'));
    modal.show();
  }

  /**
   * Handle reject action
   */
  async handleReject(): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    const loanId = (document.getElementById('rejectLoanId') as HTMLInputElement).value;
    const reason = (document.getElementById('rejectReason') as HTMLTextAreaElement).value;

    try {
      await firestoreService.rejectLoan(loanId, currentUser.uid, reason);
      this.showSuccess(i18nService.t('admin.loanRejected'));

      // Close modal
      const modal = (window as any).bootstrap.Modal.getInstance(document.getElementById('rejectModal'));
      modal?.hide();

      await this.loadLoans();
      this.render();
      this.attachEventListeners();
    } catch (error) {
      console.error('Error rejecting loan:', error);
      this.showError(i18nService.t('common.error'));
    }
  }

  /**
   * Handle return action
   */
  async handleReturn(loanId: string): Promise<void> {
    if (!confirm(i18nService.t('common.confirm'))) return;

    try {
      await firestoreService.returnLoan(loanId);
      this.showSuccess(i18nService.t('admin.itemReturned'));
      await this.loadLoans();
      this.render();
      this.attachEventListeners();
    } catch (error: any) {
      console.error('Error returning loan:', error);
      this.showError(error?.message || i18nService.t('common.error'));
    }
  }

  /**
   * Calculate days out
   */
  calculateDaysOut(approvedDate: Date): number {
    const approved = new Date(approvedDate);
    const now = new Date();
    const diff = now.getTime() - approved.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate duration between two dates
   */
  calculateDuration(startDate?: Date, endDate?: Date): string {
    if (!startDate || !endDate) return 'N/A';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end.getTime() - start.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Same day';
    if (days === 1) return '1 day';
    return `${days} days`;
  }

  /**
   * Format date
   */
  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Escape HTML
   */
  escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show success message with Bootstrap Toast
   */
  showSuccess(message: string): void {
    this.showToast(message, 'success');
  }

  /**
   * Show error message with Bootstrap Toast
   */
  showError(message: string): void {
    this.showToast(message, 'danger');
  }

  /**
   * Show Bootstrap Toast notification
   */
  private showToast(message: string, type: 'success' | 'danger' | 'warning' | 'info'): void {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toastId = `toast-${Date.now()}`;
    const icon = type === 'success' ? 'check-circle-fill' : 
                 type === 'danger' ? 'exclamation-triangle-fill' : 
                 type === 'warning' ? 'exclamation-circle-fill' : 'info-circle-fill';

    const toastHTML = `
      <div id="${toastId}" class="toast align-items-center text-bg-${type} border-0" role="alert">
        <div class="d-flex">
          <div class="toast-body">
            <i class="bi bi-${icon} me-2"></i>${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    const toastElement = document.getElementById(toastId);
    if (toastElement) {
      const toast = new (window as any).bootstrap.Toast(toastElement, { delay: 3000 });
      toast.show();
      
      // Remove from DOM after hidden
      toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
      });
    }
  }
}

export default AdminPanelComponent;