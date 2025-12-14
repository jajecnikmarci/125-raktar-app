# 🚀 Quick Setup - Get Running in 5 Minutes!

## ✅ Firebase is Working!
Your Google Sign-In is configured correctly. Now let's set up MongoDB.

## 🎯 Current Status
- ✅ **Firebase**: Working perfectly
- ⚠️ **MongoDB**: Not configured (using bypass mode)
- 🔄 **App**: You can sign in, but data won't persist

## 🏃 Option 1: Test Now Without MongoDB (Fastest)

**I've enabled a temporary bypass mode** so you can test the app immediately!

### What Works:
- ✅ Google Sign-In
- ✅ Navigation and UI
- ✅ All admin features (you're set as admin automatically)

### What Doesn't Work:
- ❌ Data persistence (items/loans won't save)
- ❌ Role management (everyone is admin in bypass mode)

### To Use Bypass Mode:
Just sign in! The app will work, but data won't persist across sessions.

---

## 🗄️ Option 2: Set Up MongoDB (10 minutes)

### Step 1: Create MongoDB Atlas Account (2 min)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up (free)
3. Create a cluster:
   - Choose **FREE** tier (M0)
   - Pick any cloud provider/region
   - Name it "Cluster0"
   - Click **Create**

### Step 2: Configure Network & User (2 min)
1. **Network Access**:
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Confirm

2. **Database Access**:
   - Click "Add New Database User"
   - Username: `admin`
   - Password: Generate one (save it!)
   - Role: **Atlas Admin**
   - Add User

### Step 3: Create Database (1 min)
1. Click "Browse Collections"
2. Click "Add My Own Data"
3. Database name: `inventory_system`
4. Collection name: `items`
5. Create
6. Add two more collections: `loans` and `users`

### Step 4: Enable Data API (3 min)
1. In Atlas, click "App Services" (left sidebar)
2. Click "Create a New App"
3. Name: `inventory-app`
4. Link to your cluster
5. Click "Create"

**In your new app:**
1. Go to "HTTPS Endpoints" → "Data API"
2. Click "Enable Data API"
3. Copy the **Data API URL** (looks like: `https://data.mongodb-api.com/app/application-0-xxxxx/endpoint/data/v1`)

**Create API Key:**
1. Go to "Authentication" → "API Keys"
2. Click "Create API Key"
3. Name: "Web App"
4. Click "Generate Key"
5. **Copy the key** (you won't see it again!)

### Step 5: Configure Data Access (2 min)
1. Go to "Rules"
2. For `inventory_system.items`:
   - Click collection
   - Toggle all permissions to ON (for testing)
3. Repeat for `loans` and `users` collections

### Step 6: Update .env File
Open `.env` and update these lines:

```env
# Replace these with your actual values:
VITE_MONGODB_DATA_API_URL=https://data.mongodb-api.com/app/application-0-xxxxx/endpoint/data/v1
VITE_MONGODB_API_KEY=your_actual_mongodb_api_key_here
VITE_MONGODB_CLUSTER_NAME=Cluster0
VITE_MONGODB_DATABASE_NAME=inventory_system
```

### Step 7: Restart Dev Server
```powershell
# Stop the server (Ctrl+C), then:
npm run dev
```

### Step 8: Test!
1. Sign in with Google
2. You should see: "✓ User sync complete"
3. Try adding an item - it will persist!

---

## 🆘 Still Having Issues?

### Check These:
```powershell
# 1. View your .env file
Get-Content .env

# 2. Make sure no placeholders remain
# Look for "your-app-id" or "your_" - these should be real values!

# 3. Restart the dev server after changes
# Ctrl+C to stop, then:
npm run dev
```

### Common MongoDB Issues:

**Error: "No 'Access-Control-Allow-Origin' header"**
- Fix: Enable Data API in MongoDB App Services
- Fix: Set IP allowlist to 0.0.0.0/0 for testing

**Error: "Invalid API key"**
- Fix: Generate new API key in App Services
- Fix: Make sure you copied the entire key

**Error: "Collection not found"**
- Fix: Create collections: `items`, `loans`, `users`
- Fix: Check database name is exactly `inventory_system`

---

## 📖 More Help

- **Quick Reference**: See [QUICKSTART.md](QUICKSTART.md)
- **Detailed Setup**: See [MONGODB_SETUP.md](MONGODB_SETUP.md)
- **Troubleshooting**: See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## 💡 Pro Tip

For now, **just use bypass mode** to test the UI and features. Set up MongoDB when you're ready to save real data!

The app is fully functional in bypass mode - you just won't have data persistence.
