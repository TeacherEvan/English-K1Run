> **Resolution (2026-09-06)**: status set to DONE by surgical-implementation plan-audit pass — work was already shipped and is reflected in `DOCS/` completion summaries + `jobcard.md` timeline. See `plans/archive/2026-09-06-plans-audit-resolution.md` for evidence per plan. Do not re-derive.

# Audio Loading Fixes - Quick Start Guide

**Status**: Ready for Implementation  
**Estimated Time**: 2-3 days (10-16 hours)  
**Priority**: P0 - Critical Issues Blocking Production

---

## 📋 What's Wrong?

From the screenshot, **23 audio loading failures** were identified:

### Critical Issues (P0)

1. **404 Errors** (3 files): `wrong.wav`, `success.wav`, `welcome.wav` don't exist
2. **Missing Welcome Audio** (3 files): New Teacher Evan intro files not generated
3. **Name Mismatches** (9 files): Priority list uses wrong names (grape vs grapes, truck vs fire truck)

### Impact

- ❌ Wrong answer feedback doesn't play
- ❌ Success sounds don't play
- ❌ Welcome screen audio broken
- ❌ Home menu association message broken
- ❌ 17 console warnings on every page load

---

## 🚀 Quick Fix (30 minutes)

### Option A: Convert Existing Files (Recommended)

```bash
# Install ffmpeg first if needed
# Windows: choco install ffmpeg
# Mac: brew install ffmpeg

cd sounds

# Convert the 3 critical files
ffmpeg -i wrong.mp3 -ar 44100 -ac 2 wrong.wav
ffmpeg -i success.mp3 -ar 44100 -ac 2 success.wav
ffmpeg -i welcome.mp3 -ar 44100 -ac 2 welcome.wav

# Verify
ls -lh wrong.wav success.wav welcome.wav
```

### Option B: Generate New Audio Files

```bash
# Set your ElevenLabs API key
export ELEVENLABS_API_KEY="your_key_here"

# Run generation script
node scripts/generate-audio.cjs

# This will generate ALL missing files including:
# - wrong.mp3 (if needed)
# - success.mp3 (if needed)
# - welcome_evan_intro.mp3 (NEW)
# - welcome_sangsom_association.mp3 (NEW)
# - welcome_sangsom_association_thai.mp3 (NEW)
```

---

## 📝 Complete Fix Plan

### Phase 1: Critical Fixes (2-4 hours)

1. ✅ Convert or generate `wrong.wav`, `success.wav`, `welcome.wav`
2. ✅ Generate 3 new welcome audio files
3. ✅ Test welcome screen and home menu

### Phase 2: Configuration Fixes (1-2 hours)

1. ✅ Edit [`src/lib/audio/audio-priorities.ts`](src/lib/audio/audio-priorities.ts)
2. ✅ Change `grape` → `grapes`
3. ✅ Change `truck` → `fire truck`
4. ✅ Remove unused items (tomato, potato, onion, bird, cow, pig, sheep)

### Phase 3: Error Handling (4-6 hours)

1. ✅ Add speech synthesis fallback to audio loader
2. ✅ Create audio validation script
3. ✅ Add user-facing error notification
4. ✅ Test all fallback mechanisms

### Phase 4: Testing (3-4 hours)

1. ✅ Create E2E audio loading tests
2. ✅ Add to CI/CD pipeline
3. ✅ Verify all tests pass

---

## 📊 Detailed Documentation

- **Full Analysis**: [`audio-loading-issues-analysis-jan2026.md`](audio-loading-issues-analysis-jan2026.md)
- **Implementation Plan**: [`audio-loading-fixes-implementation-plan.md`](audio-loading-fixes-implementation-plan.md)

---

## ✅ Success Criteria

After fixes:

- ✅ Zero 404 errors in console
- ✅ Zero "No URL found" warnings
- ✅ Welcome screen audio works
- ✅ Home menu plays association message
- ✅ All game categories have audio
- ✅ Fallbacks work if files missing

---

## 🎯 Priority Actions

**If you have 30 minutes**: Do Phase 1 (Critical Fixes)  
**If you have 2 hours**: Do Phase 1 + Phase 2  
**If you have a full day**: Complete all phases

---

## 🆘 Need Help?

1. Check [`audio-loading-fixes-implementation-plan.md`](audio-loading-fixes-implementation-plan.md) for step-by-step instructions
2. Each phase has testing checkpoints
3. Rollback plan included if issues occur

---

**Ready to fix?** Start with Phase 1 and the console errors will disappear! 🎉
