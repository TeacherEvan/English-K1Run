# Unity Template

Use this for Unity game repositories.

## `.copilotignore`

```gitignore
Library/
Temp/
Logs/
obj/
bin/
.vs/
*.log
*.meta
*.asset
*.prefab
*.mat
*.anim
*.controller
*.wav
*.mp3
*.ogg
*.png
*.jpg
*.fbx
*.blend
```

## `AGENT_README.md`

```md
# AGENT_README.md

## Architecture
- Bootstrap scene: `<scene name>`
- Gameplay logic: `<Scripts/Game or equivalent>`
- UI layer: `<Scripts/UI or Canvas controllers>`
- Data/config: `<ScriptableObjects or config path>`

## Conventions
- MonoBehaviours use PascalCase file names
- Shared systems stay out of scene-specific controllers
- ScriptableObjects hold config, not live gameplay state

## Invariants
- Do not move gameplay state into UI controllers
- Keep scene wiring separate from reusable systems
- Avoid editing generated asset metadata unless explicitly required

## Entry Points
- Input bug: `<player or input controller>`
- Audio bug: `<audio manager>`
- UI bug: `<canvas or presenter script>`

## Verification
- Reproduce in: `<target scene>`
- Tests: `<edit mode or play mode command>`
- Build check: `<unity build or CI command>`
```