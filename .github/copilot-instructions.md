# Copilot Instructions for Kindergarten Race Game

## Project Overview

Split-screen educational racing game where two players compete by tapping falling objects (emojis) to advance their turtle characters. Built with React 19 + TypeScript + Vite, optimized for tablets and touch devices in kindergarten classrooms.

**Tech Stack**: React 19, TypeScript 5.9, Vite 7.1.7, Tailwind CSS 4.1, Radix UI, class-variance-authority  
**Node Requirements**: Node.js 20.18+ or 22.12+ (Vite 7 requirement)  
**Deployment**: Vercel (production), Docker with nginx, Termux-compatible for Android dev  
**Target Devices**: QBoard interactive displays, tablets, mobile browsers  
**Repository**: github.com/TeacherEvan/English-K1Run

**Core Gameplay Loop**: Objects fall from top → players tap matching targets → turtle progress bars advance → first to top wins. Educational categories include fruits/vegetables, counting (1-15), shapes/colors, animals, vehicles, and weather concepts.

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
- **Phonics Pronunciation**: When students tap correct objects, they hear phonetic breakdown before the full word (e.g., "Aah! Aah! - Apple!"). This reinforces letter sounds and word formation. See `PHONICS_MAP` in `src/lib/constants/phonics-map.ts` for all mappings.

## Critical Architectural Rules

**⚠️ State Management**: `src/hooks/use-game-logic.ts` is the **single source of truth**. Never create parallel game state in components. All game mutations flow through this hook's methods.

**⚠️ Coordinate System**: Split-screen uses percentage-based positioning (`x <= 50` = Player 1, `x > 50` = Player 2). Never use absolute pixel coordinates. `App.tsx` handles viewport remapping.

**⚠️ Touch Handling**: `src/lib/touch-handler.ts` singleton manages all touch events. Don't attach raw `onClick` handlers to game objects—use the multi-touch API to prevent QBoard interference issues.

**⚠️ CSS Variables**: All responsive sizing uses CSS custom properties (`--font-scale`, `--object-scale`, etc.) set by `use-display-adjustment.ts`. Never hardcode pixel values in inline styles.

## Architecture & Data Flow

**State Ownership**: `src/hooks/use-game-logic.ts` (1365 lines) is the single source of truth for all gameplay state:
- `gameObjects[]`: Active falling objects with physics (id, type, emoji, x, y, speed, size, lane)
- `worms[]`: Distractor objects with wiggle animation (`WormObject` interface)
- `splats[]`: Splat effects when worms are tapped (`SplatObject` interface)
- `GameState`: Player progress, current target, level, winner status, streak tracking
- `GAME_CATEGORIES`: Array of 7 categories with items: `{ emoji, name }[]`
- Never create parallel game state elsewhere—always use the hook's methods

**Split-Screen Coordinate System**: 
- Percentage-based positioning: `x <= 50` = Player 1 (left), `x > 50` = Player 2 (right)
- Lane boundaries enforced in collision detection: `LANE_BOUNDS = { left: [10, 45], right: [55, 90] }`
- `App.tsx` remaps percentages to half-width containers during render pass
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
- `App.tsx` (297 lines): Top-level orchestrator, owns `debugVisible`, `backgroundClass`, `selectedLevel`, `timeRemaining`
- All game logic delegates to `useGameLogic()` hook—components are presentational
- Background rotation every 30s via `BACKGROUND_CLASSES` array (5 backgrounds in `App.css`)

**Singleton Pattern** (initialized on import—never instantiate new):
- `eventTracker` (`src/lib/event-tracker.ts`): Global error/performance logging, max 500 events
- `soundManager` (`src/lib/sound-manager.ts`): Web Audio API manager, lazy-initialized on first user interaction
- `multiTouchHandler` (`src/lib/touch-handler.ts`): Touch validation for QBoard displays (150ms debounce, 10px drag threshold)

## Collision Detection System

**Overview**: Physics-based collision detection prevents emojis from overlapping/phasing through each other while maintaining strict lane boundaries.

**Implementation** (in `use-game-logic.ts` → `updateObjects()` → `processLane()`):

