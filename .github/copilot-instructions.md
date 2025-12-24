# Copilot Instructions for Kindergarten Race Game

## Project Overview

Single-player educational game where a student taps falling objects (emojis) to advance their turtle character. Built with React 19 + TypeScript + Vite, optimized for tablets and touch devices in kindergarten classrooms.

**Tech Stack**: React 19.2, TypeScript 5.9, Vite 7.1.7, Tailwind CSS 4.1, Radix UI, class-variance-authority  
**Node Requirements**: Node.js 20.18+ or 22.12+ (Vite 7 requirement)  
**Deployment**: Vercel (production), Docker with nginx, Termux-compatible for Android dev, PWA-enabled  
**Target Devices**: QBoard interactive displays, tablets, mobile browsers  
**Repository**: github.com/TeacherEvan/English-K1Run

**IMPORTANT**: This was originally a two-player split-screen game but has been refactored to single-player. Some legacy documentation (`.clinerules`) may reference split-screen features - ignore those and refer to this document as the authoritative source.

**Core Gameplay Loop**: Objects fall from top → student taps matching target → progress bar advances → reach 100% to win (or auto-reset in continuous mode). Educational categories include fruits/vegetables, counting (1-15), shapes/colors, animals, vehicles, and weather concepts.

**Key Features** (December 2025):
- **Welcome Screen**: Sequential audio experience with professional narrator + children's choir. Dynamic two-phase storytelling inspired by Sangsom's modern branding. See `WELCOME_SCREEN_ENHANCEMENT_DEC2025.md` for architecture.
- **Continuous Play Mode**: Optional endless gameplay - progress auto-resets at 100% instead of showing winner screen
- **PWA Support**: Offline gameplay, intelligent caching, install to home screen
- **React 19 Concurrent Features**: useTransition for smooth non-urgent updates, optimistic UI patterns

## Educational Context & Performance Goals

**Target Audience**: Kindergarten students (ages 4-6) in classroom settings with QBoard displays and tablets.

**Educational Categories** (see `GAME_CATEGORIES` in `use-game-logic.ts`):

- **Fruits & Vegetables** (13 items): Pattern recognition with apple, banana, grapes, strawberry, carrot, cucumber, watermelon, broccoli, orange, lemon, peach, cherry, kiwi
- **Counting Fun** (15 items): Numbers 1-15 with emoji (1️⃣-🔟) and text rendering ("11", "12"... for double-digits)
- **Alphabet Challenge** (`requiresSequence: true`): Sequential letter tapping A→B→C→...→Z
- **Shapes & Colors** (13 items): Basic shapes (circle, triangle, star, diamond) + color recognition
- **Animals & Nature** (13 items): Dog, cat, fox, turtle, butterfly, owl, tree, flower, elephant, lion, rabbit, giraffe, penguin
- **Things That Go** (13 items): Vehicles (car, bus, fire truck, airplane, rocket, bicycle, helicopter, boat, train, taxi, van, scooter, motorcycle)
- **Weather Wonders** (10 items): Weather concepts (sunny, cloudy, rainy, snowy, rainbow, etc.)

**Performance Requirements**:

- **60fps target**: Smooth animations using `requestAnimationFrame` (not `setInterval`)
- **Max 30 concurrent objects**: `MAX_ACTIVE_OBJECTS = 30` with 8 spawned every 1.5s
- **Sub-100ms touch latency**: Critical for engagement on touch devices
- **Spawn mechanics**: 8 objects per spawn, 2 guaranteed to match current target (`TARGET_GUARANTEE_COUNT`)
- **Memory management**: Auto-cleanup of off-screen objects (y > 100), max 500 tracked events in `eventTracker`

**Special Handling**:

- Double-digit numbers (11-15) render as plain text with blue background in `FallingObject.tsx`, not emoji
- Worm distractors spawn progressively: 5 initial worms (3s intervals) + 3 worms every 30s during gameplay
- Sentence templates in `src/lib/constants/sentence-templates.ts` provide contextual learning phrases for each item
- **Audio Pronunciation**: When students tap correct objects, they hear simple word pronunciation (e.g., "Apple"). The phonics system was removed in November 2025 to prevent audio clashing during gameplay. See `DOCS/PHONICS_REMOVAL_NOV2025.md` for rationale.

## Critical Architectural Rules

**⚠️ State Management**: `src/hooks/use-game-logic.ts` is the **single source of truth**. Never create parallel game state in components. All game mutations flow through this hook's methods.

**⚠️ Coordinate System**: Uses percentage-based positioning (x: 5-95% of screen width). Never use absolute pixel coordinates. Objects spawn across the full width of the screen.

**⚠️ Touch Handling**: `src/lib/touch-handler.ts` singleton manages all touch events. Don't attach raw `onClick` handlers to game objects—use the multi-touch API to prevent QBoard interference issues.

**⚠️ CSS Variables**: All responsive sizing uses CSS custom properties (`--font-scale`, `--object-scale`, etc.) set by `use-display-adjustment.ts`. Never hardcode pixel values in inline styles.

