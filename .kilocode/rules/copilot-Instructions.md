# Copilot Instructions for Kindergarten Race Game

## Project Overview

Single-player educational game where kindergarten students (ages 4-6) tap falling emoji objects to advance their turtle character. Built with **React 19 + TypeScript + Vite 7**, optimized for tablets and QBoard interactive displays in classroom settings.

**Tech Stack**: React 19.2, TypeScript 5.9, Vite 7.1.7, Tailwind CSS 4.1, Radix UI, CVA  
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
| `src/hooks/use-game-logic.ts`          | **THE** game state (1860 lines) - all logic here   |
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
- `speech-synthesizer.ts` - Text-to-speech wrapper (refactored Jan 2026)
- `audio-sprite.ts` - Audio sprite playback (refactored Jan 2026)

**Audio Submodules** (`src/lib/audio/*/`):

- `speech/elevenlabs-client.ts` - ElevenLabs API integration
- `speech/web-speech-client.ts` - Browser Web Speech API fallback
- `sprite/sprite-types.ts` - Audio sprite type definitions
- `sprite/sprite-loader.ts` - Sprite manifest & buffer loading
- `sprite/sprite-player.ts` - Sprite clip playback engine

**Game Modules** (`src/lib/game/`):

- `collision-detection.ts` - Physics-based collision resolution
- `worm-manager.ts` - Worm creation, movement, lifecycle

**Never instantiate new instances** of singletons—they auto-initialize on import.

## Developer Workflows

```bash
# Development
npm run dev              # Vite dev server on port 5173
npm run verify           # lint + typecheck + build (run before commits)

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
- Fixtures in `e2e/fixtures/game.fixture.ts` provide page object models
- **Test Timing Best Practices** (Jan 2026):
  - Use `[data-testid]` selectors instead of CSS classes for moving elements
  - Allow 250ms between rapid interactions for React state propagation
  - Allow 500ms for progress bar reads (CSS transitions, especially Firefox)
  - Use `waitFor({ state: "visible", timeout: 5000 })` before clicking dynamic elements
  - Component unmount + game start transitions require 2-5s timeouts

## Component Patterns

**Memoization**: Frequently re-rendered components use `memo()`:

```tsx
export const FallingObject = memo(({ id, emoji, x, y }: FallingObjectProps) => {
  // ...
});
```

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
- **Runtime audio delivery**: Source `.wav` files live in `sounds/`, and the browser fetches `/sounds/{key}.{ext}` from the static host. Missing files are repo-side content issues that fall through to speech fallback.
- **Sentence coverage**: Missing localized target sentences fall back to English before playback. Treat French gaps and other localization gaps as content work, not hosting work.

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
