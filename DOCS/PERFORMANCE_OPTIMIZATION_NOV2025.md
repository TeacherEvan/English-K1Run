# Performance Optimization - November 27, 2025

## Issue

The application was suffering from excessive re-renders (60fps) of the root `App` component.

## Root Cause

The `useGameLogic` hook was maintaining a `currentTime` state variable that was updated every frame via `requestAnimationFrame`. This state was passed down to `App` and then to `SplatEffect` and `FairyTransformation` components.
Because `currentTime` was a state variable in the hook used by `App`, every update triggered a re-render of `App` and its entire subtree.

## Fix Implemented

### 1. Removed Global Timer

- Removed `currentTime` state and `setCurrentTime` updates from `src/hooks/use-game-logic.ts`.
- Removed `currentTime` prop passing in `src/App.tsx`.

### 2. Removed `SplatEffect`

- Removed the legacy `SplatEffect` component entirely.
- Replaced with `FairyTransformation` which is more aligned with the game's theme.
- This eliminated a component that was previously dependent on the global timer.

### 3. Refactored `FairyTransformation`

- Removed dependency on `currentTime` prop.
- Implemented internal `requestAnimationFrame` loop to manage its own animation state.
- Component now manages its own re-renders (via internal state updates) without affecting the parent `App` component.
- Optimized dependency arrays to ensure stability.

## Impact

- **CPU Usage**: Significantly reduced as React no longer reconciles the entire component tree 60 times per second.
- **Frame Rate**: More stable 60fps for animations.
- **Battery Life**: Improved efficiency on mobile devices.
