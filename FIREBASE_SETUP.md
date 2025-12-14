# Firebase Setup Guide

## Step-by-Step Firebase Configuration

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add Project**
3. Enter project name (e.g., "Inventory Management")
4. (Optional) Enable Google Analytics
5. Click **Create Project**

### 2. Add Web App

1. In your Firebase project, click the **Web** icon (`</>`)
2. Register app nickname: "Inventory Web App"
3. (Optional) Check "Also set up Firebase Hosting"
4. Click **Register App**
5. Copy the Firebase configuration object (you'll need this for `.env`)

The configuration looks like:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 3. Enable Google Authentication

1. In Firebase Console, go to **Authentication** (left sidebar)
2. Click **Get Started**
3. Go to **Sign-in method** tab
4. Click **Google**
5. Toggle **Enable**
6. Select support email from dropdown
7. Click **Save**

### 4. Configure Authorized Domains

1. Still in **Authentication** → **Settings** → **Authorized domains**
2. By default, `localhost` and your Firebase domain are authorized
3. Add your GitHub Pages domain:
   - Format: `yourusername.github.io`
   - Click **Add domain**

### 5. Get Configuration Values

From the Firebase configuration object, extract these values for your `.env` file:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 6. Test Authentication

1. Update your `.env` file with Firebase values
2. Run `npm run dev`
3. Click "Sign in with Google"
4. You should see the Google OAuth consent screen
5. After signing in, check Firebase Console → **Authentication** → **Users** to see your user

## Advanced Configuration

### OAuth Consent Screen (Google Cloud)

If you need to customize the OAuth consent screen:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **APIs & Services** → **OAuth consent screen**
4. Configure:
   - App name
   - User support email
   - App logo
   - Authorized domains
   - Developer contact information

### Security Rules (Optional)

If you plan to use Firestore or Realtime Database:

1. Go to **Firestore Database** or **Realtime Database**
2. Click **Rules** tab
3. Set appropriate security rules

Example Firestore rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only allow authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Enable Email Verification (Optional)

To require email verification:

1. Go to **Authentication** → **Settings**
2. Scroll to **User account management**
3. Click **Email verification template**
4. Customize the email template
5. Enable **Require email verification**

In your code, after sign-up:
```typescript
import { sendEmailVerification } from 'firebase/auth';

await sendEmailVerification(user);
```

### Add Additional Sign-In Methods

Besides Google, you can enable:

#### Email/Password
1. **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. Update your auth service to support email/password

#### GitHub
1. Enable **GitHub** provider
2. Follow instructions to create GitHub OAuth App
3. Add Client ID and Secret

#### Microsoft
1. Enable **Microsoft** provider
2. Configure Azure AD app

## Environment Variables Checklist

Make sure your `.env` has all Firebase values:

- [ ] `VITE_FIREBASE_API_KEY`
- [ ] `VITE_FIREBASE_AUTH_DOMAIN`
- [ ] `VITE_FIREBASE_PROJECT_ID`
- [ ] `VITE_FIREBASE_STORAGE_BUCKET`
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `VITE_FIREBASE_APP_ID`

## Production Considerations

### API Key Security

The Firebase API key is safe to expose client-side because:
- It only identifies your Firebase project
- Security is enforced by Firebase Security Rules
- Authorized domains prevent unauthorized access

However, to protect your project:

1. **Restrict API Key** (recommended):
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project
   - Go to **APIs & Services** → **Credentials**
   - Click on your API key
   - Under **Application restrictions**, select **HTTP referrers**
   - Add your domains:
     - `http://localhost:*`
     - `https://yourusername.github.io/*`

2. **Enable App Check** (advanced):
   - Protects your backend resources from abuse
   - Go to **App Check** in Firebase Console
   - Register your web app
   - Add reCAPTCHA v3 site key

### Monitor Authentication

1. Go to **Authentication** → **Users**
2. Monitor sign-ins and user activity
3. Set up alerts for suspicious activity

### Rate Limiting

Firebase has automatic rate limiting, but you can:
- Monitor usage in Firebase Console
- Set up billing alerts
- Implement custom rate limiting in your app

## Troubleshooting

### Common Issues

**Issue**: "Firebase: Error (auth/unauthorized-domain)"
- **Solution**: Add your domain to Authorized domains in Firebase Console

**Issue**: "Firebase: API key not valid"
- **Solution**: Check that API key in `.env` matches Firebase Console

**Issue**: "auth/popup-blocked"
- **Solution**: Browser blocked popup. Advise user to allow popups

**Issue**: "auth/popup-closed-by-user"
- **Solution**: User closed OAuth popup before completing sign-in

### Testing Firebase Connection

Use browser console to test:

```javascript
// In browser console after sign-in
firebase.auth().currentUser
// Should return user object if signed in
```

Or check in your app:
```typescript
import { getAuth } from 'firebase/auth';

const auth = getAuth();
console.log('Current user:', auth.currentUser);
```

## Additional Features

### Persist Authentication State

Firebase automatically persists auth state in localStorage. To customize:

```typescript
import { setPersistence, browserLocalPersistence } from 'firebase/auth';

await setPersistence(auth, browserLocalPersistence);
```

Options:
- `browserLocalPersistence`: Persists across browser sessions (default)
- `browserSessionPersistence`: Cleared when tab is closed
- `inMemoryPersistence`: Memory only (lost on refresh)

### Get User Token

To send authenticated requests to your backend:

```typescript
const user = auth.currentUser;
if (user) {
  const token = await user.getIdToken();
  // Send token in Authorization header
}
```

### Handle Auth Errors

```typescript
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider,
  AuthErrorCodes
} from 'firebase/auth';

try {
  await signInWithPopup(auth, provider);
} catch (error) {
  switch (error.code) {
    case AuthErrorCodes.POPUP_BLOCKED:
      alert('Please allow popups for this site');
      break;
    case AuthErrorCodes.POPUP_CLOSED_BY_USER:
      // User cancelled, no action needed
      break;
    case AuthErrorCodes.NETWORK_REQUEST_FAILED:
      alert('Network error. Please check your connection');
      break;
    default:
      console.error('Auth error:', error);
  }
}
```

## Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Web SDK Reference](https://firebase.google.com/docs/reference/js/auth)
- [Firebase YouTube Channel](https://www.youtube.com/firebase)
- [Firebase Blog](https://firebase.blog/)

## Support

If you encounter issues:
1. Check [Firebase Status Dashboard](https://status.firebase.google.com/)
2. Search [StackOverflow firebase tag](https://stackoverflow.com/questions/tagged/firebase)
3. Post in [Firebase Community](https://firebase.google.com/support)
