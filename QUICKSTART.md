# ⚡ Quick Start Guide

Get your Inventory & Lending Management System running in under 15 minutes!

## Prerequisites Checklist

- [ ] Node.js installed (v18+)
- [ ] Git installed
- [ ] MongoDB Atlas account created
- [ ] Firebase account created
- [ ] GitHub account

## 🚀 5-Step Setup

### Step 1: Clone & Install (2 min)

```bash
git clone https://github.com/yourusername/125-raktar-app.git
cd 125-raktar-app
npm install
```

### Step 2: Firebase Setup (3 min)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project
3. Add Web App
4. Enable **Google Sign-In** in Authentication
5. Copy config values

### Step 3: MongoDB Setup (5 min)

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create cluster (free tier M0)
3. Create database: `inventory_system`
4. Create collections: `items`, `loans`, `users`
5. Go to **App Services** → Create new app
6. Enable **Data API** and generate API Key

### Step 4: Configure Environment (2 min)

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Firebase
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# MongoDB
VITE_MONGODB_DATA_API_URL=https://data.mongodb-api.com/app/your-app-id/endpoint/data/v1
VITE_MONGODB_API_KEY=your_mongodb_key
VITE_MONGODB_CLUSTER_NAME=Cluster0
VITE_MONGODB_DATABASE_NAME=inventory_system
```

### Step 5: Run Development Server (1 min)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🎯 First Time Setup

### 1. Sign In
- Click "Sign in with Google"
- Authenticate with your Google account

### 2. Promote to Admin
- Go to MongoDB Atlas
- Open `inventory_system` → `users` collection
- Find your user
- Change `role` from `"user"` to `"admin"`

### 3. Add Test Items

Sign in as admin and add some test items:

**Example Item 1:**
```
Name: Laptop - Dell XPS 15
Location: Office - Desk 5
Quantity: 2
Tags: electronics, laptop, work
Description: High-performance laptop for development work
Status: available
```

**Example Item 2:**
```
Name: Projector - Epson EB-X41
Location: Meeting Room A
Quantity: 1
Tags: electronics, presentation, projector
Description: HD projector for presentations
Status: available
```

**Example Item 3:**
```
Name: Whiteboard Markers (Pack)
Location: Supply Closet
Quantity: 10
Tags: office supplies, stationary
Description: Assorted color dry-erase markers
Status: available
```

### 4. Test Loan Workflow

As User:
1. Click "Request" on an item
2. Fill in quantity and return date
3. Add optional notes
4. Submit request

As Admin:
1. Go to **Admin Panel**
2. See pending request
3. Click **Approve** or **Reject**
4. For approved items, later click **Mark Returned**

## 🚢 Deploy to GitHub Pages (5 min)

### 1. Update Config

Edit `vite.config.ts`:
```typescript
base: '/your-repo-name/', // Change this!
```

### 2. Add Authorized Domain

In Firebase Console:
- **Authentication** → **Settings** → **Authorized domains**
- Add: `yourusername.github.io`

### 3. Deploy

```bash
npm run deploy
```

### 4. Configure GitHub

1. Go to GitHub repo → **Settings** → **Pages**
2. Source: `gh-pages` branch
3. Save

Your app will be live at: `https://yourusername.github.io/your-repo-name/`

## 📚 Next Steps

- [ ] Read [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- [ ] Read [MONGODB_SETUP.md](MONGODB_SETUP.md) for database details
- [ ] Read [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for auth details
- [ ] Customize UI colors and branding
- [ ] Set up MongoDB indexes (see MONGODB_SETUP.md)
- [ ] Configure production security rules

## 🛠️ Common Commands

```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build locally
npm run deploy     # Deploy to GitHub Pages
```

## 🐛 Troubleshooting

### "Cannot connect to MongoDB"
✅ Check `.env` has correct MongoDB values  
✅ Verify Data API is enabled in Atlas  
✅ Check Network Access allows your IP

### "Firebase auth error"
✅ Check `.env` has correct Firebase values  
✅ Verify Google Sign-In is enabled  
✅ Check domain is authorized

### "Page loads but nothing happens"
✅ Open browser console for errors  
✅ Check all environment variables are set  
✅ Clear browser cache and reload

### "Admin panel not showing"
✅ Check your user role in MongoDB  
✅ Sign out and sign in again  
✅ Clear localStorage and retry

## 💡 Pro Tips

1. **Use Browser DevTools**: Open with F12 to see errors and network requests
2. **MongoDB Compass**: Install for easier database management
3. **Save Your .env**: Keep a secure backup of your `.env` file
4. **Test Locally First**: Always test changes locally before deploying
5. **Check Quotas**: Monitor Firebase and MongoDB usage in their consoles

## 📞 Need Help?

- **Documentation**: Check [README.md](README.md)
- **Issues**: Open an issue on GitHub
- **Firebase Help**: [Firebase Support](https://firebase.google.com/support)
- **MongoDB Help**: [MongoDB Documentation](https://docs.mongodb.com/)

## 🎉 You're Ready!

Your inventory management system is now running! Start by:
1. Adding some inventory items
2. Testing the loan request workflow
3. Exploring the admin panel
4. Customizing the design to match your needs

Happy coding! 🚀
