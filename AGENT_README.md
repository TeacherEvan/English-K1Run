# AGENT_README.md - System Prompt for English K1 Run

> **Purpose**: Ground the AI agent before any code work. Read this file FIRST.
> **Project**: English K1 Run - Touch-first classroom game for kindergarten English learning
> **Stack**: React 18 + TypeScript + Vite + Tailwind + shadcn/ui + Playwright

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│  APP SHELL (src/App.tsx)                                    │
│  - Boot flow, preload gates, scene orchestration             │
├─────────────────────────────────────────────────────────────┤
│  GAMEPLAY FACADE (src/hooks/use-game-logic.ts)              │
│  - SINGLE SOURCE OF TRUTH for all gameplay state             │
│  - Actions: handleObjectTap, startGame, spawnTarget          │
├─────────────────────────────────────────────────────────────┤
│  RENDER LAYER                                               │
│  - src/components/     → UI primitives (memo-ized)           │
│  - src/app/components/ → Scene composition                   │
├─────────────────────────────────────────────────────────────┤
│  AUDIO RUNTIME (src/lib/audio/)                             │
│  - Singleton pattern. Never instantiate new managers         │
│  - Fallback chain: Web Audio → HTMLAudio → Speech → Tones    │
├─────────────────────────────────────────────────────────────┤
│  TOUCH HANDLER (src/lib/touch-handler.ts)                   │
│  - ALL gameplay taps route through multiTouchHandler         │
│  - NEVER attach raw onClick for gameplay objects             │
└─────────────────────────────────────────────────────────────┘
```

---

## Critical Conventions (VIOLATE = BUGS)

### Coordinates
- **ALWAYS percentage-based** (X: 5-95%)
- Use `LANE_BOUNDS` from `src/lib/constants/game-config.ts`
- **NEVER use pixel positions** for gameplay objects

### Touch Handling
```typescript
// ✅ CORRECT: Route through touch handler
import { multiTouchHandler } from '@/lib/touch-handler';
<div onPointerDown={(e) => multiTouchHandler(e, id, handleTap)} />

// ❌ WRONG: Raw onClick
<div onClick={handleTap} />
```

### State Management
- **ONLY ONE** gameplay state source: `useGameLogic`
- **NEVER** create parallel state in components
- UI events → useGameLogic actions → state update → render

### File Size Limit
- **HARD LIMIT**: 200 lines per file
- If approaching limit → extract to new module with clean exports

### Naming
| Type | Pattern | Example |
|------|---------|---------|
| Components | PascalCase | `FallingObject` |
| Hooks | camelCase + `use` | `useGameLogic` |
| Constants | UPPER_SNAKE_CASE | `LANE_BOUNDS` |
| Functions | camelCase | `handleObjectTap` |

---

## Entry Points by Task

| Goal | Start Here |
|------|------------|
| Fix gameplay bug | `src/hooks/use-game-logic.ts` |
| Fix audio | `src/lib/audio/` → `src/lib/sound-manager.ts` |
| Fix touch | `src/lib/touch-handler.ts` |
| Add category | `src/lib/constants/game-categories.ts` |
| Add sentence | `src/lib/constants/sentence-templates.ts` |
| UI component | `src/components/ui/` (shadcn pattern) |
| E2E test | `e2e/fixtures/game.fixture.ts` |
| Audio generation | `scripts/generate-sentence-audio.cjs` |

---

## Audio System

### Asset Resolution
- Source files: `sounds/*.wav`
- Runtime: Browser fetches `/sounds/<key>.<ext>`
- Key mapping in `src/lib/sound-manager.ts`
- Example: `emoji_apple.wav` → registers `"apple"` + `"emoji_apple"`

### Fallback Chain
1. Web Audio API (buffer)
2. HTMLAudioElement
3. Speech Synthesis (TTS)
4. Generated tones

### Rules
- Target spawn audio: **DISABLED** (prevent spam)
- New audio: **Full sentences only** (no single words)
- Welcome narration: Starts on **explicit user gesture only**

---

## Testing

### E2E Mode
- Append `?e2e=1` to skip welcome screen
- Add `&continuousLevelMs=<ms>` for fast level rotation testing

### Key Fixtures
- `e2e/fixtures/game.fixture.ts` - Page objects
- Pattern: `gamePage.menu.startGame()`

### Commands
```bash
npm run dev           # Dev server
npm run verify        # Lint + build
npm run test:e2e      # Playwright tests
npm run test:coverage # Vitest coverage
```

---

## Product Identity

- **Public brand**: "English K1 Run"
- **Internal repo**: `English-K1Run` / `kindergarten-race-game`

---

## When Context Is Polluted

**The "Wipe and Reload" Rule**: After 3-4 failed correction turns:
1. Clear the chat session
2. Revert uncommitted changes
3. Start fresh with explicit file pins using @ syntax
4. Reference specific line numbers in your prompt

---

## File Pinning Syntax

When starting complex work, explicitly pin files:

```
Review @src/hooks/use-game-logic.ts line 142.
The target spawn logic is firing twice.
```

Avoid: "Fix the audio bug" → leads to vector search spam

---

*Last updated: 2026-04-30*
*See also: `.github/copilot-instructions.md` for detailed conventions*
