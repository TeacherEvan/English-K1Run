# Copilot Instructions for Kindergarten Race Game

## Project Overview

Single-player educational game where kindergarten students (ages 4-6) tap falling emoji objects to advance their turtle character. Built with **React 19 + TypeScript + Vite 7**, optimized for tablets and QBoard interactive displays in classroom settings.

**Tech Stack**: React 19.2, TypeScript 5.9, Vite 7.3, Tailwind CSS 4.1, Radix UI, CVA  
**Node**: v20.18+ or v22.12+ (Vite 7 requirement)  
**Deployment**: Vercel (primary), Docker/nginx, PWA-enabled  
**i18n**: react-i18next with 6 languages (en, fr, ja, th, zh-CN, zh-HK)

**Core Loop**: Objects fall → student taps matching target → progress advances → 100% wins (or auto-resets in continuous mode)

**Educational Categories** (7 total in `GAME_CATEGORIES`):

- Fruits & Vegetables (13 items) - apple, banana, grapes, etc.
- Counting Fun (15 items) - Numbers 1-15 with emoji
- Alphabet Challenge - Sequential A→Z (`requiresSequence: true`)
- Shapes & Colors (13 items) - circle, triangle, star, etc.
- Animals & Nature (13 items) - dog, cat, fox, turtle, etc.
- Things That Go (13 items) - car, bus, airplane, rocket, etc.
- Weather Wonders (10 items) - sunny, cloudy, rainy, rainbow, etc.

**⚠️ IMPORTANT**: Originally a two-player split-screen game, now single-player. Ignore legacy `.clinerules` references to split-screen.

## Critical Architecture Rules

### State Management (NEVER VIOLATE)

- **Single Source of Truth**: `src/hooks/use-game-logic.ts` owns ALL game state
- **Never** create parallel game state in components
- All game mutations flow through this hook's methods (`handleObjectTap`, `startGame`, etc.)

### Coordinate System

- **Percentage-based only**: Objects use x: 5-95% of screen width
- **Never** use absolute pixel coordinates
- Lane system: `LANE_BOUNDS = { left: [5, 95], right: [5, 95] }` (full width for single player)

### Touch Handling

- `src/lib/touch-handler.ts` singleton manages all touch events
- **Don't** attach raw `onClick` to game objects—use multi-touch API:

```tsx
// ❌ DON'T: Causes QBoard interference
<div onClick={() => handleTap(id)}>

// ✅ DO: Use validated touch handling
const handleTouchEnd = (e: React.TouchEvent) => {
  const touch = e.changedTouches[0]
  if (multiTouchHandler.validateTap(touch.identifier, id)) {
    handleTap(id)
  }
}
```

### CSS Variables

- All sizing uses CSS custom props: `--font-scale`, `--object-scale`, `--spacing-scale`
- Set by `use-display-adjustment.ts`, never hardcode pixel values
- Base design: 1920x1080, scales proportionally

## Key Files & Singletons

| File                                   | Purpose                                            |
| -------------------------------------- | -------------------------------------------------- |
| `src/hooks/use-game-logic.ts`          | **THE** game state (1878 lines) - all logic here   |
| `src/lib/sound-manager.ts`             | Web Audio API singleton, lazy-init on first tap    |
| `src/lib/touch-handler.ts`             | Multi-touch validation for QBoard (150ms debounce) |
| `src/lib/event-tracker.ts`             | Global error/performance logging (max 500 events)  |
| `src/lib/constants/game-config.ts`     | Tuning constants (spawn rates, speeds, etc.)       |
| `src/lib/constants/game-categories.ts` | Educational categories with emoji items            |

### Modular Subsystems (Jan 2026)

| Directory        | Purpose                               | Import                                               |
| ---------------- | ------------------------------------- | ---------------------------------------------------- |
| `src/lib/audio/` | Audio system (loader, player, speech) | `import { audioPlayer } from './lib/audio'`          |
| `src/lib/game/`  | Game logic (collision, worm manager)  | `import { processLaneCollisions } from './lib/game'` |

**Audio Modules** (`src/lib/audio/`):

- `types.ts` - Shared type definitions
- `audio-loader.ts` - Lazy audio loading & caching
- `audio-player.ts` - Web Audio & HTML Audio playback
- `speech-synthesizer.ts` - Text-to-speech with language support
- `audio-sprite.ts` - Audio sprite management
- `audio-accessibility.ts` - Screen reader audio descriptions
- `index.ts` - Module re-exports

**Game Modules** (`src/lib/game/`):

- `collision-detection.ts` - Physics-based collision resolution
- `worm-manager.ts` - Worm creation, movement, lifecycle

**Never instantiate new instances** of singletons—they auto-initialize on import.

## Developer Workflows

```bash
# Development
npm run dev              # Vite dev server (usually localhost:5173 or 5174)
npm run verify           # lint + typecheck + build (run before commits)
```

**Automated Code Review System**:

- `code_review.ps1`: A PowerShell script that runs every 5 minutes (via Task Scheduler "CodeReviewTimer").
- Automatically identifies staged `.ts`/`.js` files.
- Runs `eslint --fix` and `prettier --write` before committing.
- **NEVER** disable this script manually without project lead approval.

```bash
# Testing
npm run test             # Vitest watch mode
npm run test:run         # CI mode (single run)
npm run test:ui          # Vitest UI
npm run test:coverage    # Coverage report
npm run test:e2e         # Playwright E2E tests
npm run test:e2e:ui      # Playwright UI mode
npm run test:e2e:debug   # Debug E2E tests

# Production
npm run build            # tsc -b --noCheck && vite build
npm run preview          # Preview production build

# Android/ARM64
npm run install:android  # Use before build on ARM64/Android (--legacy-peer-deps)
```

**Build Note**: Keep `--noCheck` flag due to React 19 type instabilities.
**ARM64/Android**: Run `npm run install:android` first to avoid rollup errors.

**E2E Testing**: Use `?e2e=1` URL parameter to bypass welcome screen for deterministic tests:

- All page navigations use `waitUntil: 'domcontentloaded'` (PWA/service worker compatible)
- Button clicks use `.evaluate(el => el.click())` pattern for stability
- **Page Object Models** in `e2e/fixtures/game.fixture.ts`:
  - `GamePage` - Main page wrapper with navigation helpers
  - `GameMenuPage` - Menu interactions (level selection, settings)
  - `GameplayPage` - Game interactions (tapping objects, progress tracking)
  - `AudioMock` - Prevents actual audio playback in tests
- **Custom Fixtures**: Extend Playwright's `test` with `gamePage` and `audioMock`
- **Pattern**: Use `gamePage.menu.startGame()` instead of direct selectors
- Tests organized in `e2e/specs/` by feature area (accessibility, gameplay, menu, touch)
- **Stability Notes**:
  - Menu loading skeleton uses `data-testid="menu-loading-skeleton"` (do not wait on `game-menu` alone when asserting readiness).
  - Prefer waiting for `data-testid="game-title"` to confirm GameMenu has mounted.

## Component Patterns

**Memoization**: Frequently re-rendered components use `memo()`:

```tsx
export const FallingObject = memo(({ id, emoji, x, y }: FallingObjectProps) => {
  // ...
});
```

**GameMenu JSX Structure** - Critical layout requirements:

- **Never wrap grid in IIFE**: Avoid `{(() => { return <div>...</div> })()}` patterns that break flex layout
- **Proper flex children**: Level select grid must be a direct child with `flex-1` class
- **Correct hierarchy**: `header div` → `grid div (flex-1)` → `footer div` as siblings, not nested
- **Scope management**: Move data arrays (like `thaiTranslations`) inside map functions rather than closure wrappers
- **Common mistake**: Nesting grid inside header div causes all cards to overlap

**UI Primitives** (`src/components/ui/*`): Shadcn-style with CVA variants:

```tsx
const buttonVariants = cva("base-classes", {
  variants: { size: {...}, variant: {...} }
})
```

**Props Interfaces**: Always define explicit TypeScript interfaces, never inline types.

## Audio System

- **Modular Architecture** (Jan 2026): Split into `src/lib/audio/` modules
  - `audio-loader.ts` - Lazy loading & caching with fallback candidates
  - `audio-player.ts` - Web Audio API + HTMLAudio fallback
  - `speech-synthesizer.ts` - Text-to-speech with language support
  - `types.ts` - Shared interfaces
- **Fallback Chain**: Web Audio API → HTMLAudio → Speech Synthesis → Tones
- **File Naming**: `/sounds/{name}.wav`, `/sounds/emoji_{name}.wav`
- **Key Mapping**: `emoji_apple.wav` → keys `"apple"` and `"emoji_apple"`
- **Context Lifecycle**: Starts `suspended`, auto-resumes on first user interaction
- **Language Support**: Uses ElevenLabs voices via `sound-manager.setLanguage(code)`
- **Default Voice**: Alice (ElevenLabs Voice ID: `E4IXevHtHpKGh0bvrPPr`) - used for English audio generation

```tsx
// Playing audio on correct tap
import { playSoundEffect } from "./lib/sound-manager";

playSoundEffect.byName(targetName); // e.g., "apple"
playSoundEffect.voice(); // pronunciation in current language
```

**Welcome Screen Sequence** (4-phase narration):

1. `welcome_association` - English intro
2. `welcome_learning` - English learning prompt
3. `welcome_association_thai` - Thai translation
4. `welcome_learning_thai` - Thai translation

**Multi-Language TTS** (6 languages):

- Configured in `src/lib/constants/language-config.ts`
- Voice IDs per language (ElevenLabs multilingual_v2 model)
- Managed by `LanguageContext` (`src/context/language-context.tsx`)
- Font families: CJK languages use specific font stacks

After audio completes, waits for user tap/Enter/Space. Fallback timer enables continue if audio fails.

**Welcome Screen Visuals (Jan 2026)**:

- **Animations**: High-performance SVG/CSS (Sun Beams, Rainbow Arch, Wind Streams, Leaf Spawns).
- **Reduced Motion**: All animations disabled if `prefers-reduced-motion` is detected.
- **Landscape Optimization**: Uses `object-contain` + background decorations (clouds, kids) to avoid cropping.
- **E2E Mode**: Animations disabled when `?e2e=1` is present.

## Collision Detection

- Physics-based push prevents emoji overlap (not simple overlap checks)
- Horizontal-only forces preserve fall speed (never modify Y during collision)
- Minimum separation: 8% of screen width (`COLLISION_MIN_SEPARATION`)
- Objects clamped to boundaries [5%, 95%]
- O(n²) but acceptable for max 30 objects at 60fps

## Common Tasks

**Add New Game Category**:

1. Add to `GAME_CATEGORIES` in `src/lib/constants/game-categories.ts`
2. Generate audio files using `scripts/generate-audio.cjs`:

   ```bash
   node scripts/generate-audio.cjs --language all  # All 6 languages
   node scripts/generate-audio.cjs --language en   # English only
   ```

   - Requires `ELEVENLABS_API_KEY` in `.env`
   - Voice IDs defined in `scripts/generate-audio.cjs` (synced with `language-config.ts`)
   - Uses `eleven_multilingual_v2` model for all languages
   - Outputs to `/sounds/{name}_{lang}.wav` format

3. Add sentence templates to `src/lib/constants/sentence-templates.ts` (all 6 languages)
4. Update i18n files in `src/locales/*.json` if adding UI strings

**Other Audio Scripts**:

- `generate-missing-audio.cjs` - Detect and generate missing audio files
- `optimize-audio.cjs` - Convert/optimize audio formats
- `list-elevenlabs-voices.cjs` - List available ElevenLabs voices

**Adjust Difficulty**: Modify constants in `src/lib/constants/game-config.ts`:

- `MAX_ACTIVE_OBJECTS` (30), `SPAWN_COUNT` (8), `TARGET_GUARANTEE_COUNT` (2)
- `WORM_INITIAL_COUNT` (1), `WORM_RECURRING_COUNT` (1), `WORM_RECURRING_INTERVAL` (60000ms)

**Debug Performance**:

- Set `debugVisible` in `App.tsx` to show FPS, event logs, CSS vars
- **Performance Profiler** (`src/lib/performance-profiler.ts`):
  - Tracks component render times (mount, update, nested-update phases)
  - Configurable slow render threshold (default: 16.67ms for 60fps)
  - Uses React `<Profiler>` component + Performance API
  - Max 100 measurements stored (configurable)
  - Access via `performanceProfiler.getMeasurements()`
- **Event Tracker** (`src/lib/event-tracker.ts`):
  - Singleton for global error/performance logging
  - Max 500 events (auto-prunes oldest)
  - Tracks: emoji lifecycle, object spawns, collisions, audio events
  - Methods: `trackError()`, `trackEmojiLifecycle()`, `trackObjectSpawn()`
  - View events in debug panel or console

**Continuous Mode Implementation**:

- Controlled by `continuousMode` state in `SettingsContext`.
- When enabled: progress auto-resets at 100% instead of showing winner screen.
- High score tracking in `localStorage` key: `continuousModeHighScore`.
- Timer starts on game start, tracks completion time for each cycle.
- **Settings Dialog**: Managed in `src/components/SettingsDialog.tsx` (Tabs: Language, Display, Accessibility).
- State managed via `SettingsProvider` (`src/context/settings-context.tsx`) with localStorage persistence.
- Target pool refills automatically on each cycle for variety.

**Add New Language**:

1. Add to `SUPPORTED_LANGUAGES` in `src/lib/constants/language-config.ts`
2. Create `src/locales/{code}.json` with translations
3. Import in `src/i18n.ts` resources object
4. Add ElevenLabs voice ID to `LANGUAGE_VOICES` map
5. Test with `LanguageSelector` component in Settings

## Gotchas

- **Node Version**: Must be 20.18+ or 22.12+ (Vite 7)
- **React 19 Types**: Keep `--noCheck` until `@types/react` v19 stabilizes
- **Percentage Coordinates**: Always use 5-95% range, never pixels
- **Audio Init**: Requires user interaction; context starts `suspended`
- **Singletons**: Never `new` the trackers—they init on import
- **i18n Namespace**: Always use `t('namespace:key')` pattern for translations
- **CJK Fonts**: Chinese/Japanese need specific font families from `language-config.ts`
- **E2E Tests**: Use `?e2e=1` param to skip welcome screen for deterministic tests

## Key Documentation

- `DOCS/ARCHITECTURE_DECISION_RECORD_DEC2025.md` - Major architectural choices (PWA, animations, accessibility)
- `DOCS/LANGUAGE_SELECTION_IMPLEMENTATION_JAN2026.md` - i18n architecture and ElevenLabs integration
- `DOCS/E2E_TEST_FIXES_JAN2026.md` - Playwright patterns and page object models
- `DOCS/BEST_PRACTICES.md` - Code style and conventions
- `DOCS/SECURITY.md` - Security considerations