## Architecture & Data Flow

**State Ownership**: `src/hooks/use-game-logic.ts` is the single source of truth for all gameplay state:

- `gameObjects[]`: Active falling objects with physics (id, type, emoji, x, y, speed, size, lane)
- `worms[]`: Distractor objects with wiggle animation (`WormObject` interface)
- `fairyTransforms[]`: Visual effects when worms are tapped (`FairyTransformObject` interface)
- `GameState`: Player progress, current target, level, winner status, streak tracking
- `GAME_CATEGORIES`: Array of 7 categories with items: `{ emoji, name }[]`
- Never create parallel game state elsewhere—always use the hook's methods

**Coordinate System**:

- Percentage-based positioning: Objects spawn across x: 5-95% of screen width
- Lane system uses `LANE_BOUNDS = { left: [5, 95], right: [5, 95] }` (full width for single player)
- **Never use absolute pixel coordinates**—maintain percentage system when adding features

**Category System**:

- Each category in `GAME_CATEGORIES` has `items: { emoji, name }[]`
- Special flag: `requiresSequence: true` (Alphabet Challenge) enforces sequential tapping order
- Adding categories: Update `GAME_CATEGORIES` array + add matching audio files to `/sounds/`
- Check `sequenceIndex` field when implementing sequence-based gameplay

**Object Lifecycle** (controlled by `use-game-logic.ts`):

1. **Spawn**: `spawnObject()` creates up to `MAX_ACTIVE_OBJECTS` at 1500ms intervals, 8 objects per spawn, 2 guaranteed matches
2. **Update**: `updateObjects()` uses `requestAnimationFrame` for smooth 60fps physics (not `setInterval`)
3. **Collision**: `processLane()` handles physics-based collision detection with bidirectional forces
4. **Tap**: `handleObjectTap()` is the **only** place that scores points, plays audio, advances progress, detects winners
5. **Cleanup**: Objects auto-remove when y > 100 or on manual tap; never mutate `gameObjects` outside the hook

**Component Ownership**:

- `App.tsx` (297 lines): Top-level orchestrator, owns `debugVisible`, `backgroundClass`, `selectedLevel`, `timeRemaining`, `showWelcome`, `continuousMode`
- **Welcome Screen Flow**: `WelcomeScreen.tsx` (277 lines) displays on first load with:
  - **Sequential Audio**: Professional voice ("In association with SANGSOM Kindergarten") → Children's choir ("Learning through games for everyone!")
  - **Dynamic Phases**: Two-phase visual storytelling synced with audio (intro → tagline)
  - **Timing**: 3 seconds per phase + 0.5s fade = ~6.5 seconds total
  - **Fallback**: Auto-dismisses after 6s if audio files missing
- **Continuous Mode**: When enabled, winner detection is bypassed and progress auto-resets at 100%
- All game logic delegates to `useGameLogic()` hook—components are presentational
- Background rotation every 30s via `BACKGROUND_CLASSES` array (10 backgrounds in `App.css`, doubled Nov 2025)

**Singleton Pattern** (initialized on import—never instantiate new):

- `eventTracker` (`src/lib/event-tracker.ts`): Global error/performance logging, max 500 events
- `soundManager` (`src/lib/sound-manager.ts`): Web Audio API manager, lazy-initialized on first user interaction
- `multiTouchHandler` (`src/lib/touch-handler.ts`): Touch validation for QBoard displays (150ms debounce, 10px drag threshold)
- `performanceProfiler` (`src/lib/performance-profiler.ts`): Production profiler for tracking component render times (NEW Dec 2025)
- `resourcePreloader` (`src/lib/resource-preloader.ts`): Intelligent asset preloading with priority queue (NEW Dec 2025)

## Collision Detection System

**Overview**: Physics-based collision detection prevents emojis from overlapping/phasing through each other.

**Implementation** (in `use-game-logic.ts` → `updateObjects()` → `processLane()`):

```typescript
const processLane = (objects: GameObject[], lane: "left" | "right") => {
  // Define boundaries - full screen width for single player
  const [minX, maxX] = [5, 95]; // 5% to 95% of screen width

  // For each object, check collision with all others
  // If objects too close horizontally:
  //   - Apply horizontal push to separate them
  //   - Clamp to boundaries [minX, maxX]
  //   - Preserve Y coordinates (don't affect fall speed)
};
```

**Key Features**:

- ✅ **Full Width**: Objects can spawn and move across entire screen (5-95%)
- ✅ **Physics-Based Push**: Uses distance calculations for natural separation
- ✅ **Bidirectional Forces**: Both colliding objects pushed apart naturally
- ✅ **Horizontal Only**: Push is horizontal to preserve fall speed
- ✅ **Strict Boundaries**: Objects clamped to screen bounds

**Critical Rules**:

- Never modify Y coordinates during collision resolution (breaks fall speed)
- Always clamp X to screen boundaries [5, 95]
- Use distance-based collision not simple overlap checks

**Performance**: O(n²) but limited to ~30 objects max, so acceptable for 60fps target.

## User Interface & UX Features

