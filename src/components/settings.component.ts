/**
 * Settings Component
 * 
 * Admin panel for managing locations and categories
 */

import { firestoreService } from '../services/firestore.service';
import { getAuthService } from '../services/auth.service';
import type { Location, Category } from '../types/models';

export class SettingsComponent {
  private locations: Location[] = [];
  private categories: Category[] = [];
  private container: HTMLElement;

  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Container ${containerId} not found`);
    }
    this.container = element;
    (window as any).settingsComponent = this; // Make it available globally
  }

  /**
   * Initialize the settings panel
   */
  async init(): Promise<void> {
    const authService = getAuthService();
    const isAdmin = authService.isAdmin();

    if (!isAdmin) {
      this.container.innerHTML = `
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle"></i>
          Access denied. Admin privileges required.
        </div>
      `;
      return;
    }

    await Promise.all([
      this.loadLocations(),
      this.loadCategories()
    ]);

    this.render();
    this.setupEventListeners();
  }

  /**
   * Load locations from Firestore
   */
  private async loadLocations(): Promise<void> {
    try {
      this.locations = await firestoreService.getLocations(true); // Include inactive
    } catch (error) {
      console.error('Error loading locations:', error);
      this.showToast('Failed to load locations', 'danger');
    }
  }

  /**
   * Load categories from Firestore
   */
  private async loadCategories(): Promise<void> {
    try {
      this.categories = await firestoreService.getCategories(true); // Include inactive
    } catch (error) {
      console.error('Error loading categories:', error);
      this.showToast('Failed to load categories', 'danger');
    }
  }

  /**
   * Render the settings panel
   */
  private render(): void {
    this.container.innerHTML = `
      <div class="container-fluid py-4">
        <h2 class="mb-4">
          <i class="bi bi-gear"></i> Settings
        </h2>

        <!-- Tabs -->
        <ul class="nav nav-tabs mb-4" id="settingsTabs" role="tablist">
          <li class="nav-item" role="presentation">
            <button class="nav-link active" id="locations-tab" data-bs-toggle="tab" data-bs-target="#locations" type="button" role="tab">
              <i class="bi bi-geo-alt"></i> Locations
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" id="categories-tab" data-bs-toggle="tab" data-bs-target="#categories" type="button" role="tab">
              <i class="bi bi-tags"></i> Categories
            </button>
          </li>
        </ul>

