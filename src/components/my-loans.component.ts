/**
 * My Loans Component
 * 
 * Displays user's loan history and status
 */

import { firestoreService } from '../services/firestore.service';
import { getAuthService } from '../services/auth.service';
import type { Loan } from '../types/models';
import { i18nService } from '../services/i18n.service';

export class MyLoansComponent {
  private authService = getAuthService();
  private pendingLoans: Loan[] = [];
  private activeLoans: Loan[] = [];
  private historyLoans: Loan[] = [];
  private container: HTMLElement;

  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Container ${containerId} not found`);
    }
    this.container = element;
  }

  /**
   * Initialize the component
   */
  async init(): Promise<void> {
    await this.loadLoans();
    this.render();
    this.attachEventListeners();
  }

  /**
   * Load user's loans
   */
  async loadLoans(): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.error('No user logged in');
      return;
    }

    try {
      const allLoans = await firestoreService.getUserLoans(currentUser.uid);
      
      // Separate by status
      this.pendingLoans = allLoans.filter(loan => loan.status === 'pending');
      this.activeLoans = allLoans.filter(loan => loan.status === 'approved');
      this.historyLoans = allLoans.filter(loan => 
        loan.status === 'returned' || loan.status === 'rejected'
      );
    } catch (error) {
      console.error('Error loading loans:', error);
      this.showToast(i18nService.t('common.error'), 'danger');
    }
  }

  /**
   * Render the component
   */
  render(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.container.innerHTML = `
        <div class="alert alert-warning">
          <i class="bi bi-exclamation-triangle"></i>
          ${i18nService.t('dashboard.loginRequired')}
        </div>
      `;
      return;
    }

    this.container.innerHTML = `
      <div class="container-fluid py-4">
        <!-- Header -->
        <div class="row mb-4">
          <div class="col">
            <h2><i class="bi bi-box-seam"></i> ${i18nService.t('myLoans.title')}</h2>
            <p class="text-muted">${i18nService.t('myLoans.subtitle')}</p>
          </div>
        </div>

        <!-- Statistics Cards -->
        <div class="row mb-4">
          <div class="col-md-4">
            <div class="card bg-warning text-white">
              <div class="card-body">
                <h5 class="card-title"><i class="bi bi-clock-history"></i> ${i18nService.t('myLoans.status.pending')}</h5>
                <h2 class="mb-0">${this.pendingLoans.length}</h2>
                <small>${i18nService.t('myLoans.awaitingApproval')}</small>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card bg-info text-white">
              <div class="card-body">
                <h5 class="card-title"><i class="bi bi-box-arrow-right"></i> ${i18nService.t('myLoans.currentLoans')}</h5>
                <h2 class="mb-0">${this.activeLoans.length}</h2>
                <small>${i18nService.t('myLoans.currentlyBorrowed')}</small>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card bg-success text-white">
              <div class="card-body">
                <h5 class="card-title"><i class="bi bi-archive"></i> ${i18nService.t('myLoans.loanHistory')}</h5>
                <h2 class="mb-0">${this.historyLoans.length}</h2>
                <small>${i18nService.t('myLoans.completedLoans')}</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <ul class="nav nav-tabs mb-3" id="myLoansTabs" role="tablist">
          <li class="nav-item" role="presentation">
            <button class="nav-link active" id="active-tab" data-bs-toggle="tab" 
                    data-bs-target="#active" type="button" role="tab">
              ${i18nService.t('myLoans.currentLoans')}
              ${this.activeLoans.length > 0 ? `<span class="badge bg-info ms-2">${this.activeLoans.length}</span>` : ''}
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" id="pending-tab" data-bs-toggle="tab" 
                    data-bs-target="#pending" type="button" role="tab">
              ${i18nService.t('myLoans.status.pending')}
              ${this.pendingLoans.length > 0 ? `<span class="badge bg-warning ms-2">${this.pendingLoans.length}</span>` : ''}
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" id="history-tab" data-bs-toggle="tab" 
                    data-bs-target="#history" type="button" role="tab">
              ${i18nService.t('myLoans.loanHistory')}
            </button>
          </li>
        </ul>

