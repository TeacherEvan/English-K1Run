# Audio Lazy Loading Implementation - November 2025

## Overview

To improve initial application load time and reduce memory usage, the audio system has been refactored to use lazy loading. Previously, all audio file URLs were resolved at startup, which could increase the initial bundle size and processing time.

## Changes Implemented

### 1. Lazy Glob Import

Modified `src/lib/sound-manager.ts` to use lazy imports for audio files:

```typescript
// Before (Eager)
const rawAudioFiles = import.meta.glob('../../sounds/*.{wav,mp3}', {
    eager: true,
    import: 'default',
    query: '?url'
})

// After (Lazy)
const rawAudioFiles = import.meta.glob('../../sounds/*.{wav,mp3}', {
    import: 'default',
    query: '?url'
})
```

### 2. Loader Registry

- Replaced `audioUrlIndex` (which stored URLs directly) with `audioLoaderIndex` (which stores loader functions).
- Added `resolvedUrlCache` to store URLs after they are fetched, preventing repeated module resolution.

### 3. On-Demand Resolution

- Implemented `getUrl(key)` which:
  1. Checks `resolvedUrlCache`.
  2. If missing, calls the loader function from `audioLoaderIndex`.
  3. Caches and returns the resolved URL.
- Updated `loadFromIndex` and `playWithHtmlAudio` to use this async resolution mechanism.

## Impact

- **Startup**: The application no longer resolves 100+ audio modules at startup. It only registers the loader functions.
- **Runtime**: When a sound is played for the first time, there is a tiny additional step to fetch the module containing the URL (if not already bundled) and then fetch the audio file.
- **Network**: Audio assets are strictly fetched on-demand.

## Verification

- Build process confirms generation of individual chunks for audio assets (e.g., `dist/assets/apple-....js`), confirming that they are split out of the main bundle.
- Type safety verified via `npm run build`.
