# Job Card

Date: 2026-01-15
Repo: TeacherEvan/English-K1Run (branch: main)

## Goal

# Job Card (Index)

Date: 2026-02-02
Repo: TeacherEvan/English-K1Run (branch: main)

## Latest Update (2026-02-02)

Audio fixes and integration cleanup:

- Added /sounds public fallback resolution for audio assets to restore missing welcome audio playback.
- Home menu association playback now uses welcome_sangsom_association and welcome_sangsom_association_thai.
- Disabled target spawn audio trigger to stop repeated “Target spawned” playback.

Files updated:

- src/lib/audio/audio-registry.ts
- src/hooks/use-home-menu-audio.ts
- src/lib/sound-manager.ts

## Archive

- DOCS/jobcards/2026-01.md
- DOCS/jobcards/2025-12.md
  - Gated high-volume touch telemetry (`eventTracker.trackEvent`) to dev/debug mode.
  - File: [src/lib/touch-handler.ts](src/lib/touch-handler.ts)

### Tooling / Problems cleanup

- Added VS Code workspace TypeScript SDK pin so editor diagnostics match the repo’s installed `typescript`:
  - File: [.vscode/settings.json](.vscode/settings.json)
- Cleaned ESLint “react-refresh/only-export-components” warnings for shadcn-style UI primitives by disabling the rule only for those files (no runtime changes):
  - File: [eslint.config.js](eslint.config.js)

## Validation (December 22, 2025)

- Installed deps: `npm install`
- Unit tests: `npm run test:run` (pass)
- Type check: `npm run check-types` (pass)
- Lint/build: `npm run verify` (pass)

## Notes / Follow-ups (December 22, 2025)

- If VS Code still shows a `tsconfig.json` deprecation warning for `baseUrl`, run “TypeScript: Select TypeScript Version” → “Use Workspace Version”, or reload VS Code. The repo’s `tsc` build is green.