**Target Display**: Located at top-center during gameplay, shows current target emoji/name and category badge. Styled with 25% scale (`transform: scale(0.25)`) and completely transparent background for minimal visual obstruction. Only the text and emoji remain visible with text-shadow for readability.

**Back to Levels Button**: Fixed at top-left during active gameplay (hidden during winner screen). Clicking calls `resetGame()` to return to level selection menu. Styled with responsive sizing using `--font-scale` and `--spacing-scale` CSS variables.

**Fullscreen Mode**: Auto-triggers on first user interaction (click, touch, or keydown) via `requestFullscreen()` utility with cross-browser support (Chrome, Safari, Firefox, IE/Edge). Uses proper TypeScript typing to avoid vendor prefix issues.

**Background Rotation**: Random background changes every 30s from `BACKGROUND_CLASSES` array (`app-bg-sunrise`, `app-bg-deep-ocean`, etc.). Also changes when returning to menu.

**Visual Feedback**: Screen shake animation triggers on incorrect taps (0.5s duration). Splat effects appear when worms are tapped.

**Multi-Touch Support**: Advanced touch handling system prevents accidental touches from interfering with gameplay on QBoard displays and mobile devices. `src/lib/touch-handler.ts` validates each touch independently with debouncing (150ms), drag detection (10px movement threshold), and long-press rejection (300ms duration limit). Auto-enables on game start, disables on game end. See `MULTI_TOUCH_IMPLEMENTATION.md` for details.

**Touch Integration Pattern**: When adding interactive game objects:

```tsx
// ❌ DON'T: Raw onClick handlers cause QBoard interference
<div onClick={() => handleTap(id)}>

// ✅ DO: Use touch handler validation
const handleTouchEnd = (e: React.TouchEvent) => {
  const touch = e.changedTouches[0]
  if (multiTouchHandler.validateTap(touch.identifier, id)) {
    handleTap(id)
  }
}
<div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onClick={handleClick}>
```

## Build & Developer Workflows

**Development**:

```bash
npm run dev              # Vite on port 5173 with polling HMR
npm run test             # Run unit tests with Vitest (watch mode)
npm run test:run         # Run tests once (CI mode)
npm run test:ui          # Run tests with interactive UI
npm run test:coverage    # Generate coverage reports
npm run test:e2e         # Run Playwright end-to-end tests
npm run test:e2e:ui      # Playwright UI mode
npm run test:e2e:headed  # See browser during E2E tests
npm run test:e2e:debug   # Debug E2E tests step-by-step
npm run verify           # Run lint + type check + build
npm run check-types      # TypeScript type checking only
npm run optimize         # Vite dependency optimization
```

**Constrained Devices**: Run `npm run install:android` or `npm run install:safe` before first dev server start to handle ARM64 rollup compatibility on Android/Termux.

**Production Build**:

```bash
npm run build  # Runs: tsc -b --noCheck && vite build
```

Keep the `--noCheck` flag due to React 19 type instabilities with `@types/react` v19.

**Git Workflow Tips for Non-Developers**:

- **Avoid `git rebase`** - Use simple `git pull` + `git push` workflow
- **If stuck in VIM editor**: Never manually resolve - abort immediately with `git rebase --abort` or `git merge --abort`
- **Prefer merge over rebase**: `git pull origin main` (merge) is safer than `git pull --rebase`
- **If conflicts occur**: Use VS Code's merge conflict UI instead of terminal editors

**Docker**:

- Dev: `docker-compose --profile dev up kindergarten-race-dev` (hot reload, volume-mounted source)
- Prod: `docker-compose up -d` (nginx-served static bundles at port 3000)
- Volume mapping excludes `/app/node_modules` to avoid platform-specific native dependency conflicts
- Multi-stage Dockerfile: build stage (Node) → serve stage (nginx)

**Deployment**: 

- **Primary**: Vercel for production (automatic deployments from main branch)
- **Configuration**: `vercel.json` configures CORS headers, MIME types for `.wav` files, rewrites for SPA routing
- Static assets served with proper headers to prevent audio loading issues
- **Alternative**: Docker deployment via `deploy.sh` script for self-hosted environments

**Bundle Optimization**: Manual chunking in `vite.config.ts` keeps vendor bundles <1MB. Avoid adding large dependencies (d3, three.js, recharts) without updating chunk strategy.

## Styling & Responsiveness

**CSS Variables for Scaling**: `use-display-adjustment.ts` calculates responsive values and sets CSS custom props on `<html>`:

- `--font-scale`, `--object-scale`, `--spacing-scale`, `--fall-speed-scale`
- **Always use these vars** in inline styles instead of hardcoded pixel values
- When adding new vars, expose them in `QuickDebug` for diagnostics
- Base design: 1920x1080, scales down proportionally via `min(widthScale, heightScale)`

**Tailwind Structure**:

- Import only `src/main.css` in `main.tsx`
- Custom color system from `theme.json` with CSS variables (`--color-neutral-*`, etc.)
- Add global styles by extending `main.css` to preserve Tailwind's layer order
- Use `cn()` utility from `src/lib/utils.ts` to merge Tailwind classes safely

