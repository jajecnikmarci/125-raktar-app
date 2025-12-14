# 🏗️ System Architecture Documentation

## Overview

The Inventory & Lending Management System is a **serverless, static web application** designed to run entirely on GitHub Pages. It leverages modern cloud services to provide a full-featured inventory management system without requiring a dedicated backend server.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        GitHub Pages                         │
│                    (Static Hosting)                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Vite + TypeScript                        │  │
│  │           (Build & Bundle)                            │  │
│  │                                                       │  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │         Bootstrap 5 UI Layer                │    │  │
│  │  │  • Dashboard Component                      │    │  │
│  │  │  • Admin Panel Component                    │    │  │
│  │  │  • Authentication UI                        │    │  │
│  │  └─────────────────────────────────────────────┘    │  │
│  │                        ▲                             │  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │         Application Layer                   │    │  │
│  │  │  • Routing Logic                            │    │  │
│  │  │  • State Management                         │    │  │
│  │  │  • Event Handling                           │    │  │
│  │  └─────────────────────────────────────────────┘    │  │
│  │                        ▲                             │  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │         Service Layer                       │    │  │
│  │  │  • AuthService                              │    │  │
│  │  │  • MongoDBService                           │    │  │
│  │  └─────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                   ▲                            ▲
                   │                            │
        ┌──────────┴────────────┐   ┌──────────┴───────────┐
        │                       │   │                      │
        │  Firebase Auth        │   │   MongoDB Atlas      │
        │  (Google Sign-In)     │   │   (Data API)         │
        │                       │   │                      │
        │  • User Auth          │   │  • Items Collection  │
        │  • Token Management   │   │  • Loans Collection  │
        │  • OAuth Flow         │   │  • Users Collection  │
        └───────────────────────┘   └──────────────────────┘
```

## Component Architecture

### 1. Frontend Layer (Static)

#### Technology Stack
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Bootstrap 5**: Responsive UI framework
- **Bootstrap Icons**: Icon library

#### Key Components

**DashboardComponent** (`dashboard.component.ts`)
- Displays inventory items in a data table
- Search and filter functionality
- Request item modal for users
- CRUD operations for admins

**AdminPanelComponent** (`admin-panel.component.ts`)
- Loan request approval/rejection workflow
- Active loans tracking
- Return processing
- Admin-only access control

**Main App** (`main.ts`)
- Application bootstrapping
- Route management
- Auth state handling
- View rendering coordination

### 2. Service Layer

#### AuthService (`auth.service.ts`)

**Responsibilities:**
- Initialize Firebase SDK
- Handle Google OAuth flow
- Manage authentication state
- Sync Firebase users with MongoDB
- Token management
- Role-based access control

**Key Methods:**
```typescript
signInWithGoogle(): Promise<User>
signOut(): Promise<void>
getIdToken(): Promise<string | null>
isAuthenticated(): boolean
isAdmin(): boolean
```

#### MongoDBService (`mongodb.service.ts`)

**Responsibilities:**
- HTTP communication with MongoDB Data API
- CRUD operations for all collections
- Transaction-like operations (approve/return)
- Data validation
- Error handling

**Key Methods:**
```typescript
// Items
getItems(filter?): Promise<Item[]>
createItem(item): Promise<string>
updateItem(id, updates): Promise<boolean>
deleteItem(id): Promise<boolean>

// Loans
getLoansByUser(userId): Promise<Loan[]>
getPendingLoans(): Promise<Loan[]>
createLoanRequest(loan): Promise<string>
approveLoan(loanId, adminId): Promise<boolean>
rejectLoan(loanId, adminId, notes?): Promise<boolean>
returnLoan(loanId): Promise<boolean>

// Users
getUserByUid(uid): Promise<User | null>
createUser(user): Promise<string>
updateUserRole(uid, role): Promise<boolean>
```

### 3. Data Layer

#### MongoDB Collections

**items**
- Stores inventory items
- Indexed on: name, status, tags
- Denormalized for performance

**loans**
- Tracks lending transactions
- Denormalized item and user data
- Indexed on: itemId, userId, status, requestedAt

**users**
- User profiles with roles
- Synced with Firebase Auth
- Indexed on: uid (unique), email (unique), role

## Data Flow

### 1. Authentication Flow

```
User Action → Google OAuth → Firebase Auth
                                    ↓
                          Get Firebase User & Token
                                    ↓
                          Check MongoDB for User
                                    ↓
                    ┌───────────────┴───────────────┐
                    │                               │
              User Exists                    User Not Found
                    │                               │
            Update Last Login                 Create New User
                    │                          (Role: user)
                    └───────────────┬───────────────┘
                                    ↓
                          Load User Data & Role
                                    ↓
                        Update UI (Show Admin Links if Admin)
                                    ↓
                            Render Dashboard
```

### 2. Item Request Flow

```
User Clicks "Request Item"
          ↓
Fill Request Form (Quantity, Return Date, Notes)
          ↓
Submit Request → MongoDBService.createLoanRequest()
          ↓
Create Loan Document (Status: PENDING)
          ↓
Notify User (Success Message)
          ↓
Admin Sees Request in Admin Panel
          ↓
Admin Reviews Request
          ↓
    ┌─────┴─────┐
    │           │
Approve      Reject
    │           │
    │         Update Loan
    │         (Status: REJECTED)
    │           
Update Loan
(Status: APPROVED)
    │
Update Item
(Status: ON_LOAN)
    │
User Notified
```

### 3. Return Flow

```
Admin Clicks "Mark as Returned"
          ↓
Confirm Action
          ↓
MongoDBService.returnLoan(loanId)
          ↓
Update Loan (Status: RETURNED, returnedAt: now)
          ↓
