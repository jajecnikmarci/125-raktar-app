import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  Firestore
} from 'firebase/firestore';
import type { Item, Loan, User } from '../types/models';

class FirestoreService {
  private db: Firestore | null = null;
  private initialized = false;
  
  /**
   * Get Firestore instance (lazy initialization)
   */
  private async getDb(): Promise<Firestore> {
    if (!this.db) {
      // Dynamic import to avoid circular dependency
      const authModule = await import('./auth.service');
      this.db = getFirestore(authModule.app);
    }
    return this.db;
  }

  /**
   * Initialize Firestore connection
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      console.log('🔥 Initializing Firestore...');
      // Test connection by attempting to read from a collection
      const db = await this.getDb();
      const testCollection = collection(db, 'items');
      await getDocs(query(testCollection, where('__name__', '==', 'non-existent-doc')));
      
      this.initialized = true;
      console.log('✓ Firestore connected successfully');
    } catch (error: any) {
      console.error('❌ Firestore initialization failed:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      
      // Provide specific guidance based on error
      if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
        throw new Error('Firestore permission denied. Please set up Security Rules in Firebase Console. See FIRESTORE_SETUP.md');
      } else if (error?.code === 'unavailable' || error?.message?.includes('UNAVAILABLE')) {
        throw new Error('Firestore is not enabled. Please enable Firestore Database in Firebase Console.');
      } else {
        throw new Error(`Failed to connect to Firestore: ${error?.message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Check if Firestore is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  // ==================== ITEM OPERATIONS ====================

  /**
   * Get all items from inventory
   */
  async getItems(): Promise<Item[]> {
    try {
      const db = await this.getDb();
      const itemsCol = collection(db, 'items');
      const itemsSnapshot = await getDocs(query(itemsCol, orderBy('name')));
      
      const items = itemsSnapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
      })) as Item[];

      console.log(`✓ Fetched ${items.length} items from Firestore`);
      return items;
    } catch (error: any) {
      console.error('Error fetching items:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      
      if (error?.code === 'permission-denied') {
        console.error('💡 Fix: Update Firestore Security Rules in Firebase Console');
      } else if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
        console.error('💡 Fix: Create required index (click the link in the error above)');
      }
      
      throw error;
    }
  }

  /**
   * Get a single item by ID
   */
  async getItem(itemId: string): Promise<Item | null> {
    try {
      const db = await this.getDb();
      const itemDoc = doc(db, 'items', itemId);
      const itemSnapshot = await getDoc(itemDoc);
      
      if (!itemSnapshot.exists()) {
        return null;
      }

      const data = itemSnapshot.data();
      return {
        _id: itemSnapshot.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date()
      } as Item;
    } catch (error) {
      console.error('Error fetching item:', error);
      throw error;
    }
  }

  /**
   * Create a new item
   */
  async createItem(item: Omit<Item, '_id' | 'createdAt' | 'updatedAt'>): Promise<Item> {
    try {
      const db = await this.getDb();
      const itemsCol = collection(db, 'items');
      const now = Timestamp.now();
      
      // Remove undefined values (Firestore doesn't support them)
      const cleanItem: any = { ...item };
      Object.keys(cleanItem).forEach(key => {
        if (cleanItem[key] === undefined) {
          delete cleanItem[key];
        }
      });
      
      const newItem = {
        ...cleanItem,
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(itemsCol, newItem);
      
      console.log('✓ Item created:', docRef.id);
      
      return {
        _id: docRef.id,
        ...item,
        createdAt: now.toDate(),
        updatedAt: now.toDate()
      };
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  }

  /**
   * Update an existing item
   */
  async updateItem(itemId: string, updates: Partial<Omit<Item, '_id' | 'createdAt'>>): Promise<void> {
    try {
      const db = await this.getDb();
      const itemDoc = doc(db, 'items', itemId);
      
      // Remove undefined values (Firestore doesn't support them)
      const cleanUpdates: any = { ...updates };
      Object.keys(cleanUpdates).forEach(key => {
        if (cleanUpdates[key] === undefined) {
          delete cleanUpdates[key];
        }
      });
      
      await updateDoc(itemDoc, {
        ...cleanUpdates,
        updatedAt: Timestamp.now()
      });
      
      console.log('✓ Item updated:', itemId);
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  }

  /**
   * Delete an item
   */
  async deleteItem(itemId: string): Promise<void> {
    try {
      const db = await this.getDb();
      const itemDoc = doc(db, 'items', itemId);
      await deleteDoc(itemDoc);
      
      console.log('✓ Item deleted:', itemId);
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  }

  // ==================== LOAN OPERATIONS ====================

  /**
   * Get all loans, optionally filtered by status
   */
  async getLoans(status?: Loan['status']): Promise<Loan[]> {
    try {
      const db = await this.getDb();
      const loansCol = collection(db, 'loans');
      
      let loansQuery;
      if (status) {
        loansQuery = query(loansCol, where('status', '==', status), orderBy('requestedAt', 'desc'));
      } else {
        loansQuery = query(loansCol, orderBy('requestedAt', 'desc'));
      }
      
      const loansSnapshot = await getDocs(loansQuery);
      
      const loans = loansSnapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data(),
        requestedAt: doc.data().requestedAt?.toDate?.() || new Date(),
        approvedAt: doc.data().approvedAt?.toDate?.() || null,
        returnedAt: doc.data().returnedAt?.toDate?.() || null,
        expectedReturnDate: doc.data().expectedReturnDate?.toDate?.() || null
      })) as Loan[];

      console.log(`✓ Fetched ${loans.length} loans from Firestore`);
      return loans;
    } catch (error) {
      console.error('Error fetching loans:', error);
      throw error;
    }
  }

  /**
   * Get loans for a specific user
   */
  async getUserLoans(userId: string): Promise<Loan[]> {
    try {
      const db = await this.getDb();
      const loansCol = collection(db, 'loans');
      const loansQuery = query(
        loansCol, 
        where('userId', '==', userId),
        orderBy('requestedAt', 'desc')
      );
      
      const loansSnapshot = await getDocs(loansQuery);
      
      const loans = loansSnapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data(),
        requestedAt: doc.data().requestedAt?.toDate?.() || new Date(),
        approvedAt: doc.data().approvedAt?.toDate?.() || null,
        returnedAt: doc.data().returnedAt?.toDate?.() || null,
        expectedReturnDate: doc.data().expectedReturnDate?.toDate?.() || null
      })) as Loan[];

      return loans;
    } catch (error) {
      console.error('Error fetching user loans:', error);
      throw error;
    }
  }

  /**
   * Create a new loan request
   */
  async createLoan(loan: Omit<Loan, '_id' | 'requestedAt'>): Promise<Loan> {
    try {
      const db = await this.getDb();
      const loansCol = collection(db, 'loans');
      const now = Timestamp.now();
      
      // Remove undefined values (Firestore doesn't support them)
      const cleanLoan: any = { ...loan };
      Object.keys(cleanLoan).forEach(key => {
        if (cleanLoan[key] === undefined) {
          delete cleanLoan[key];
        }
      });
      
      const newLoan = {
        ...cleanLoan,
        requestedAt: now,
        status: 'pending' as const
      };

      const docRef = await addDoc(loansCol, newLoan);
      
      console.log('✓ Loan created:', docRef.id);
      
      return {
        _id: docRef.id,
        ...loan,
        requestedAt: now.toDate(),
        status: 'pending'
      };
    } catch (error) {
      console.error('Error creating loan:', error);
      throw error;
    }
  }

  /**
   * Approve a loan request
   */
  async approveLoan(loanId: string, adminId: string): Promise<void> {
    try {
      const db = await this.getDb();
      const loanDoc = doc(db, 'loans', loanId);
      
      await updateDoc(loanDoc, {
        status: 'approved',
        approvedBy: adminId,
        approvedAt: Timestamp.now()
      });
      
      console.log('✓ Loan approved:', loanId);
    } catch (error) {
      console.error('Error approving loan:', error);
      throw error;
    }
  }

  /**
   * Reject a loan request
   */
  async rejectLoan(loanId: string, adminId: string, reason?: string): Promise<void> {
    try {
      const db = await this.getDb();
      const loanDoc = doc(db, 'loans', loanId);
      
      const updates: any = {
        status: 'rejected',
        approvedBy: adminId,
        approvedAt: Timestamp.now()
      };
      
      if (reason) {
        updates.rejectionReason = reason;
      }
      
      await updateDoc(loanDoc, updates);
      
      console.log('✓ Loan rejected:', loanId);
    } catch (error) {
      console.error('Error rejecting loan:', error);
      throw error;
    }
  }

  /**
   * Mark a loan as returned
   */
  async returnLoan(loanId: string): Promise<void> {
    try {
      const db = await this.getDb();
      const loanDoc = doc(db, 'loans', loanId);
      
      await updateDoc(loanDoc, {
        status: 'returned',
        returnedAt: Timestamp.now()
      });
      
      console.log('✓ Loan returned:', loanId);
    } catch (error) {
      console.error('Error returning loan:', error);
      throw error;
    }
  }

  // ==================== USER OPERATIONS ====================

  /**
   * Get user by Firebase UID (uses UID as document ID)
   */
  async getUserByUid(uid: string): Promise<User | null> {
    try {
      const db = await this.getDb();
      const userDoc = doc(db, 'users', uid); // Use UID as document ID
      const userSnapshot = await getDoc(userDoc);
      
      if (!userSnapshot.exists()) {
        return null;
      }

      const data = userSnapshot.data();
      
      return {
        _id: userSnapshot.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date()
      } as User;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  /**
   * Create a new user (uses UID as document ID)
   */
  async createUser(user: Omit<User, '_id' | 'createdAt'>): Promise<User> {
    try {
      const db = await this.getDb();
      const userDoc = doc(db, 'users', user.uid); // Use UID as document ID
      const now = Timestamp.now();
      
      const newUser = {
        ...user,
        createdAt: now
      };

      // Use setDoc to create document with specific ID
      const { setDoc } = await import('firebase/firestore');
      await setDoc(userDoc, newUser);
      
      console.log('✓ User created:', user.uid);
      
      return {
        _id: user.uid,
        ...user,
        createdAt: now.toDate()
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, role: 'admin' | 'user'): Promise<void> {
    try {
      const db = await this.getDb();
      const userDoc = doc(db, 'users', userId);
      
      await updateDoc(userDoc, {
        role: role
      });
      
      console.log('✓ User role updated:', userId, role);
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const db = await this.getDb();
      const usersCol = collection(db, 'users');
      const usersSnapshot = await getDocs(query(usersCol, orderBy('email')));
      
      const users = usersSnapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      })) as User[];

      console.log(`✓ Fetched ${users.length} users from Firestore`);
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }
}

export const firestoreService = new FirestoreService();
