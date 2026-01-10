# White Screen Troubleshooting Guide

## Kindergarten Race - Educational Game

**Last Updated:** January 10, 2026  
**Version:** 1.0.0

---

## 🎯 Quick Fix Summary

**Issue:** White screen with `Uncaught TypeError: can't access property "useLayoutEffect" of undefined`

**Root Cause:** React 19 packages were being split incorrectly during Vite build process, causing React internals to be undefined when accessed by child chunks.

**Solution:** Updated `vite.config.ts` to consolidate all React-related packages (`react`, `react-dom`, `scheduler`, `jsx-runtime`, `react-error-boundary`) into a single vendor chunk.

**Status:** ✅ RESOLVED

---

## 📋 Table of Contents

1. [Browser Console Debugging](#1-browser-console-debugging)
2. [Build Process Issues](#2-build-process-issues)
3. [Deployment-Specific Problems](#3-deployment-specific-problems)
4. [Asset Loading Failures](#4-asset-loading-failures)
5. [React/Vite Configuration Issues](#5-reactvite-configuration-issues)
6. [Network and CORS Problems](#6-network-and-cors-problems)
7. [Browser Compatibility](#7-browser-compatibility)
8. [Advanced Debugging Techniques](#8-advanced-debugging-techniques)

---

## 1. Browser Console Debugging

### Step 1.1: Open Developer Tools

**All Browsers:**

- Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
- Press `Cmd+Option+I` (macOS)

**Expected Outcome:** Developer tools panel opens at bottom or side of browser

### Step 1.2: Check Console Tab

**Look for:**

- ❌ Red error messages
- ⚠️ Yellow warnings
- 🔵 Blue informational messages

**Common Errors & Solutions:**

| Error Message                           | Root Cause                     | Solution                                         |
| --------------------------------------- | ------------------------------ | ------------------------------------------------ |
| `useLayoutEffect of undefined`          | React bundle splitting issue   | See [Section 5.1](#51-react-19-bundle-splitting) |
| `Cannot read property 'X' of undefined` | Missing dependency or import   | Check import statements                          |
| `Failed to fetch`                       | Network/CORS issue             | See [Section 6](#6-network-and-cors-problems)    |
| `SyntaxError: Unexpected token`         | Build corruption or cache      | Clear cache and rebuild                          |
| `Module not found`                      | Missing file or incorrect path | Verify file exists                               |

### Step 1.3: Check Network Tab

**Instructions:**

1. Click **Network** tab in DevTools
2. Reload page (`Ctrl+R` or `Cmd+R`)
3. Look for red/failed requests

**Expected Outcome:** All resources should show `200` status (green)

**⚠️ Warning Signs:**

- `404` - File not found (missing build artifacts)
- `500` - Server error (deployment issue)
- `CORS error` - Cross-origin policy violation

---

## 2. Build Process Issues

### Step 2.1: Clean Build

```bash
# Remove old build artifacts
rm -rf dist node_modules/.vite

# Rebuild from scratch
npm run build
```

**Expected Output:**

```
✓ built in ~20-30s
dist/index.html                    5.72 kB
dist/assets/vendor-react-*.js    234.08 kB
```

### Step 2.2: Verify Build Contents

```bash
# List critical files
ls dist/
ls dist/assets/

# Should include:
# - index.html
# - assets/vendor-react-*.js
# - assets/index-*.js
# - assets/css/index-*.css
```

### Step 2.3: Test Build Locally

```bash
# Serve production build locally
npm run preview

# Or use static server
npx serve dist
```

**Access:** http://localhost:4173 (or port shown)

**Expected Outcome:** App renders without errors

### Step 2.4: Check Node Version

```bash
node --version
```

**Required:** v20.18+ or v22.12+ (Vite 7 requirement)

**⚠️ If version is too old:**

```bash
# Install NVM (Node Version Manager)
# Then install correct version:
nvm install 22
nvm use 22
```

---

## 3. Deployment-Specific Problems

### 3.1 Vercel Deployment

#### Step 3.1.1: Check Build Logs

1. Go to Vercel Dashboard → Deployments
2. Click on latest deployment
3. View **Build Logs** tab

**Look for:**

- ❌ Build failures
- ⚠️ Module resolution warnings
- 📦 Large bundle warnings

#### Step 3.1.2: Environment Variables

**Required Variables:** None for basic deployment

**Optional:**

- `NODE_VERSION=22.12.0` (if build uses wrong Node)

#### Step 3.1.3: Force Redeploy

```bash
# From local machine
vercel --prod --force

# Or via dashboard
# Deployments → ⋯ Menu → Redeploy
```

### 3.2 Docker/nginx Deployment

#### Step 3.2.1: Check nginx Configuration

```nginx
# Correct configuration (from nginx.conf)
location / {
    try_files $uri $uri/ /index.html;  # SPA fallback
    add_header Cache-Control "no-cache";
}

location ~* \.(js|css|png|jpg|jpeg|gif|ico|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### Step 3.2.2: Build Docker Image

```bash
# Build with correct Node version
docker build -t k1run:latest .

# Run locally to test
docker run -p 8080:80 k1run:latest
```

**Access:** http://localhost:8080

---

## 4. Asset Loading Failures

### Step 4.1: Audio Files

**Issue:** Audio may fail silently without blocking render

**Check:**

```javascript
// In browser console
console.log(import.meta.glob("../../../sounds/*.{wav,mp3}"));
```

**Expected:** Large object with ~500+ audio file paths

**⚠️ If empty:** Audio files missing from `sounds/` directory

### Step 4.2: CSS Backgrounds

**Issue:** Background images fail to load

**Check Network tab for:**

- `backgrounds-real.css` - Should be 200 OK
- Background image files (`.jpg`, `.png`)

**Fix:**

```bash
# Verify backgrounds exist
ls src/*.css | grep background
```

### Step 4.3: Font Loading

**Issue:** Google Fonts blocked or slow

**Fallback:** App uses `Fredoka` from Google Fonts with fallback to system fonts

**Check:**

```css
/* In DevTools Computed tab, verify font-family */
font-family: "Fredoka", system-ui, sans-serif;
```

---

## 5. React/Vite Configuration Issues

### 5.1 React 19 Bundle Splitting

**THE FIX for white screen issue:**

#### Problem

Vite's `manualChunks` was splitting React packages incorrectly:

- `react` → `vendor-react` chunk
- `react-error-boundary` → `vendor-react-utils` chunk (WRONG!)

When `vendor-react-utils` loaded before `vendor-react`, it tried to access React internals that didn't exist yet.

#### Solution

**File:** `vite.config.ts`

```typescript
manualChunks(id) {
  if (id.includes("node_modules")) {
    // CRITICAL: ALL React packages in ONE chunk
    if (
      id.includes("react") ||
      id.includes("scheduler") ||
      id.includes("react-dom") ||
      id.includes("jsx-runtime") ||
      id.includes("react-error-boundary")  // ← Must be here!
    ) {
      return "vendor-react";
    }
    // ... other chunks
  }
}
```

**Key Rule:** Any package that imports from `react` or `react-dom` MUST be in `vendor-react` chunk.

### 5.2 ESBuild Target

**Ensure modern JS support:**

```typescript
// vite.config.ts
build: {
  target: ["es2020", "edge88", "firefox78", "chrome87", "safari14"],
}
```

### 5.3 Dependency Optimization

```typescript
optimizeDeps: {
  include: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    // ... other critical deps
  ],
}
```

---

## 6. Network and CORS Problems

### Step 6.1: Check CORS Headers

**Issue:** Cross-origin requests blocked

**For Vercel:**
Add `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Access-Control-Allow-Origin", "value": "*" }]
    }
  ]
}
```

### Step 6.2: Service Worker Issues

**Disable service worker for debugging:**

```javascript
// In src/main.tsx, comment out:
// import('./lib/service-worker-registration')
```

**Clear existing service workers:**

1. DevTools → Application tab
2. Service Workers section
3. Click "Unregister" for all workers

---

## 7. Browser Compatibility

### 7.1 Supported Browsers

| Browser | Minimum Version | Status             |
| ------- | --------------- | ------------------ |
| Chrome  | 87+             | ✅ Fully Supported |
| Edge    | 88+             | ✅ Fully Supported |
| Firefox | 78+             | ✅ Fully Supported |
| Safari  | 14+             | ✅ Fully Supported |
| IE 11   | N/A             | ❌ Not Supported   |

### 7.2 Test in Incognito/Private Mode

**Why:** Eliminates extension interference and cache issues

**Chrome/Edge:** `Ctrl+Shift+N`  
**Firefox:** `Ctrl+Shift+P`  
**Safari:** `Cmd+Shift+N`

### 7.3 Disable Browser Extensions

**Potential conflicts:**

- Ad blockers (may block Google Fonts)
- Privacy extensions (may block analytics)
- Script blockers (may block Vite's HMR in dev)

---

## 8. Advanced Debugging Techniques

### 8.1 React DevTools

**Install:** [React Developer Tools](https://react.dev/learn/react-developer-tools)

**Check:**

1. Components tab should show `<App>` tree
2. If blank → React not loading (bundle issue)

### 8.2 Performance Profiling

```javascript
// Check render performance in console
performance.mark("app-start");
// After app loads
performance.measure("app-load", "app-start");
performance.getEntriesByType("measure");
```

### 8.3 Source Maps

**Enable for debugging:**

```typescript
// vite.config.ts
build: {
  sourcemap: true,  // Temporarily enable
}
```

**⚠️ Warning:** Increases bundle size, disable in production

### 8.4 Bundle Analysis

```bash
# Install analyzer
npm install --save-dev rollup-plugin-visualizer

# Add to vite.config.ts plugins:
import { visualizer } from 'rollup-plugin-visualizer'
plugins: [
  react(),
  tailwindcss(),
  visualizer({ open: true })
]

# Build and view
npm run build
```

**Expected:** Browser opens with interactive bundle visualization

---

## 🚨 Emergency Checklist

If **nothing else works**, try these steps in order:

### ☐ Step 1: Hard Refresh

- Windows/Linux: `Ctrl+Shift+R`
- macOS: `Cmd+Shift+R`

### ☐ Step 2: Clear All Caches

```bash
# Browser cache: DevTools → Network → Disable cache (checkbox)
# Node cache:
rm -rf node_modules/.vite
rm -rf dist

# Rebuild:
npm run build
```

### ☐ Step 3: Fresh Install

```bash
# Backup package-lock.json first!
rm -rf node_modules package-lock.json
npm install
npm run build
```

### ☐ Step 4: Test in Different Browser

- Chrome → Try Firefox
- Check browser console for different errors

### ☐ Step 5: Check GitHub Issues

Search for similar issues:

- [Vite GitHub Issues](https://github.com/vitejs/vite/issues)
- [React GitHub Issues](https://github.com/facebook/react/issues)

---

## 📞 Getting Additional Help

### Information to Provide

When reporting issues, include:

1. **Error Message** (full text from console)
2. **Browser & Version** (e.g., Chrome 120)
3. **Operating System** (e.g., Windows 11)
4. **Build Output** (npm run build logs)
5. **Network Tab** (screenshot of failed requests)
6. **Steps to Reproduce**

### Useful Commands for Diagnostics

```bash
# Environment info
node --version
npm --version
git rev-parse HEAD  # Current commit

# Dependency versions
npm list react react-dom vite

# Build with verbose output
npm run build -- --debug

# Check for conflicting global packages
npm list -g --depth=0
```

---

## ✅ Post-Fix Verification

After applying fixes, verify:

### ☐ Development Mode Works

```bash
npm run dev
# App should load at http://localhost:5173
```

### ☐ Production Build Works

```bash
npm run build
npm run preview
# App should load at http://localhost:4173
```

### ☐ No Console Errors

- Open DevTools → Console
- Should show only info messages, no red errors

### ☐ React DevTools Shows Components

- Install React DevTools extension
- Components tab should show full app tree

### ☐ Network Requests Succeed

- All JavaScript files: 200 OK
- All CSS files: 200 OK
- Audio files: 200 OK (lazy loaded)

---

## 📚 Related Documentation

- [Main README](../README.md)
- [Architecture Decision Record](./ARCHITECTURE_DECISION_RECORD_DEC2025.md)
- [Deployment Guide](./NGINX_DEPLOYMENT_GUIDE.md)
- [Vercel Deployment Diagnostics](../VERCEL_DEPLOYMENT_DIAGNOSTIC_DEC29.md)

---

## 🔄 Version History

| Date       | Version | Changes                                                            |
| ---------- | ------- | ------------------------------------------------------------------ |
| 2026-01-10 | 1.0.0   | Initial comprehensive guide covering React 19 bundle splitting fix |

---

**Need immediate help?** Open browser DevTools (F12) → Console tab → Screenshot the error → Search this guide for the error message.
