# 📦 Inventory & Lending Management System

A modern, full-stack inventory and lending management system built with TypeScript, Vite, Bootstrap 5, Firebase Authentication, and MongoDB Atlas. Designed to be deployed as a static site on GitHub Pages.

## 🌟 Features

- **🔐 Google Authentication**: Secure sign-in using Firebase Authentication
- **📊 Real-time Inventory**: Browse and search available items
- **🎯 Role-Based Access Control (RBAC)**:
  - **Users**: Request to borrow items
  - **Admins**: Manage inventory, approve/reject requests, track returns
- **📝 Lending Workflow**: Complete request → approval → return cycle
- **🔍 Advanced Search & Filters**: Find items by name, tags, location, or status
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices

## 🏗️ Tech Stack

- **Frontend**: TypeScript, Vite, Bootstrap 5
- **Authentication**: Firebase Auth (Google Sign-In)
- **Database**: MongoDB Atlas (via Data API)
- **Hosting**: GitHub Pages (Static Site)
- **Icons**: Bootstrap Icons

## 📋 Prerequisites

Before setting up the project, ensure you have:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [MongoDB Atlas Account](https://www.mongodb.com/cloud/atlas)
- [Firebase Account](https://firebase.google.com/)
- [GitHub Account](https://github.com/)

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/125-raktar-app.git
cd 125-raktar-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Authentication** → **Google Sign-In Provider**
4. Go to **Project Settings** → **General** → Copy your web app configuration

### 4. MongoDB Atlas Setup

#### Create Database and Collections

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new cluster (or use existing)
3. Create a database named `inventory_system`
4. Create three collections:
   - `items`
   - `loans`
   - `users`

#### Set Up Indexes

Run these commands in MongoDB Shell or Compass:

```javascript
// Items collection indexes
db.items.createIndex({ "name": 1 })
db.items.createIndex({ "status": 1 })
db.items.createIndex({ "tags": 1 })

// Loans collection indexes
db.loans.createIndex({ "itemId": 1 })
db.loans.createIndex({ "userId": 1 })
db.loans.createIndex({ "status": 1 })
db.loans.createIndex({ "requestedAt": -1 })

// Users collection indexes
db.users.createIndex({ "uid": 1 }, { unique: true })
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "role": 1 })
```

#### Enable MongoDB Data API

1. In Atlas, go to **App Services**
2. Click **Create a New App** or use existing
3. Enable **Data API**
4. Generate an **API Key** with read/write permissions
5. Note your:
   - Data API URL
   - API Key
   - Cluster Name
   - Database Name

### 5. Environment Variables

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Edit `.env` and fill in your credentials:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# MongoDB Data API Configuration
VITE_MONGODB_DATA_API_URL=https://data.mongodb-api.com/app/your-app-id/endpoint/data/v1
VITE_MONGODB_API_KEY=your_mongodb_api_key
VITE_MONGODB_CLUSTER_NAME=your_cluster_name
VITE_MONGODB_DATABASE_NAME=inventory_system
```

### 6. Update Vite Configuration

Edit `vite.config.ts` and change the `base` path to match your GitHub repository name:

```typescript
export default defineConfig({
  base: '/your-repo-name/', // e.g., '/125-raktar-app/'
  // ...
});
```

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Creating Your First Admin User

1. Sign in with Google
2. Your user will be created with the default "user" role
3. Manually promote yourself to admin:
   - Open MongoDB Atlas
   - Navigate to `inventory_system` → `users` collection
   - Find your user document
   - Edit the `role` field to `"admin"`
   - Save changes

Alternatively, create a MongoDB trigger or use MongoDB Compass to update the role.

## 📁 Project Structure

```
125-raktar-app/
├── src/
│   ├── components/
│   │   ├── dashboard.component.ts      # Item listing and search
│   │   └── admin-panel.component.ts    # Admin approval dashboard
│   ├── services/
│   │   ├── auth.service.ts             # Firebase authentication
│   │   └── mongodb.service.ts          # MongoDB CRUD operations
│   ├── types/
│   │   └── models.ts                   # TypeScript interfaces
│   └── main.ts                         # Application entry point
├── index.html                          # Main HTML file
├── package.json                        # Dependencies
├── tsconfig.json                       # TypeScript configuration
├── vite.config.ts                      # Vite configuration
├── .env.example                        # Environment variables template
└── README.md                           # This file
```

## 🚢 Deploying to GitHub Pages

### 1. Build the Project

```bash
npm run build
```

### 2. Deploy

```bash
npm run deploy
```

This will:
- Build the production bundle
- Push the `dist` folder to the `gh-pages` branch
- Deploy to GitHub Pages

### 3. Configure GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Set source to `gh-pages` branch
4. Save and wait for deployment

Your app will be available at: `https://yourusername.github.io/125-raktar-app/`

## 📊 Database Schema

### Items Collection

```typescript
{
  _id: ObjectId,
  name: string,
  location: string,
  quantity: number,
  tags: string[],
  description: string,
  status: 'available' | 'on_loan' | 'maintenance' | 'retired',
  createdAt: Date,
  updatedAt: Date,
  createdBy: string,
  imageUrl?: string
}
```

### Loans Collection

```typescript
{
  _id: ObjectId,
  itemId: string,
  itemName: string,
  userId: string,
  userEmail: string,
  userName: string,
  quantity: number,
  status: 'pending' | 'approved' | 'rejected' | 'returned' | 'overdue',
  requestedAt: Date,
  approvedAt?: Date,
  approvedBy?: string,
  returnedAt?: Date,
  expectedReturnDate?: Date,
  notes?: string,
  adminNotes?: string
}
```

### Users Collection

```typescript
{
  _id: ObjectId,
  uid: string,              // Firebase UID (unique)
  email: string,            // (unique)
  displayName: string,
  photoURL?: string,
  role: 'admin' | 'user',
  createdAt: Date,
  lastLogin?: Date,
  isActive: boolean
}
```

## 🔒 Security Considerations

### ⚠️ Important: API Key Security

This application exposes MongoDB API keys client-side. To mitigate risks:

1. **Use MongoDB App Services Rules**: Set up server-side validation rules
2. **Restrict API Key Permissions**: Create a dedicated API key with minimal permissions
3. **Enable IP Whitelisting**: Restrict access to known IPs (if possible)
4. **Use MongoDB Realm Functions**: For sensitive operations, use serverless functions
5. **Rate Limiting**: Enable rate limiting in MongoDB Atlas

### Production Recommendations

For production environments, consider:

- Using MongoDB App Services with server-side functions
- Implementing Firebase Security Rules
- Adding request signing/HMAC validation
- Using environment-specific API keys
- Implementing audit logging

## 🛠️ Development

### Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run deploy    # Deploy to GitHub Pages
```

### Adding New Features

1. **New Components**: Add to `src/components/`
2. **New Services**: Add to `src/services/`
3. **New Types**: Update `src/types/models.ts`
4. **New Routes**: Update `src/main.ts`

## 🐛 Troubleshooting

### Authentication Issues

- Verify Firebase configuration in `.env`
- Check that Google Sign-In is enabled in Firebase Console
- Ensure your domain is authorized in Firebase (including localhost)

### Database Connection Issues

- Verify MongoDB Data API URL and API key
- Check network access settings in MongoDB Atlas
- Ensure collections exist with correct names

### Build Issues

- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf .vite`
- Check Node.js version: `node --version` (should be v18+)

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 👨‍💻 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ using TypeScript, Vite, Bootstrap, Firebase, and MongoDB

