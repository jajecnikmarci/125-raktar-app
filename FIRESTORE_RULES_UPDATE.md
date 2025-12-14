# 🚨 Firestore Security Rules Frissítés Szükséges

## Probléma

A következő hibákat látod a konzolban:

```
Error fetching locations: FirebaseError: Missing or insufficient permissions.
Error fetching categories: FirebaseError: Missing or insufficient permissions.
```

## Megoldás - 5 perc

### 1. Lépés: Nyisd meg a Firebase Console-t

🔗 [Firebase Console - Firestore Rules](https://console.firebase.google.com/project/raktar-app-b8086/firestore/rules)

### 2. Lépés: Frissítsd a Security Rules-t

A **Rules** fülön add hozzá ezt a két új collection-t a meglévő szabályokhoz (a `}` előtt, a `loans` szabályok után):

```javascript
    // Locations collection (for dynamic location management)
    match /locations/{locationId} {
      // Everyone authenticated can read locations
      allow read: if isSignedIn();
      
      // Only admins can create, update, or delete locations
      allow create, update, delete: if isAdmin();
    }
    
    // Categories collection (for dynamic category management)
    match /categories/{categoryId} {
      // Everyone authenticated can read categories
      allow read: if isSignedIn();
      
      // Only admins can create, update, or delete categories
      allow create, update, delete: if isAdmin();
    }
```

### 3. Lépés: Publikáld a változtatásokat

1. Kattints a **Publish** gombra
2. Várj 5-10 másodpercet
3. Frissítsd az alkalmazást (F5)

## Teljes Security Rules (ha biztos akarsz lenni)

<details>
<summary>Kattints ide a teljes rules kódért</summary>

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
      allow read: if isSignedIn() && request.auth.uid == userId;
      allow create: if isSignedIn() && request.auth.uid == userId;
      allow update: if isSignedIn() && (
        (request.auth.uid == userId && !('role' in request.resource.data.diff(resource.data).affectedKeys()))
        || isAdmin()
      );
      allow delete: if isAdmin();
      allow read: if isAdmin();
    }
    
    // Items collection
    match /items/{itemId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isAdmin();
    }
    
    // Loans collection
    match /loans/{loanId} {
      allow read: if isSignedIn() && (
        resource.data.userId == request.auth.uid || isAdmin()
      );
      allow create: if isSignedIn() && 
                      request.resource.data.userId == request.auth.uid &&
                      request.resource.data.status == 'pending';
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
    
    // Locations collection (for dynamic location management)
    match /locations/{locationId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isAdmin();
    }
    
    // Categories collection (for dynamic category management)
    match /categories/{categoryId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isAdmin();
    }
  }
}
```

</details>

## Ellenőrzés

A sikeres frissítés után:

1. ✅ A dashboard betöltődik hibák nélkül
2. ✅ A Settings oldal megjeleníti a locations/categories táblázatokat
3. ✅ Az item form location/category dropdown-ok megjelennek

## További segítség

Ha még mindig hibákat látsz, nézd meg a [FIRESTORE_SETUP.md](./FIRESTORE_SETUP.md) teljes útmutatóját.
