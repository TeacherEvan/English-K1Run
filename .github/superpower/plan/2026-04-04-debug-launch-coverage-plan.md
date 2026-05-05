# Debug Launch Coverage Plan

## Goal

Provide practical VS Code debug coverage for the repo by supporting app runtime, dashboard server, unit tests, Playwright, and a compound launch that starts the main app plus dashboard server together.

## Architecture

Keep debug orchestration in `.vscode/launch.json` and avoid repo-wide runtime behavior changes except where an actual debug target is broken. Fix broken entrypoints only when required to make an advertised debug configuration runnable.

## Constraints

- Prefer compact files; split helpers when it improves clarity.
- Prefer minimal, explicit debug configurations over fragile magic.
- Verify any newly advertised debug target actually starts.
- Do not add secrets or environment-specific hardcoding.

## Tasks

### Task 1: Add compound debug configuration

Files:

- `.vscode/launch.json`

Changes:

- add a compound launch for the game app plus dashboard server
- keep existing app, Vitest, Playwright, and dashboard configs intact

Validation:

- JSON diagnostics clean for `.vscode/launch.json`

### Task 2: Ensure dashboard debug target is runnable

Files:

- `dashboard-server.js`

Changes:

- keep the dashboard server compatible with the repo's ESM package configuration so the debug target actually starts

Validation:

- `node dashboard-server.js`

### Task 3: Commit the debug setup

Validation:

- `git status --short`
- create a single descriptive commit
