# 📦 Inventory & Lending Management System

A modern, full-stack inventory and lending management system built with TypeScript, Vite, Bootstrap 5, and Firebase. This project is configured for easy deployment to either Firebase Hosting or GitHub Pages.

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
- **Database**: Firebase Firestore (Real-time NoSQL)
- **Hosting**: Firebase Hosting / GitHub Pages
- **Icons**: Bootstrap Icons

## 📋 Prerequisites

Before setting up the project, ensure you have:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Firebase Account](https://firebase.google.com/) (Free tier is sufficient)
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

### 4. Firebase Firestore Setup

**📖 For detailed step-by-step instructions, see [FIRESTORE_SETUP.md](./FIRESTORE_SETUP.md)**

#### Quick Setup:

1. In Firebase Console, enable **Firestore Database**
2. Choose **Start in production mode**
3. Select a location close to your users
4. Update Security Rules (see [FIRESTORE_SETUP.md](./FIRESTORE_SETUP.md))
5. Collections will be created automatically on first use:
   - `users`
   - `items`
   - `loans`

#### Make Yourself Admin:

1. Sign in to the app once with Google
2. Go to Firebase Console → Firestore Database
3. Find your document in the `users` collection
4. Edit the `role` field from `"user"` to `"admin"`
5. Refresh the app to see admin features

### 5. Environment Variables

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Edit `.env` and fill in your Firebase credentials:

```env
# Firebase Configuration (from Firebase Console → Project Settings)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Note**: Firestore uses the same Firebase project configuration. No additional database credentials needed!

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Creating Your First Admin User

1. Sign in with Google
2. Your user will be created in Firestore with the default "user" role
3. Manually promote yourself to admin:
   - Open Firebase Console → Firestore Database
   - Navigate to the `users` collection
   - Find your user document (look for your email)
   - Edit the `role` field from `"user"` to `"admin"`
   - Click **Update**
4. Refresh the app - you'll now see the Admin Panel!

## 📁 Project Structure

```
125-raktar-app/
├── src/
│   ├── components/
│   │   ├── dashboard.component.ts      # Item listing and search
│   │   └── admin-panel.component.ts    # Admin approval dashboard
│   ├── services/
│   │   ├── auth.service.ts             # Firebase authentication
│   │   └── firestore.service.ts        # Firestore database operations
│   ├── types/
│   │   └── models.ts                   # TypeScript interfaces
│   └── main.ts                         # Application entry point
├── dist/                             # Build output directory
├── .gitignore                        # Files to ignore in git
├── index.html                        # Main HTML file
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript configuration
├── vite.config.ts                    # Vite configuration
├── .env.example                      # Environment variables template
└── README.md                         # This file
```

## 🚢 Deployment

This project supports two deployment targets: Firebase Hosting (recommended) and GitHub Pages.

### Option 1: Deploying to Firebase Hosting (Recommended)

Firebase Hosting provides a fast, secure, and reliable way to host your web app.

**To deploy, simply run the `npm run build` command, and then use the IDE's Firebase deployment feature.**

### Option 2: Deploying to GitHub Pages

This method is suitable for simple static site hosting.

#### 1. Configure Vite for GitHub Pages

Edit `vite.config.ts` and set the `base` path to match your GitHub repository name:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/your-repo-name/', // e.g., '/125-raktar-app/'
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 3000,
  },
});
```

#### 2. Deploy

```bash
npm run deploy
```

This script will:
- Build the production bundle into the `dist` folder.
- Push the `dist` folder to the `gh-pages` branch on GitHub.

#### 3. Configure GitHub Pages

1. Go to your repository on GitHub.
2. Navigate to **Settings** → **Pages**.
3. Under **Build and deployment**, set the **Source** to **Deploy from a branch**.
4. Set the **Branch** to `gh-pages` with the `/ (root)` folder.
5. Save and wait for deployment.

Your app will be available at: `https://yourusername.github.io/your-repo-name/`

## 🛠️ Development

### Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build locally
npm run deploy    # Build and deploy to GitHub Pages
```

### Adding New Features

1. **New Components**: Add to `src/components/`
2. **New Services**: Add to `src/services/`
3. **New Types**: Update `src/types/models.ts`
4. **New Routes**: Update `src/main.ts`

## 🐛 Troubleshooting

### Authentication Issues

- Verify Firebase configuration in `.env`.
- Check that Google Sign-In is enabled in the Firebase Console.
- Ensure your domain is authorized in Firebase (including localhost for development).

### Build Issues

- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check your Node.js version: `node --version` (should be v18+).

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 👨‍💻 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ using TypeScript, Vite, Bootstrap, and Firebase.

