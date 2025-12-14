# 📂 Project File Structure

Complete directory structure of the Inventory & Lending Management System.

```
125-raktar-app/
│
├── 📄 index.html                          # Main HTML entry point
├── 📄 package.json                        # Dependencies and scripts
├── 📄 tsconfig.json                       # TypeScript configuration
├── 📄 vite.config.ts                      # Vite build configuration
│
├── 📄 .env.example                        # Environment variables template
├── 📄 .gitignore                          # Git ignore rules
│
├── 📖 README.md                           # Main project documentation
├── 📖 QUICKSTART.md                       # Quick setup guide
├── 📖 ARCHITECTURE.md                     # System architecture documentation
├── 📖 MONGODB_SETUP.md                    # MongoDB configuration guide
├── 📖 FIREBASE_SETUP.md                   # Firebase configuration guide
├── 📖 FILE_STRUCTURE.md                   # This file
│
└── src/                                   # Source code directory
    │
    ├── 📄 main.ts                         # Application entry point
    │   └── Responsibilities:
    │       - Initialize Firebase
    │       - Set up routing
    │       - Handle authentication flow
    │       - Render components
    │
    ├── 📄 vite-env.d.ts                   # TypeScript environment definitions
    ├── 📄 sample-data.ts                  # Sample data for testing
    │
    ├── 📁 types/                          # TypeScript type definitions
    │   └── 📄 models.ts                   # Data models and interfaces
    │       ├── Item interface
    │       ├── Loan interface
    │       ├── User interface
    │       ├── ItemStatus enum
    │       ├── LoanStatus enum
    │       └── UserRole enum
    │
    ├── 📁 services/                       # Business logic layer
    │   │
    │   ├── 📄 auth.service.ts             # Authentication service
    │   │   └── Responsibilities:
    │   │       - Firebase Auth initialization
    │   │       - Google Sign-In flow
    │   │       - Token management
    │   │       - User state management
    │   │       - Role-based access control
    │   │
    │   └── 📄 mongodb.service.ts          # Database service
    │       └── Responsibilities:
    │           - MongoDB Data API communication
    │           - CRUD operations for Items
    │           - CRUD operations for Loans
    │           - CRUD operations for Users
    │           - Transaction-like operations
    │
    └── 📁 components/                     # UI Components
        │
        ├── 📄 dashboard.component.ts      # Main dashboard
        │   └── Features:
        │       - Display items in table
        │       - Search and filter items
        │       - Request item modal
        │       - Item management (admin)
        │
        └── 📄 admin-panel.component.ts    # Admin panel
            └── Features:
                - Pending requests list
                - Active loans tracking
                - Approve/Reject workflow
                - Return processing
                - Statistics dashboard

```

## 📦 Build Output Structure

After running `npm run build`, the `dist/` folder will be created:

```
dist/
├── index.html                              # Processed HTML
├── assets/
│   ├── index-[hash].js                     # Bundled JavaScript
│   ├── index-[hash].css                    # Bundled CSS
│   └── [other-assets]-[hash].[ext]        # Other static assets
└── vite.svg                                # Vite logo (if present)
```

## 🔧 Configuration Files Explained

### `package.json`
- **dependencies**: Runtime libraries (Bootstrap, Firebase)
- **devDependencies**: Build tools (Vite, TypeScript, gh-pages)
- **scripts**: 
  - `dev`: Start development server
  - `build`: Build production bundle
  - `preview`: Preview production build
  - `deploy`: Deploy to GitHub Pages

### `tsconfig.json`
- **compilerOptions**: TypeScript compiler settings
- **include**: Files to compile
- Enables strict type checking

### `vite.config.ts`
- **base**: Base URL for GitHub Pages
- **build.outDir**: Output directory (dist)
- **server.port**: Development server port

### `.env`
- **VITE_FIREBASE_***: Firebase configuration
- **VITE_MONGODB_***: MongoDB Data API configuration
- ⚠️ **Important**: Never commit this file!

## 📝 File Purposes

### Entry Points

| File | Purpose |
|------|---------|
| `index.html` | HTML shell, loads main.ts |
| `src/main.ts` | Application bootstrap and routing |

### Services

| File | Purpose |
|------|---------|
| `auth.service.ts` | Authentication logic |
| `mongodb.service.ts` | Database operations |

### Components

| File | Purpose |
|------|---------|
| `dashboard.component.ts` | Main item listing view |
| `admin-panel.component.ts` | Admin management view |

### Types

| File | Purpose |
|------|---------|
| `models.ts` | TypeScript interfaces for data |
| `vite-env.d.ts` | Environment variable types |

### Documentation

| File | Purpose |
|------|---------|
| `README.md` | Project overview and setup |
| `QUICKSTART.md` | Fast setup guide |
| `ARCHITECTURE.md` | System design details |
| `MONGODB_SETUP.md` | Database configuration |
| `FIREBASE_SETUP.md` | Auth configuration |
| `FILE_STRUCTURE.md` | This file |

## 🎨 Asset Organization

Currently, assets are loaded from CDNs:
- **Bootstrap 5**: CDN link in index.html
- **Bootstrap Icons**: CDN link in index.html
- **Firebase SDK**: npm package

To add local assets:
```
src/
└── assets/
    ├── images/
    │   ├── logo.png
    │   └── placeholder.jpg
    ├── styles/
    │   └── custom.css
    └── fonts/
        └── custom-font.woff2
```

Import in your components:
```typescript
import logo from '../assets/images/logo.png';
import '../assets/styles/custom.css';
```

## 🔐 Security-Sensitive Files

### Never Commit
- `.env` - Contains API keys and secrets
- `node_modules/` - Dependencies (can be reinstalled)
- `dist/` - Build output (regenerated)

### Safe to Commit
- `.env.example` - Template without real values
- `src/` - Source code
- Configuration files

## 📊 File Size Reference

Approximate sizes:

| Category | Size |
|----------|------|
| `node_modules/` | ~200MB |
| `src/` (uncompiled) | ~100KB |
| `dist/` (compiled) | ~500KB |
| Documentation | ~50KB |

Production bundle breakdown:
- JavaScript: ~300KB (includes Firebase, Bootstrap JS)
- CSS: ~150KB (Bootstrap + custom)
- HTML: ~10KB

## 🚀 Adding New Files

### New Component
```
src/components/my-component.component.ts
```

### New Service
```
src/services/my-service.service.ts
```

### New Type
Add to existing `src/types/models.ts` or create new file

### New Documentation
Create in root directory with `.md` extension

## 🔄 Development Workflow

1. **Edit source files** in `src/`
2. **Vite watches** and hot-reloads changes
3. **Test in browser** at localhost:3000
4. **Build for production**: `npm run build`
5. **Deploy**: `npm run deploy`

## 📚 Related Documentation

- [Project Setup](README.md)
- [Quick Start Guide](QUICKSTART.md)
- [System Architecture](ARCHITECTURE.md)
- [MongoDB Configuration](MONGODB_SETUP.md)
- [Firebase Configuration](FIREBASE_SETUP.md)

---

**Tip**: Use VS Code's file explorer to navigate this structure visually!
