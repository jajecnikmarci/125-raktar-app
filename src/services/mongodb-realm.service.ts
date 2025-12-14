/**
 * MongoDB Realm Service
 * Uses MongoDB Realm Web SDK for client-side database access
 * This is the modern replacement for the deprecated Data API
 */

import * as Realm from 'realm-web';
import { Item, Loan, User, ItemStatus, LoanStatus } from '../types/models';

interface MongoDBConfig {
  appId: string;
  clusterName: string;
  databaseName: string;
}

export class MongoDBService {
  private static instance: MongoDBService;
  private config: MongoDBConfig;
  private app: Realm.App;
  private mongodb: Realm.Services.MongoDB | null = null;

  private constructor() {
    this.config = {
      appId: import.meta.env.VITE_MONGODB_REALM_APP_ID,
      clusterName: import.meta.env.VITE_MONGODB_CLUSTER_NAME,
      databaseName: import.meta.env.VITE_MONGODB_DATABASE_NAME,
    };

    // Initialize Realm App
    this.app = new Realm.App({ id: this.config.appId });
  }

  static getInstance(): MongoDBService {
    if (!MongoDBService.instance) {
      MongoDBService.instance = new MongoDBService();
    }
    return MongoDBService.instance;
  }

  /**
   * Authenticate with custom JWT from Firebase
   */
  async authenticateWithFirebase(firebaseToken: string): Promise<void> {
    try {
      // Login using Custom JWT (Firebase token)
      const credentials = Realm.Credentials.jwt(firebaseToken);
      await this.app.logIn(credentials);
      
      this.mongodb = this.app.currentUser?.mongoClient(this.config.clusterName);
      console.log('✓ MongoDB Realm authenticated');
    } catch (error) {
      console.error('MongoDB Realm authentication failed:', error);
      
      // Fallback: Login anonymously for testing
      try {
        const credentials = Realm.Credentials.anonymous();
        await this.app.logIn(credentials);
        this.mongodb = this.app.currentUser?.mongoClient(this.config.clusterName);
        console.warn('⚠️ Using anonymous authentication (for testing only)');
      } catch (anonError) {
        console.error('Anonymous authentication also failed:', anonError);
        throw anonError;
      }
    }
  }

  /**
   * Get MongoDB database instance
   */
  private getDatabase() {
    if (!this.mongodb) {
      throw new Error('MongoDB not initialized. Call authenticateWithFirebase first.');
    }
    return this.mongodb.db(this.config.databaseName);
  }

  // ==================== ITEMS COLLECTION ====================

  async getItems(filter: Partial<Item> = {}): Promise<Item[]> {
    const collection = this.getDatabase().collection<Item>('items');
    return await collection.find(filter, { sort: { name: 1 } });
  }

  async getItemById(id: string): Promise<Item | null> {
    const collection = this.getDatabase().collection<Item>('items');
    return await collection.findOne({ _id: new Realm.BSON.ObjectId(id) } as any);
  }

