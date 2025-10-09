# Copilot Instructions for Kindergarten Race Game

## Project Overview

Split-screen educational racing game where two players compete by tapping falling objects to advance their progress bars. Built with React 19 + TypeScript + Vite, optimized for tablets and touch devices in kindergarten classrooms.

**Tech Stack**: React 19, TypeScript 5.9, Vite 7.1.7, Tailwind CSS 4.1, Radix UI, class-variance-authority
**Node Requirements**: Node.js 20.18+ or 22.12+ (Vite 7 requirement)
**Deployment**: Vercel (production), Docker with nginx, Termux-compatible for Android dev

## Architecture & Data Flow

**State Ownership**: `src/hooks/use-game-logic.ts` is the single source of truth for all gameplay state—`gameObjects[]`, `GameState`, `GAME_CATEGORIES`, player scoring, and winner detection. Never create parallel game state elsewhere.

**Split-Screen Logic**: Objects spawn with `x <= 50` for player 1, `x > 50` for player 2 (percentages). `App.tsx` remaps these to half-width containers in the render pass. Maintain this coordinate system when adding spawn patterns.

**Category System**: `GAME_CATEGORIES` array defines levels with `items: { emoji, name }[]`. Special case: "Alphabet Challenge" has `requiresSequence: true` which enforces sequential tapping (ABC...). When adding categories, check if sequence mode applies.

**Object Lifecycle**: 
1. `spawnObject()` creates up to 15 active objects (tracked by `eventTracker`)
2. `handleObjectTap()` is the **only** place that scores points, plays audio, advances progress, and detects winners
3. Objects auto-remove on y > 100 or manual tap; never mutate `gameObjects` outside the hook

**Component Ownership**: `App.tsx` owns top-level state (`debugVisible`, `backgroundClass`, `selectedLevel`) and orchestrates layout. All game logic delegates to `use-game-logic.ts` hook.

## User Interface & UX Features

**Target Display**: Located at top-center during gameplay, shows current target emoji/name and category badge. Styled with 25% scale (`transform: scale(0.25)`) and completely transparent background for minimal visual obstruction. Only the text and emoji remain visible with text-shadow for readability.

**Back to Levels Button**: Fixed at top-left during active gameplay (hidden during winner screen). Clicking calls `resetGame()` to return to level selection menu. Styled with responsive sizing using `--font-scale` and `--spacing-scale` CSS variables.

**Fullscreen Mode**: Auto-triggers on first user interaction (click, touch, or keydown) via `requestFullscreen()` utility with cross-browser support (Chrome, Safari, Firefox, IE/Edge). Uses proper TypeScript typing to avoid vendor prefix issues.

**Background Rotation**: Random background changes every 30s from `BACKGROUND_CLASSES` array (`app-bg-sunrise`, `app-bg-deep-ocean`, etc.). Also changes when returning to menu.

**Multi-Touch Support**: Advanced touch handling system prevents accidental touches from interfering with gameplay on QBoard displays and mobile devices. `src/lib/touch-handler.ts` validates each touch independently with debouncing (150ms), drag detection (10px movement threshold), and long-press rejection (300ms duration limit). Auto-enables on game start, disables on game end. See `MULTI_TOUCH_IMPLEMENTATION.md` for details.

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

**Docker**:
- Dev: `docker-compose --profile dev up kindergarten-race-dev` (hot reload, volume-mounted)
- Prod: `docker-compose up -d` (nginx-served static bundles at port 3000)
- Volume mapping excludes `/app/node_modules` to avoid platform conflicts

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
- Use `cn()` utility from `src/lib/utils.ts` to merge Tailwind classes

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

**Debug Overlays**: `FireworksDisplay`, `PerformanceMonitor`, `EventTrackerDebug`, `QuickDebug`, `ErrorMonitor`, `TouchHandlerDebug` mount once in `<App />`. They consume global singletons (`eventTracker`, `soundManager`, `multiTouchHandler`)—don't instantiate new trackers.

**State Updates**: Use functional setState when new state depends on previous (e.g., `setGameObjects(prev => [...prev, newObj])`).

## Telemetry & Audio