```typescript
const processLane = (objects: GameObject[], lane: 'left' | 'right') => {
  // Define strict lane boundaries - objects MUST stay within their lane
  const [minX, maxX] = lane === 'left' ? [10, 45] : [55, 90]
  const emojiRadius = 30 // Approximate radius of emoji (size 60 / 2)
  const minSeparation = emojiRadius * 2 + 10 // 70px minimum distance between centers
  
  // For each object, check collision with all others in the same lane
  // If distance < minSeparation:
  //   - Calculate push angle using atan2(dy, dx)
  //   - Apply horizontal push to both objects (bidirectional)
  //   - Clamp to lane boundaries [minX, maxX]
  //   - Preserve Y coordinates (don't affect fall speed)
}
```

**Key Features**:
- ✅ **Lane Isolation**: Left `[10, 45]` and right `[55, 90]` processed separately
- ✅ **Physics-Based Push**: Uses proper distance calculations and push angles
- ✅ **Bidirectional Forces**: Both colliding objects pushed apart naturally
- ✅ **Horizontal Only**: Push is horizontal to preserve fall speed
- ✅ **Strict Boundaries**: Objects clamped to lane bounds, cannot cross to other side
- ✅ **No Phasing**: Minimum separation of 70px enforced between emoji centers

**Critical Rules**:
- Never modify Y coordinates during collision resolution (breaks fall speed)
- Always clamp X to lane-specific `[minX, maxX]` boundaries
- Process lanes independently to prevent side-switching
- Use distance-based collision (Pythagorean theorem) not simple overlap checks

**Performance**: O(n²) per lane but limited to ~7-8 objects per side max, so acceptable for 60fps target.

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
npm run dev  # Vite on port 5173 with polling HMR
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
- Dev: `docker-compose --profile dev up kindergarten-race-dev` (hot reload, volume-mounted)
- Prod: `docker-compose up -d` (nginx-served static bundles at port 3000)
- Volume mapping excludes `/app/node_modules` to avoid platform conflicts

**Deployment**: Project uses Vercel for production. Static assets are served with proper CORS and MIME type headers configured in `vercel.json`.

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