  async createItem(item: Omit<Item, '_id'>): Promise<string> {
    const collection = this.getDatabase().collection<Item>('items');
    const result = await collection.insertOne({
      ...item,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    return result.insertedId.toString();
  }

  async updateItem(id: string, updates: Partial<Item>): Promise<boolean> {
    const collection = this.getDatabase().collection<Item>('items');
    const result = await collection.updateOne(
      { _id: new Realm.BSON.ObjectId(id) } as any,
      { $set: { ...updates, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  async deleteItem(id: string): Promise<boolean> {
    const collection = this.getDatabase().collection<Item>('items');
    const result = await collection.deleteOne({ _id: new Realm.BSON.ObjectId(id) } as any);
    return result.deletedCount > 0;
  }

  async searchItems(searchTerm: string): Promise<Item[]> {
    const collection = this.getDatabase().collection<Item>('items');
    return await collection.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { tags: { $regex: searchTerm, $options: 'i' } },
      ],
    } as any);
  }

  // ==================== LOANS COLLECTION ====================

  async getLoans(filter: Partial<Loan> = {}): Promise<Loan[]> {
    const collection = this.getDatabase().collection<Loan>('loans');
    return await collection.find(filter, { sort: { requestedAt: -1 } });
  }

  async getLoansByUser(userId: string): Promise<Loan[]> {
    return this.getLoans({ userId });
  }

  async getPendingLoans(): Promise<Loan[]> {
    return this.getLoans({ status: LoanStatus.PENDING });
  }

  async getActiveLoans(): Promise<Loan[]> {
    return this.getLoans({ status: LoanStatus.APPROVED });
  }

  async createLoanRequest(loan: Omit<Loan, '_id' | 'requestedAt' | 'status'>): Promise<string> {
    const collection = this.getDatabase().collection<Loan>('loans');
    const result = await collection.insertOne({
      ...loan,
      status: LoanStatus.PENDING,
      requestedAt: new Date(),
    } as any);
    return result.insertedId.toString();
  }

  async approveLoan(loanId: string, adminId: string): Promise<boolean> {
    const loansCollection = this.getDatabase().collection<Loan>('loans');
    const loan = await this.getLoanById(loanId);
    
    if (!loan) return false;

    // Update loan status
    const loanResult = await loansCollection.updateOne(
      { _id: new Realm.BSON.ObjectId(loanId) } as any,
      {
        $set: {
          status: LoanStatus.APPROVED,
          approvedAt: new Date(),
          approvedBy: adminId,
        },
      }
    );

    // Update item status
    if (loanResult.modifiedCount > 0) {
      await this.updateItem(loan.itemId, { status: ItemStatus.ON_LOAN });
      return true;
    }

    return false;
  }

  async rejectLoan(loanId: string, adminId: string, adminNotes?: string): Promise<boolean> {
    const collection = this.getDatabase().collection<Loan>('loans');
    const result = await collection.updateOne(
      { _id: new Realm.BSON.ObjectId(loanId) } as any,
      {
        $set: {
          status: LoanStatus.REJECTED,
          approvedBy: adminId,
          adminNotes,
        },
      }
    );
    return result.modifiedCount > 0;
  }

  async returnLoan(loanId: string): Promise<boolean> {
    const loansCollection = this.getDatabase().collection<Loan>('loans');
    const loan = await this.getLoanById(loanId);
    
    if (!loan) return false;

    const loanResult = await loansCollection.updateOne(
      { _id: new Realm.BSON.ObjectId(loanId) } as any,
      {
        $set: {
          status: LoanStatus.RETURNED,
          returnedAt: new Date(),
        },
      }
    );

    if (loanResult.modifiedCount > 0) {
      await this.updateItem(loan.itemId, { status: ItemStatus.AVAILABLE });
      return true;
    }

    return false;
  }

  async getLoanById(id: string): Promise<Loan | null> {
    const collection = this.getDatabase().collection<Loan>('loans');
    return await collection.findOne({ _id: new Realm.BSON.ObjectId(id) } as any);
  }

  // ==================== USERS COLLECTION ====================

  async getUserByUid(uid: string): Promise<User | null> {
    const collection = this.getDatabase().collection<User>('users');
    return await collection.findOne({ uid });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const collection = this.getDatabase().collection<User>('users');
    return await collection.findOne({ email });
  }

  async createUser(user: Omit<User, '_id'>): Promise<string> {
    const collection = this.getDatabase().collection<User>('users');
    const result = await collection.insertOne(user as any);
    return result.insertedId.toString();
  }

  async updateUserLastLogin(uid: string): Promise<boolean> {
    const collection = this.getDatabase().collection<User>('users');
    const result = await collection.updateOne(
      { uid },
      { $set: { lastLogin: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  async updateUserRole(uid: string, role: string): Promise<boolean> {
    const collection = this.getDatabase().collection<User>('users');
    const result = await collection.updateOne(
      { uid },
      { $set: { role } }
    );
    return result.modifiedCount > 0;
  }

  async getAllUsers(): Promise<User[]> {
    const collection = this.getDatabase().collection<User>('users');
    return await collection.find({}, { sort: { createdAt: -1 } });
  }
}

export default MongoDBService;
