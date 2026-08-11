# Rust Template

Use this for Rust services, CLIs, and desktop apps.

## `.copilotignore`

```gitignore
target/
Cargo.lock
*.log
.env
.env.*
coverage/
flamegraph.svg
*.profraw
*.profdata
```

## `AGENT_README.md`

```md
# AGENT_README.md

## Architecture
- Crate entry point: `src/main.rs` or `src/lib.rs`
- Domain modules: `<src/domain or module tree>`
- IO boundaries: `<http, db, fs, or cli modules>`
- Async runtime: `<tokio/async-std/none>`

## Conventions
- Keep parsing and validation near boundary modules
- Keep domain types separate from transport types
- Prefer explicit error types over stringly errors

## Invariants
- Do not block inside async paths
- Keep ownership and lifetimes simple at API boundaries
- Centralize config loading in `<config module>`

## Entry Points
- Logic bug: `<domain module>`
- IO bug: `<adapter module>`
- CLI bug: `<command module>`

## Verification
- Format: `cargo fmt --check`
- Lint: `cargo clippy --all-targets --all-features -- -D warnings`
- Tests: `cargo test`
```