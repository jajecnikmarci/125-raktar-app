# 🔧 Authentication Troubleshooting Guide

## Quick Diagnosis

### Step 1: Check Environment Variables

1. **Verify `.env` file exists and has values**
   ```bash
   # PowerShell
   Get-Content .env
   ```

2. **Ensure NO placeholder values remain**
   - ❌ `VITE_FIREBASE_API_KEY=your_firebase_api_key`
   - ✅ `VITE_FIREBASE_API_KEY=AIzaSyC...actual_key_here`

3. **Restart dev server after changing `.env`**
   ```bash
   # Stop server (Ctrl+C), then:
   npm run dev
   ```

### Step 2: Check Browser Console

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for error messages

### Common Errors & Solutions

#### Error: "Firebase: Error (auth/invalid-api-key)"
**Cause**: Firebase API key is incorrect or missing

**Solution**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project → ⚙️ Settings → General
3. Scroll to "Your apps" → Web app
4. Copy the **apiKey** value
5. Update `.env`: `VITE_FIREBASE_API_KEY=AIzaSy...`
6. Restart dev server

#### Error: "Firebase: Error (auth/unauthorized-domain)"
**Cause**: Your domain (localhost) is not authorized

**Solution**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. **Authentication** → **Settings** → **Authorized domains**
3. Ensure `localhost` is in the list
4. If deploying, add your GitHub Pages domain

#### Error: "Failed to sign in" (Generic)
**Possible Causes**:

1. **Popup Blocked**
   - Browser blocked the Google OAuth popup
   - **Solution**: Allow popups for localhost

2. **Firebase Not Initialized**
   - Environment variables not loaded
   - **Solution**: Restart dev server after updating `.env`

3. **Google Sign-In Not Enabled**
   - **Solution**: 
     1. Firebase Console → Authentication
     2. Sign-in method tab
     3. Enable Google provider

4. **Network Issues**
   - **Solution**: Check internet connection

### Step 3: Test Firebase Configuration

Add this to your browser console:

```javascript
// Test if environment variables are loaded
console.log('API Key:', import.meta.env.VITE_FIREBASE_API_KEY);
console.log('Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
```

Expected output:
- ✅ Shows actual values (not `undefined`)
- ❌ Shows `undefined` → Environment variables not loaded

### Step 4: Manual Test

1. Open browser console (F12)
2. Paste this code:

```javascript
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const auth = getAuth();
const provider = new GoogleAuthProvider();

signInWithPopup(auth, provider)
  .then((result) => {
    console.log('✅ Sign-in successful!', result.user);
  })
  .catch((error) => {
    console.error('❌ Sign-in failed:', error.code, error.message);
  });
```

## Detailed Debugging Steps

### 1. Verify Firebase Project Setup

```bash
# Check if firebase-tools is installed
firebase --version
```

If not installed:
```bash
npm install -g firebase-tools
firebase login
```

### 2. Check Firebase Console Settings

#### Required Settings:
- [ ] Project created
- [ ] Web app added
- [ ] Google Sign-In enabled
- [ ] `localhost` in authorized domains
- [ ] OAuth consent screen configured (if needed)

### 3. Check .env File Format

Correct format:
```env
VITE_FIREBASE_API_KEY=AIzaSyC_actual_key_without_quotes
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

❌ Wrong:
```env
VITE_FIREBASE_API_KEY="AIzaSyC..."  # No quotes!
VITE_FIREBASE_API_KEY = AIzaSyC...  # No spaces around =
```

### 4. Check for Mixed Environments

If you have both `.env` and `.env.local`:
- Vite loads `.env.local` FIRST (it overrides `.env`)
- Make sure you're editing the right file

### 5. Browser-Specific Issues

#### Chrome/Edge:
- Check if third-party cookies are blocked
- Settings → Privacy → Cookies → Allow all cookies (for testing)

#### Firefox:
- Enhanced Tracking Protection may block OAuth
- Click shield icon in address bar → Turn off for localhost

### 6. MongoDB Connection Issue

If Firebase works but still shows "Failed to sign in", MongoDB might be the issue:

Check browser console for:
- `MongoDB API Error`
- `Network request failed`

**Solution**: Verify MongoDB credentials in `.env`

## Testing Checklist

Run through this checklist:

### Firebase Setup
- [ ] Firebase project created
- [ ] Web app registered
- [ ] Config values copied to `.env`
- [ ] Google Sign-In enabled
- [ ] `localhost` authorized
- [ ] Dev server restarted after `.env` changes

### Environment Variables
- [ ] `.env` file exists
- [ ] All `VITE_FIREBASE_*` values set
- [ ] All `VITE_MONGODB_*` values set
- [ ] No placeholder text (no `your_...`)
- [ ] No quotes around values
- [ ] No spaces around `=`

### Browser
- [ ] Console open to see errors
- [ ] Popups allowed
- [ ] Third-party cookies allowed
- [ ] No ad-blockers interfering
- [ ] Cache cleared

### Network
- [ ] Internet connection working
- [ ] Firewall not blocking Firebase
- [ ] No proxy issues

## Alternative: Test Without MongoDB

To isolate Firebase issues, temporarily comment out MongoDB code:

In `auth.service.ts`, modify `handleUserLogin`:

```typescript
private async handleUserLogin(firebaseUser: FirebaseUser): Promise<void> {
  try {
    // Temporarily create user without MongoDB
    const user: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || 'User',
      photoURL: firebaseUser.photoURL || undefined,
      role: UserRole.ADMIN, // Set as admin for testing
      createdAt: new Date(),
      lastLogin: new Date(),
      isActive: true,
    };
    
    this.currentUser = user;
    this.onAuthStateChange(user);
    
    console.log('✅ Firebase auth successful (MongoDB disabled for testing)');
  } catch (error) {
    console.error('Error handling user login:', error);
    throw error;
  }
}
```

If this works:
- ✅ Firebase is configured correctly
- ❌ MongoDB is the issue → Check MongoDB setup

If this still fails:
- ❌ Firebase configuration is the issue

## Still Not Working?

### Get Detailed Error Information

Add this to `src/main.ts` at the top:

```typescript
window.onerror = function(msg, url, lineNo, columnNo, error) {
  console.error('Global error:', {
    message: msg,
    url: url,
    lineNo: lineNo,
    columnNo: columnNo,
    error: error
  });
  return false;
};
```

### Enable Verbose Logging

In `auth.service.ts` constructor, add:

```typescript
constructor() {
  console.log('🔥 Initializing Firebase Auth...');
  
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  
  console.log('Firebase config:', {
    apiKey: firebaseConfig.apiKey ? '✓ Set' : '✗ Missing',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
  });
  
  // ... rest of constructor
}
```

### Contact Support

If all else fails, provide these details:
1. Browser console errors (full text)
2. Firebase config status (from debug log)
3. Browser and version
4. Operating system

## Quick Fix: Start Fresh

If completely stuck, start over with Firebase:

1. **Delete old Firebase project** (if test)
2. **Create new Firebase project**
3. **Follow [FIREBASE_SETUP.md](FIREBASE_SETUP.md)** step-by-step
4. **Update `.env` with new credentials**
5. **Restart dev server**

---

**Need more help?** Open an issue on GitHub with:
- Console error messages
- Steps you've already tried
- Browser and OS information
