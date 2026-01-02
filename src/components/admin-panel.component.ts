/**
 * Admin Panel Component
 * Handles loan request approvals, rejections, and returns
 */

import { Loan, LoanStatus } from '../types/models';
import { firestoreService } from '../services/firestore.service';
import { getAuthService } from '../services/auth.service';

export class AdminPanelComponent {
  private authService = getAuthService();
  private pendingLoans: Loan[] = [];
  private activeLoans: Loan[] = [];
  private returnedLoans: Loan[] = [];
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
          Access Denied: Admin privileges required.
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
      this.pendingLoans = await firestoreService.getLoans(LoanStatus.PENDING);
      this.activeLoans = await firestoreService.getLoans(LoanStatus.APPROVED);
      this.returnedLoans = await firestoreService.getLoans(LoanStatus.RETURNED);
    } catch (error) {
      console.error('Error loading loans:', error);
      this.showError('Failed to load loan requests.');
    }
  }

  /**
   * Render admin panel
   */
  render(): void {
    this.container.innerHTML = `
      <div class="container-fluid py-4">
        <!-- Header -->
        <div class="row mb-4">
          <div class="col">
            <h2><i class="bi bi-shield-check"></i> Admin Panel</h2>
          </div>
        </div>

        <!-- Statistics Cards -->
        <div class="row mb-4">
          <div class="col-md-4 mb-3">
            <div class="card bg-warning text-white">
              <div class="card-body">
                <h5 class="card-title"><i class="bi bi-clock-history"></i> Pending Requests</h5>
                <h2 class="mb-0">${this.pendingLoans.length}</h2>
              </div>
            </div>
          </div>
          <div class="col-md-4 mb-3">
            <div class="card bg-info text-white">
              <div class="card-body">
                <h5 class="card-title"><i class="bi bi-box-arrow-right"></i> Active Loans</h5>
                <h2 class="mb-0">${this.activeLoans.length}</h2>
              </div>
            </div>
          </div>
          <div class="col-md-4 mb-3">
            <div class="card bg-success text-white">
              <div class="card-body">
                <h5 class="card-title"><i class="bi bi-check-circle"></i> Returned</h5>
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
              Pending Requests
              ${this.pendingLoans.length > 0 ? `<span class="badge bg-danger ms-2">${this.pendingLoans.length}</span>` : ''}
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" id="active-tab" data-bs-toggle="tab" 
                    data-bs-target="#active" type="button" role="tab">
              Active Loans
              ${this.activeLoans.length > 0 ? `<span class="badge bg-info ms-2">${this.activeLoans.length}</span>` : ''}
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" id="returned-tab" data-bs-toggle="tab" 
                    data-bs-target="#returned" type="button" role="tab">
              Returned Loans
              ${this.returnedLoans.length > 0 ? `<span class="badge bg-success ms-2">${this.returnedLoans.length}</span>` : ''}
            </button>
          </li>
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
              <h5 class="modal-title">Loan Note</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
              <p id="adminNoteContent" class="text-break"></p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
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
          <i class="bi bi-info-circle"></i> No pending requests at this time.
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
                  <th>Item</th>
                  <th>Requested By</th>
                  <th>Quantity</th>
                  <th>Requested Date</th>
                  <th>Expected Return</th>
                  <th>Note</th>
                  <th>Actions</th>
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
              <i class="bi bi-sticky"></i> Note
            </button>
          ` : '<span class="text-muted">-</span>'}
        </td>
        <td>
          <div class="btn-group" role="group">
            <button class="btn btn-sm btn-success approve-btn" 
                    data-loan-id="${loan._id}" 
                    title="Approve Request">
              <i class="bi bi-check-circle"></i> Approve
            </button>
            <button class="btn btn-sm btn-danger reject-btn" 
                    data-loan-id="${loan._id}" 
                    title="Reject Request">
              <i class="bi bi-x-circle"></i> Reject
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
          <i class="bi bi-info-circle"></i> No active loans at this time.
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
                  <th>Item</th>
                  <th>Borrowed By</th>
                  <th>Quantity</th>
                  <th>Approved Date</th>
                  <th>Expected Return</th>
                  <th>Days Out</th>
                  <th>Note</th>
                  <th>Actions</th>
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
          ${isOverdue ? '<span class="badge bg-danger ms-2">OVERDUE</span>' : ''}
        </td>
        <td><span class="badge bg-info">${daysOut} days</span></td>
        <td>
          ${loan.notes ? `
            <button class="btn btn-sm btn-outline-info view-note-btn" 
                    data-note="${this.escapeHtml(loan.notes)}">
              <i class="bi bi-sticky"></i> Note
            </button>
          ` : '<span class="text-muted">-</span>'}
        </td>
        <td>
          <button class="btn btn-sm btn-primary return-btn" 
                  data-loan-id="${loan._id}" 
                  title="Mark as Returned">
            <i class="bi bi-box-arrow-in-left"></i> Mark Returned
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
          <i class="bi bi-info-circle"></i> No returned loans yet.
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
                  <th>Item</th>
                  <th>Borrowed By</th>
                  <th>Quantity</th>
                  <th>Requested</th>
                  <th>Approved</th>
                  <th>Returned</th>
                  <th>Duration</th>
                  <th>Note</th>
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
          ${wasOverdue ? '<span class="badge bg-warning ms-2">Was Overdue</span>' : ''}
        </td>
        <td><span class="badge bg-success">${duration}</span></td>
        <td>
          ${loan.notes ? `
            <button class="btn btn-sm btn-outline-info view-note-btn" 
                    data-note="${this.escapeHtml(loan.notes)}">
              <i class="bi bi-sticky"></i> Note
            </button>
          ` : '<span class="text-muted">-</span>'}
        </td>
      </tr>
    `;
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
              <h5 class="modal-title">Reject Loan Request</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
              <input type="hidden" id="rejectLoanId">
              <div class="mb-3">
                <label for="rejectReason" class="form-label">
                  Reason for Rejection (Optional)
                </label>
                <textarea class="form-control" id="rejectReason" rows="3" 
                          placeholder="Provide a reason for rejecting this request..."></textarea>
              </div>
              <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle"></i>
                This action cannot be undone. The user will be notified of the rejection.
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-danger" id="confirmRejectBtn">
                Confirm Rejection
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
  }

  /**
   * Handle approve action
   */
  async handleApprove(loanId: string): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    if (!confirm('Approve this loan request?')) return;

    try {
      await firestoreService.approveLoan(loanId, currentUser.uid);
      this.showSuccess('Loan request approved successfully!');
      await this.loadLoans();
      this.render();
      this.attachEventListeners();
    } catch (error: any) {
      console.error('Error approving loan:', error);
      this.showError(error?.message || 'Failed to approve loan request.');
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
      this.showSuccess('Loan request rejected.');

      // Close modal
      const modal = (window as any).bootstrap.Modal.getInstance(document.getElementById('rejectModal'));
      modal?.hide();

      await this.loadLoans();
      this.render();
      this.attachEventListeners();
    } catch (error) {
      console.error('Error rejecting loan:', error);
      this.showError('Failed to reject loan request.');
    }
  }

  /**
   * Handle return action
   */
  async handleReturn(loanId: string): Promise<void> {
    if (!confirm('Mark this item as returned?')) return;

    try {
      await firestoreService.returnLoan(loanId);
      this.showSuccess('Item marked as returned!');
      await this.loadLoans();
      this.render();
      this.attachEventListeners();
    } catch (error: any) {
      console.error('Error returning loan:', error);
      this.showError(error?.message || 'Failed to mark item as returned.');
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
