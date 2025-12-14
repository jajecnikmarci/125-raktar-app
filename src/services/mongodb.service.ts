/**
 * MongoDB Data API Service
 * Handles all CRUD operations with MongoDB Atlas via Data API
 * 
 * SECURITY NOTE: In production, consider using MongoDB App Services (Realm)
 * with server-side rules to avoid exposing API keys client-side.
 * For GitHub Pages deployment, API key is necessary but should have restricted permissions.
 */

import { Item, Loan, User, ItemStatus, LoanStatus } from '../types/models';

interface MongoDBConfig {
  dataApiUrl: string;
  apiKey: string;
  clusterName: string;
  databaseName: string;
}

interface MongoDBResponse<T> {
  document?: T;
  documents?: T[];
  insertedId?: string;
  matchedCount?: number;
  modifiedCount?: number;
  deletedCount?: number;
}

export class MongoDBService {
  private static instance: MongoDBService;
  private config: MongoDBConfig;

  private constructor() {
    this.config = {
      dataApiUrl: import.meta.env.VITE_MONGODB_DATA_API_URL,
      apiKey: import.meta.env.VITE_MONGODB_API_KEY,
      clusterName: import.meta.env.VITE_MONGODB_CLUSTER_NAME,
      databaseName: import.meta.env.VITE_MONGODB_DATABASE_NAME,
    };
  }

  static getInstance(): MongoDBService {
    if (!MongoDBService.instance) {
      MongoDBService.instance = new MongoDBService();
    }
    return MongoDBService.instance;
  }

  /**
   * Generic method to call MongoDB Data API
   */
  private async callDataAPI<T>(
    action: string,
    collection: string,
    data: any
  ): Promise<MongoDBResponse<T>> {
    const url = `${this.config.dataApiUrl}/action/${action}`;
    
    const payload = {
      dataSource: this.config.clusterName,
      database: this.config.databaseName,
      collection,
      ...data,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MongoDB API Error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('MongoDB API call failed:', error);
      throw error;
    }
  }

  // ==================== ITEMS COLLECTION ====================

  /**
   * Get all items
   */
  async getItems(filter: Partial<Item> = {}): Promise<Item[]> {
    const response = await this.callDataAPI<Item>('find', 'items', {
      filter,
      sort: { name: 1 },
    });
    return response.documents || [];
  }

  /**
   * Get item by ID
   */
  async getItemById(id: string): Promise<Item | null> {
    const response = await this.callDataAPI<Item>('findOne', 'items', {
      filter: { _id: { $oid: id } },
    });
    return response.document || null;
  }

