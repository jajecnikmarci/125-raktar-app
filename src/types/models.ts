/**
 * MongoDB Collections Schema & TypeScript Interfaces
 * 
 * Collections:
 * 1. items - Inventory items
 * 2. loans - Lending records
 * 3. users - User profiles with roles
 */

export enum ItemStatus {
  AVAILABLE = 'available',
  ON_LOAN = 'on_loan',
  MAINTENANCE = 'maintenance',
  RETIRED = 'retired'
}

export enum LoanStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  RETURNED = 'returned',
  OVERDUE = 'overdue'
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

/**
 * Location Interface
 * Represents a storage location that can be managed
 */
export interface Location {
  _id?: string;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isActive: boolean;
}

/**
 * Category Interface
 * Represents an item category that can be managed
 */
export interface Category {
  _id?: string;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isActive: boolean;
}

/**
 * Item Interface
 * Represents an inventory item
 */
export interface Item {
  _id?: string;
  name: string;
  location: string; // Now references Location.name
  category?: string; // Now references Category.name
  quantity: number;
  tags: string[];
  description: string;
  status: ItemStatus;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string; // User ID
  imageUrl?: string;
}

/**
 * Loan Interface
 * Represents a lending transaction
 */
export interface Loan {
  _id?: string;
  itemId: string; // Reference to Item._id
  itemName: string; // Denormalized for quick display
  userId: string; // User who requested/borrowed
  userEmail: string; // Denormalized
  userName: string; // Denormalized
  quantity: number; // How many units borrowed
  status: LoanStatus;
  requestedAt: Date;
  approvedAt?: Date;
  approvedBy?: string; // Admin user ID
  returnedAt?: Date;
  expectedReturnDate?: Date;
  notes?: string;
  adminNotes?: string; // Admin-only notes
}

/**
 * User Interface
 * Represents a user profile
 */
export interface User {
  _id?: string;
  uid: string; // Firebase UID
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

/**
 * MongoDB Collection Schemas (for reference when creating in Atlas)
 * 
 * ITEMS COLLECTION:
 * {
 *   "_id": { "$oid": "..." },
 *   "name": "string",
 *   "location": "string",
 *   "quantity": { "$numberInt": "0" },
 *   "tags": ["string"],
 *   "description": "string",
 *   "status": "available|on_loan|maintenance|retired",
 *   "createdAt": { "$date": "..." },
 *   "updatedAt": { "$date": "..." },
 *   "createdBy": "string",
 *   "imageUrl": "string"
 * }
 * 
 * Indexes:
 * - { name: 1 }
 * - { status: 1 }
 * - { tags: 1 }
 * 
 * LOANS COLLECTION:
 * {
 *   "_id": { "$oid": "..." },
 *   "itemId": "string",
 *   "itemName": "string",
 *   "userId": "string",
 *   "userEmail": "string",
 *   "userName": "string",
 *   "quantity": { "$numberInt": "0" },
 *   "status": "pending|approved|rejected|returned|overdue",
 *   "requestedAt": { "$date": "..." },
 *   "approvedAt": { "$date": "..." },
 *   "approvedBy": "string",
 *   "returnedAt": { "$date": "..." },
 *   "expectedReturnDate": { "$date": "..." },
 *   "notes": "string",
 *   "adminNotes": "string"
 * }
 * 
 * Indexes:
 * - { itemId: 1 }
 * - { userId: 1 }
 * - { status: 1 }
 * - { requestedAt: -1 }
 * 
 * USERS COLLECTION:
 * {
 *   "_id": { "$oid": "..." },
 *   "uid": "string",
 *   "email": "string",
 *   "displayName": "string",
 *   "photoURL": "string",
 *   "role": "admin|user",
 *   "createdAt": { "$date": "..." },
 *   "lastLogin": { "$date": "..." },
 *   "isActive": { "$boolean": true }
 * }
 * 
 * Indexes:
 * - { uid: 1 } (unique)
 * - { email: 1 } (unique)
 * - { role: 1 }
 */
