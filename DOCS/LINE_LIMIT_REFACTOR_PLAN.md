# Line Limit Audit & Refactor Plan (<= 500 Lines)

## Objective
Enforce the policy that **no file exceeds 500 lines** by auditing current violations, identifying code smells, and laying out a pragmatic refactor plan that aligns with the project’s architecture (touch-first gameplay, audio modules, and performance-sensitive UI).

## Audit Summary (Files > 500 Lines)
Line counts are from the current working tree at the time of this audit. The list prioritizes gameplay- and user-facing code first, then shared utilities, then documentation/generator scripts.

| Priority | File | Lines | Area | Code Smells / Risks |
| --- | --- | --- | --- | --- |
| P0 | `src/lib/sound-manager.ts` | 1927 | Audio | God object: registry + playback + fallback + preloading + voice logic; hard to test and reason about. |
| P0 | `src/hooks/use-game-logic.ts` | 1878 | Game logic | Monolithic hook mixing state, spawning, scoring, timers, and UI side-effects. |
| P1 | `src/lib/accessibility-utils.ts` | 931 | Accessibility | Large collection of unrelated helpers with no clear module boundaries. |
| P1 | `src/components/ui/sidebar.tsx` | 739 | UI | Dense component file with nested rendering logic; difficult to isolate re-renders. |
| P1 | `src/main.css` | 651 | Styling | Global styles + component styles mixed; hard to optimize or reuse. |
| P1 | `src/lib/audio/audio-loader.ts` | 582 | Audio | Multiple loader implementations in a single file. |
| P1 | `src/lib/constants/sentence-templates.ts` | 576 | Content | Large constants file; harder to extend and review. |
| P1 | `src/lib/performance-monitor-utils.ts` | 545 | Performance | Metrics + reporting + helpers combined. |
| P1 | `src/App.css` | 539 | Styling | Component-level styles mixed with global patterns. |
| P2 | `e2e/fixtures/game.fixture.ts` | 555 | Tests | Fixture responsibilities mixed (selectors + flow + setup). |
| P2 | `improved-testServer.js` | 691 | Tooling | Server + config + diagnostics in one file. |
| P2 | `scripts/generate-audio.cjs` | 575 | Tooling | Script orchestration and file IO mixed. |
| P2 | `README.md` | 520 | Docs | Large root doc; onboarding and architecture topics mixed. |
| P2 | `DOCS/BEST_PRACTICES.md` | 635 | Docs | Multiple topics in one document. |
| P2 | `DOCS/INTEGRATION_GUIDE.md` | 599 | Docs | Feature guides combined; hard to keep concise. |
| P2 | `DOCS/LANGUAGE_SELECTION_IMPLEMENTATION_JAN2026.md` | 519 | Docs | Single long narrative; better as multiple sections. |
| P2 | `jobcard.md` | 852 | Docs | Large scoped narrative; should be segmented. |
| P2 | `C-jobcard.md` | 1014 | Docs | Same as above; over limit. |
| P2 | `DOCS/ARCHIVE/A-ACTIONABLE_RECOMMENDATIONS_2026-01-17.md` | 1201 | Docs | Archived but still exceeds limit. |
| P2 | `DOCS/ARCHIVE/C-CODE_REVIEW_REPORT_2026-01-17.md` | 938 | Docs | Archived but still exceeds limit. |
| P2 | `package-lock.json` | 19364 | Generated | Auto-generated lockfile; violates policy without procedural mitigation and should be reviewed for dependency bloat separately. |

## Key Code Smells & Maintainability Risks
- **God objects / mixed responsibilities**: `sound-manager.ts`, `use-game-logic.ts`, and `accessibility-utils.ts` combine unrelated workflows, blocking clear separation of concerns.
- **High cognitive load**: Large UI and CSS files (`sidebar.tsx`, `App.css`, `main.css`) increase the cost of safe visual changes and performance tuning.
- **Low test granularity**: Test fixtures and tooling files bundle distinct behaviors, making them harder to mock or isolate.
- **Content sprawl**: Long documentation and constants files impede reviews and updates; small changes require large diffs.

## Refactor Strategy (Aligned with Recent Practices)
Recent work shows value in **extracting inline CSS into dedicated files**, **ESLint compliance**, **automated testing**, and **disciplined Git staging**. This plan extends those practices to achieve the 500-line rule without sacrificing gameplay performance or visual complexity.

### Module Decomposition Targets
- **Audio system (`sound-manager.ts`, `audio-loader.ts`)**
  - Split into `src/lib/audio/` modules: `registry.ts` (alias mapping/indexing), `preload.ts` (priority loading), `fallbacks.ts` (HTMLAudio/Speech/tone fallbacks), `speech.ts` (speech synthesis), `tone-utils.ts` (tone generation helpers), `playback.ts` (play/stop orchestration), `audio-context.ts` (context lifecycle).
  - Keep singletons; avoid new audio instantiations per the architecture.
