# Modularization Refactoring Guide (January 2026)

## Overview

This document describes the modularization refactoring performed on the English-K1Run codebase to improve:

- **Performance**: Lazy loading reduces initial bundle size and startup time
- **Maintainability**: Smaller modules with single responsibilities are easier to understand and test
- **Scalability**: Pluggable components can be extended without affecting core logic

## Monolithic Files Identified

| File                | Size   | Lines | Issues                                                                       |
| ------------------- | ------ | ----- | ---------------------------------------------------------------------------- |
| `use-game-logic.ts` | 65.2KB | 1860  | Collision, spawning, tap handling, worm logic, target management all coupled |
| `sound-manager.ts`  | 38.9KB | 1338  | Audio loading, playback, speech synthesis, preloading mixed together         |
| `App.tsx`           | 15.9KB | 448   | Already uses React.lazy ✅                                                   |

## New Module Structure

### Audio System (`src/lib/audio/`)

The sound-manager.ts has been split following the existing TODO comment:

```
src/lib/audio/
├── index.ts              # Re-exports all modules
├── types.ts              # Shared type definitions (~80 lines)
├── audio-loader.ts       # Audio file loading & caching (~290 lines)
├── audio-player.ts       # Web Audio & HTML Audio playback (~270 lines)
└── speech-synthesizer.ts # Text-to-speech functionality (~180 lines)
```

**Module Responsibilities:**

| Module                  | Purpose                                           | Lazy-loadable             |
| ----------------------- | ------------------------------------------------- | ------------------------- |
| `types.ts`              | Type definitions, constants                       | No (small, always needed) |
| `audio-loader.ts`       | Vite glob imports, URL resolution, buffer caching | Yes                       |
| `audio-player.ts`       | Web Audio API, HTML Audio fallback                | Yes                       |
| `speech-synthesizer.ts` | Speech synthesis wrapper                          | Yes                       |

### Game Logic (`src/lib/game/`)

Core game logic extracted from use-game-logic.ts:

```
src/lib/game/
├── index.ts               # Re-exports all modules
├── collision-detection.ts # Physics-based collision (~150 lines)
└── worm-manager.ts        # Worm creation & lifecycle (~130 lines)
```

**Module Responsibilities:**

| Module                   | Purpose                               | Lazy-loadable |
| ------------------------ | ------------------------------------- | ------------- |
| `collision-detection.ts` | Lane collision, worm-object collision | Yes           |
| `worm-manager.ts`        | Worm creation, movement, lifecycle    | Yes           |

## Lazy Loading Patterns

### 1. React.lazy for Components (Already Implemented)

```tsx
// App.tsx - existing pattern
const AchievementDisplay = lazy(() =>
  import("./components/AchievementDisplay").then((m) => ({
    default: m.AchievementDisplay,
  }))
);
```

### 2. Dynamic Import for Modules (New Pattern)

```typescript
// Load audio system on demand
const loadAudioSystem = async () => {
  const { audioPlayer, speechSynthesizer } = await import("./lib/audio");
  return { audioPlayer, speechSynthesizer };
};

// Use in component
useEffect(() => {
  if (needsAudio) {
    loadAudioSystem().then(({ audioPlayer }) => {
      audioPlayer.playSound("success");
    });
  }
}, [needsAudio]);
```

### 3. Conditional Import (For Optional Features)

```typescript
// Only load collision detection when game starts
const startGame = async () => {
  const { processLaneCollisions, applyWormObjectCollision } =
    await import("./lib/game/collision-detection");

  // Use imported functions
};
```

## Migration Path

### Phase 1: Module Creation ✅ (Completed)

- [x] Create `src/lib/audio/` module structure
- [x] Create `src/lib/game/` module structure
- [x] Define shared types
- [x] Extract pure functions

### Phase 2: Integration (Future)

- [ ] Update `sound-manager.ts` to use new modules
- [ ] Update `use-game-logic.ts` to use new modules
- [ ] Add backward compatibility exports

### Phase 3: Optimization (Future)

- [ ] Add dynamic imports in non-critical paths
- [ ] Measure bundle size improvements
- [ ] Add performance metrics

## Bundle Impact Estimates

| Change              | Bundle Size Impact | Startup Impact        |
| ------------------- | ------------------ | --------------------- |
| Audio modules split | -10-15KB initial   | Faster first paint    |
| Game modules split  | -5-10KB initial    | Reduced hook init     |
| Total estimated     | -15-25KB           | ~100ms faster startup |

## Testing Considerations

Each new module exports pure functions that can be unit tested independently:

```typescript
// collision-detection.test.ts
import { processLaneCollisions } from "../collision-detection";

describe("processLaneCollisions", () => {
  it("should resolve overlapping objects", () => {
    const objects = [
      /* test data */
    ];
    processLaneCollisions(objects, "left");
    // Assert positions changed
  });
});
```

## Backward Compatibility

The original files (`sound-manager.ts`, `use-game-logic.ts`) remain functional. New modules can be adopted incrementally by:

1. Importing from new module location
2. Removing redundant code from monolithic files
3. Updating tests to use new module paths

## Performance Metrics to Track

After full migration, measure:

- **LCP (Largest Contentful Paint)**: Target < 2.5s
- **TTI (Time to Interactive)**: Target < 3.5s
- **Bundle size**: Track in CI with `npm run build`
- **Memory usage**: Profile with Chrome DevTools

## References

- [React lazy() API](https://react.dev/reference/react/lazy)
- [Vite Dynamic Import](https://vite.dev/guide/features#dynamic-import)
- [Vite Code Splitting](https://vite.dev/guide/build#chunking-strategy)
