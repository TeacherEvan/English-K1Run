# AI Agent Workflow

Use this as a universal default for any AI coding agent.

## Core Principle

Explicit context beats implicit discovery.

The agent should not guess:
- what files matter
- what files are noise
- where the architecture boundaries are
- what failed in the previous attempt

## The Ironclad Rules

1. Add a deterministic ignore file.
2. Add a root-level agent manifesto.
3. Pin the exact files for non-trivial work.
4. Reset the session after repeated failed turns.

## Rule 1: Deterministic Ignore

Create `.copilotignore` from an official stack template, then append repo-specific exclusions.

Always exclude:
- binary assets
- generated build output
- dependency trees
- logs and reports
- caches and editor junk
- secrets and environment files

The goal is not minimalism. The goal is to stop the agent from reading noise.

## Rule 2: Agent Manifesto

Create `AGENT_README.md` or `ARCHITECTURE.md` in the repo root.

Keep it short and operational:
- what owns state
- what owns rendering
- where side effects live
- naming conventions
- critical invariants that must not be violated
- the best entry points for common tasks

Treat this as the repo's AI system prompt.

## Rule 3: Explicit Pinning

Do not start with broad prompts like:

```text
Fix the audio bug.
```

Start with file-pinned prompts like:

```text
Review @AGENT_README.md, @src/lib/audio/index.ts, and @src/lib/sound-manager.ts.
The welcome audio stops after the first phrase on replay.
Check the state handoff around line 84.
```

This forces the search space to stay local and makes failures easier to diagnose.

## Rule 4: Wipe And Reload

If the agent fails twice on the same fix:
- stop the current session
- revert the failed edit if needed
- start a new prompt
- state why the previous attempt failed
- repin the exact files

Context pollution is real. Fresh context is cheaper than a fourth correction turn.

## Standard Prompt Shape

```text
Review @AGENT_README.md and @<owner-file>.
Behavior: <what is wrong now>.
Expected: <what should happen>.
Constraint: <invariant to preserve>.
Check: <test or command to run after edit>.
```

## When To Deviate

Broad repo search is fine when:
- you are onboarding to an unknown codebase
- you are writing the first manifesto
- you are doing dependency or blast-radius analysis

After that, go back to explicit pinning.

## Template Pack

Use the starter docs in `DOCS/agent-templates/`:
- `README.md`
- `generic-web.md`
- `python-django.md`
- `rust.md`
- `unity.md`