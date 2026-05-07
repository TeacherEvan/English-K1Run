# Backend Agent and Agent Deduplication Implementation Plan

> **For agentic workers:** REQUIRED: Use the `subagent-driven-development` agent (recommended) or `executing-plans` agent to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a single workspace-scoped backend engineering agent for English K1 Run and prevent backend-agent duplication by documenting that agent as the canonical backend surface for this repository.

**Architecture:** Keep the implementation deliberately small. Create one `.agent.md` file under `.github/agents/` that specializes in this repo's backend-adjacent mechanics, then wire that agent into `.github/copilot-instructions.md` so future workers reuse it instead of creating renamed copies. A current audit of `/home/ewaldt/Documents/VS/GAMES/English-K1Run` and `/home/ewaldt/.config/Code/User` found unrelated user-profile agents but no backend-mechanics duplicate variants, so duplicate cleanup remains a deletion no-op and is handled by validating that only the canonical workspace backend agent exists for this scope after implementation.

**Tech Stack:** VS Code custom agents (`.agent.md`), Markdown frontmatter, repo instructions in `.github/copilot-instructions.md`, shell validation with `test`, `rg`, and `find`.

---

## File Structure

- Create: `.github/agents/backend-mechanics.agent.md`
  Responsibility: The single canonical backend specialist for the repo's Express dashboard API, Playwright test-server internals, CI workflows, deployment/runtime config, and Node-based operational scripts.
- Modify: `.github/copilot-instructions.md` after `## Developer Workflows` (around line 106)
  Responsibility: Make the backend agent discoverable and prevent future duplicate backend agents by declaring one canonical backend agent.
- No delete operations planned
  Responsibility: The audit found no duplicate backend-mechanics agent variants to remove; unrelated user-profile agents can remain untouched.

### Task 1: Create the Canonical Backend Agent

Retroactive execution note: this plan is now documenting work that already exists in the branch. The red-step checks below were not rerun in their original failing state because the backend agent had already been created before this plan was backfilled.

**Files:**

- Create: `.github/agents/backend-mechanics.agent.md`
- Reference: `dashboard-server.js`
- Reference: `test-server/index.js`
- Reference: `test-server/server.js`
- Reference: `.github/workflows/ci.yml`
- Reference: `package.json`

- [ ] **Step 1: Write the failing existence check**

```bash
test ! -f .github/agents/backend-mechanics.agent.md && echo "missing backend agent"
```

Expected: prints `missing backend agent`

- [ ] **Step 2: Run the check to verify it fails**

Run:

```bash
test ! -f .github/agents/backend-mechanics.agent.md && echo "missing backend agent"
```

Expected: prints `missing backend agent`

- [x] **Step 3: Write the minimal implementation**

Create `.github/agents/backend-mechanics.agent.md` with this exact content:

