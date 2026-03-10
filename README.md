# English K1 Run

Single-player, touch-first classroom game built with React 19, TypeScript, and Vite. The current public-facing product name is **English K1 Run**.

## What this repo is

- **Gameplay model:** single-player, offline-first
- **Core state:** `src/hooks/use-game-logic.ts`
- **Audio system:** `src/lib/audio/`
- **UI shell:** React components in `src/components/` and `src/app/`
- **Tests:** Vitest + Playwright
- **Target devices:** tablets, touch displays, classroom browsers

## Quick start

### Prerequisites

- Node.js `20.18+` or `22.12+`
- npm
- Modern browser

### Install and run

```bash
git clone https://github.com/TeacherEvan/English-K1Run.git
cd English-K1Run
npm install
npm run dev
```

### Optional audio setup

```bash
cp .env.example .env
```

- Use `ELEVENLABS_API_KEY` for local audio-generation scripts.
- Use `VITE_ELEVENLABS_API_KEY` only if you intentionally want live browser-side ElevenLabs testing during development.
- For competition and production, prefer pre-generated audio assets.

See `AUDIO_SETUP.md` for the current audio/env model.

## Common commands

```bash
# Development
npm run dev
npm run verify

# Unit tests
npm run test
npm run test:run
npm run test:coverage

# E2E tests
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:headed

# Audio
npm run audio:list-voices
npm run audio:generate-welcome
npm run audio:generate
npm run audio:validate

# Production
npm run build
npm run preview
```

## Fast repo map

```text
src/
  app/                App shell and startup orchestration
  components/         Gameplay, menu, and UI components
  context/            Settings and language providers
  hooks/              Gameplay and UI hooks
  lib/audio/          Audio runtime, preloaders, speech, playback
  lib/game/           Collision, worms, and game helpers
  locales/            Translation JSON files
  types/              Shared TypeScript types

public/               Static assets and runtime-served sounds
sounds/               Source/generated audio assets
e2e/                  Playwright fixtures and specs
scripts/              Validation and generation tooling
DOCS/                 Current guides and historical summaries
plans/                Working plans and audits
```

## Architecture notes

- Keep gameplay state in `useGameLogic`; do not create parallel gameplay state in components.
- Use percentage-based coordinates only for gameplay objects.
- Route gameplay touch handling through `src/lib/touch-handler.ts`.
- Keep audio singleton-based; do not instantiate ad-hoc audio managers.
- Welcome narration in normal mode must start from explicit user gesture.

## Current documentation entry points

- `AUDIO_SETUP.md` — active audio/env setup
- `DOCS/A-README.md` — docs landing page
- `DOCS/CODEBASE_INDEX.md` — navigation map for the codebase
- `plans/competition-readiness-roadmap-2026-03-10.md` — current readiness roadmap

## Testing notes

- Local Playwright defaults are tuned for `chromium`, `firefox`, and `mobile`.
- Use `?e2e=1` to skip the welcome screen in E2E flows.
- Run `npm run verify` before shipping changes.

## Audio guidance

- Pre-generated assets are the recommended runtime path.
- Browser-side premium TTS is optional and best treated as a dev-only fallback.
- If audio behavior seems off, start with:

```bash
npm run audio:validate
```

Then check `CONSOLE_EXAMPLES.md` and `AUDIO_SETUP.md`.

## Deployment notes

- Primary targets: static hosting, Vercel, Docker/nginx
- Do not rely on client-side premium API secrets for competition readiness
- Validate audio assets before deployment

## Contributing

- Keep source and docs files under the repo’s size conventions where possible.
- Preserve existing product copy: `English K1 Run` for player-facing text.
- Update the docs index when adding new long-lived guides.

## License

MIT — see `LICENSE`.