  /**
   * Create new item
   */
  async createItem(item: Omit<Item, '_id'>): Promise<string> {
    const itemWithTimestamps = {
      ...item,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const response = await this.callDataAPI<Item>('insertOne', 'items', {
      document: itemWithTimestamps,
    });
    return response.insertedId || '';
  }

  /**
   * Update item
   */
  async updateItem(id: string, updates: Partial<Item>): Promise<boolean> {
    const response = await this.callDataAPI<Item>('updateOne', 'items', {
      filter: { _id: { $oid: id } },
      update: {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
    });
    return (response.modifiedCount || 0) > 0;
  }

  /**
   * Delete item
   */
  async deleteItem(id: string): Promise<boolean> {
    const response = await this.callDataAPI<Item>('deleteOne', 'items', {
      filter: { _id: { $oid: id } },
    });
    return (response.deletedCount || 0) > 0;
  }

  /**
   * Search items by tags or name
   */
  async searchItems(searchTerm: string): Promise<Item[]> {
    const response = await this.callDataAPI<Item>('find', 'items', {
      filter: {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { tags: { $in: [new RegExp(searchTerm, 'i')] } },
        ],
      },
    });
    return response.documents || [];
  }

  // ==================== LOANS COLLECTION ====================

  /**
   * Get all loans
   */
  async getLoans(filter: Partial<Loan> = {}): Promise<Loan[]> {
    const response = await this.callDataAPI<Loan>('find', 'loans', {
      filter,
      sort: { requestedAt: -1 },
    });
    return response.documents || [];
  }

  /**
   * Get loans by user
   */
  async getLoansByUser(userId: string): Promise<Loan[]> {
    return this.getLoans({ userId });
  }

  /**
   * Get pending loan requests (for admin)
   */
  async getPendingLoans(): Promise<Loan[]> {
    return this.getLoans({ status: LoanStatus.PENDING });
  }

  /**
   * Get active loans (approved but not returned)
   */
  async getActiveLoans(): Promise<Loan[]> {
    return this.getLoans({ status: LoanStatus.APPROVED });
  }

  /**
   * Create loan request
   */
  async createLoanRequest(loan: Omit<Loan, '_id' | 'requestedAt' | 'status'>): Promise<string> {
    const loanRequest = {
      ...loan,
      status: LoanStatus.PENDING,
      requestedAt: new Date(),
    };

    const response = await this.callDataAPI<Loan>('insertOne', 'loans', {
      document: loanRequest,
    });
    return response.insertedId || '';
  }

  /**
   * Approve loan request
   */
  async approveLoan(loanId: string, adminId: string): Promise<boolean> {
    const loan = await this.getLoanById(loanId);
    if (!loan) return false;

    // Update loan status
    const loanUpdated = await this.callDataAPI<Loan>('updateOne', 'loans', {
      filter: { _id: { $oid: loanId } },
      update: {
        $set: {
          status: LoanStatus.APPROVED,
          approvedAt: new Date(),
          approvedBy: adminId,
        },
      },
    });

    // Update item status to ON_LOAN
    if ((loanUpdated.modifiedCount || 0) > 0) {
      await this.updateItem(loan.itemId, { status: ItemStatus.ON_LOAN });
      return true;
    }

    return false;
  }

  /**
   * Reject loan request
   */
  async rejectLoan(loanId: string, adminId: string, adminNotes?: string): Promise<boolean> {
    const response = await this.callDataAPI<Loan>('updateOne', 'loans', {
      filter: { _id: { $oid: loanId } },
      update: {
        $set: {
          status: LoanStatus.REJECTED,
          approvedBy: adminId,
          adminNotes,
        },
      },
    });
    return (response.modifiedCount || 0) > 0;
  }

  /**
   * Mark loan as returned
   */
  async returnLoan(loanId: string): Promise<boolean> {
    const loan = await this.getLoanById(loanId);
    if (!loan) return false;

    // Update loan status
    const loanUpdated = await this.callDataAPI<Loan>('updateOne', 'loans', {
      filter: { _id: { $oid: loanId } },
      update: {
        $set: {
          status: LoanStatus.RETURNED,
          returnedAt: new Date(),
        },
      },
    });

    // Update item status back to AVAILABLE
    if ((loanUpdated.modifiedCount || 0) > 0) {
      await this.updateItem(loan.itemId, { status: ItemStatus.AVAILABLE });
      return true;
    }

    return false;
  }

  /**
   * Get loan by ID
   */
  async getLoanById(id: string): Promise<Loan | null> {
    const response = await this.callDataAPI<Loan>('findOne', 'loans', {
      filter: { _id: { $oid: id } },
    });
    return response.document || null;
  }

  // ==================== USERS COLLECTION ====================

  /**
   * Get user by Firebase UID
   */
  async getUserByUid(uid: string): Promise<User | null> {
    const response = await this.callDataAPI<User>('findOne', 'users', {
      filter: { uid },
    });
    return response.document || null;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const response = await this.callDataAPI<User>('findOne', 'users', {
      filter: { email },
    });
    return response.document || null;
  }

  /**
   * Create new user
   */
  async createUser(user: Omit<User, '_id'>): Promise<string> {
    const response = await this.callDataAPI<User>('insertOne', 'users', {
      document: user,
    });
    return response.insertedId || '';
  }

  /**
   * Update user last login
   */
  async updateUserLastLogin(uid: string): Promise<boolean> {
    const response = await this.callDataAPI<User>('updateOne', 'users', {
      filter: { uid },
      update: {
        $set: {
          lastLogin: new Date(),
        },
      },
    });
    return (response.modifiedCount || 0) > 0;
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(uid: string, role: string): Promise<boolean> {
    const response = await this.callDataAPI<User>('updateOne', 'users', {
      filter: { uid },
      update: {
        $set: { role },
      },
    });
    return (response.modifiedCount || 0) > 0;
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(): Promise<User[]> {
    const response = await this.callDataAPI<User>('find', 'users', {
      filter: {},
      sort: { createdAt: -1 },
    });
    return response.documents || [];
  }
}

export default MongoDBService;
