/**
 * Dashboard Component
 * Displays inventory items in a Bootstrap table with search and filter
 */

import { Item, ItemStatus, Location, Category } from '../types/models';
import { firestoreService } from '../services/firestore.service';
import { getAuthService } from '../services/auth.service';

export class DashboardComponent {
  private authService = getAuthService();
  private allItems: Item[] = [];
  private items: Item[] = [];
  private locations: Location[] = [];
  private categories: Category[] = [];
  private container: HTMLElement;
  private isGrouped: boolean = false;

  constructor(containerId: string) {
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
    await Promise.all([
      this.loadItems(),
      this.loadLocations(),
      this.loadCategories()
    ]);
    this.render();
    this.attachEventListeners();
  }

  /**
   * Load items from database
   */
  async loadItems(): Promise<void> {
    try {
      this.allItems = await firestoreService.getItems();
      this.items = [...this.allItems];
    } catch (error) {
      console.error('Error loading items:', error);
      this.showError('Failed to load items. Please try again.');
    }
  }

  /**
   * Load locations from database
   */
  async loadLocations(): Promise<void> {
    try {
      this.locations = await firestoreService.getLocations();
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  }

  /**
   * Load categories from database
   */
  async loadCategories(): Promise<void> {
    try {
      this.categories = await firestoreService.getCategories();
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  /**
   * Render dashboard HTML
   */
  render(): void {
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
          <div class="col-md-5 mb-3">
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control" id="searchInput" 
                     placeholder="Search items by name, description, or tags...">
            </div>
          </div>
          <div class="col-md-2 mb-3">
            <select class="form-select" id="statusFilter">
              <option value="">All Status</option>
              <option value="${ItemStatus.AVAILABLE}">Available</option>
              <option value="${ItemStatus.ON_LOAN}">On Loan</option>
              <option value="${ItemStatus.MAINTENANCE}">Maintenance</option>
              <option value="${ItemStatus.RETIRED}">Retired</option>
            </select>
          </div>
          <div class="col-md-3 mb-3">
            <select class="form-select" id="locationFilter">
              <option value="">All Locations</option>
              ${this.getUniqueLocations().map(loc => `<option value="${loc}">${loc}</option>`).join('')}
            </select>
          </div>
          <div class="col-md-2 mb-3 d-flex align-items-center">
             <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" role="switch" id="groupByProductToggle" ${this.isGrouped ? 'checked' : ''}>
                <label class="form-check-label" for="groupByProductToggle">Group Products</label>
             </div>
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
                  ${this.isGrouped ? this.renderGroupedItemsRows() : this.renderItemsRows()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Request Modal -->
      ${this.renderRequestModal()}
      
      <!-- Item Loans Modal -->
      ${this.renderItemLoansModal()}
      
      <!-- Product Details Modal -->
      ${this.renderProductDetailsModal()}
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
          <small class="text-muted">${this.escapeHtml(item.description || '')}</small>
        </td>
        <td><i class="bi bi-geo-alt"></i> ${this.escapeHtml(item.location || '')}</td>
        <td>
          <span class="badge bg-secondary">${item.quantity || 0}</span>
        </td>
        <td>
          ${(item.tags || []).map(tag => 
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

    // View Loans button (visible to admins only)
    if (isAdmin) {
      buttons.push(`
        <button class="btn btn-sm btn-info view-loans-btn text-white" data-item-id="${item._id}" title="View Loans">
          <i class="bi bi-eye"></i>
        </button>
      `);
    }

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
            <div class="modal-body p-4">
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
   * Render Note Modal
   */
  renderNoteModal(): string {
    return `
      <div class="modal fade" id="dashboardNoteModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Loan Note</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
              <p id="dashboardNoteContent" class="text-break"></p>
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
   * Render Item Loans Modal
   */
  renderItemLoansModal(): string {
    return `
      <div class="modal fade" id="itemLoansModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Item Loan History</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
              <h6 id="itemLoansTitle" class="mb-3 text-primary"></h6>
              <div class="table-responsive">
                <table class="table table-sm table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>User</th>
                      <th>Qty</th>
                      <th>Status</th>
                      <th>Requested</th>
                      <th>Returned</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody id="itemLoansTableBody">
                    <tr><td colspan="6" class="text-center">Loading...</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
      ${this.renderNoteModal()}
    `;
  }

  /**
   * Render Product Details Modal
   */
  renderProductDetailsModal(): string {
    return `
      <div class="modal fade" id="productDetailsModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Product Details</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
              <h6 id="productDetailsTitle" class="mb-3 text-primary"></h6>
              
              <div class="row mb-4">
                 <div class="col-md-6">
                    <div class="card">
                        <div class="card-header bg-light">Inventory Breakdown</div>
                        <ul class="list-group list-group-flush" id="productInventoryList">
                            <li class="list-group-item">Loading...</li>
                        </ul>
                    </div>
                 </div>
                 <div class="col-md-6">
                    <div class="card">
                        <div class="card-header bg-light">Active Loans Summary</div>
                        <ul class="list-group list-group-flush" id="productLoansList">
                            <li class="list-group-item">Loading...</li>
                        </ul>
                    </div>
                 </div>
              </div>
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
   * Render grouped table rows
   */
  renderGroupedItemsRows(): string {
    const groups: { [key: string]: Item[] } = {};
    const singles: Item[] = [];

    this.items.forEach(item => {
      if (item.groupId) {
        if (!groups[item.groupId]) groups[item.groupId] = [];
        groups[item.groupId].push(item);
      } else {
        singles.push(item);
      }
    });

    let html = '';
    
    // Render Groups
    Object.keys(groups).forEach(groupId => {
        const groupItems = groups[groupId];
        // Aggregate unique tags from all items in the group
        const allTags = [...new Set(groupItems.flatMap(i => i.tags || []))];
        const totalQty = groupItems.reduce((sum, i) => sum + i.quantity, 0);
        const locations = [...new Set(groupItems.map(i => i.location))].join(', ');
        
        html += `
          <tr class="table-info">
            <td>
                <strong>${this.escapeHtml(groupId)}</strong>
            </td>
            <td>${this.escapeHtml(locations)}</td>
            <td><span class="badge bg-primary">${totalQty} Total</span></td>
             <td>
              ${allTags.map(tag => 
                `<span class="badge bg-info me-1">${this.escapeHtml(tag)}</span>`
              ).join('')}
            </td>
            <td><span class="badge bg-info">Grouped</span></td>
            <td>
                <button class="btn btn-sm btn-primary view-group-details-btn" data-group-id="${groupId}">
                    <i class="bi bi-eye"></i> View Details
                </button>
            </td>
          </tr>
        `;
    });

    // Render Singles
     if (singles.length > 0) {
        html += singles.map(item => `
          <tr data-item-id="${item._id}">
            <td>
              <strong>${this.escapeHtml(item.name)}</strong>
              <br>
              <small class="text-muted">${this.escapeHtml(item.description || '')}</small>
            </td>
            <td><i class="bi bi-geo-alt"></i> ${this.escapeHtml(item.location || '')}</td>
            <td>
              <span class="badge bg-secondary">${item.quantity || 0}</span>
            </td>
            <td>
              ${(item.tags || []).map(tag => 
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
     
     if (html === '') {
        return `<tr><td colspan="6" class="text-center py-4">No items found</td></tr>`;
     }

     return html;
  }

  /**
   * Open Product Details Modal (Grouped View)
   */
  async openProductDetails(groupId: string): Promise<void> {
     // Find all items in this group from ALL items (not just filtered ones)
     const groupItems = this.allItems.filter(i => i.groupId === groupId);
     if (groupItems.length === 0) return;

     // Show modal
     const modal = new (window as any).bootstrap.Modal(document.getElementById('productDetailsModal'));
     modal.show();
     
     const titleEl = document.getElementById('productDetailsTitle');
     if (titleEl) titleEl.textContent = `Group: ${groupId}`;
     
     // Render Inventory Breakdown
     const inventoryList = document.getElementById('productInventoryList');
     if (inventoryList) {
        inventoryList.innerHTML = groupItems.map(item => `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <span><i class="bi bi-geo-alt"></i> ${this.escapeHtml(item.location)}</span>
                <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-secondary rounded-pill">${item.quantity}</span>
                    <div class="btn-group btn-group-sm">
                        ${this.renderActionButtons(item)}
                    </div>
                </div>
            </li>
        `).join('');

        // Attach event listeners for buttons within the inventory list
        // We use the specific classes generated by renderActionButtons
        
        // View Loans
        inventoryList.querySelectorAll('.view-loans-btn').forEach(btn => {
            const itemId = (btn as HTMLElement).dataset.itemId;
            (btn as HTMLElement).onclick = (e) => {
                e.stopPropagation();
                if (itemId) this.viewLoans(itemId);
            };
        });

        // Request
        inventoryList.querySelectorAll('.request-btn').forEach(btn => {
            const itemId = (btn as HTMLElement).dataset.itemId;
            (btn as HTMLElement).onclick = (e) => {
                e.stopPropagation();
                if (itemId) this.openRequestModal(itemId);
            };
        });

        // Edit (Admin only)
        inventoryList.querySelectorAll('.edit-btn').forEach(btn => {
            const itemId = (btn as HTMLElement).dataset.itemId;
            (btn as HTMLElement).onclick = (e) => {
                e.stopPropagation();
                if (itemId) {
                    // Hide details modal to focus on edit
                    const detailsModal = (window as any).bootstrap.Modal.getInstance(document.getElementById('productDetailsModal'));
                    detailsModal?.hide();
                    this.openEditItemForm(itemId);
                }
            };
        });

        // Delete (Admin only)
        inventoryList.querySelectorAll('.delete-btn').forEach(btn => {
            const itemId = (btn as HTMLElement).dataset.itemId;
            (btn as HTMLElement).onclick = async (e) => {
                e.stopPropagation();
                if (itemId) {
                     if (!confirm('Are you sure you want to delete this item?')) return;
                     
                     try {
                        await firestoreService.deleteItem(itemId);
                        this.showSuccess('Item deleted successfully');
                        
                        // Refresh data
                        await this.loadItems();
                        this.applyFiltersAndSearch();
                        
                        // Refresh this modal or close if empty
                        const updatedGroupItems = this.allItems.filter(i => i.groupId === groupId);
                        if (updatedGroupItems.length === 0) {
                            const detailsModal = (window as any).bootstrap.Modal.getInstance(document.getElementById('productDetailsModal'));
                            detailsModal?.hide();
                        } else {
                            this.openProductDetails(groupId);
                        }
                     } catch (error) {
                        console.error('Error deleting item:', error);
                        this.showError('Failed to delete item.');
                     }
                }
            };
        });
     }

     // Fetch and Render Loans
     const loansList = document.getElementById('productLoansList');
     
     if (!this.authService.isAdmin()) {
        if (loansList) {
            const card = loansList.closest('.card');
            if (card && card.parentElement) {
                (card.parentElement as HTMLElement).style.display = 'none';
            }
        }
        const inventoryList = document.getElementById('productInventoryList');
        if (inventoryList) {
            const card = inventoryList.closest('.card');
            if (card && card.parentElement) {
                card.parentElement.classList.remove('col-md-6');
                card.parentElement.classList.add('col-md-12');
            }
        }
        return;
     }

     if (loansList) loansList.innerHTML = '<li class="list-group-item">Loading loans...</li>';

     try {
        // We need to fetch loans for EACH item ID in the group
        const loanPromises = groupItems.map(item => firestoreService.getLoansByItem(item._id!));
        const loansArrays = await Promise.all(loanPromises);
        const allLoans = loansArrays.flat();
        
        // Filter only active/approved loans
        const activeLoans = allLoans.filter(l => l.status === 'approved');
        
        if (loansList) {
            if (activeLoans.length === 0) {
                loansList.innerHTML = '<li class="list-group-item text-muted">No active loans.</li>';
            } else {
                // Group by user for cleaner display
                const loansByUser: {[key: string]: number} = {};
                activeLoans.forEach(loan => {
                    if (!loansByUser[loan.userName]) loansByUser[loan.userName] = 0;
                    loansByUser[loan.userName] += loan.quantity;
                });

                loansList.innerHTML = Object.keys(loansByUser).map(userName => `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span><i class="bi bi-person"></i> ${this.escapeHtml(userName)}</span>
                        <span class="badge bg-warning text-dark rounded-pill">${loansByUser[userName]} on loan</span>
                    </li>
                `).join('');
            }
        }

     } catch (error) {
        console.error('Error fetching group loans:', error);
        if (loansList) loansList.innerHTML = '<li class="list-group-item text-danger">Failed to load loans.</li>';
     }
  }

  /**
   * Attach event listeners
   */
  attachEventListeners(): void {
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const statusFilter = document.getElementById('statusFilter') as HTMLSelectElement;
    const locationFilter = document.getElementById('locationFilter') as HTMLSelectElement;
    const groupByToggle = document.getElementById('groupByProductToggle') as HTMLInputElement;

    if (searchInput) {
      searchInput.addEventListener('input', () => this.applyFiltersAndSearch());
    }
    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.applyFiltersAndSearch());
    }
    if (locationFilter) {
      locationFilter.addEventListener('change', () => this.applyFiltersAndSearch());
    }
    if (groupByToggle) {
        groupByToggle.addEventListener('change', (e) => {
            this.isGrouped = (e.target as HTMLInputElement).checked;
            this.render(); // Re-render the whole view to update table structure
            this.attachEventListeners(); // Re-attach listeners
        });
    }
    
    // View Loans buttons
    document.querySelectorAll('.view-loans-btn').forEach(btn => {
      const itemId = (btn as HTMLElement).dataset.itemId;
      (btn as HTMLElement).onclick = () => {
        if (itemId) this.viewLoans(itemId);
      };
    });

    // View Group Details buttons
    document.querySelectorAll('.view-group-details-btn').forEach(btn => {
      const groupId = (btn as HTMLElement).dataset.groupId;
      (btn as HTMLElement).onclick = () => {
        if (groupId) this.openProductDetails(groupId);
      };
    });

    // Request buttons (inline onclick is better for dynamic content)
    document.querySelectorAll('.request-btn').forEach(btn => {
      const itemId = (btn as HTMLElement).dataset.itemId;
      (btn as HTMLElement).onclick = () => {
        if (itemId) this.openRequestModal(itemId);
      };
    });

    // Submit request button - remove old listeners
    const submitRequestBtn = document.getElementById('submitRequestBtn');
    if (submitRequestBtn) {
      const newSubmitRequestBtn = submitRequestBtn.cloneNode(true);
      submitRequestBtn.parentNode?.replaceChild(newSubmitRequestBtn, submitRequestBtn);
      newSubmitRequestBtn.addEventListener('click', () => {
        this.handleRequestSubmit();
      });
    }

    // Admin: Add item
    const addItemBtn = document.getElementById('addItemBtn');
    if (addItemBtn) {
      const newAddItemBtn = addItemBtn.cloneNode(true);
      addItemBtn.parentNode?.replaceChild(newAddItemBtn, addItemBtn);
      newAddItemBtn.addEventListener('click', () => {
        this.openAddItemForm();
      });
    }

    // Admin: Edit item buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
      const itemId = (btn as HTMLElement).dataset.itemId;
      (btn as HTMLElement).onclick = () => {
        if (itemId) this.openEditItemForm(itemId);
      };
    });

    // Admin: Delete item buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
      const itemId = (btn as HTMLElement).dataset.itemId;
      (btn as HTMLElement).onclick = () => {
        if (itemId) this.deleteItem(itemId);
      };
    });
  }

  /**
   * Open Note Modal
   */
  openNoteModal(note: string): void {
    const modalEl = document.getElementById('dashboardNoteModal');
    const contentEl = document.getElementById('dashboardNoteContent');
    
    if (modalEl && contentEl) {
      contentEl.textContent = note;
      const modal = new (window as any).bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  /**
   * View loans for a specific item
   */
  async viewLoans(itemId: string): Promise<void> {
    const item = this.items.find(i => i._id === itemId);
    if (!item) return;

    // Show modal
    const modalEl = document.getElementById('itemLoansModal');
    const modal = new (window as any).bootstrap.Modal(modalEl);
    
    // Check if Product Details is open and adjust z-index
    const detailsModal = document.getElementById('productDetailsModal');
    if (detailsModal && detailsModal.classList.contains('show')) {
        if (modalEl) modalEl.style.zIndex = '1060'; // Higher than default 1055
    } else {
        if (modalEl) modalEl.style.zIndex = ''; // Reset
    }

    modal.show();

    const titleEl = document.getElementById('itemLoansTitle');
    if (titleEl) titleEl.textContent = `Loans for: ${item.name}`;

    const tbody = document.getElementById('itemLoansTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="spinner-border text-primary" role="status"></div></td></tr>';

    try {
      const loans = await firestoreService.getLoansByItem(itemId);
      
      if (!tbody) return;

      if (loans.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No history found for this item.</td></tr>';
        return;
      }

      tbody.innerHTML = loans.map(loan => `
        <tr>
          <td>
            ${this.escapeHtml(loan.userName)}<br>
            <small class="text-muted">${this.escapeHtml(loan.userEmail)}</small>
          </td>
          <td>${loan.quantity}</td>
          <td>
            <span class="badge ${this.getLoanStatusColor(loan.status)}">
              ${loan.status}
            </span>
          </td>
          <td>${new Date(loan.requestedAt).toLocaleDateString()}</td>
          <td>${loan.returnedAt ? new Date(loan.returnedAt).toLocaleDateString() : '-'}</td>
          <td>
             ${loan.notes ? `
              <button class="btn btn-sm btn-outline-info view-loan-note-btn" 
                      data-note="${this.escapeHtml(loan.notes)}">
                <i class="bi bi-sticky"></i> Note
              </button>
             ` : '<span class="text-muted">-</span>'}
          </td>
        </tr>
      `).join('');

      // Attach note button listeners
      tbody.querySelectorAll('.view-loan-note-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const note = (e.currentTarget as HTMLElement).dataset.note;
          if (note) this.openNoteModal(note);
        });
      });

    } catch (error) {
      console.error('Error fetching item loans:', error);
      if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Failed to load history.</td></tr>';
    }
  }

  /**
   * Get color for loan status
   */
  getLoanStatusColor(status: string): string {
    switch (status) {
      case 'approved': return 'bg-success';
      case 'pending': return 'bg-warning';
      case 'returned': return 'bg-secondary';
      case 'rejected': return 'bg-danger';
      default: return 'bg-light text-dark';
    }
  }

  /**
   * Apply filters and search
   */
  applyFiltersAndSearch(): void {
    const statusFilter = (document.getElementById('statusFilter') as HTMLSelectElement)?.value;
    const locationFilter = (document.getElementById('locationFilter') as HTMLSelectElement)?.value;
    const searchTerm = (document.getElementById('searchInput') as HTMLInputElement)?.value.toLowerCase().trim();

    let filtered = [...this.allItems];

    if (statusFilter) {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    if (locationFilter) {
      filtered = filtered.filter(item => item.location === locationFilter);
    }

    if (searchTerm.length > 0) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.description?.toLowerCase().includes(searchTerm) ||
        item.location?.toLowerCase().includes(searchTerm) ||
        item.category?.toLowerCase().includes(searchTerm) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      );
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
      tbody.innerHTML = this.isGrouped ? this.renderGroupedItemsRows() : this.renderItemsRows();
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
    const expectedReturnDateValue = (document.getElementById('expectedReturnDate') as HTMLInputElement).value;
    
    // Validate expected return date
    if (!expectedReturnDateValue) {
      this.showError('Please select an expected return date');
      return;
    }
    
    const expectedReturnDate = new Date(expectedReturnDateValue);
    
    // Validate the date is valid and in the future
    if (isNaN(expectedReturnDate.getTime())) {
      this.showError('Invalid return date');
      return;
    }
    
    if (expectedReturnDate <= new Date()) {
      this.showError('Return date must be in the future');
      return;
    }
    
    const notes = (document.getElementById('requestNotes') as HTMLTextAreaElement).value;

    try {
      await firestoreService.createLoan({
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
      this.applyFiltersAndSearch();
    } catch (error) {
      console.error('Error submitting request:', error);
      this.showError('Failed to submit request. Please try again.');
    }
  }

  /**
   * Open add item form
   */
  openAddItemForm(): void {
    // Reset form
    (document.getElementById('itemForm') as HTMLFormElement).reset();
    (document.getElementById('itemId') as HTMLInputElement).value = '';
    (document.getElementById('itemGroupId') as HTMLInputElement).value = '';
    (document.getElementById('itemModalTitle') as HTMLElement).textContent = 'Add New Item';
    
    // Populate location and category dropdowns
    this.populateLocationDropdown();
    this.populateCategoryDropdown();
    
    // Show modal
    const modal = new (window as any).bootstrap.Modal(document.getElementById('itemModal'));
    modal.show();
    
    // Attach save handler
    const saveBtn = document.getElementById('saveItemBtn');
    if (saveBtn) {
      saveBtn.onclick = () => this.handleItemSave();
    }
  }

  /**
   * Open edit item form
   */
  openEditItemForm(itemId: string): void {
    const item = this.items.find(i => i._id === itemId);
    if (!item) return;

    // Populate location and category dropdowns first
    this.populateLocationDropdown();
    this.populateCategoryDropdown();

    // Populate form
    (document.getElementById('itemId') as HTMLInputElement).value = item._id || '';
    (document.getElementById('itemName') as HTMLInputElement).value = item.name;
    (document.getElementById('itemCategory') as HTMLSelectElement).value = item.category || '';
    (document.getElementById('itemGroupId') as HTMLInputElement).value = item.groupId || '';
    (document.getElementById('itemDescription') as HTMLTextAreaElement).value = item.description || '';
    (document.getElementById('itemQuantity') as HTMLInputElement).value = item.quantity.toString();
    (document.getElementById('itemLocation') as HTMLSelectElement).value = item.location || '';
    (document.getElementById('itemStatus') as HTMLSelectElement).value = item.status;
    (document.getElementById('itemTags') as HTMLInputElement).value = (item.tags || []).join(', ');
    (document.getElementById('itemImageUrl') as HTMLInputElement).value = item.imageUrl || '';
    
    (document.getElementById('itemModalTitle') as HTMLElement).textContent = 'Edit Item';
    
    // Show modal
    const modal = new (window as any).bootstrap.Modal(document.getElementById('itemModal'));
    modal.show();
    
    // Attach save handler
    const saveBtn = document.getElementById('saveItemBtn');
    if (saveBtn) {
      saveBtn.onclick = () => this.handleItemSave();
    }
  }

  /**
   * Handle item save (create or update)
   */
  async handleItemSave(): Promise<void> {
    const itemId = (document.getElementById('itemId') as HTMLInputElement).value;
    const name = (document.getElementById('itemName') as HTMLInputElement).value;
    const category = (document.getElementById('itemCategory') as HTMLSelectElement).value;
    const groupId = (document.getElementById('itemGroupId') as HTMLInputElement).value;
    const description = (document.getElementById('itemDescription') as HTMLTextAreaElement).value;
    const quantity = parseInt((document.getElementById('itemQuantity') as HTMLInputElement).value);
    const location = (document.getElementById('itemLocation') as HTMLSelectElement).value;
    const status = (document.getElementById('itemStatus') as HTMLSelectElement).value as ItemStatus;
    const tagsInput = (document.getElementById('itemTags') as HTMLInputElement).value;
    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
    const imageUrl = (document.getElementById('itemImageUrl') as HTMLInputElement).value;

    try {
      if (itemId) {
        // Update existing item
        await firestoreService.updateItem(itemId, {
          name,
          category,
          groupId: groupId || undefined,
          description,
          quantity,
          location,
          status,
          tags,
          imageUrl
        });
        this.showSuccess('Item updated successfully');
      } else {
        // Create new item
        await firestoreService.createItem({
          name,
          category,
          groupId: groupId || undefined,
          description,
          quantity,
          location,
          status,
          tags,
          imageUrl: imageUrl || undefined
        });
        this.showSuccess('Item added successfully');
      }

      // Close modal
      const modal = (window as any).bootstrap.Modal.getInstance(document.getElementById('itemModal'));
      modal?.hide();

      // Reload items
      await this.loadItems();
      this.applyFiltersAndSearch();
    } catch (error) {
      console.error('Error saving item:', error);
      this.showError('Failed to save item. Please try again.');
    }
  }

  /**
   * Delete item
   */
  async deleteItem(itemId: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await firestoreService.deleteItem(itemId);
      this.showSuccess('Item deleted successfully');
      await this.loadItems();
      this.applyFiltersAndSearch();
    } catch (error) {
      console.error('Error deleting item:', error);
      this.showError('Failed to delete item. Please try again.');
    }
  }

  /**
   * Get unique locations from items
   */
  getUniqueLocations(): string[] {
    return [...new Set(this.allItems.map(item => item.location))];
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

  /**
   * Populate location dropdown
   */
  private populateLocationDropdown(): void {
    const locationSelect = document.getElementById('itemLocation') as HTMLSelectElement;
    if (!locationSelect) return;

    // Clear existing options except the first one
    locationSelect.innerHTML = '<option value="">Select a location...</option>';

    // Add all active locations
    this.locations.forEach(location => {
      const option = document.createElement('option');
      option.value = location.name;
      option.textContent = location.name;
      locationSelect.appendChild(option);
    });
  }

  /**
   * Populate category dropdown
   */
  private populateCategoryDropdown(): void {
    const categorySelect = document.getElementById('itemCategory') as HTMLSelectElement;
    if (!categorySelect) return;

    // Clear existing options except the first one
    categorySelect.innerHTML = '<option value="">Select a category...</option>';

    // Add all active categories
    this.categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.name;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });
  }
}

export default DashboardComponent;
