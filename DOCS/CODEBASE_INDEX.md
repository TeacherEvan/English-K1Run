# Codebase Index

Use this file as the fast navigation map for `English K1 Run`.

## Best entry points

| Goal                      | Start here                                | Why                                   |
| ------------------------- | ----------------------------------------- | ------------------------------------- |
| Understand gameplay state | `src/hooks/use-game-logic.ts`             | Main gameplay façade                  |
| Trace rendering           | `src/app/components/AppGameplayScene.tsx` | Gameplay scene composition            |
| Inspect audio runtime     | `src/lib/audio/`                          | Playback, loaders, speech, sequencing |
| Check touch behavior      | `src/lib/touch-handler.ts`                | Multi-touch entry point               |
| Review translations       | `src/locales/`                            | Player-facing strings                 |
| Review tests              | `e2e/` and `src/**/__tests__/`            | E2E and unit coverage                 |

## Directory guide

### `src/app/`

- App shell, boot flow, preload hooks, top-level scene orchestration.

### `src/components/`

- Menu, welcome, gameplay, HUD, and UI primitives.
- `src/components/ui/` contains reusable Radix/shadcn-style building blocks.

### `src/hooks/`

- Gameplay façade and supporting hooks.
- `src/hooks/game-logic/` contains extracted gameplay submodules.

### `src/lib/audio/`

- Core runtime audio modules.
- Includes preloaders, registry/resolution helpers, speech clients, and playback controls.

### `src/lib/game/`

- Collision helpers, worm management, and low-level gameplay utilities.

### `src/context/`

- Settings and language providers.

### `src/locales/`

- Translation JSON files for supported languages.

### `public/` and `sounds/`

- `public/` holds static runtime assets.
- `sounds/` is the working/generated audio asset source directory used by project tooling.

### `scripts/`

- Build helpers, validation scripts, and audio generation tooling.

### `DOCS/`

- Current guides plus compact historical summaries.

### `plans/`

- Planning and audit material. Useful for context, but not always the final source of truth.

## Active setup docs

- `README.md` — onboarding and command map
- `AUDIO_SETUP.md` — audio/env setup
- `DOCS/A-README.md` — docs landing page

## Historical vs active docs

If a historical summary disagrees with current setup:

1. Trust the code.
2. Then trust `README.md`, `AUDIO_SETUP.md`, and `.env.example`.
3. Treat older reports in `DOCS/` and `plans/` as snapshots, not authoritative setup instructions.

## High-signal files for future work

- `plans/competition-readiness-roadmap-2026-03-10.md`
- `.github/copilot-instructions.md`
- `package.json`
- `playwright.config.ts`
- `src/lib/constants/language-config.ts`

## Fast search tips

- Audio issue: search `ElevenLabs`, `speechSynthesizer`, or `audio:validate`
- Gameplay issue: search `useGameLogic`, `handleObjectTap`, or `spawn`
- Menu/startup issue: search `WelcomeScreen`, `AppStartupGate`, or `GameMenu`
- Localization issue: search `accessibility.` or translation keys in `src/locales/`
