# Codebase Index

Use this file as the fast navigation map for `English K1 Run`.

## Best entry points

| Goal                         | Start here                                | Why                                   |
| ---------------------------- | ----------------------------------------- | ------------------------------------- |
| Understand app boot          | `src/App.tsx` and `src/app/`              | Top-level startup and scene wiring    |
| Understand gameplay state    | `src/hooks/use-game-logic.ts`             | Main gameplay facade                  |
| Trace gameplay rendering     | `src/app/components/AppGameplayScene.tsx` | Gameplay scene composition            |
| Inspect audio runtime        | `src/lib/audio/`                          | Playback, loaders, speech, sequencing |
| Check touch behavior         | `src/lib/touch-handler.ts`                | Multi-touch entry point               |
| Review settings/localization | `src/context/` and `src/locales/`         | Providers and translation resources   |
| Review tests                 | `e2e/` and `src/**/__tests__/`            | E2E and unit coverage                 |
| Review tooling               | `package.json` and `scripts/`             | Commands and maintenance scripts      |

## System map

| Area                | Key files / directories                                 | Notes                                                  |
| ------------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| App shell           | `src/App.tsx`, `src/app/`, `src/app/components/`        | Boot flow, preload gates, top-level scene composition  |
| Gameplay state      | `src/hooks/use-game-logic.ts`, `src/hooks/game-logic/`  | Gameplay session, spawning, taps, target progression   |
| Gameplay UI         | `src/components/`, `src/components/game-menu/`, `src/components/welcome/` | Menus, welcome screen, HUD, overlays, reusable widgets |
| Audio runtime       | `src/lib/audio/`, `src/lib/sound-manager*.ts`           | Asset resolution, playback, speech, sequencing         |
| Core game utilities | `src/lib/game/`, `src/lib/constants/`                   | Collision logic, worms, config, labels, tuning         |
| Accessibility & UX  | `src/lib/accessibility/`, `src/context/`, `src/hooks/display-adjustment/` | A11y helpers, settings, display adaptation             |
| Localization        | `src/locales/`, `src/i18n.ts`, `src/lib/constants/language-config.ts` | Supported locales and language metadata                |
| Test harness        | `e2e/`, `playwright.config.ts`, `src/test/`, `src/**/__tests__/` | Browser and unit/integration validation                |
| Tooling & scripts   | `scripts/`, `eslint.config.js`, `package.json`          | Generation, validation, lint/build/test commands       |

## Directory guide

### `src/app/`

- App shell, boot flow, preload hooks, top-level scene orchestration.

### `src/components/`

- Menu, welcome, gameplay, HUD, and UI primitives.
- `src/components/ui/` contains reusable Radix/shadcn-style building blocks.

### `src/hooks/`

- Gameplay facade and supporting hooks.
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

- Durable guides, changelog, and navigation entry points.

### `plans/`

- Planning and audit material. Useful for context, but not always the final source of truth.

### Generated outputs

- `dist/`, `playwright-report/`, and `allure-results/` are generated artifacts.
- Use them for validation, not as implementation entry points.

## High-signal files

- `README.md` - onboarding and command map
- `AUDIO_SETUP.md` - audio/env setup
- `jobcard.md` - compressed recent history
- `package.json` - authoritative command list
- `playwright.config.ts` - browser test matrix
- `src/lib/constants/language-config.ts` - locale and voice wiring
- `.github/copilot-instructions.md` - repo-specific engineering guidance

## Source-of-truth rule

If a historical summary disagrees with current setup:

1. Trust the code.
2. Then trust `README.md`, `AUDIO_SETUP.md`, and `.env.example`.
3. Treat older reports in `DOCS/` and `plans/` as snapshots, not authoritative setup instructions.

## Fast search tips

- Audio issue: search `ElevenLabs`, `speechSynthesizer`, `centralAudioManager`, or `audio:validate`
- Gameplay issue: search `useGameLogic`, `handleObjectTap`, `spawn`, or `worm`
- Menu/startup issue: search `WelcomeScreen`, `AppStartupGate`, `GameMenu`, or `HomeWindow`
- Localization issue: search `accessibility.`, `language-config`, or translation keys in `src/locales/`
- Test issue: search `data-testid`, `?e2e=1`, `playwright`, or the matching spec name in `e2e/specs/`
