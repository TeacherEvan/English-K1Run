# Generic Web Template

Use this for React, Vite, Next.js, or similar frontend repositories.

## `.copilotignore`

```gitignore
node_modules/
dist/
build/
.next/
coverage/
playwright-report/
test-results/
*.log
.env
.env.*
package-lock.json
yarn.lock
pnpm-lock.yaml
public/*.png
public/*.jpg
public/*.jpeg
public/*.gif
public/*.webp
public/*.mp4
public/*.mp3
public/*.wav
```

## `AGENT_README.md`

```md
# AGENT_README.md

## Architecture
- App shell: `src/App.tsx`
- State owner: `<main state hook or store>`
- Render layer: `src/components/`
- Side effects: `<api layer or service directory>`

## Conventions
- Components: PascalCase
- Hooks: camelCase with `use`
- Utilities: project style
- Tests: `<unit test dir>` and `<e2e dir>`

## Invariants
- Do not create duplicate state outside `<main state owner>`
- Do not call APIs directly from presentation-only components
- Keep routing changes inside `<router boundary>`

## Entry Points
- Bug in state flow: `<owner file>`
- Bug in UI behavior: `<scene or component file>`
- Bug in API data: `<service file>`

## Verification
- Dev: `<dev command>`
- Tests: `<test command>`
- Build: `<build command>`
```