**Event Tracking**: `src/lib/event-tracker.ts` is a singleton that auto-registers global error handlers, FPS tracking, and spawn-rate warnings on import. Use `eventTracker.trackEvent()`, `trackError()`, `trackUserAction()` for logging so overlays render consistently. Max 1000 events tracked in memory.

**Error Handling**: `ErrorMonitor` monkey-patches `console.error/warn` to display in-game. Keep console usage minimal; wrap debug logs in `if (import.meta.env.DEV)` to avoid UI spam.

**Audio System**: `src/lib/sound-manager.ts` uses Web Audio API, lazy-initialized on first user interaction. 
- Call `playSoundEffect.tap()`, `.success()`, `.wrong()`, `.win()` for feedback—don't create `<audio>` tags
- `.wav` files in `/sounds/` are indexed by normalized names via `import.meta.glob()`
- Naming convention: `{name}.wav`, `emoji_{name}.wav` (e.g., `emoji_apple.wav` → keys: `"apple"`, `"emoji_apple"`, `"emoji apple"`)
- Number words auto-map to digits (`one.wav` → `"1"` key)
- Fallback to Web Audio tones if file missing

## Vite Configuration

**Path Alias**: `@` resolves to `src/` (e.g., `import { cn } from '@/lib/utils'`)

**Polling Watch**: `server.watch.usePolling: true` essential for Termux/Docker dev environments where native FS events don't propagate

**Manual Chunking**: `build.rollupOptions.output.manualChunks()` separates vendor code into:
- `vendor-react`, `vendor-radix`, `vendor-ui-utils`, `vendor-large-utils`, `vendor-other`
- `ui-components`, `game-components`, `game-hooks`, `game-utils`

When adding large dependencies, assign them to the appropriate bucket to prevent chunk bloat. Target: vendor bundles <1MB each.

**HMR Config**: `server.hmr.overlay: true` shows build errors in-browser. Port 5173, strictPort: false allows fallback.

## Project-Specific Conventions

**Audio Assets**: Sound files in `/sounds/` follow naming convention: `{name}.wav`, `emoji_{name}.wav`. When adding items to `GAME_CATEGORIES`, ensure corresponding audio assets exist or `sound-manager` will fallback to Web Audio tones.

**TypeScript Compilation**: Uses `tsc -b` (project references) but with `--noCheck` flag due to React 19 type evolution. Don't remove the flag until React 19 is stable.

**Performance Targets**: 60fps gameplay, max 15 concurrent objects, touch latency monitoring for tablets.

**Combo System**: Streak thresholds at 3, 5, 7 taps trigger `ComboCelebration` component with predefined messages in `COMBO_LEVELS` array.

## Common Tasks

**Add New Game Category**: 
1. Append to `GAME_CATEGORIES` in `use-game-logic.ts`
2. Add `.wav` files to `/sounds/` with matching names (use `scripts/generate-audio.cjs` if available)
3. If sequential gameplay needed, set `requiresSequence: true`

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

## Troubleshooting Audio Issues (BenQ Classroom Displays)

**Problem**: Audio pronunciations fail to play on BenQ interactive displays despite working on standard browsers.

**Root Causes**:
1. **Embedded Browser Limitations**: BenQ displays often use custom/embedded browsers with limited Web Audio API support
2. **Autoplay Policies**: Stricter autoplay restrictions than Chrome/Firefox
3. **CORS Restrictions**: May block cross-origin audio requests
4. **File Loading**: `.wav` file fetching can fail silently on embedded browsers

**Audio System Architecture** (in `src/lib/sound-manager.ts`):
- **Primary**: Web Audio API with `AudioContext` (best quality, pronunciation support)
- **Fallback 1**: HTMLAudio elements (better mobile/embedded browser compatibility)
- **Fallback 2**: Web Audio synthesized tones (always works, no pronunciation)
- **Android Detection**: Auto-switches to HTMLAudio on Android Chrome via `preferHTMLAudio` flag

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

4. **Force HTMLAudio Mode**: If Web Audio API fails, sound-manager auto-detects mobile and uses HTMLAudio:
   ```typescript
   preferHTMLAudio = isMobile && /android/i.test(ua)
   playWithHtmlAudio(key) // Creates new Audio(url) elements
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