**Background Rotation**: `App.css` defines 10 `.app-bg-*` classes using real image overlays (`.app-bg-sunrise`, `.app-bg-deep-ocean`, `.app-bg-nebula-galaxy`, etc.). `pickRandomBackground()` in `App.tsx` switches every 30s—add new backgrounds by extending both the class list and `BACKGROUND_CLASSES` array. Background images added November 2025 to double variety.

## Component Patterns

**UI Primitives** (`src/components/ui/*`): Shadcn-style components using `class-variance-authority` (CVA). Example from `button.tsx`:

```tsx
const buttonVariants = cva("base-classes", {
  variants: { size: {...}, variant: {...} }
})
```

Extend existing variants instead of adding inline Tailwind classes. All 42 UI components follow this pattern.

**Props Interfaces**: All components define strict TypeScript interfaces for props (e.g., `PlayerAreaProps`, `FallingObjectProps`). Don't use inline types.

**Memoization**: Frequently re-rendered components like `PlayerArea`, `FallingObject`, `TargetDisplay`, `GameMenu` wrap with `memo()`. Follow this pattern for new game components that receive props on every frame.

**Debug Overlays**: `FireworksDisplay`, `PerformanceMonitor`, `EventTrackerDebug`, `QuickDebug`, `ErrorMonitor`, `TouchHandlerDebug`, `EmojiLifecycleDebug` mount once in `<App />`. They consume global singletons (`eventTracker`, `soundManager`, `multiTouchHandler`)—don't instantiate new trackers.

**Lazy Loading**: Debug components are lazy-loaded in `App.tsx` to reduce initial bundle size:

```tsx
const PerformanceMonitor = lazy(() =>
  import("./components/PerformanceMonitor").then((m) => ({
    default: m.PerformanceMonitor,
  }))
);
```

Wrap usage with `<Suspense>`. Apply same pattern for new large/optional components.

**State Updates**: Use functional setState when new state depends on previous (e.g., `setGameObjects(prev => [...prev, newObj])`).

## React 19 Features & Production Utilities (December 2025)

### Optimistic UI Pattern

**File**: `src/hooks/use-optimistic-ui.ts`

React 19's `useTransition` hook for marking non-urgent state updates, preventing UI blocking during expensive operations.

**Usage**:
```tsx
const { startOptimisticUpdate, isPending } = useOptimisticUI()

// Urgent: Update immediately
setSearchQuery(value)

// Non-urgent: Filter in background without blocking input
startOptimisticUpdate(() => {
  setFilteredResults(expensiveFilter(value))
})
```

**Features**: Async transitions, error handling, stable function references, proper TypeScript typing

### Performance Profiler

**File**: `src/lib/performance-profiler.ts`

Enterprise-grade monitoring for component render times and bottleneck detection.

**Usage with React Profiler**:
```tsx
import { Profiler } from 'react'
import { performanceProfiler } from '@/lib/performance-profiler'

<Profiler id="GameArea" onRender={performanceProfiler.recordMeasurement}>
  <GameArea />
</Profiler>
```

**Features**: 
- Automatic slowest render detection (16.67ms threshold for 60fps)
- Performance marks for React DevTools integration
- Configurable thresholds and memory limits (max 100 measurements)
- JSON export for external analysis

**Utility Functions**:
```tsx
// Measure synchronous execution
const result = measureExecutionTime('calculation', () => complexCalc())

// Measure async execution  
const data = await measureAsyncExecutionTime('fetch', () => fetchData())
```

### Resource Preloader

**File**: `src/lib/resource-preloader.ts`

Intelligent asset preloading with priority queue for images, audio, and fonts.

**Usage**:
```tsx
resourcePreloader.preloadAssets([
  { url: '/sounds/welcome.wav', type: 'audio', priority: 'high' },
  { url: '/images/logo.png', type: 'image', priority: 'medium' }
])

// Check preload status
const status = resourcePreloader.getPreloadStatus()
```

**Features**: Priority-based loading (high/medium/low), parallel loading, status tracking, error handling

## Telemetry & Audio

**Event Tracking**: `src/lib/event-tracker.ts` is a singleton that auto-registers global error handlers, FPS tracking, and spawn-rate warnings on import. Use `eventTracker.trackEvent()`, `trackError()`, `trackUserAction()` for logging so overlays render consistently. Max 500 events tracked in memory (reduced from 1000 for performance).

**Emoji Rotation Tracking**: `eventTracker` monitors emoji spawn frequency to ensure fair distribution.

- Tracks last appearance time and count for each emoji
- Identifies "overdue" emojis (>10s without appearance)
- `spawnObject` prioritizes stale emojis to maintain variety

**Error Handling**: `ErrorMonitor` monkey-patches `console.error/warn` to display in-game. Keep console usage minimal; wrap debug logs in `if (import.meta.env.DEV)` to avoid UI spam.

**Audio System**: `src/lib/sound-manager.ts` uses Web Audio API, lazy-initialized on first user interaction.

