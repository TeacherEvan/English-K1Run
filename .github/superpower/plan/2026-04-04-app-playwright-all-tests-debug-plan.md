# App + Playwright All-Tests Compound Debug Plan

## Goal

Add a VS Code compound debug entry that starts the app dev server and the existing Playwright all-tests debug session together.

## Architecture

Keep the change local to `.vscode/launch.json` and reuse the existing `App: Dev server only` and `Playwright: Debug all tests` entries.

## Constraints

- Keep files under the repo 200-line limit.
- Preserve existing debug entries.
- Validate JSON diagnostics after the edit.
- Commit the follow-up cleanly on the current debug branch.

## Tasks

### Task 1: Add the compound launch entry

Files:

- `.vscode/launch.json`

Changes:

- add `Debug app + Playwright all tests`
- reuse `App: Dev server only`
- reuse `Playwright: Debug all tests`

Validation:

- JSON diagnostics clean for `.vscode/launch.json`

### Task 2: Commit the follow-up

Validation:

- `git status --short`
- create a single descriptive commit
