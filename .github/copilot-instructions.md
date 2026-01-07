# Copilot Instructions for Kindergarten Race Game

## Project Overview

Single-player educational game where kindergarten students (ages 4-6) tap falling emoji objects to advance their turtle character. Built with **React 19 + TypeScript + Vite 7**, optimized for tablets and QBoard interactive displays in classroom settings.

**Tech Stack**: React 19.2, TypeScript 5.9, Vite 7.1.7, Tailwind CSS 4.1, Radix UI, CVA  
**Node**: v20.18+ or v22.12+ (Vite 7 requirement)  
**Deployment**: Vercel (primary), Docker/nginx, PWA-enabled

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

**Never instantiate new instances** of singletons—they auto-initialize on import.

## Developer Workflows

```bash
# Development
npm run dev              # Vite dev server on port 5173
npm run verify           # lint + typecheck + build (run before commits)

# Testing
npm run test             # Vitest watch mode
npm run test:run         # CI mode (single run)
npm run test:e2e         # Playwright E2E tests

# Production
npm run build            # tsc -b --noCheck && vite build
```

**Build Note**: Keep `--noCheck` flag due to React 19 type instabilities.  
**ARM64/Android**: Run `npm run install:android` first to avoid rollup errors.

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

- Web Audio API preferred → HTMLAudio fallback → Speech Synthesis → Tones
- Files in `/sounds/`: `{name}.wav`, `emoji_{name}.wav`
- **Keys auto-map**: `emoji_apple.wav` → `"apple"`, `"emoji_apple"`
- Context starts `suspended`, auto-resumes on first tap

```tsx
// Playing audio on correct tap
playSoundEffect.byName(targetName); // e.g., "apple"
playSoundEffect.voice(); // pronunciation
```

**Welcome Screen Audio Sequence** (4-phase narration):

1. `welcome_association` - English intro
2. `welcome_learning` - English learning prompt
3. `welcome_association_thai` - Thai translation
4. `welcome_learning_thai` - Thai translation

- After audio completes, waits for user tap/Enter/Space to proceed
- Fallback timer enables continue if audio fails

## Collision Detection

- Physics-based push prevents emoji overlap (not simple overlap checks)
- Horizontal-only forces preserve fall speed (never modify Y during collision)
- Minimum separation: 8% of screen width (`COLLISION_MIN_SEPARATION`)
- Objects clamped to boundaries [5%, 95%]
- O(n²) but acceptable for max 30 objects at 60fps

## Common Tasks

**Add New Game Category**:

1. Add to `GAME_CATEGORIES` in `src/lib/constants/game-categories.ts`
2. Add `.wav` files to `/sounds/` with matching names
3. Add sentence templates to `src/lib/constants/sentence-templates.ts`

**Adjust Difficulty**: Modify constants in `src/lib/constants/game-config.ts`:

- `MAX_ACTIVE_OBJECTS` (30), `SPAWN_COUNT` (8), `TARGET_GUARANTEE_COUNT` (2)

**Debug Performance**: Set `debugVisible` in `App.tsx` to show FPS, event logs, CSS vars.

## Gotchas

- **Node Version**: Must be 20.18+ or 22.12+ (Vite 7)
- **React 19 Types**: Keep `--noCheck` until `@types/react` v19 stabilizes
- **Percentage Coordinates**: Always use 5-95% range, never pixels
- **Audio Init**: Requires user interaction; context starts `suspended`
- **Singletons**: Never `new` the trackers—they init on import

## Key Documentation

- `DOCS/ARCHITECTURE_DECISION_RECORD_DEC2025.md` - Major architectural choices
- `DOCS/MULTI_TOUCH_IMPLEMENTATION.md` - Touch handling for QBoard
