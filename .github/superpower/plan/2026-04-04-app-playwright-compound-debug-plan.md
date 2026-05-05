# App + Playwright Compound Debug Plan

## Goal

Add a VS Code compound debug entry that starts the app dev server and a Playwright debug session together without disturbing the existing single-target debug entries.

## Architecture

Keep the change local to `.vscode/launch.json`. Use a dev-server-only launch target for compound use so Playwright can run alongside the app server without also opening an extra Chrome debug window.

## Constraints

- Prefer compact files; split helpers when it improves clarity.
- Preserve existing debug entries.
- Validate JSON diagnostics after the edit.
- Verify the referenced Playwright and Vitest entry files still exist.

## Tasks

### Task 1: Add the compound launch entry

Files:

- `.vscode/launch.json`

Changes:

- add an `App: Dev server only` launch config
- add a `Debug app + Playwright current test` compound
- keep the existing browser-opening app config for manual app debugging

Validation:

- JSON diagnostics clean for `.vscode/launch.json`

### Task 2: Verify the debug targets still resolve

Validation:

- confirm `node_modules/@playwright/test/cli.js` exists
- confirm `node_modules/vitest/vitest.mjs` exists
