# Deployment Guide for Layne's World Dashboard

## Quick Start - Deploy to GitHub Pages

Follow these steps to get your dashboard live on GitHub Pages:

### Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right and select "New repository"
3. Name it: `Laynes_World` (or any name you prefer)
4. Keep it **Public** (required for free GitHub Pages)
5. **Do NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

### Step 2: Update Vite Configuration (if you changed the repo name)

If you named your repository something other than "Laynes_World", update `vite.config.ts`:

```typescript
base: '/YOUR_REPO_NAME/', // Replace with your actual repo name
```

### Step 3: Push to GitHub

Run these commands in your terminal (replace YOUR_USERNAME with your GitHub username):

```bash
git remote add origin https://github.com/YOUR_USERNAME/Laynes_World.git
git push -u origin main
```

### Step 4: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings** (top menu)
3. Click on **Pages** (left sidebar)
4. Under "Build and deployment":
   - Source: Select **GitHub Actions**
5. Wait a few minutes for the deployment to complete

### Step 5: Access Your Dashboard

Your dashboard will be live at:
```
https://YOUR_USERNAME.github.io/Laynes_World/
```

The GitHub Actions workflow will automatically deploy your app whenever you push changes to the main branch.

## Monitoring Deployment

1. Go to the **Actions** tab in your GitHub repository
2. You'll see the "Deploy to GitHub Pages" workflow running
3. Click on it to see the progress
4. Once complete (green checkmark), your site is live!

## Making Updates

Whenever you want to update your dashboard:

```bash
git add .
git commit -m "Description of your changes"
git push
```

The site will automatically redeploy with your changes.

## Alternative: Manual Deployment

If you prefer manual deployment:

```bash
npm run deploy
```

This will build and deploy directly to the gh-pages branch.

## Troubleshooting

### Deployment fails
- Check the Actions tab for error messages
- Ensure your repository is public
- Verify the base path in vite.config.ts matches your repo name

### Site shows 404
- Wait 5-10 minutes after first deployment
- Check that GitHub Pages is enabled in Settings > Pages
- Verify the URL matches: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

### Blank page
- Check browser console for errors
- Verify the base path in vite.config.ts is correct
- Clear browser cache and hard refresh (Ctrl+Shift+R)

## Next Steps

Once deployed, you can:
1. Share the URL with others
2. Add a custom domain (Settings > Pages > Custom domain)
3. Continue developing locally with `npm run dev`
4. Push updates anytime to automatically redeploy

## Environment Variables for Production

Currently, the app uses mock data. To connect to real APIs:

1. Get API keys for:
   - News API
   - YouTube Data API
   - Deals API
   - Google Calendar API (OAuth)
   - Microsoft Graph API (OAuth)

2. Add them as GitHub Secrets:
   - Go to Settings > Secrets and variables > Actions
   - Click "New repository secret"
   - Add each API key

3. Update the GitHub Actions workflow to use these secrets

4. Update the environment configuration to use production values

## Support

If you encounter issues:
- Check the GitHub Actions logs
- Review the browser console for errors
- Ensure all dependencies are installed: `npm install`
- Try rebuilding: `npm run build`
