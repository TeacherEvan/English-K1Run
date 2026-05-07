# Python Django Template

Use this for Django applications and Python backend repos.

## `.copilotignore`

```gitignore
__pycache__/
*.py[cod]
.pytest_cache/
.mypy_cache/
.ruff_cache/
.venv/
venv/
env/
dist/
build/
*.egg-info/
coverage/
htmlcov/
*.log
.env
.env.*
media/
staticfiles/
```

## `AGENT_README.md`

```md
# AGENT_README.md

## Architecture
- Entry point: `<manage.py or ASGI/WSGI path>`
- Project settings: `<settings module>`
- Domain apps: `<apps directory>`
- Side effects: `<tasks, integrations, signals>`

## Conventions
- Business logic stays in `<services or domain modules>`
- ORM access stays out of templates and serializers when possible
- Background work goes through `<celery or async task layer>`

## Invariants
- Keep request validation in `<forms/serializers layer>`
- Keep transactions scoped to `<service boundary>`
- Do not spread settings logic across apps

## Entry Points
- Request bug: `<view or api module>`
- Data bug: `<model or service module>`
- Background job bug: `<task module>`

## Verification
- Tests: `<pytest command>`
- Lint: `<ruff command>`
- Type check: `<mypy command>`
```