/**
 * Dashboard Component
 * Displays inventory items in a Bootstrap table with search and filter
 */

import { Item, ItemStatus } from '../types/models';
import { MongoDBService } from '../services/mongodb.service';
import { getAuthService } from '../services/auth.service';

export class DashboardComponent {
  private mongoService: MongoDBService;
  private authService = getAuthService();
  private items: Item[] = [];
  private container: HTMLElement;

  constructor(containerId: string) {
    this.mongoService = MongoDBService.getInstance();
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Container ${containerId} not found`);
    }
    this.container = element;
  }

  /**
   * Initialize dashboard
   */
  async init(): Promise<void> {
    await this.loadItems();
    this.render();
    this.attachEventListeners();
  }

  /**
   * Load items from database
   */
  async loadItems(): Promise<void> {
    try {
      this.items = await this.mongoService.getItems();
    } catch (error) {
      console.error('Error loading items:', error);
      this.showError('Failed to load items. Please try again.');
    }
  }

  /**
   * Render dashboard HTML
   */
  render(): void {
    const currentUser = this.authService.getCurrentUser();
    const isAdmin = this.authService.isAdmin();

    this.container.innerHTML = `
      <div class="container-fluid py-4">
        <!-- Header -->
        <div class="row mb-4">
          <div class="col-md-6">
            <h2><i class="bi bi-box-seam"></i> Inventory Dashboard</h2>
          </div>
          <div class="col-md-6 text-end">
            ${isAdmin ? `
              <button class="btn btn-primary" id="addItemBtn">
                <i class="bi bi-plus-circle"></i> Add Item
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Search and Filters -->
        <div class="row mb-3">
          <div class="col-md-6">
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control" id="searchInput" 
                     placeholder="Search items by name, description, or tags...">
            </div>
          </div>
          <div class="col-md-3">
            <select class="form-select" id="statusFilter">
              <option value="">All Status</option>
              <option value="${ItemStatus.AVAILABLE}">Available</option>
              <option value="${ItemStatus.ON_LOAN}">On Loan</option>
              <option value="${ItemStatus.MAINTENANCE}">Maintenance</option>
              <option value="${ItemStatus.RETIRED}">Retired</option>
            </select>
          </div>
          <div class="col-md-3">
            <select class="form-select" id="locationFilter">
              <option value="">All Locations</option>
              ${this.getUniqueLocations().map(loc => `<option value="${loc}">${loc}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- Items Table -->
        <div class="card shadow">
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover align-middle">
                <thead class="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Quantity</th>
                    <th>Tags</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="itemsTableBody">
                  ${this.renderItemsRows()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Request Modal -->
      ${this.renderRequestModal()}
    `;
  }

  /**
   * Render table rows
   */
  renderItemsRows(): string {
    if (this.items.length === 0) {
      return `
        <tr>
          <td colspan="6" class="text-center text-muted py-4">
            <i class="bi bi-inbox" style="font-size: 3rem;"></i>
            <p class="mt-2">No items found</p>
          </td>
        </tr>
      `;
    }

    return this.items.map(item => `
      <tr data-item-id="${item._id}">
        <td>
          <strong>${this.escapeHtml(item.name)}</strong>
          <br>
          <small class="text-muted">${this.escapeHtml(item.description)}</small>
        </td>
        <td><i class="bi bi-geo-alt"></i> ${this.escapeHtml(item.location)}</td>
        <td>
          <span class="badge bg-secondary">${item.quantity}</span>
        </td>
        <td>
          ${item.tags.map(tag => 
            `<span class="badge bg-info me-1">${this.escapeHtml(tag)}</span>`
          ).join('')}
        </td>
        <td>${this.getStatusBadge(item.status)}</td>
        <td>
          ${this.renderActionButtons(item)}
        </td>
      </tr>
    `).join('');
  }

  /**
   * Render action buttons based on item status and user role
   */
  renderActionButtons(item: Item): string {
    const isAdmin = this.authService.isAdmin();
    const buttons: string[] = [];

    // Request button for users if item is available
    if (item.status === ItemStatus.AVAILABLE && item.quantity > 0) {
      buttons.push(`
        <button class="btn btn-sm btn-success request-btn" data-item-id="${item._id}">
          <i class="bi bi-hand-thumbs-up"></i> Request
        </button>
      `);
    }

    // Edit and Delete for admins
    if (isAdmin) {
      buttons.push(`
        <button class="btn btn-sm btn-outline-primary edit-btn" data-item-id="${item._id}">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger delete-btn" data-item-id="${item._id}">
          <i class="bi bi-trash"></i>
        </button>
      `);
    }

    return buttons.join(' ');
  }

  /**
   * Get status badge HTML
   */
  getStatusBadge(status: ItemStatus): string {
    const badges = {
      [ItemStatus.AVAILABLE]: '<span class="badge bg-success">Available</span>',
      [ItemStatus.ON_LOAN]: '<span class="badge bg-warning">On Loan</span>',
      [ItemStatus.MAINTENANCE]: '<span class="badge bg-secondary">Maintenance</span>',
      [ItemStatus.RETIRED]: '<span class="badge bg-dark">Retired</span>',
    };
    return badges[status] || '<span class="badge bg-light">Unknown</span>';
  }

  /**
   * Render request modal
   */
  renderRequestModal(): string {
    return `
      <div class="modal fade" id="requestModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Request Item</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="requestForm">
                <input type="hidden" id="requestItemId">
                <div class="mb-3">
                  <label class="form-label">Item</label>
                  <input type="text" class="form-control" id="requestItemName" readonly>
                </div>
                <div class="mb-3">
                  <label for="requestQuantity" class="form-label">Quantity</label>
                  <input type="number" class="form-control" id="requestQuantity" 
                         min="1" value="1" required>
                </div>
                <div class="mb-3">
                  <label for="expectedReturnDate" class="form-label">Expected Return Date</label>
                  <input type="date" class="form-control" id="expectedReturnDate" required>
                </div>
                <div class="mb-3">
                  <label for="requestNotes" class="form-label">Notes (Optional)</label>
                  <textarea class="form-control" id="requestNotes" rows="3"></textarea>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary" id="submitRequestBtn">Submit Request</button>
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
    // Search
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    searchInput?.addEventListener('input', (e) => {
      this.handleSearch((e.target as HTMLInputElement).value);
    });

    // Filters
    const statusFilter = document.getElementById('statusFilter') as HTMLSelectElement;
    const locationFilter = document.getElementById('locationFilter') as HTMLSelectElement;
    
    statusFilter?.addEventListener('change', () => this.applyFilters());
    locationFilter?.addEventListener('change', () => this.applyFilters());

    // Request buttons
    document.querySelectorAll('.request-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const itemId = (e.currentTarget as HTMLElement).dataset.itemId;
        if (itemId) this.openRequestModal(itemId);
      });
    });