        <!-- Tab Content -->
        <div class="tab-content" id="settingsTabContent">
          <!-- Locations Tab -->
          <div class="tab-pane fade show active" id="locations" role="tabpanel">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h4>Manage Locations</h4>
              <button class="btn btn-primary" id="addLocationBtn">
                <i class="bi bi-plus-circle"></i> Add Location
              </button>
            </div>
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="locationsTableBody">
                  ${this.renderLocationsTable()}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Categories Tab -->
          <div class="tab-pane fade" id="categories" role="tabpanel">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h4>Manage Categories</h4>
              <button class="btn btn-primary" id="addCategoryBtn">
                <i class="bi bi-plus-circle"></i> Add Category
              </button>
            </div>
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="categoriesTableBody">
                  ${this.renderCategoriesTable()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render locations table rows
   */
  private renderLocationsTable(): string {
    if (this.locations.length === 0) {
      return `
        <tr>
          <td colspan="5" class="text-center text-muted">
            No locations found. Click "Add Location" to create one.
          </td>
        </tr>
      `;
    }

    return this.locations.map(location => `
      <tr>
        <td><strong>${this.escapeHtml(location.name)}</strong></td>
        <td>${this.escapeHtml(location.description || '-')}</td>
        <td>
          <span class="badge bg-${location.isActive ? 'success' : 'secondary'}">
            ${location.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>${location.createdAt ? new Date(location.createdAt).toLocaleDateString() : '-'}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="window.settingsComponent.editLocation('${location._id}')">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-${location.isActive ? 'danger' : 'success'}" onclick="window.settingsComponent.toggleLocation('${location._id}', ${!location.isActive})">
            <i class="bi bi-${location.isActive ? 'trash' : 'arrow-clockwise'}"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  /**
   * Render categories table rows
   */
  private renderCategoriesTable(): string {
    if (this.categories.length === 0) {
      return `
        <tr>
          <td colspan="5" class="text-center text-muted">
            No categories found. Click "Add Category" to create one.
          </td>
        </tr>
      `;
    }

    return this.categories.map(category => `
      <tr>
        <td><strong>${this.escapeHtml(category.name)}</strong></td>
        <td>${this.escapeHtml(category.description || '-')}</td>
        <td>
          <span class="badge bg-${category.isActive ? 'success' : 'secondary'}">
            ${category.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>${category.createdAt ? new Date(category.createdAt).toLocaleDateString() : '-'}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="window.settingsComponent.editCategory('${category._id}')">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-${category.isActive ? 'danger' : 'success'}" onclick="window.settingsComponent.toggleCategory('${category._id}', ${!category.isActive})">
            <i class="bi bi-${category.isActive ? 'trash' : 'arrow-clockwise'}"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners(): void {
    document.getElementById('addLocationBtn')?.addEventListener('click', () => this.openLocationModal());
    document.getElementById('addCategoryBtn')?.addEventListener('click', () => this.openCategoryModal());
    document.getElementById('saveLocationBtn')?.addEventListener('click', () => this.handleLocationSave());
    document.getElementById('saveCategoryBtn')?.addEventListener('click', () => this.handleCategorySave());
  }

  /**
   * Open location modal (add or edit)
   */
  openLocationModal(locationId?: string): void {
    const modal = document.getElementById('locationModal');
    const title = document.getElementById('locationModalTitle');
    const form = document.getElementById('locationForm') as HTMLFormElement;
    
    if (title) {
      title.textContent = locationId ? 'Edit Location' : 'Add New Location';
    }

    // Reset form
    form?.reset();
    (document.getElementById('locationId') as HTMLInputElement).value = '';

    // If editing, populate form
    if (locationId) {
      const location = this.locations.find(l => l._id === locationId);
      if (location) {
        (document.getElementById('locationId') as HTMLInputElement).value = location._id!;
        (document.getElementById('locationName') as HTMLInputElement).value = location.name;
        (document.getElementById('locationDescription') as HTMLTextAreaElement).value = location.description || '';
      }
    }

    // Show modal
    const bsModal = new (window as any).bootstrap.Modal(modal);
    bsModal.show();
  }

  /**
   * Open category modal (add or edit)
   */
  openCategoryModal(categoryId?: string): void {
    const modal = document.getElementById('categoryModal');
    const title = document.getElementById('categoryModalTitle');
    const form = document.getElementById('categoryForm') as HTMLFormElement;
    
    if (title) {
      title.textContent = categoryId ? 'Edit Category' : 'Add New Category';
    }

    // Reset form
    form?.reset();
    (document.getElementById('categoryId') as HTMLInputElement).value = '';

    // If editing, populate form
    if (categoryId) {
      const category = this.categories.find(c => c._id === categoryId);
      if (category) {
        (document.getElementById('categoryId') as HTMLInputElement).value = category._id!;
        (document.getElementById('categoryName') as HTMLInputElement).value = category.name;
        (document.getElementById('categoryDescription') as HTMLTextAreaElement).value = category.description || '';
      }
    }

    // Show modal
    const bsModal = new (window as any).bootstrap.Modal(modal);
    bsModal.show();
  }

  /**
   * Handle location save (create or update)
   */
  async handleLocationSave(): Promise<void> {
    const locationId = (document.getElementById('locationId') as HTMLInputElement).value;
    const name = (document.getElementById('locationName') as HTMLInputElement).value.trim();
    const description = (document.getElementById('locationDescription') as HTMLTextAreaElement).value.trim();

    if (!name) {
      this.showToast('Please enter a location name', 'warning');
      return;
    }

    try {
      if (locationId) {
        // Update existing
        await firestoreService.updateLocation(locationId, { name, description });
        this.showToast('Location updated successfully!', 'success');
      } else {
        // Create new
        await firestoreService.createLocation({ name, description, isActive: true });
        this.showToast('Location created successfully!', 'success');
      }

      // Close modal
      const modal = (window as any).bootstrap.Modal.getInstance(document.getElementById('locationModal'));
      modal?.hide();

      // Reload and re-render
      await this.loadLocations();
      this.updateLocationsTable();
    } catch (error) {
      console.error('Error saving location:', error);
      this.showToast('Failed to save location', 'danger');
    }
  }

  /**
   * Handle category save (create or update)
   */
  async handleCategorySave(): Promise<void> {
    const categoryId = (document.getElementById('categoryId') as HTMLInputElement).value;
    const name = (document.getElementById('categoryName') as HTMLInputElement).value.trim();
    const description = (document.getElementById('categoryDescription') as HTMLTextAreaElement).value.trim();

    if (!name) {
      this.showToast('Please enter a category name', 'warning');
      return;
    }

    try {
      if (categoryId) {
        // Update existing
        await firestoreService.updateCategory(categoryId, { name, description });
        this.showToast('Category updated successfully!', 'success');
      } else {
        // Create new
        await firestoreService.createCategory({ name, description, isActive: true });
        this.showToast('Category created successfully!', 'success');
      }

      // Close modal
      const modal = (window as any).bootstrap.Modal.getInstance(document.getElementById('categoryModal'));
      modal?.hide();

      // Reload and re-render
      await this.loadCategories();
      this.updateCategoriesTable();
    } catch (error) {
      console.error('Error saving category:', error);
      this.showToast('Failed to save category', 'danger');
    }
  }

  /**
   * Edit location
   */
  editLocation(locationId: string): void {
    this.openLocationModal(locationId);
  }

  /**
   * Edit category
   */
  editCategory(categoryId: string): void {
    this.openCategoryModal(categoryId);
  }

  /**
   * Toggle location active status
   */
  async toggleLocation(locationId: string, activate: boolean): Promise<void> {
    const action = activate ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${action} this location?`)) {
      return;
    }

    try {
      await firestoreService.updateLocation(locationId, { isActive: activate });
      this.showToast(`Location ${action}d successfully!`, 'success');
      
      await this.loadLocations();
      this.updateLocationsTable();
    } catch (error) {
      console.error(`Error ${action}ing location:`, error);
      this.showToast(`Failed to ${action} location`, 'danger');
    }
  }

  /**
   * Toggle category active status
   */
  async toggleCategory(categoryId: string, activate: boolean): Promise<void> {
    const action = activate ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${action} this category?`)) {
      return;
    }

    try {
      await firestoreService.updateCategory(categoryId, { isActive: activate });
      this.showToast(`Category ${action}d successfully!`, 'success');
      
      await this.loadCategories();
      this.updateCategoriesTable();
    } catch (error) {
      console.error(`Error ${action}ing category:`, error);
      this.showToast(`Failed to ${action} category`, 'danger');
    }
  }

  /**
   * Update locations table
   */
  private updateLocationsTable(): void {
    const tbody = document.getElementById('locationsTableBody');
    if (tbody) {
      tbody.innerHTML = this.renderLocationsTable();
    }
  }

  /**
   * Update categories table
   */
  private updateCategoriesTable(): void {
    const tbody = document.getElementById('categoriesTableBody');
    if (tbody) {
      tbody.innerHTML = this.renderCategoriesTable();
    }
  }

  /**
   * Show Bootstrap toast notification
   */
  private showToast(message: string, type: 'success' | 'danger' | 'warning' | 'info' = 'info'): void {
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

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
