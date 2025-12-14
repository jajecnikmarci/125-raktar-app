# Firebase Firestore Setup Guide

This guide will help you set up Firebase Firestore for your Inventory Management System.

## Prerequisites

- A Firebase project with Authentication already configured (Google Sign-In)
- Firebase Console access

## Step 1: Enable Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **raktar-app-b8086**
3. In the left sidebar, click on **Firestore Database**
4. Click **Create database**
5. Choose **Start in production mode** (we'll add custom rules next)
6. Select a location (choose closest to your users, e.g., **europe-west3** for Hungary)
7. Click **Enable**

## Step 2: Configure Firestore Security Rules

Security rules control who can read/write to your database.

1. In Firestore Database, go to the **Rules** tab
2. Replace the default rules with the following:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Helper function to check if user is admin
    function isAdmin() {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      // Anyone authenticated can read their own user document
      allow read: if isSignedIn() && request.auth.uid == userId;
      
      // Only the user themselves can create their document (on first login)
      allow create: if isSignedIn() && request.auth.uid == userId;
      
      // Users cannot update their own role, only admins can
      allow update: if isSignedIn() && (
        (request.auth.uid == userId && !('role' in request.resource.data.diff(resource.data).affectedKeys()))
        || isAdmin()
      );
      
      // Only admins can delete users
      allow delete: if isAdmin();
      
      // Admins can read all users
      allow read: if isAdmin();
    }
    
    // Items collection
    match /items/{itemId} {
      // Everyone authenticated can read items
      allow read: if isSignedIn();
      
      // Only admins can create, update, or delete items
      allow create, update, delete: if isAdmin();
    }
    
    // Loans collection
    match /loans/{loanId} {
      // Users can read their own loans, admins can read all
      allow read: if isSignedIn() && (
        resource.data.userId == request.auth.uid || isAdmin()
      );
      
      // Users can create loan requests for themselves
      allow create: if isSignedIn() && 
                      request.resource.data.userId == request.auth.uid &&
                      request.resource.data.status == 'pending';
      
      // Only admins can approve/reject/update loans
      allow update: if isAdmin();
      
      // Only admins can delete loans
      allow delete: if isAdmin();
    }
  }
}
```

3. Click **Publish** to save the rules

### Security Rules Explanation

- **Users Collection**: Users can only read/update their own profile. Admins can manage all users.
- **Items Collection**: Everyone can view items, but only admins can add/edit/delete them.
- **Loans Collection**: Users can see their own loan requests and create new ones. Only admins can approve/reject/manage all loans.

## Step 3: Create Firestore Collections

Firestore creates collections automatically when you add the first document. However, you can create them manually to set up indexes.

### Create Collections

1. In Firestore Database, click **Start collection**
2. Create three collections:
   - `users`
   - `items`
   - `loans`

### Add Sample Data (Optional)

You can add sample data to test the application:

#### Sample Item
Collection: `items`

```json
{
  "name": "Laptop Dell XPS 15",
  "description": "High-performance development laptop",
  "category": "Electronics",
  "quantity": 5,
  "availableQuantity": 5,
  "location": "Office Storage Room A",
  "status": "available",
  "imageUrl": "https://via.placeholder.com/150",
  "createdAt": [Timestamp: Now],
  "updatedAt": [Timestamp: Now]
}
```

## Step 4: Create Composite Indexes

For efficient queries, create these indexes:

### Method 1: Automatic (Recommended)

1. Run your application and perform actions that require queries
2. Firebase will detect missing indexes and show error messages with links
3. Click the provided link to auto-create the index
4. Wait 2-5 minutes for the index to build

### Method 2: Manual

1. Go to **Firestore Database** → **Indexes** tab
2. Click **Create Index**

#### Index 1: Loans by Status and Date
- **Collection**: `loans`
- **Fields**:
  - `status` - Ascending
  - `requestDate` - Descending
- **Query scope**: Collection

#### Index 2: Loans by User and Date
- **Collection**: `loans`
- **Fields**:
  - `userId` - Ascending
  - `requestDate` - Descending
- **Query scope**: Collection

#### Index 3: Items by Name
- **Collection**: `items`
- **Fields**:
  - `name` - Ascending
- **Query scope**: Collection

## Step 5: Test Firestore Connection

1. Make sure your `.env` file has the correct Firebase configuration:

```env
VITE_FIREBASE_API_KEY=AIzaSyCVtQvdEyGfjDJ5lbP83a9UJ_koJftSP90
VITE_FIREBASE_AUTH_DOMAIN=raktar-app-b8086.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=raktar-app-b8086
VITE_FIREBASE_STORAGE_BUCKET=raktar-app-b8086.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=543395083178
VITE_FIREBASE_APP_ID=1:543395083178:web:b0764f72784596b9b2f1d3
```

2. Run your development server:

```bash
npm run dev
```

3. Open the browser console (F12)
4. Sign in with Google
5. You should see:
   - ✓ Firebase configuration loaded
   - ✓ Google authentication successful
   - 🔥 Initializing Firestore...
   - ✓ Firestore connected successfully
   - 📝 Creating new user in Firestore... (on first login)
   - ✓ New user created in Firestore

## Step 6: Verify Database in Firebase Console

1. Go back to Firebase Console → Firestore Database
2. You should see a `users` collection with your user document
3. Check that your user has the correct fields:
   - `uid`: Your Firebase user ID
   - `email`: Your email address
   - `displayName`: Your name
   - `role`: "user" (default for new users)
   - `createdAt`: Timestamp
   - `lastLogin`: Timestamp
   - `isActive`: true

## Step 7: Promote Yourself to Admin

To access admin features, you need to manually change your role:

1. In Firestore Database, navigate to `users` collection
2. Find your user document
3. Click on the document to edit it
4. Change the `role` field from `"user"` to `"admin"`
5. Click **Update**
6. Refresh your app - you should now see the Admin Panel

## Common Issues

### Issue: "Missing or insufficient permissions"

**Solution**: Check your Firestore Security Rules. Make sure they match the rules provided in Step 2.

### Issue: "PERMISSION_DENIED: Missing index"

**Solution**: Click the link in the error message to auto-create the required index, or create it manually in the Indexes tab.

### Issue: "Firestore initialization failed"

**Solution**: 
- Verify your Firebase configuration in `.env`
- Make sure Firestore is enabled in Firebase Console
- Check browser console for detailed error messages

### Issue: User role stays "user" after changing to "admin"

**Solution**: 
- Sign out and sign in again
- Clear browser cache and cookies
- Check that you edited the correct user document in Firestore

## Firestore Pricing

Firebase Firestore has a generous free tier:

### Free Tier Limits (per day)
- **Stored data**: 1 GB
- **Document reads**: 50,000
- **Document writes**: 20,000
- **Document deletes**: 20,000
- **Network egress**: 10 GB/month

For a small inventory management system with 5-10 users:
- Estimated reads/day: ~500-1,000
- Estimated writes/day: ~100-200
- **This is well within the free tier!**

## Next Steps

1. ✅ Firestore is configured
2. ✅ Security rules are set
3. ✅ Your user account is created
4. ✅ You've promoted yourself to admin
5. 🎉 Start using the application!

## Additional Resources

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Pricing Calculator](https://firebase.google.com/pricing)

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify your Firebase configuration
3. Review the Firestore Security Rules
4. Check that indexes are built
5. Ensure your user has the correct role in Firestore
