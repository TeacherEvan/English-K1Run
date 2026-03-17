# Documentation Index

Use this page as the main landing point for repository documentation.

## Read these first

| Priority | File                                | Why it matters                                  |
| -------- | ----------------------------------- | ----------------------------------------------- |
| 1        | `../README.md`                      | Install/run/test commands and repo conventions  |
| 2        | `../AUDIO_SETUP.md`                 | Current audio, asset, and environment guidance  |
| 3        | `../jobcard.md`                     | Compressed recent history and practical context |
| 4        | `CODEBASE_INDEX.md`                 | Fast codebase navigation map                    |
| 5        | `CHANGELOG.md`                      | Durable shipped-history summary                 |

## Guides by task

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

## Source-of-truth rule

If two docs disagree:

1. Trust the code.
2. Then trust `../README.md`, `../AUDIO_SETUP.md`, and `../.env.example`.
3. Treat `../plans/` and historical reports as snapshots, not current setup instructions.

## What lives where

- `DOCS/` contains durable guides and navigation docs.
- `DOCS/archive/` contains archived reports and logs that still have reference value.
- `../plans/` contains planning and audit material.
- Generated outputs like `../dist/`, `../playwright-report/`, and `../allure-results/` are for validation, not onboarding.

## Recommended reading paths

### New contributor

1. `../README.md`
2. `CODEBASE_INDEX.md`
3. `BEST_PRACTICES.md`

### Audio troubleshooting

1. `../AUDIO_SETUP.md`
2. `../CONSOLE_EXAMPLES.md`
3. `CODEBASE_INDEX.md`

### Competition-readiness work

1. `../plans/competition-readiness-roadmap-2026-03-10.md`
2. `CODEBASE_INDEX.md`
3. `SECURITY.md`
4. `../README.md` for the deployed-site diagnostic test entry point

## Maintenance rule

When adding a new long-lived guide, add it here and keep the description to one line. Prefer updating the trusted entry points over creating another one-off root-level summary.