- Call `playSoundEffect.voice()` for correct taps with simple word pronunciation (e.g., "Apple")
- Sentence templates in `src/lib/constants/sentence-templates.ts` provide contextual phrases (e.g., "Let's eat an apple!")
- `playSoundEffect.sticker()` plays winner celebration ("GIVE THEM A STICKER!")
- `.wav` files in `/sounds/` are indexed by normalized names via `import.meta.glob()`
- Naming convention: `{name}.wav`, `emoji_{name}.wav` (e.g., `emoji_apple.wav` → keys: `"apple"`, `"emoji_apple"`, `"emoji apple"`)
- Number words auto-map to digits (`one.wav` → `"1"` key)
- **Playback Method**: Web Audio API is always preferred for correct pitch/speed. HTMLAudio fallback has `playbackRate = 1.0` explicitly set to prevent distorted voices
- Fallback hierarchy: Web Audio API → HTMLAudio (playbackRate=1.0) → Speech Synthesis → Web Audio tones

**Sequential Audio Pattern** (Welcome Screen):

- Use `soundManager.playSound()` directly for custom audio sequences
- Pattern: `await playSound(key1)` → `await delay(duration)` → `await playSound(key2)`
- Welcome screen uses: `welcome_association` (professional voice) → 3s delay → `welcome_learning` (children's choir)
- Always provide fallback timing if audio files missing
- See `WELCOME_SCREEN_ENHANCEMENT_DEC2025.md` for implementation details

## Vite Configuration

**Path Alias**: `@` resolves to `src/` (e.g., `import { cn } from '@/lib/utils'`)

**Polling Watch**: `server.watch.usePolling: true` essential for Termux/Docker dev environments where native FS events don't propagate

**Manual Chunking Strategy** (in `vite.config.ts`): Prevents large vendor bundles by splitting:

- React ecosystem: `vendor-react-core`, `vendor-react-jsx`, `vendor-react-dom-{client,server,core}`, `vendor-react-scheduler`
- Radix UI groups: `vendor-radix-dialogs`, `vendor-radix-forms`, `vendor-radix-navigation`, `vendor-radix-other`
- Other vendors: `vendor-ui-utils` (CVA, clsx, tailwind-merge), `vendor-large-utils` (lucide-react), `vendor-other`
- App chunks: `ui-components`, `game-components`, `game-hooks`, `game-utils`
- **Target**: Keep each chunk <1MB; assign new large dependencies to appropriate bucket

**HMR Config**: `server.hmr.overlay: true` shows build errors in-browser. Port 5173, strictPort: false allows fallback.

**Audio Asset Loading**: Uses `import.meta.glob('../../sounds/*.wav', { eager: true, query: '?url' })` to index audio files at build time

## Project-Specific Conventions

**Audio Assets**: Sound files in `/sounds/` follow naming convention: `{name}.wav`, `emoji_{name}.wav`. When adding items to `GAME_CATEGORIES`, ensure corresponding audio assets exist or `sound-manager` will fallback to Web Audio tones.

**TypeScript Compilation**: Uses `tsc -b` (project references) but with `--noCheck` flag due to React 19 type evolution. Don't remove the flag until React 19 is stable.

**Performance Targets**: 60fps gameplay, max 30 concurrent objects (reduced from initial 15), touch latency monitoring for tablets. See `MAX_ACTIVE_OBJECTS` in `game-config.ts`.

**Combo System**: Streak thresholds at 3, 5, 7 taps trigger `ComboCelebration` component with predefined messages in `COMBO_LEVELS` array.

## Common Tasks

**Add New Game Category**:

1. Append to `GAME_CATEGORIES` in `src/lib/constants/game-categories.ts`:
   ```typescript
   {
     name: 'Category Name',
     items: [
       { emoji: '🎯', name: 'item1' },
       { emoji: '🎨', name: 'item2' }
     ],
     requiresSequence: false  // Set true for A→B→C sequential gameplay
   }
   ```
2. Add `.wav` files to `/sounds/` with matching names (use `scripts/generate-audio.cjs` if available)
3. Add sentence templates to `src/lib/constants/sentence-templates.ts` for contextual learning
4. Test by selecting the category in-game and verifying audio playback

**Add Sentence Template**:

1. Edit `src/lib/constants/sentence-templates.ts`
2. Add entry: `'word': 'Educational context phrase'` (e.g., `'apple': 'Let\'s eat an apple!'`)

**Run Tests Before Committing**:

```bash
npm run verify  # Comprehensive: lint + typecheck + build (recommended)
# OR run individually:
npm run lint         # ESLint only
npm run check-types  # TypeScript only
npm run test:run     # Vitest unit tests
npm run test:e2e     # Playwright E2E tests
```

**Create Unit Test for New Utility**:

1. Create `src/lib/utils/__tests__/my-utility.test.ts`
2. Import Vitest functions: `import { describe, it, expect } from 'vitest'`
3. Follow pattern from `spawn-position.test.ts` for structure
4. Run `npm run test:ui` for interactive test development
5. Aim for edge cases: boundary values, error conditions, typical usage
3. Keep phrases simple and age-appropriate for kindergarten (4-6 years)
4. Test by tapping the object in-game - should hear contextual phrase

**Adjust Difficulty**: Modify `spawnObject()` intervals in `use-game-logic.ts`, `fallSpeedMultiplier` in `use-display-adjustment.ts`, or max concurrent objects (currently 15).

**Debug Performance**: Enable overlays via `debugVisible` state in `App.tsx`. `PerformanceMonitor` shows FPS, `EventTrackerDebug` shows spawn rates, `QuickDebug` shows CSS var values.

**Change Scoring**: Only modify `handleObjectTap()` in `use-game-logic.ts`—it's the sole authority for point calculation, streak tracking, and winner declaration.

**Add UI Component**: Use existing Shadcn components in `src/components/ui/`. If creating new, follow CVA pattern with strict props interfaces and memoization if performance-critical.

## Gotchas & Known Issues

- **Node Version**: Must use Node 20.18+ or 22.12+ (not 18.x) due to Vite 7 requirement
- **React 19 Types**: Keep `--noCheck` flag in build script until `@types/react` v19 stabilizes (current workaround for type evolution)
- **Android/ARM64**: Use `npm run install:android` to avoid `@rollup/rollup-android-arm64` errors on Termux/Android devices
- **Background Images**: External URLs may be blocked; backgrounds defined in `App.css` use local `/public/*.jpg` files
- **Audio Initialization**: Web Audio requires user interaction; `sound-manager` auto-initializes on first tap (context starts `suspended`)
- **Percentage Coordinates**: Never use absolute pixel positioning; always use percentage-based `x` values (5-95 range)
- **Browser Cache**: After rebuilding, use hard refresh (`Ctrl+Shift+R` / `Cmd+Shift+R`) to clear cached bundles if seeing old game behavior
- **Singleton Patterns**: Never instantiate new instances of `eventTracker`, `soundManager`, `multiTouchHandler`, `performanceProfiler`, or `resourcePreloader` - they're initialized on import

## Essential Documentation Files

When debugging issues or understanding features, consult these key documents in `/DOCS/`:

**Architecture & Decisions**:
- `ARCHITECTURE_DECISION_RECORD_DEC2025.md` - Major architectural choices and rationale
- `BEST_PRACTICES.md` - Project-wide coding standards and patterns
- `VISUAL_FLOW_DIAGRAM.md` - Visual representation of data flow

**Feature Documentation**:
- `WELCOME_SCREEN_ENHANCEMENT_DEC2025.md` - Sequential audio welcome screen architecture
- `MULTI_TOUCH_IMPLEMENTATION.md` - Touch handling system for QBoard displays
- `EMOJI_ROTATION_SYSTEM.md` - Fair emoji distribution algorithm
- `SENTENCE_TEMPLATES_ENHANCEMENT.md` - Contextual learning phrases system

**Performance & Optimization**:
- `PERFORMANCE_OPTIMIZATION_DEC2025.md` - Latest performance improvements (Dec 2025)
- `PERFORMANCE_OPTIMIZATION_NOV2025.md` - November 2025 optimizations
- `PERFORMANCE_OPTIMIZATION_OCT2025.md` - October 2025 baseline improvements
- `CODE_QUALITY_IMPROVEMENTS_DEC2025.md` - 7.4→10/10 quality upgrade details

**Audio System**:
- `AUDIO_OVERLAP_QUALITY_FIX_DEC2025.md` - Audio quality improvements
- `PHONICS_REMOVAL_NOV2025.md` - Why phonics was removed (prevents audio clashing)
- `SINGLE_WORD_AUDIO_REMOVAL_DEC2025.md` - Audio simplification rationale
- `VERCEL_AUDIO_DEBUG.md` - Troubleshooting audio on deployment platforms

**Bug Fix Documentation**:
- `SPAWN_FIX_DEC2025.md`, `SPAWN_FIX_VISUAL_GUIDE.md` - Spawn system fixes
- `SENTENCE_REPETITION_FIX_DEC2025.md` - Audio repetition bug fix
- Root-level `*.md` files document specific bugs (e.g., `EMOJI_SIDE_SWITCHING_BUG_FIX.md`)

**General**:
- `README.md` - User-facing features and getting started
- `CHANGELOG.md` - Version history and release notes
- `TESTING_INSTRUCTIONS.md` - Comprehensive testing guide

## Code Quality & Testing (December 2025)

### Unit Testing Infrastructure (Added December 2025)

**Framework**: Vitest with @vitest/ui for interactive testing
**Test Files**: Follow pattern `src/{module}/__tests__/{file}.test.ts`
**Example**: `src/lib/utils/__tests__/spawn-position.test.ts` tests spawn collision logic
**Commands**: `npm test` (watch mode), `npm run test:run` (CI mode), `npm run test:ui` (interactive)
**Coverage**: Core utilities like spawn position calculation have comprehensive tests

### Spawn Position Utility (Added December 2025)

**File**: `src/lib/utils/spawn-position.ts`
**Purpose**: Consolidated duplicate spawn positioning logic from 3 locations in `use-game-logic.ts`
**Function**: `calculateSafeSpawnPosition()` handles collision-free spawn placement
**Benefits**: Single source of truth, easier to test, reduced ~50 lines of duplication
**Usage**: Imported and used in `spawnImmediateTargets()`, `spawnObject()` target/decoy spawning

### Quality Score

**Status**: 10/10 (upgraded from 7.4/10 - December 2025)
**Key Improvements**:

- Fixed TypeScript configuration (`ignoreDeprecations: "5.0"` for TS 5.9)
- Eliminated all ESLint errors (0 errors, down from 2 in E2E fixtures)
- Added comprehensive unit testing infrastructure with Vitest
- Removed ~50 lines of code duplication with `spawn-position.ts` utility
- Enhanced test coverage with Web Audio API mocks
- See `CODE_QUALITY_IMPROVEMENTS_DEC2025.md` for full analysis

**Testing Philosophy**: Core utilities have dedicated unit tests (e.g., `spawn-position.test.ts`). When adding new utilities, create corresponding test files in `__tests__/` subdirectories. Use Vitest UI (`npm run test:ui`) for interactive test development.

## Recent Bug Fixes (November 2025)

### Audio Bug Fix (November 2025)

**Issue**: "Coin" word spoken by speech synthesis instead of sound effect.
**Fix**:

1. Removed redundant `playSoundEffect.coin()` call in `AchievementDisplay.tsx` (handled by `use-game-logic`).
2. Removed background sound parameter from `voiceWithPhonics` to prevent fallback issues when files are missing.
   **Lesson**: Avoid redundant audio calls in components; let `use-game-logic` handle all gameplay audio. Ensure `.wav` files exist to prevent speech synthesis fallback.

### Performance Optimizations (October 15, 2025)

**Major Changes**:

1. **Spawn Rate Reduction**: 1400ms → 2000ms (30% reduction for better frame rates)
2. **Animation Loop Upgrade**: `setInterval` → `requestAnimationFrame` with frame pacing for smooth 60fps
3. **Timer Optimization**: Target countdown reduced from 100ms → 1000ms updates (90% fewer re-renders)
4. **Background Rotation**: Only updates on menu screens, paused during gameplay
5. **Memory Reduction**: Event tracker maxEvents reduced from 1000 → 500
6. **Console Logging**: Wrapped all debug logs in `if (import.meta.env.DEV)` guards
7. **Event Listener Cleanup**: Fixed memory leak with anonymous touchstart handler

**Impact**: Significantly improved 60fps consistency, reduced CPU usage, eliminated memory leaks. See `PERFORMANCE_OPTIMIZATION_OCT2025.md` for detailed analysis.

### Overlapping Audio Voices (Fixed - October 14, 2025)

**Issue**: Two voices playing simultaneously causing distorted "throat cancer" sound:

1. Background success/wrong/win sound effects
2. Target pronunciation voice
   Both played at once, creating garbled audio output

**Root Cause**: Previous commits (`5b35570`, `5401d41`) removed background sounds, but changes were accidentally reverted to main

- Line 436: `playSoundEffect.success()` + `playSoundEffect.voice()` both triggered on correct tap
- Line 464: `playSoundEffect.win()` played on winner
- Line 491: `playSoundEffect.wrong()` played on incorrect tap
- Speech synthesis using unnatural `pitch: 1.1, rate: 0.85` settings

**Fix** (Commit `9173813`):

1. **Removed all background sound effects**:
   - Removed `playSoundEffect.success()` call (line 436)
   - Removed `playSoundEffect.win()` call (line 464)
   - Removed `playSoundEffect.wrong()` call (line 491)
2. **Kept ONLY** `playSoundEffect.voice()` for clean target pronunciations
3. **Improved voice quality**: Changed speech synthesis to `pitch: 1.0, rate: 1.0` for natural sound

**Impact**: Clean audio with single voice announcing targets, no overlapping sounds or distortion

### Emoji Side-Switching Bug (Fixed)

**Issue**: Objects spawned on right side (x > 50) were being pushed to left side (x <= 50) during collision detection  
**Root Cause**: Collision detection used hardcoded left lane boundaries `[10, 45]` for both lanes  
**Fix**: `processLane()` now accepts lane parameter and uses lane-specific boundaries. For single-player mode, both lanes now use full width `[5, 95]`.

**Impact**: Objects now maintain consistent positions throughout their lifecycle

### Collision Detection Rewrite (October 2025)

**Issue**: Emojis phasing through each other despite collision detection  
**Root Cause**: Weak push forces (0.2px) insufficient to prevent overlaps  
**Fix**: Complete rewrite with physics-based collision:

- Calculate actual distance between emoji centers using Pythagorean theorem
- Use `atan2()` for proper push angles
- Apply bidirectional forces with proper separation distance (70px minimum)
- Horizontal push only to preserve fall speed

**See Also**: `EMOJI_SIDE_SWITCHING_BUG_FIX.md` for detailed analysis

### Debug Documentation Pattern

When fixing bugs, comprehensive markdown docs are created in project root:

- `EMOJI_SIDE_SWITCHING_BUG_FIX.md` - Analysis with before/after JSON evidence
- `MULTI_TOUCH_IMPLEMENTATION.md`, `MULTI_TOUCH_QUICKSTART.md` - Feature documentation
- `VERCEL_AUDIO_DEBUG.md` - Platform-specific troubleshooting guides
- `jobcard.md` - Tracks completed work items and issues addressed

Follow this pattern: create detailed `.md` files for significant fixes with root cause analysis and code snippets.

## Troubleshooting Audio Issues (BenQ Classroom Displays)

**Problem**: Audio pronunciations fail to play on BenQ interactive displays despite working on standard browsers.

**Root Causes**:

1. **Embedded Browser Limitations**: BenQ displays often use custom/embedded browsers with limited Web Audio API support
2. **Autoplay Policies**: Stricter autoplay restrictions than Chrome/Firefox
3. **CORS Restrictions**: May block cross-origin audio requests
4. **File Loading**: `.wav` file fetching can fail silently on embedded browsers

**Audio System Architecture** (in `src/lib/sound-manager.ts`):

- **Primary**: Web Audio API with `AudioContext` (best quality, correct pitch/speed)
- **Fallback 1**: HTMLAudio elements with `playbackRate = 1.0` (prevents frog/chipmunk voices on mobile)
- **Fallback 2**: Speech Synthesis API (text-to-speech)
- **Fallback 3**: Web Audio synthesized tones (always works, no pronunciation)
- **Mobile Detection**: Disabled HTMLAudio preference to ensure Web Audio API is used for better quality across all devices

**Debugging Steps**:

1. **Check Console Logs**: Look for `[SoundManager]` prefixed messages showing:

   - Registered audio file count (should be 165+ aliases from 110+ files)
   - Audio context state (`suspended` → `running` after first tap)
   - File load success/failures with URLs
   - Which playback method is active (HTMLAudio vs Web Audio API)

2. **Test User Interaction**: Audio context starts `suspended` and requires user tap to unlock:

   ```typescript
   // First tap anywhere triggers:
   setupUserInteractionListener() → ensureInitialized() → audioContext.resume()
   ```

3. **Verify File Loading**: Check if `.wav` files load from `/sounds/` via Vite's `import.meta.glob()`:

   - Files indexed at build time into `audioUrlIndex` Map
   - Keys are normalized (lowercase, underscores, emoji prefix handling)
   - Example: `emoji_apple.wav` → keys: `"apple"`, `"emoji_apple"`, `"emoji apple"`

4. **Force HTMLAudio Mode**: If Web Audio API fails, sound-manager uses HTMLAudio with `playbackRate = 1.0`:
   ```typescript
   preferHTMLAudio = false; // Always use Web Audio API first
   playWithHtmlAudio(key); // Fallback with playbackRate = 1.0 to prevent pitch distortion
   ```

**BenQ-Specific Fixes**:

- **Enable Debug Overlays**: Set `debugVisible` state in `App.tsx` to see `EventTrackerDebug` showing audio events
- **Check CORS Headers**: `vercel.json` includes proper CORS headers; ensure BenQ browser allows cross-origin requests
- **Test in Kiosk Mode**: Some BenQ browsers have kiosk mode restrictions—test in standard browser mode first
- **Verify MIME Types**: Ensure server serves `.wav` as `audio/wav` (configured in `vercel.json`)
- **Use Speech Synthesis Fallback**: If all audio fails, sound-manager falls back to `speechSynthesis.speak()` for pronunciations

**Audio Pronunciation Pipeline**:

1. User taps object → `handleObjectTap()` in `use-game-logic.ts`
2. Calls `playSoundEffect.byName(targetName)` from `sound-manager.ts`
3. Resolves key candidates (e.g., "apple" → check: "apple", "emoji_apple", "1" if number)
4. Tries in order: HTMLAudio (if mobile) → Web Audio API → Speech Synthesis → Tone fallback
5. Logs each attempt to console with `[SoundManager]` prefix

**Common Error Messages**:

- `"No URL found for key"` → Audio file missing or naming mismatch; check `GAME_CATEGORIES` items match `/sounds/*.wav` filenames
- `"HTTP 404"` → Build didn't include audio files; verify `dist/assets/` contains `.wav` files
- `"Audio context suspended"` → No user interaction yet; require tap before playing
- `"HTMLAudio playback failed"` → Browser autoplay blocked; switch to Web Audio API or require explicit audio enable button

**Manual Testing on BenQ**:

1. Open browser console (F12 or on-screen keyboard Ctrl+Shift+I)
2. Click game menu "Test Audio" button if available
3. Check `getAudioDebugInfo()` output for system state
4. Monitor `[SoundManager]` logs during gameplay
5. If silent, check `audioContext.state` and `preferHTMLAudio` flag values

**See Also**: `VERCEL_AUDIO_DEBUG.md` for comprehensive troubleshooting guide with step-by-step debugging instructions.