```md
---
description: "Use when working on backend, server, Express API, dashboard server, Playwright test server internals, CI workflows, deployment runtime, Docker, nginx, Vercel, Node scripts, or backend mechanics for English K1 Run."
name: "Backend Mechanics Engineer"
tools: [read, edit, search, execute]
argument-hint: "Describe the backend, server, test-server, CI, deployment, or runtime task and include the failing file, command, route, or workflow if you have one."
user-invocable: true
agents: []
---
You are the backend engineering specialist for English K1 Run.

You own the repo's backend-adjacent mechanics:
- `dashboard-server.js` and the `/api/test-runs` Express surface
- `test-server/` internals that support Playwright UI mode and test execution
- deployment/runtime config such as `Dockerfile`, `Dockerfile.dev`, `docker-compose.yml`, `nginx.conf`, and `vercel.json`
- Node-based workflow entry points in `package.json`, deployment scripts, and `.github/workflows/*.yml`

## Constraints
- DO NOT treat frontend gameplay state as backend state; gameplay authority stays in `src/hooks/use-game-logic.ts`.
- DO NOT invent new backend services when an existing script, workflow, or server entry point already owns the behavior.
- DO NOT diagnose missing audio assets as hosting failures when the file is absent from `sounds/`.
- ONLY make backend, infrastructure, workflow, and runtime changes that fit the existing static-hosting-first architecture.

## Approach
1. Start from the narrowest concrete backend anchor: a failing route, workflow, script, command, or server file.
2. Trace the owning code path locally before changing adjacent infrastructure.
3. Make the smallest fix in the existing backend surface instead of adding parallel abstractions.
4. Validate with the cheapest relevant command, such as a targeted Node run, `npm run check-types`, `npm run verify`, or a focused test command.

## Output Format
Summary:
- one paragraph on the backend problem and fix

Files:
- changed files with one-line reason each

Validation:
- exact commands run and whether they passed

Risks:
- remaining backend or deployment risks, or `none`
```

- [x] **Step 4: Run validation to verify it passes**

Run:

```bash
rg -n "^(description|name|tools|argument-hint|user-invocable|agents):|^You are the backend engineering specialist|^## Constraints|^## Approach|^## Output Format" .github/agents/backend-mechanics.agent.md
```

Expected: matches for all six frontmatter keys plus the main body headings.

- [ ] **Step 5: Commit**

Status note: intentionally left open because no commit was requested in this session.

```bash
git add .github/agents/backend-mechanics.agent.md
git commit -m "chore: add canonical backend mechanics agent"
```

### Task 2: Wire the Canonical Agent into Repo Guidance and Re-Check for Duplicates

Retroactive execution note: this plan was updated after the guidance had already been added to the repository, so the original failing discovery checks were not rerun in a pre-implementation state.

**Files:**

- Modify: `.github/copilot-instructions.md`
- Test: `.github/copilot-instructions.md`
- Audit: `.github/agents/backend-mechanics.agent.md`

- [ ] **Step 1: Write the failing discovery check**

```bash
rg -n "backend-mechanics.agent.md|single canonical backend agent|No duplicate backend agents" .github/copilot-instructions.md || echo "backend agent guidance missing"
```

Expected: prints `backend agent guidance missing`

- [ ] **Step 2: Run the check to verify it fails**

Run:

```bash
rg -n "backend-mechanics.agent.md|single canonical backend agent|No duplicate backend agents" .github/copilot-instructions.md || echo "backend agent guidance missing"
```

Expected: prints `backend agent guidance missing`

- [x] **Step 3: Write the minimal implementation**

Replace the `## Developer Workflows` block in `.github/copilot-instructions.md` with this exact block:

```md
## Developer Workflows

- **Backend agent**: For backend, server, CI, deployment, dashboard API, or Playwright test-server work, use `.github/agents/backend-mechanics.agent.md` as the single canonical backend agent for this repository.
- **No duplicate backend agents**: Do not add renamed or near-identical backend agent variants unless the scope is materially different from the canonical backend mechanics agent.
- **Dev server**: `npm run dev`. Verification: `npm run verify` (lint + build). Type checking is available separately via `npm run check-types`; build currently runs `tsc -b && vite build`.
- **Automated formatting**: Runs via `code_review.ps1` every 5 minutes; do not disable it.
- **E2E**: Use `?e2e=1` to skip the welcome screen. Page objects/fixtures are in `e2e/fixtures/game.fixture.ts`(../e2e/fixtures/game.fixture.ts); prefer `gamePage.menu.startGame()` patterns. Tests live in `e2e/specs/`(../e2e/specs/).
```

- [x] **Step 4: Run validation to verify it passes and no duplicates exist**

Run:

```bash
rg -n "backend-mechanics.agent.md|single canonical backend agent|No duplicate backend agents" .github/copilot-instructions.md
find .github/agents -maxdepth 1 -name '*.agent.md' -print | sort
find /home/ewaldt/.config/Code/User -name '*.agent.md' -print | sort
```

Expected:

- `rg` prints the new backend-agent guidance lines in `.github/copilot-instructions.md`
- `find .github/agents ...` prints exactly `.github/agents/backend-mechanics.agent.md`
- `find /home/ewaldt/.config/Code/User ...` may print unrelated user-profile agents, but no backend-mechanics duplicate variant should appear

Observed validation result:

- Workspace agent audit returned `.github/agents/backend-mechanics.agent.md`
- User-profile audit returned `Ask.agent.md`, `Explore.agent.md`, `Plan.agent.md`, and `gameplay-mechanics-workflow.agent.md`; none duplicate the backend-mechanics agent scope or filename

- [ ] **Step 5: Commit**

Status note: intentionally left open because no commit was requested in this session.

```bash
git add .github/copilot-instructions.md
git commit -m "docs: document canonical backend agent usage"
```

## Self-Review Checklist

- Spec coverage: The plan creates one backend-specialist agent and addresses duplicate-agent drift by enforcing one canonical workspace agent. Unrelated user-profile `.agent.md` files exist, but no backend-mechanics duplicate variant exists, so no delete task is required.
- Placeholder scan: No `TODO`, `TBD`, or undefined follow-up steps remain.
- Type consistency: The canonical filename, agent name, and duplicate-check commands all use the same `backend-mechanics.agent.md` path.