Get Associated Item
          ↓
Update Item (Status: AVAILABLE)
          ↓
Refresh Admin Panel
```

## Security Architecture

### Frontend Security

1. **Environment Variables**
   - All sensitive configs in `.env`
   - Never commit `.env` to Git
   - Use `.env.example` for documentation

2. **XSS Prevention**
   - Escape all user input in HTML rendering
   - Use `textContent` instead of `innerHTML` where possible
   - Sanitize data before display

3. **Authentication**
   - Firebase handles OAuth securely
   - Tokens stored in localStorage
   - Token refresh handled automatically

### Backend Security (MongoDB)

1. **API Key Management**
   - Dedicated API key for web app
   - Minimal required permissions
   - Consider IP whitelisting

2. **Data API Rules**
   - Server-side validation
   - Role-based access control
   - Field-level security

3. **Production Considerations**
   - Use MongoDB App Services (Realm) Functions for sensitive operations
   - Implement server-side validation rules
   - Enable rate limiting
   - Set up monitoring and alerts

## Deployment Pipeline

### Development

```bash
npm install          # Install dependencies
cp .env.example .env # Create environment file
npm run dev          # Start dev server (localhost:3000)
```

### Production Build

```bash
npm run build        # Build for production
                     # Output: dist/
```

### GitHub Pages Deployment

```bash
npm run deploy       # Build + Deploy to gh-pages branch
```

**Process:**
1. Vite builds production bundle
2. `gh-pages` package pushes `dist/` to `gh-pages` branch
3. GitHub Pages serves from `gh-pages` branch
4. App available at: `https://username.github.io/repo-name/`

## Performance Optimizations

### Build Optimizations

- **Code Splitting**: Vite automatically splits code
- **Tree Shaking**: Removes unused code
- **Minification**: JavaScript and CSS minified
- **Source Maps**: Generated for debugging

### Runtime Optimizations

- **Lazy Loading**: Load components on demand
- **Debouncing**: Search input debounced (300ms)
- **Caching**: Browser caches static assets
- **CDN**: Bootstrap and icons loaded from CDN

### Database Optimizations

- **Indexes**: All frequently queried fields indexed
- **Denormalization**: Reduce joins by storing redundant data
- **Pagination**: Consider implementing for large datasets
- **Projection**: Only fetch required fields

## Scalability Considerations

### Current Limits

- **MongoDB Data API**: 15,000 requests/day (free tier)
- **Firebase Auth**: 50,000 sign-ins/month (free tier)
- **GitHub Pages**: 100 GB bandwidth/month (soft limit)

### Scaling Strategies

1. **Upgrade Plans**
   - MongoDB Atlas: Pay-as-you-go
   - Firebase: Blaze plan (pay-as-you-go)

2. **Caching**
   - Implement client-side caching
   - Use Service Workers for offline support
   - Cache frequent queries

3. **Backend Migration**
   - When limits reached, migrate to:
     - Vercel Edge Functions
     - Cloudflare Workers
     - AWS Lambda + API Gateway

4. **Database Optimization**
   - Implement data archiving
   - Use MongoDB Change Streams for real-time updates
   - Consider read replicas for heavy read operations

## Monitoring & Debugging

### Development Tools

- **Browser DevTools**: Network, Console, Application tabs
- **Vue DevTools**: For enhanced debugging (if migrating to Vue)
- **MongoDB Compass**: Database GUI for queries
- **Firebase Console**: Auth monitoring

### Production Monitoring

- **Firebase Analytics**: User behavior tracking
- **MongoDB Atlas Monitoring**: Query performance, storage
- **GitHub Pages Status**: Uptime and deployments
- **Error Logging**: Implement Sentry or similar

### Debugging Tips

1. **Check Browser Console**: Most errors visible here
2. **Network Tab**: Monitor API calls and responses
3. **Application Tab**: Check localStorage for tokens
4. **MongoDB Atlas Logs**: View Data API request logs
5. **Firebase Auth Console**: Check user sign-in attempts

## Future Enhancements

### Phase 2 Features

- [ ] Email notifications (using SendGrid/Mailgun)
- [ ] Image upload for items (Firebase Storage)
- [ ] QR code generation for items
- [ ] Export data (CSV/PDF)
- [ ] Advanced reporting dashboard
- [ ] Mobile app (React Native)

### Technical Improvements

- [ ] Implement state management (Zustand/Redux)
- [ ] Add unit tests (Vitest)
- [ ] Add E2E tests (Playwright)
- [ ] Implement Progressive Web App (PWA)
- [ ] Add offline support with Service Workers
- [ ] Optimize bundle size with dynamic imports
- [ ] Add internationalization (i18n)

## Maintenance

### Regular Tasks

- Update dependencies monthly: `npm outdated && npm update`
- Review MongoDB Atlas usage and optimize queries
- Check Firebase usage and clean up unused users
- Monitor GitHub Pages bandwidth
- Review and update security rules
- Backup database regularly (MongoDB Atlas has automatic backups)

### Security Updates

- Subscribe to security advisories for:
  - Firebase SDK
  - MongoDB Node.js driver
  - Vite and TypeScript
  - Bootstrap
- Implement automatic Dependabot updates on GitHub

## Resources

### Documentation Links

- [Project README](README.md)
- [MongoDB Setup Guide](MONGODB_SETUP.md)
- [Firebase Setup Guide](FIREBASE_SETUP.md)

### External Resources

- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.3/)
- [Firebase Web SDK](https://firebase.google.com/docs/web/setup)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)

## Support & Contributing

For questions, issues, or contributions:
1. Open an issue on GitHub
2. Submit a pull request
3. Review contribution guidelines

---

**Last Updated**: December 2025  
**Version**: 1.0.0
