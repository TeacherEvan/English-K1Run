# Mandarin Language Rollout Plan

**Date**: February 1, 2026  
**Owner**: Teacher Evan  
**Status**: Planning  
**Scope**: Add Mandarin (zh-CN) as the next language with full sentence-based audio and phonics support.

## Goals

- Enable Mandarin as a selectable language in the app
- Ensure sentence-based target announcements exist in Mandarin
- Keep phonics module English-only unless Mandarin phonics are defined
- Avoid single-word audio clips in the Mandarin flow

## Phase 1 — Content & Templates

1. **Sentence templates**
   - Update [src/lib/constants/sentence-templates/zh-cn.ts](../src/lib/constants/sentence-templates/zh-cn.ts) to cover all current targets in `GAME_CATEGORIES`.
   - Verify all sentences are full phrases (no single-word entries).

2. **Translation QA**
   - Review for accuracy and age-appropriate phrasing.
   - Keep consistent terminology across categories.

## Phase 2 — Language Configuration

1. **Language config**
   - Confirm `zh-CN` is present in [src/lib/constants/language-config.ts](../src/lib/constants/language-config.ts).
   - Ensure voice IDs are set for Mandarin.

2. **Locales**
   - Update UI labels in [src/locales/](../src/locales/) for Mandarin.

## Phase 3 — Audio Generation

1. **ElevenLabs generation**
   - Generate Mandarin audio for welcome and association messages if required.
   - Validate filenames match `audio-registry` naming conventions.

2. **Validation**
   - Run `npm run audio:validate` and resolve missing Mandarin files.

## Phase 4 — Gameplay Integration

1. **Target announcements**
   - Verify `getSentenceTemplate()` returns Mandarin sentences when language is set to `zh-CN`.
   - Ensure fallback behavior is acceptable when a template is missing.

2. **Phonics**
   - Keep English-only phonics unless Mandarin phonics spec is defined.
   - Document any future Mandarin phonics plan in this file.

## Phase 5 — Testing

- Manual verification of Mandarin announcements during gameplay
- Confirm no single-word audio clips play in Mandarin
- E2E smoke test for language switching and target announcements

## Success Criteria

- Mandarin language selectable in settings
- All target announcements use Mandarin sentences
- No single-word clips in target announcements
- Audio validation passes

## Notes

- Keep all plan updates under 200 lines per file.
