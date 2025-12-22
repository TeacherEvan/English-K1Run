# Job Card

Date: 2025-12-22
Repo: TeacherEvan/English-K1Run (branch: main)

## Goal
Improve performance and clean up developer-facing Problems/lint noise without changing gameplay UX.

## Work Completed
### Performance optimizations
- Cached viewport dimensions once and updated on `resize` to avoid reading `window.innerWidth/innerHeight` every frame.
  - File: [src/hooks/use-game-logic.ts](src/hooks/use-game-logic.ts)
- Reduced hot-path overhead in multi-touch handling:
  - Avoided `Array.from()` allocations on `TouchList`.
  - Gated high-volume touch telemetry (`eventTracker.trackEvent`) to dev/debug mode.
  - File: [src/lib/touch-handler.ts](src/lib/touch-handler.ts)

### Tooling / Problems cleanup
- Added VS Code workspace TypeScript SDK pin so editor diagnostics match the repo’s installed `typescript`:
  - File: [.vscode/settings.json](.vscode/settings.json)
- Cleaned ESLint “react-refresh/only-export-components” warnings for shadcn-style UI primitives by disabling the rule only for those files (no runtime changes):
  - File: [eslint.config.js](eslint.config.js)

## Validation
- Installed deps: `npm install`
- Unit tests: `npm run test:run` (pass)
- Type check: `npm run check-types` (pass)
- Lint/build: `npm run verify` (pass)

## Notes / Follow-ups
- If VS Code still shows a `tsconfig.json` deprecation warning for `baseUrl`, run “TypeScript: Select TypeScript Version” → “Use Workspace Version”, or reload VS Code. The repo’s `tsc` build is green.