**Background Rotation**: `App.css` defines 5 `.app-bg-*` classes using real image overlays (`.app-bg-sunrise`, `.app-bg-deep-ocean`, etc.). `pickRandomBackground()` in `App.tsx` switches every 30s—add new backgrounds by extending both the class list and `BACKGROUND_CLASSES` array.

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
const PerformanceMonitor = lazy(() => import('./components/PerformanceMonitor').then(m => ({ default: m.PerformanceMonitor })))
```
Wrap usage with `<Suspense>`. Apply same pattern for new large/optional components.

**State Updates**: Use functional setState when new state depends on previous (e.g., `setGameObjects(prev => [...prev, newObj])`).

## Telemetry & Audio

**Event Tracking**: `src/lib/event-tracker.ts` is a singleton that auto-registers global error handlers, FPS tracking, and spawn-rate warnings on import. Use `eventTracker.trackEvent()`, `trackError()`, `trackUserAction()` for logging so overlays render consistently. Max 500 events tracked in memory (reduced from 1000 for performance).

**Emoji Rotation Tracking**: `eventTracker` monitors emoji spawn frequency to ensure fair distribution.
- Tracks last appearance time and count for each emoji
- Identifies "overdue" emojis (>10s without appearance)
- `spawnObject` prioritizes stale emojis to maintain variety

**Error Handling**: `ErrorMonitor` monkey-patches `console.error/warn` to display in-game. Keep console usage minimal; wrap debug logs in `if (import.meta.env.DEV)` to avoid UI spam.

**Audio System**: `src/lib/sound-manager.ts` uses Web Audio API, lazy-initialized on first user interaction. 
- Call `playSoundEffect.voiceWithPhonics()` for correct taps with phonics breakdown (e.g., "Aah! Aah! - Apple!")
- `playSoundEffect.chaChing()` plays celebratory coin sound for correct selections
- `.wav` files in `/sounds/` are indexed by normalized names via `import.meta.glob()`
- Naming convention: `{name}.wav`, `emoji_{name}.wav` (e.g., `emoji_apple.wav` → keys: `"apple"`, `"emoji_apple"`, `"emoji apple"`)
- Number words auto-map to digits (`one.wav` → `"1"` key)
- **Playback Method**: Web Audio API is always preferred for correct pitch/speed. HTMLAudio fallback has `playbackRate = 1.0` explicitly set to prevent distorted voices (frog/chipmunk sounds)
- Fallback hierarchy: Web Audio API → HTMLAudio (playbackRate=1.0) → Speech Synthesis → Web Audio tones

**Phonics System** (`src/lib/constants/phonics-map.ts`):
- Maps words to phonetic breakdown: `PHONICS_MAP['apple'] = ['Aah', 'Aah', 'Apple']`
- `playWithPhonics(word, backgroundSound)` plays phonics sequence with optional background sound
- Background sounds (like 'cha-ching') play at 30% volume while human voice plays at 100%
- Sequence: phonicSound1 (300ms pause) → phonicSound2 (200ms pause) → fullWord pronunciation
- **Audio Prioritization**: Human voice always takes priority with full volume; non-voice sounds automatically reduced to 30% when playing simultaneously

**Cha-Ching Sound**: Plays at reduced volume (30%) during correct object taps while phonics voice pronunciation plays at full volume (100%). This creates an engaging reward sound without overwhelming the educational voice content.

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

**Performance Targets**: 60fps gameplay, max 15 concurrent objects, touch latency monitoring for tablets.

**Combo System**: Streak thresholds at 3, 5, 7 taps trigger `ComboCelebration` component with predefined messages in `COMBO_LEVELS` array.

## Common Tasks

**Add New Game Category**: 
1. Append to `GAME_CATEGORIES` in `use-game-logic.ts`
2. Add `.wav` files to `/sounds/` with matching names (use `scripts/generate-audio.cjs` if available)
3. Add phonics mappings to `PHONICS_MAP` in `src/lib/constants/phonics-map.ts` (format: `[phonicSound, phonicSound, fullWord]`)
4. If sequential gameplay needed, set `requiresSequence: true`

**Add Phonics Mapping**: 
1. Edit `src/lib/constants/phonics-map.ts`
2. Add entry: `'word': ['Phonic', 'Phonic', 'Word']` (e.g., `'apple': ['Aah', 'Aah', 'Apple']`)
3. Use initial sound repeated twice, then full word pronunciation
4. Test by tapping the object in-game - should hear phonics sequence

**Adjust Difficulty**: Modify `spawnObject()` intervals in `use-game-logic.ts`, `fallSpeedMultiplier` in `use-display-adjustment.ts`, or max concurrent objects (currently 15).

**Debug Performance**: Enable overlays via `debugVisible` state in `App.tsx`. `PerformanceMonitor` shows FPS, `EventTrackerDebug` shows spawn rates, `QuickDebug` shows CSS var values.

**Change Scoring**: Only modify `handleObjectTap()` in `use-game-logic.ts`—it's the sole authority for point calculation, streak tracking, and winner declaration.

**Add UI Component**: Use existing Shadcn components in `src/components/ui/`. If creating new, follow CVA pattern with strict props interfaces and memoization if performance-critical.

## Gotchas & Known Issues

- **Node Version**: Must use Node 20.18+ or 22.12+ (not 18.x) due to Vite 7 requirement
- **React 19 Types**: Keep `--noCheck` flag in build script until `@types/react` v19 stabilizes
- **Android/ARM64**: Use `npm run install:android` to avoid `@rollup/rollup-android-arm64` errors
- **Background Images**: External URLs may be blocked; backgrounds defined in `App.css` use local `/public/*.jpg` files
- **Audio Initialization**: Web Audio requires user interaction; `sound-manager` auto-initializes on first tap
- **Split-Screen Coordinates**: Never use absolute pixel positioning; always use percentage-based `x` values relative to player area
- **Browser Cache**: After rebuilding, use hard refresh (`Ctrl+Shift+R` / `Cmd+Shift+R`) to clear cached bundles if seeing old game behavior

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
**Fix**: `processLane()` now accepts lane parameter and uses lane-specific boundaries:
- Left lane: `[10, 45]`
- Right lane: `[55, 90]`

**Impact**: Objects now maintain consistent `playerSide` throughout their entire lifecycle (spawn → movement → tap/miss → removal)

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
   preferHTMLAudio = false // Always use Web Audio API first
   playWithHtmlAudio(key) // Fallback with playbackRate = 1.0 to prevent pitch distortion
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
