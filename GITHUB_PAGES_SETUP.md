# GitHub Pages Deployment Guide

## Automatic Deployment (Recommended)

The project is configured with GitHub Actions for automatic deployment.

### Setup Steps

1. **Enable GitHub Pages in Repository Settings**
   - Go to: `Settings` → `Pages`
   - Source: Select `GitHub Actions`
   - Save changes

2. **Push to Main Branch**
   - The workflow will automatically trigger on push to `main`
   - Monitor progress in `Actions` tab

3. **Access Your Site**
   - URL: `https://YOUR_USERNAME.github.io/125-raktar-app/`
   - Available after successful deployment (~2-3 minutes)

### Workflow Features

- ✅ Automatic builds on push to main
- ✅ Manual trigger via workflow_dispatch
- ✅ Uses Node.js 20 with npm caching
- ✅ TypeScript compilation + Vite build
- ✅ Artifact upload to GitHub Pages

## Manual Deployment (Alternative)

If you prefer manual deployment:

```bash
# Build and deploy
npm run deploy
```

This uses `gh-pages` package to deploy the `dist` folder to the `gh-pages` branch.

### Manual Setup

1. Enable GitHub Pages with source set to `gh-pages` branch
2. Run `npm run deploy` locally
3. Push changes

## Configuration

### Base Path
The base path is set in `vite.config.ts`:
```typescript
base: '/125-raktar-app/'
```

If you rename the repository, update this path.

### Build Output
- Output directory: `dist/`
- Source maps: Enabled
- TypeScript: Pre-compiled before build

## Troubleshooting

### 404 Errors
- Verify base path matches repository name
- Check GitHub Pages source is correctly configured
- Wait 2-3 minutes after first deployment

### Build Failures
- Check `Actions` tab for error logs
- Verify all dependencies in package.json
- Test build locally: `npm run build`

### Environment Variables
For Firebase config, add to GitHub repository secrets:
- Go to `Settings` → `Secrets and variables` → `Actions`
- Add any sensitive environment variables (if needed)

## Firebase Configuration

The Firebase config in `src/services/firebase.service.ts` should work in production. Ensure:
- Firestore Security Rules are properly configured
- Authentication is enabled for your domain
- Add your GitHub Pages URL to Firebase authorized domains:
  - Firebase Console → Authentication → Settings → Authorized domains
  - Add: `YOUR_USERNAME.github.io`

## First Deployment Checklist

- [ ] Merge feature branch to main
- [ ] Enable GitHub Pages (Actions source)
- [ ] Add GitHub Pages domain to Firebase
- [ ] Wait for Actions workflow to complete
- [ ] Test site at your GitHub Pages URL
- [ ] Verify authentication works
- [ ] Test loan creation/management

## Continuous Deployment

Every push to `main` automatically:
1. Checks out code
2. Installs dependencies
3. Runs TypeScript compilation
4. Builds with Vite
5. Deploys to GitHub Pages

No manual intervention needed after initial setup!
