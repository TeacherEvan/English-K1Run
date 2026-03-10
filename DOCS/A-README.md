# Documentation Index

Use this page as the main landing point for repository documentation.

## Start here

- `../README.md` — onboarding, commands, architecture notes
- `../AUDIO_SETUP.md` — current audio and environment setup
- `../jobcard.md` — compressed recent-history and practical repo notes
- `CODEBASE_INDEX.md` — fast navigation map for the codebase
- `../plans/competition-readiness-roadmap-2026-03-10.md` — current competition-readiness roadmap

## Current guides

| Topic               | File                   | Use when                                               |
| ------------------- | ---------------------- | ------------------------------------------------------ |
| Onboarding          | `../README.md`         | You need install/run/test commands                     |
| Audio/env           | `../AUDIO_SETUP.md`    | You need current ElevenLabs or asset guidance          |
| Recent history      | `../jobcard.md`        | You need the shortest reliable summary of recent work  |
| Codebase navigation | `CODEBASE_INDEX.md`    | You need to find the right module quickly              |
| Integration details | `INTEGRATION_GUIDE.md` | You are wiring utilities or shared infrastructure      |
| Best practices      | `BEST_PRACTICES.md`    | You are changing code patterns or contributor workflow |
| Security            | `SECURITY.md`          | You are reviewing deployment/security posture          |
| Changelog           | `CHANGELOG.md`         | You need recent shipped history                        |

## Historical summaries

These files are useful context, but they are not the primary source of truth for setup:

- `../CONSOLE_EXAMPLES.md`
- `../ISSUE_RESOLUTION_AUDIO.md`
- `../PR_SUMMARY.md`
- `AUDIO_LOADING_FIXES_COMPLETED_JAN2026.md`
- `LANGUAGE_SELECTION_IMPLEMENTATION_JAN2026.md`
- `archive/README.md`

Older one-off implementation reports may be merged into `../jobcard.md` or `.github/copilot-instructions.md` once their practical guidance becomes stable.
The January 2026 audio/loading plan and implementation-summary docs have already been folded into `../jobcard.md`, `../AUDIO_SETUP.md`, and code-level references.

If a historical summary disagrees with current behavior:

1. Trust the code.
2. Then trust `../README.md`, `../AUDIO_SETUP.md`, and `../.env.example`.
3. Treat older reports and plans as snapshots.

## Directory notes

- `DOCS/` contains durable guides and compact summaries.
- `DOCS/archive/` contains archived root-level reports and logs kept for historical reference.
- `../plans/` contains planning and audit material.
- Root-level markdown files are usually user-facing summaries or historical incident notes.

## Recommended reading paths

### New contributor

1. `../README.md`
2. `CODEBASE_INDEX.md`
3. `BEST_PRACTICES.md`

### Audio troubleshooting

1. `../AUDIO_SETUP.md`
2. `../CONSOLE_EXAMPLES.md`
3. `../ISSUE_RESOLUTION_AUDIO.md`

### Competition-readiness work

1. `../plans/competition-readiness-roadmap-2026-03-10.md`
2. `CODEBASE_INDEX.md`
3. `SECURITY.md`

## Maintenance rule

When adding a new long-lived guide, add it here and keep the description to one line. Tiny docs are easier to trust, and much harder to weaponize against future-you.