        <!-- Tab Content -->
        <div class="tab-content" id="myLoansTabContent">
          <!-- Active Loans Tab -->
          <div class="tab-pane fade show active" id="active" role="tabpanel">
            ${this.renderActiveLoans()}
          </div>

          <!-- Pending Requests Tab -->
          <div class="tab-pane fade" id="pending" role="tabpanel">
            ${this.renderPendingRequests()}
          </div>

          <!-- History Tab -->
          <div class="tab-pane fade" id="history" role="tabpanel">
            ${this.renderHistory()}
          </div>
        </div>
      </div>
      ${this.renderNoteModal()}
    `;
  }

  /**
   * Render Note Modal
   */
  renderNoteModal(): string {
    return `
      <div class="modal fade" id="myLoansNoteModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${i18nService.t('common.notes')}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
              <p id="myLoansNoteContent" class="text-break"></p>
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
    const modalEl = document.getElementById('myLoansNoteModal');
    const contentEl = document.getElementById('myLoansNoteContent');
    
    if (modalEl && contentEl) {
      contentEl.textContent = note;
      const modal = new (window as any).bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  /**
   * Render active loans
   */
  renderActiveLoans(): string {
    if (this.activeLoans.length === 0) {
      return `
        <div class="alert alert-info">
          <i class="bi bi-info-circle"></i> ${i18nService.t('myLoans.noCurrent')}
          <a href="#" class="alert-link" onclick="window.app.navigate('dashboard')">${i18nService.t('common.viewDetails')}</a>
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
                  <th>${i18nService.t('common.quantity')}</th>
                  <th>${i18nService.t('admin.approvedDate')}</th>
                  <th>${i18nService.t('dashboard.expectedReturnDate')}</th>
                  <th>${i18nService.t('admin.daysOut')}</th>
                  <th>${i18nService.t('common.status')}</th>
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
   * Render active loan row
   */
  renderActiveRow(loan: Loan): string {
    const daysOut = this.calculateDaysOut(loan.approvedAt || loan.requestedAt);
    const isOverdue = loan.expectedReturnDate && 
                      new Date(loan.expectedReturnDate) < new Date();

    return `
      <tr ${isOverdue ? 'class="table-warning"' : ''}>
        <td>
          <strong>${this.escapeHtml(loan.itemName)}</strong>
          ${loan.notes ? `
            <br>
            <button class="btn btn-sm btn-outline-info view-note-btn mt-1" 
                    data-note="${this.escapeHtml(loan.notes)}">
              <i class="bi bi-sticky"></i> ${i18nService.t('common.viewDetails')}
            </button>
          ` : ''}
        </td>
        <td><span class="badge bg-secondary">${loan.quantity}</span></td>
        <td>${this.formatDate(loan.approvedAt || loan.requestedAt)}</td>
        <td>
          ${loan.expectedReturnDate ? this.formatDate(loan.expectedReturnDate) : 'N/A'}
          ${isOverdue ? `<br><span class="badge bg-danger">${i18nService.t('admin.overdue')}</span>` : ''}
        </td>
        <td><span class="badge bg-info">${daysOut} ${i18nService.t('admin.daysOut')}</span></td>
        <td><span class="badge bg-success">${i18nService.t('myLoans.status.approved')}</span></td>
      </tr>
    `;
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
                  <th>${i18nService.t('common.quantity')}</th>
                  <th>${i18nService.t('admin.requestedDate')}</th>
                  <th>${i18nService.t('dashboard.expectedReturnDate')}</th>
                  <th>${i18nService.t('common.status')}</th>
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
   * Render pending request row
   */
  renderPendingRow(loan: Loan): string {
    return `
      <tr>
        <td>
          <strong>${this.escapeHtml(loan.itemName)}</strong>
          ${loan.notes ? `
            <br>
            <button class="btn btn-sm btn-outline-info view-note-btn mt-1" 
                    data-note="${this.escapeHtml(loan.notes)}">
              <i class="bi bi-sticky"></i> ${i18nService.t('common.viewDetails')}
            </button>
          ` : ''}
        </td>
        <td><span class="badge bg-secondary">${loan.quantity}</span></td>
        <td>${this.formatDate(loan.requestedAt)}</td>
        <td>${loan.expectedReturnDate ? this.formatDate(loan.expectedReturnDate) : 'N/A'}</td>
        <td><span class="badge bg-warning">${i18nService.t('myLoans.status.pending')}</span></td>
      </tr>
    `;
  }

  /**
   * Render history
   */
  renderHistory(): string {
    if (this.historyLoans.length === 0) {
      return `
        <div class="alert alert-info">
          <i class="bi bi-info-circle"></i> ${i18nService.t('myLoans.noHistory')}
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
                  <th>${i18nService.t('common.quantity')}</th>
                  <th>${i18nService.t('admin.requestedDate')}</th>
                  <th>${i18nService.t('admin.duration')}</th>
                  <th>${i18nService.t('common.status')}</th>
                </tr>
              </thead>
              <tbody>
                ${this.historyLoans.map(loan => this.renderHistoryRow(loan)).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render history row
   */
  renderHistoryRow(loan: Loan): string {
    const duration = loan.status === 'returned' && loan.returnedAt
      ? this.calculateDuration(loan.approvedAt || loan.requestedAt, loan.returnedAt)
      : 'N/A';
    
    const statusBadge = loan.status === 'returned'
      ? `<span class="badge bg-success">${i18nService.t('myLoans.status.returned')}</span>`
      : `<span class="badge bg-danger">${i18nService.t('myLoans.status.rejected')}</span>`;

    const wasOverdue = loan.status === 'returned' && 
                       loan.expectedReturnDate && 
                       loan.returnedAt &&
                       new Date(loan.returnedAt) > new Date(loan.expectedReturnDate);

    return `
      <tr>
        <td>
          <strong>${this.escapeHtml(loan.itemName)}</strong>
          ${loan.adminNotes ? `<br><small class="text-muted"><i class="bi bi-info-circle"></i> ${this.escapeHtml(loan.adminNotes)}</small>` : ''}
          ${loan.notes ? `
            <br>
            <button class="btn btn-sm btn-outline-info view-note-btn mt-1" 
                    data-note="${this.escapeHtml(loan.notes)}">
              <i class="bi bi-sticky"></i> ${i18nService.t('common.viewDetails')}
            </button>
          ` : ''}
        </td>
        <td><span class="badge bg-secondary">${loan.quantity}</span></td>
        <td><small>${this.formatDate(loan.requestedAt)}</small></td>
        <td>
          ${duration}
          ${wasOverdue ? `<br><span class="badge bg-warning">${i18nService.t('admin.wasOverdue')}</span>` : ''}
        </td>
        <td>${statusBadge}</td>
      </tr>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners(): void {
    document.querySelectorAll('.view-note-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const note = (e.currentTarget as HTMLElement).dataset.note;
        if (note) this.openNoteModal(note);
      });
    });
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
  formatDate(date?: Date): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
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
   * Show Bootstrap toast notification
   */
  private showToast(message: string, type: 'success' | 'danger' | 'warning' | 'info'): void {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toastId = `toast-${Date.now()}`;
    const bgClass = type === 'danger' ? 'bg-danger' : type === 'warning' ? 'bg-warning' : type === 'success' ? 'bg-success' : 'bg-info';
    
    const toastHTML = `
      <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0" role="alert">
        <div class="d-flex">
          <div class="toast-body">
            ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    const toastElement = document.getElementById(toastId);
    if (toastElement) {
      const toast = new (window as any).bootstrap.Toast(toastElement, { autohide: true, delay: 3000 });
      toast.show();
      
      toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
      });
    }
  }
}

export default MyLoansComponent;