    // Submit request
    document.getElementById('submitRequestBtn')?.addEventListener('click', () => {
      this.handleRequestSubmit();
    });

    // Admin: Add item
    document.getElementById('addItemBtn')?.addEventListener('click', () => {
      this.openAddItemForm();
    });
  }

  /**
   * Handle search
   */
  async handleSearch(term: string): Promise<void> {
    if (term.trim().length < 2) {
      await this.loadItems();
    } else {
      this.items = await this.mongoService.searchItems(term);
    }
    this.updateTableBody();
  }

  /**
   * Apply filters
   */
  applyFilters(): void {
    const statusFilter = (document.getElementById('statusFilter') as HTMLSelectElement)?.value;
    const locationFilter = (document.getElementById('locationFilter') as HTMLSelectElement)?.value;

    let filtered = [...this.items];

    if (statusFilter) {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    if (locationFilter) {
      filtered = filtered.filter(item => item.location === locationFilter);
    }

    this.items = filtered;
    this.updateTableBody();
  }

  /**
   * Update table body
   */
  updateTableBody(): void {
    const tbody = document.getElementById('itemsTableBody');
    if (tbody) {
      tbody.innerHTML = this.renderItemsRows();
      this.attachEventListeners();
    }
  }

  /**
   * Open request modal
   */
  openRequestModal(itemId: string): void {
    const item = this.items.find(i => i._id === itemId);
    if (!item) return;

    (document.getElementById('requestItemId') as HTMLInputElement).value = itemId;
    (document.getElementById('requestItemName') as HTMLInputElement).value = item.name;
    (document.getElementById('requestQuantity') as HTMLInputElement).max = item.quantity.toString();

    // Set minimum date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    (document.getElementById('expectedReturnDate') as HTMLInputElement).min = 
      tomorrow.toISOString().split('T')[0];

    // Show modal (requires Bootstrap JS)
    const modal = new (window as any).bootstrap.Modal(document.getElementById('requestModal'));
    modal.show();
  }

  /**
   * Handle request submission
   */
  async handleRequestSubmit(): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.showError('You must be logged in to request items');
      return;
    }

    const itemId = (document.getElementById('requestItemId') as HTMLInputElement).value;
    const item = this.items.find(i => i._id === itemId);
    if (!item) return;

    const quantity = parseInt((document.getElementById('requestQuantity') as HTMLInputElement).value);
    const expectedReturnDate = new Date((document.getElementById('expectedReturnDate') as HTMLInputElement).value);
    const notes = (document.getElementById('requestNotes') as HTMLTextAreaElement).value;

    try {
      await this.mongoService.createLoanRequest({
        itemId: item._id!,
        itemName: item.name,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName,
        quantity,
        expectedReturnDate,
        notes,
      });

      this.showSuccess('Request submitted successfully!');
      
      // Close modal
      const modal = (window as any).bootstrap.Modal.getInstance(document.getElementById('requestModal'));
      modal?.hide();

      // Reload items
      await this.loadItems();
      this.updateTableBody();
    } catch (error) {
      console.error('Error submitting request:', error);
      this.showError('Failed to submit request. Please try again.');
    }
  }

  /**
   * Open add item form (placeholder)
   */
  openAddItemForm(): void {
    alert('Add Item form would open here - implement as separate component');
  }

  /**
   * Get unique locations from items
   */
  getUniqueLocations(): string[] {
    return [...new Set(this.items.map(item => item.location))];
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show success message
   */
  showSuccess(message: string): void {
    // Simple alert - replace with toast notification in production
    alert(message);
  }

  /**
   * Show error message
   */
  showError(message: string): void {
    alert(message);
  }
}

export default DashboardComponent;
