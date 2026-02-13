# JOBCARD

Repo: TeacherEvan/English-K1Run (branch: main)
Purpose: Compressed history of work that helps future agents ramp quickly.

## Highlights

- Audio system: ElevenLabs fallback chain, inventory validation, fade transitions, and size reduction.
- Menu and welcome: layout fixes, lazy-loaded menus, welcome flow stability, home menu audio gating.
- Settings and accessibility: expanded settings coverage, reduced motion/high contrast, WCAG-aligned UI.
- E2E reliability: Playwright waits, navigation retry backoff, touch spec stability.
- Tooling and docs: Copilot instructions expansion, clarified MCP tooling, build and lint stability.
- Audio stability: public sounds URL resolution, ElevenLabs stop integration, and SFX fallback guards.

## Timeline (Compressed)

### 2026-02-13

- Disabled gameplay tap reinforcement audio (removed correct/incorrect tap sound playback).
- Enforced instruction-first gameplay audio: target-identification announcements remain the only gameplay voice output.
- Added mission completion marker (`sessionStorage`) when non-continuous mode reaches winner state.
- Reworked home menu audio hook to disable association lines and play only "GIVE THEM A STICKER!" after returning from mission completion.
- Added shared mission-complete audio state helper: `src/hooks/home-menu-audio-state.ts`.
- Validation: changed files pass ESLint (`ESLINT_EXIT:0`) and error scan (no TypeScript/diagnostic errors in touched files).

### 2026-02-08

- Added audio fade-in/out support and applied it to welcome-to-menu and home menu sequences.
- Expanded Settings dialog into Audio, Visual, Controls, and Accessibility tabs.
- Fixed welcome readiness state for audio sequencing and guarded SSR usage in audio context.
- Split welcome audio sequencer into smaller modules to satisfy the 200-line limit.
- Fixed public sounds URL resolution to select existing formats (prevents .ogg/.m4a/.aac 404 loops).
- Stopped ElevenLabs/WebSpeech playback when stopping all audio to prevent overlap across screens.
- Disabled speech fallback for normal SFX playback to avoid incorrect or stacked audio.
- Simplified audio-public-resolver to eliminate network check spam (returns .mp3/.wav directly).
- Next: home screen visual refactor.

### 2026-02-03

- Home menu Sangsom association lines now play only once per session.

### 2026-02-02

- Generated missing welcome audio and validated inventory (`npm run audio:validate`).
- Restored /sounds public fallback resolution for missing assets.
- Disabled repeated target spawn audio.

### 2026-01-17

- Copilot instructions expanded for production guidance (error handling, perf, a11y, testing, security, deployment).
- MCP tooling docs clarified editor-managed tool availability vs repo metadata.
- GameMenu lazy-loaded and `formatBestTime` utility extracted.
- Playwright navigation retry improved with backoff + jitter; touch spec beforeEach hardened.
- GameMenuLevelSelect improved fallbacks, a11y, and selection stability.
- Audio bundle reduced by removing redundant WAVs in favor of MP3.
- HomeWindow and accessibility utilities refactored.

### 2026-01-16 to 2026-01-13

- E2E stability: updated waits for lazy-loaded menus and fixed skeleton IDs.
- Welcome screen: layout fixes and logic cleanup to avoid landscape cropping.
- ElevenLabs fallback chain and Playwright diagnostic fixes.

### 2025-12-29 to 2025-12-22

- CSS warnings removed (vendor prefix fixes).
- Welcome fallback copy, debug overlay keyboard shortcut, and cleanup.
- Continuous mode: timer, high score tracking, and progression tuning.
- Audio pacing and i18n visuals (Thai font stack, rainbow/gradient effects).
- Touch performance improvements; TypeScript SDK pin and ESLint adjustments.

## Common Files Impacted

- Audio: src/lib/audio/_, src/lib/sound-manager_, public/sounds/\*
- Menu/UI: src/components/game-menu/_, src/components/WelcomeScreen_
- Settings: src/context/settings-context.tsx, src/components/ui/\*
- E2E: e2e/fixtures/_, e2e/specs/_, improved-testServer.js
- Tooling/docs: .github/copilot-instructions.md, eslint.config.js, .vscode/settings.json

## Validation

- `npm run audio:validate` (2026-02-02) passed.
- `npm run test:run`, `npm run check-types`, `npm run verify` (Dec 2025) passed.

## Follow-ups

- Home screen visual refactor (next session).
- Extend audio fades to other transitions when needed.
- Continue E2E stabilization after major UI updates.
