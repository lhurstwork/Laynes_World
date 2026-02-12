# Troubleshooting Guide

## Blank Page on GitHub Pages

If you see a blank page when visiting your deployed site, follow these steps:

### Step 1: Clear Browser Cache
The most common issue is browser caching.

**Chrome/Edge:**
1. Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Or open DevTools (F12) → Right-click refresh button → "Empty Cache and Hard Reload"

**Firefox:**
1. Press `Ctrl + Shift + Delete`
2. Select "Cached Web Content" → Clear Now
3. Refresh the page

### Step 2: Check Browser Console
1. Open your browser's Developer Tools (F12)
2. Go to the "Console" tab
3. Look for any error messages (red text)
4. Common errors and solutions:

**Error: "Failed to load module"**
- Solution: The base path might be wrong. Check `vite.config.ts`

**Error: "404 Not Found"**
- Solution: Assets aren't loading. Wait 5 minutes for deployment to complete

**Error: "Unexpected token '<'"**
- Solution: JavaScript file is loading HTML instead. Check base path configuration

### Step 3: Verify Deployment Completed
1. Go to: https://github.com/lhurstwork/Laynes_World/actions
2. Check that the latest workflow has a green checkmark ✓
3. If it's still running (yellow dot), wait for it to complete
4. If it failed (red X), click on it to see the error

### Step 4: Check the Network Tab
1. Open Developer Tools (F12)
2. Go to the "Network" tab
3. Refresh the page (Ctrl+R)
4. Look for any failed requests (red status codes)
5. Check if assets are loading from the correct URL:
   - Should be: `https://lhurstwork.github.io/Laynes_World/assets/...`
   - Not: `https://lhurstwork.github.io/assets/...`

### Step 5: Verify GitHub Pages Settings
1. Go to: https://github.com/lhurstwork/Laynes_World/settings/pages
2. Verify:
   - Source is set to "GitHub Actions"
   - Your site is published at: `https://lhurstwork.github.io/Laynes_World/`

### Step 6: Test Locally
To verify the build works locally:

```bash
npm run build
npm run preview
```

Then open: http://localhost:4173/Laynes_World/

If it works locally but not on GitHub Pages, the issue is with deployment configuration.

## Common Issues and Solutions

### Issue: Page loads but shows "Loading..." forever
**Cause:** JavaScript bundle failed to load or execute, OR Jekyll processing is interfering
**Solution:**
1. Check browser console for errors (especially "Failed to load resource: 404" for main.tsx)
2. If you see a 404 error for `main.tsx`, this means Jekyll is processing the site
   - Verify `public/.nojekyll` file exists in your repository
   - The `.nojekyll` file should be empty and located in the `public/` directory
   - After adding it, rebuild and redeploy
3. Verify all assets loaded successfully in Network tab
4. Try incognito/private browsing mode
5. Wait 10-15 minutes for GitHub Pages CDN to clear cache

### Issue: Styles are missing (unstyled content)
**Cause:** CSS file failed to load
**Solution:**
1. Check Network tab for failed CSS requests
2. Verify base path in `vite.config.ts` matches repo name
3. Clear cache and hard refresh

### Issue: 404 Error on GitHub Pages
**Cause:** GitHub Pages not properly configured
**Solution:**
1. Ensure repository is public
2. Enable GitHub Pages in Settings → Pages
3. Set source to "GitHub Actions"
4. Wait 5-10 minutes after first deployment

### Issue: Jekyll Processing Interference (404 for main.tsx)
**Cause:** GitHub Pages uses Jekyll by default, which can interfere with Vite builds
**Symptoms:**
- Browser console shows: `Failed to load resource: the server responded with a status of 404 () main.tsx:1`
- Loading spinner never goes away
- Site worked locally but fails on GitHub Pages

**Solution:**
1. Verify `.nojekyll` file exists in `public/` directory
2. The file should be completely empty (0 bytes)
3. Rebuild the project: `npm run build`
4. Verify `.nojekyll` is in the `dist/` folder after build
5. Commit and push changes
6. Wait 10-15 minutes for GitHub Pages CDN to propagate changes
7. Clear browser cache completely (Ctrl+Shift+Delete)
8. Try accessing in incognito mode

**Why this happens:**
Jekyll processes files starting with underscores differently, which can break Vite's asset loading. The `.nojekyll` file tells GitHub Pages to skip Jekyll processing entirely.

### Issue: Changes not appearing
**Cause:** Browser cache or deployment not complete
**Solution:**
1. Check Actions tab to verify deployment completed
2. Clear browser cache
3. Try incognito/private browsing mode
4. Wait 5 minutes and try again

## Getting Help

If none of these solutions work:

1. **Check the browser console** - This is the most important step!
2. **Check GitHub Actions logs** - Look for build/deployment errors
3. **Try a different browser** - Rules out browser-specific issues
4. **Test locally** - Confirms the build itself works

## Debug Information to Collect

If you need to report an issue, collect this information:

1. Browser and version (e.g., Chrome 120)
2. URL you're trying to access
3. Screenshot of browser console errors
4. Screenshot of Network tab showing failed requests
5. Link to failed GitHub Actions workflow (if any)
6. Whether it works locally with `npm run preview`

## Quick Fixes

**Try these in order:**

1. ✅ Hard refresh: `Ctrl + Shift + R`
2. ✅ Clear cache and reload
3. ✅ Try incognito/private mode
4. ✅ Wait 5 minutes and try again
5. ✅ Check GitHub Actions completed successfully
6. ✅ Verify GitHub Pages is enabled
7. ✅ Check browser console for errors

## Still Not Working?

If you've tried everything above and it's still not working:

1. Check if the site works in incognito mode
2. Try accessing from a different device/network
3. Verify the deployment workflow completed successfully
4. Check if there are any GitHub status issues: https://www.githubstatus.com/

## Contact

For additional help, you can:
- Check GitHub Pages documentation: https://docs.github.com/en/pages
- Review Vite deployment guide: https://vitejs.dev/guide/static-deploy.html
- Check the repository's Actions tab for deployment logs
