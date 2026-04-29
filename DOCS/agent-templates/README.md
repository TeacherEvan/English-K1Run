# Agent Template Pack

These templates are for bootstrapping the same workflow in other repositories.

## Files In This Folder

- `generic-web.md` for React, Vite, Next.js, and similar web apps
- `python-django.md` for Django and Python service repos
- `rust.md` for Rust applications and services
- `unity.md` for Unity game projects

## How To Use

1. Pick the stack template closest to your repo.
2. Copy the `.copilotignore` block into a real `.copilotignore` file.
3. Copy the `AGENT_README.md` block into a real root-level file.
4. Replace placeholders with repo-specific paths and invariants.
5. Add the new guide to the repo's docs index.

## What To Customize First

- the real state owner
- the main render or UI layer
- the side-effect boundaries
- the test commands
- binary and generated asset folders
- any critical invariants that frequently regress

## Maintenance Rule

If the architecture changes, update the manifesto before asking the agent to do major work.