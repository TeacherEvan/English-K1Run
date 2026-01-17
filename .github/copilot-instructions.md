# Copilot Instructions – English-K1Run

## Table of Contents

- [Big Picture Architecture](#big-picture-architecture)
- [Critical Conventions](#critical-conventions)
- [Coding Standards](#coding-standards)
- [UI Patterns](#ui-patterns)
- [Audio, i18n, and Welcome Flow](#audio-i18n-and-welcome-flow)
- [Gameplay Tuning and Continuous Mode](#gameplay-tuning-and-continuous-mode)
- [Error Handling](#error-handling)
- [Performance Optimization](#performance-optimization)
- [Accessibility](#accessibility)
- [Testing Practices](#testing-practices)
- [Security Guidelines](#security-guidelines)
- [Developer Workflows](#developer-workflows)
- [Deployment Considerations](#deployment-considerations)
- [Adding Content](#adding-content)

## Big Picture Architecture

- **Single-player, touch-first classroom game**: Core state lives in `use-game-logic` in `src/hooks/use-game-logic.ts`(../src/hooks/use-game-logic.ts); do not create parallel state in components.
- **Data flow**: UI events → `use-game-logic` actions (e.g., `handleObjectTap`, `startGame`) → state updates → render.
- **Audio architecture**: Modularized under `src/lib/audio/`(../src/lib/audio/) and re-exported from `src/lib/audio/index.ts`(../src/lib/audio/index.ts). Use singletons; do not instantiate new ones.

## Critical Conventions

- **Coordinates**: Percentage-based only. X ranges 5–95% with `LANE_BOUNDS` in `src/lib/constants/game-config.ts`(../src/lib/constants/game-config.ts). Never use pixel positions for gameplay objects.
- **Touch handling**: Must route through `multiTouchHandler` in `src/lib/touch-handler.ts`(../src/lib/touch-handler.ts). Do not attach raw `onClick` for gameplay objects.
- **Sizing**: Uses CSS vars (`--font-scale`, `--object-scale`, `--spacing-scale`) set by `src/hooks/use-display-adjustment.ts`(../src/hooks/use-display-adjustment.ts).

## Coding Standards

- **TypeScript**: Strict typing required. Use interfaces for props and state. Avoid `any`; prefer union types or generics.
- **Naming conventions**:
  - Components: PascalCase (e.g., `FallingObject`)
  - Hooks: camelCase with `use` prefix (e.g., `useGameLogic`)
  - Constants: UPPER_SNAKE_CASE (e.g., `LANE_BOUNDS`)
  - Variables/functions: camelCase
- **Imports**: Group by external libraries, then internal modules. Use absolute imports for src/.
- **File structure**: Keep related files together; use index.ts for clean exports.

## UI Patterns

- **Performance**: Frequently re-rendered components use `memo()` (example: `src/components/FallingObject.tsx'(../src/components/FallingObject.tsx)).
- **Layout**: Game menu layout keeps header, grid (`flex-1`), and footer as siblings; avoid wrappers that break layout in `src/components/GameMenu.tsx`(../src/components/GameMenu.tsx).
- **UI library**: Shadcn-style UI primitives and CVA variants live in `src/components/ui/`(../src/components/ui/).
- **Styling**: Use CSS modules or styled-components for component-specific styles; theme variables for consistency.

## Audio, i18n, and Welcome Flow

- **Audio fallback chain**: Web Audio → HTMLAudio → Speech Synthesis → tones. Key mapping lives in `src/lib/sound-manager.ts`(../src/lib/sound-manager.ts) (e.g., emoji_apple.wav registers `"apple"` and `"emoji_apple"`).
- **Language config and voices**: `src/lib/constants/language-config.ts`(../src/lib/constants/language-config.ts). Translations: `src/locales/`(../src/locales/).
- **Welcome screen narration**: Four phases and respects reduced motion; e2e mode disables animations when `?e2e=1` is present.

## Gameplay Tuning and Continuous Mode

- **Tuning constants**: Live in [`src/lib/constants/game-config.ts`](../src/lib/constants/game-config.ts).
- **Continuous mode state**: In SettingsContext with persistence (localStorage key `continuousModeHighScore`); see [`src/context/settings-context.tsx`](../src/context/settings-context.tsx).

## Error Handling

- **React errors**: Wrap components with `ErrorBoundary` (see `src/components/ErrorBoundary.tsx`(../src/components/ErrorBoundary.tsx)).
- **Async operations**: Use try-catch blocks; handle promises with `.catch()`.
- **Logging**: Use console.error for development; integrate with error reporting service in production.
- **Fallbacks**: Provide user-friendly error messages; avoid crashes by graceful degradation.

## Performance Optimization

- **Lazy loading**: Use `React.lazy()` for route components and heavy UI elements.
- **Code splitting**: Split bundles by routes using dynamic imports.
- **Memoization**: Apply `React.memo`, `useMemo`, and `useCallback` for expensive computations and event handlers.
- **Core Web Vitals**: Optimize for LCP, FID, CLS through image optimization, lazy loading, and efficient rendering.

## Accessibility

- **ARIA labels**: Add `aria-label` or `aria-labelledby` for interactive elements.
- **Keyboard navigation**: Ensure all interactive elements are focusable and operable via keyboard.
- **Screen readers**: Test with NVDA/JAWS; use semantic HTML.
- **Color contrast**: Meet WCAG AA standards; avoid color-only indicators.
- **Reduced motion**: Respect `prefers-reduced-motion` media query.

## Testing Practices

- **Unit tests**: Use Jest for hooks and utilities; cover critical logic in `src/hooks/__tests__/`](../src/hooks/**tests**/).
- **Integration tests**: Test component interactions and state changes.
- **E2E tests**: Use Playwright for full user flows; fixtures in `e2e/fixtures/`(../e2e/fixtures/); specs in `e2e/specs/`(../e2e/specs/).
- **Coverage**: Aim for 80%+ coverage; focus on error paths and edge cases.

## Security Guidelines

- **Input validation**: Sanitize user inputs; use libraries like DOMPurify for HTML.
- **XSS prevention**: Avoid `dangerouslySetInnerHTML`; escape outputs.
- **HTTPS**: Always serve over HTTPS; set secure cookies.
- **Dependencies**: Regularly audit with `npm audit`; keep packages updated.
- **Data storage**: Encrypt sensitive data; avoid storing secrets in localStorage.

## Developer Workflows

- **Dev server**: `npm run dev`. Verification: `npm run verify` (lint + typecheck + build). Build uses `--noCheck` due to React 19 types.
- **Automated formatting**: Runs via `code_review.ps1` every 5 minutes; do not disable it.
- **E2E**: Use `?e2e=1` to skip the welcome screen. Page objects/fixtures are in `e2e/fixtures/game.fixture.ts`(../e2e/fixtures/game.fixture.ts); prefer `gamePage.menu.startGame()` patterns. Tests live in `e2e/specs/`(../e2e/specs/).

## Deployment Considerations

- **CI/CD**: Use GitHub Actions for automated builds and deployments.
- **Monitoring**: Integrate error tracking (e.g., Sentry) and performance monitoring.
- **Caching**: Implement service worker for offline capabilities; cache static assets.
- **Environment variables**: Use `.env` files; never commit secrets.

## Adding Content

- **New categories**: Go in `src/lib/constants/game-categories.ts`(../src/lib/constants/game-categories.ts).
- **Sentence templates**: Live in `src/lib/constants/sentence-templates.ts`(../src/lib/constants/sentence-templates.ts); audio generation scripts are in `scripts/`(../scripts/).