- **Game logic (`use-game-logic.ts`)**
  - Create `src/hooks/use-game-logic/` with `state.ts`, `reducers.ts`, `actions.ts`, `scoring.ts`, `timers.ts`, `spawn.ts`, `selectors.ts`.
  - Preserve the “UI events → hook actions → state update” flow.
- **Accessibility (`accessibility-utils.ts`)**
  - Split into `aria.ts`, `focus.ts`, `keyboard.ts`, `motion.ts`, and re-export from `index.ts`.
- **UI (`sidebar.tsx`)**
  - Extract subcomponents (`SidebarNav`, `SidebarItem`, `SidebarTrigger`) and memoize hot paths.
  - Keep layout siblings for header/grid/footer as per `GameMenu` layout rule.
- **Styling (`main.css`, `App.css`)**
  - Introduce `src/styles/` (or similar) with `base.css`, `animations.css`, `theme.css`, and component-scoped CSS modules.
  - Continue the inline-CSS extraction trend to reduce inline complexity.
- **Performance (`performance-monitor-utils.ts`)**
  - Split metrics capture, reporting, and profiling helpers into dedicated files.
- **Content (`sentence-templates.ts`)**
  - Split by category (e.g., `colors.ts`, `numbers.ts`, `animals.ts`) and compose a combined export.
- **Testing (`game.fixture.ts`)**
  - Split selectors, actions, and setup helpers to keep fixtures lean.
- **Tooling (`improved-testServer.js`, `generate-audio.cjs`)**
  - Split config, CLI parsing, and IO helpers into modules.

### Documentation Segmentation
- Replace long monolithic docs with smaller topic-focused files and a TOC index.
- Keep archived reports as multiple shorter chapters (e.g., `DOCS/ARCHIVE/2026-01-17/part-1.md`).
- Move large onboarding sections in `README.md` into `DOCS/` and link them.

### Generated Files Policy
- `package-lock.json` exceeds the 500-line limit. Decide between:
  1. **Workspace-level lockfiles** (split by package if tooling allows), or
  2. **Policy exception for generated artifacts** documented in the repo.

If exceptions are not allowed, a split-lockfile approach is required before enforcement.

## Step-by-Step Implementation Plan
1. **Baseline & Tooling**
   - Run `npm run lint`, `npm run test:run`, and `npm run build` to capture the current baseline.
   - Generate an automated line-count report (script or manual command) for tracking progress.
2. **P0 Refactors (Audio + Game Logic)**
   - Extract modules as outlined above; ensure imports use the new index files.
   - Add unit tests for extracted logic (e.g., audio preload, spawn logic) to preserve behavior.
3. **P1 Refactors (Accessibility, UI, CSS, Performance)**
   - Split utilities and UI subcomponents; keep memoization for frequently re-rendered parts.
   - Move inline CSS into dedicated files and verify `main.css`/`App.css` drop below 500 lines.
4. **P2 Refactors (Content, Tests, Tooling, Docs)**
   - Split constants and fixtures into smaller modules.
   - Segment long docs into chapters with an index file for discoverability.
5. **Generated Files Decision**
   - Choose and implement the lockfile strategy. If policy exceptions are required, document them.
6. **Verification & Performance Checks**
   - For each refactor, run targeted tests (Vitest + Playwright for affected areas).
   - Run `npm run lint` and `npm run build` to confirm ESLint and build compliance.
   - Monitor performance: preserve memoization, avoid re-renders, and keep audio initialization stable.
7. **Code Review & Commit Strategy**
   - Use **small, focused commits** per file group: `git add -p` for clean staging.
   - Request code review for each major module extraction; include diff summaries and test results.
   - Merge in stages to avoid destabilizing the gameplay loop or audio pipeline.

## Recommended Commit Sequencing
1. `chore(audit): add line-limit refactor plan`
2. `refactor(audio): split sound manager modules`
3. `refactor(gameplay): split use-game-logic modules`
4. `refactor(ui): split sidebar and CSS modules`
5. `refactor(utils): segment accessibility + performance utilities`
6. `refactor(content/tests/tools): split large constants, fixtures, scripts`
7. `docs: split long docs and update README links`

## Notes on Visual Complexity & Performance
- **Visual complexity** should be handled by modular CSS and reusable components rather than adding more inline styles in large files.
- **Performance** improvements should preserve the current memoization patterns (`React.memo`, `useMemo`, `useCallback`) and avoid creating new audio contexts.
- **Code splitting** and lazy loading can reduce bundle size while keeping gameplay responsive.
