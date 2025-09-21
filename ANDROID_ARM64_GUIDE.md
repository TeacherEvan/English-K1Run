# Android ARM64 / Termux Troubleshooting Guide

This guide helps resolve the `@rollup/rollup-android-arm64` module error when installing dependencies on Android ARM64 devices (like Termux).

## The Problem

When running `npm install` on Android ARM64 devices, you may encounter:

```
Error: Cannot find module @rollup/rollup-android-arm64. npm has a bug related to optional dependencies (https://github.com/npm/cli/issues/4828). Please try `npm i` again after removing both package-lock.json and node_modules directory.
```

This happens because:
1. Vite uses Rollup internally
2. Rollup has platform-specific optional dependencies
3. npm sometimes fails to properly resolve optional dependencies on ARM64 platforms
4. The `@rollup/rollup-android-arm64` package may not be available or properly indexed

## Solutions

### Quick Fix (Recommended)

```bash
# Method 1: Use the built-in Android install script
npm run install:android

# Method 2: Use the safe install script if the above fails
npm run install:safe
```

### Manual Solutions

#### Method 1: Clean Install
```bash
# 1. Clean everything
rm -rf node_modules package-lock.json

# 2. Clear npm cache
npm cache clean --force

# 3. Install with legacy peer deps
npm install --legacy-peer-deps
```

#### Method 2: Skip Optional Dependencies
```bash
npm install --no-optional
```

#### Method 3: Use Different Package Manager
```bash
# Using Yarn
npm install -g yarn
yarn install

# Using pnpm
npm install -g pnpm
pnpm install
```

#### Method 4: Platform Requirements Override
```bash
npm install --ignore-platform-reqs
```

### If You Still Have Issues

1. **Check your Node.js version:**
   ```bash
   node --version  # Should be 18+ 
   npm --version   # Should be 8+
   ```

2. **Update npm:**
   ```bash
   npm install -g npm@latest
   ```

3. **Use a different Node.js distribution:**
   - Try Node.js from different sources (nvm, official binaries)
   - Some ARM64 builds work better than others

4. **Manual dependency management:**
   ```bash
   # Install core dependencies only, skip dev dependencies initially
   npm install --production
   
   # Then install dev dependencies
   npm install --only=dev --no-optional
   ```

## Why This Happens

The issue is related to:
- npm's handling of optional dependencies on non-standard platforms
- Platform-specific binary packages not being properly cached or downloaded
- Differences in how ARM64 Android environments handle native modules

## Project Configuration

The project includes an `.npmrc` file with settings optimized for this issue:
- `optional=true` - Allows skipping failed optional dependencies
- Extended timeouts for slower mobile connections
- More flexible engine requirements

## Development Server

Once installed successfully, you can run:
```bash
npm run dev
```

The development server should start normally and be accessible at `http://localhost:5173/`.

## Need Help?

If none of these solutions work:
1. Check the [npm CLI issue #4828](https://github.com/npm/cli/issues/4828)
2. Open an issue with your specific error output
3. Consider using Docker as an alternative (see main README)