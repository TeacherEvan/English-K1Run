# Gameplay Language Settings Implementation Plan

**Date**: 2026-03-12  
**Status**: Ready for verification and completion  
**Scope**: Settings-driven gameplay language selection, menu button subtitle behavior, and regression coverage.

## UX intent this plan implements

- Players can choose the language used for gameplay prompts, target sentences, and spoken guidance.
- Menu action buttons keep English as the primary label for classroom consistency.
- The selected gameplay language appears as a lightweight secondary subtitle beneath menu action labels.
- Display language and gameplay language remain separate controls with separate responsibilities.

## Verified context

- `SettingsContext` already stores `displayLanguage` and `gameplayLanguage` and persists both to `k1-settings`.
- `LanguageProvider` syncs `displayLanguage` to `i18n` and forwards `gameplayLanguage` to `soundManager.setLanguage(...)`.
- Menu action buttons already derive English titles and translated subtitles via `getMenuActionLabel(...)`.
- Gameplay sentence generation already reads the requested language from sentence-template helpers.
- Existing E2E covers persistence of display and gameplay language settings in the menu.

## In scope

- Verify the settings surface exposes both display and gameplay language selectors.
- Verify gameplay audio/text uses `gameplayLanguage` rather than `displayLanguage`.
- Verify menu buttons keep English titles while showing translated subtitles in the selected gameplay language.
- Add or strengthen regression coverage for sentence playback selection.

## Out of scope

- Adding new languages.
- Rewriting the menu layout or button design.
- Replacing the current audio fallback chain.
- Large refactors to settings, i18n, or audio architecture.

## Implementation sequence

### 1. Confirm state ownership and persistence

**Files**: `src/context/settings-context.tsx`, `src/context/language-context.tsx`

Tasks:

- Verify `displayLanguage` and `gameplayLanguage` are both persisted.
- Verify display language updates UI language only.
- Verify gameplay language updates sound playback language only.

Definition of done:

- A language change in settings can be traced to the correct downstream owner with no ambiguity.

### 2. Confirm settings UI contract

**Files**: `src/components/game-menu/settings-sections/ControlSettings.tsx`, `src/components/ui/language-selector.tsx`

Tasks:

- Verify the Controls tab exposes both selectors.
- Verify the gameplay selector copy clearly states it affects gameplay text and voice.
- Verify localization keys exist for all supported languages.

Definition of done:

- Users can independently change menu/display language and gameplay language from Settings.

### 3. Confirm menu label rendering contract

**Files**: `src/components/game-menu/menu-action-labels.ts`, `src/components/game-menu/MenuActionButtonContent.tsx`, `src/components/game-menu/GameMenuHome.tsx`, `src/components/game-menu/GameMenuSettingsDialog.tsx`

Tasks:

- Keep English as the primary action label.
- Show the selected gameplay language as secondary subtitle text.
- Preserve the lightweight gray subtitle styling.

Definition of done:

- Menu buttons remain readable in English while reflecting the chosen gameplay language beneath.

### 4. Strengthen gameplay-language regression coverage

**Files**: `src/lib/audio/__tests__/target-announcements.test.ts`

Tasks:

- Assert sentence lookup returns the correct language-specific sentence for gameplay targets.
- Assert playback sends the correct sentence and language code to the speech synthesizer.
- Keep tests deterministic and avoid live timing or network dependencies.

Definition of done:

- A regression that routes gameplay narration to the wrong language breaks the test suite immediately.

## Acceptance criteria

- Changing gameplay language in Settings changes gameplay target sentence selection.
- Menu primary labels remain English.
- Menu subtitles reflect the selected gameplay language when it is not English.
- Display language can change independently without replacing the English primary menu labels.
- Focused unit tests and menu E2E pass.

## Verification checklist

- Run `vitest` for focused menu/gameplay language tests.
- Run the menu Playwright suite.
- Run production build.
- Check touched files for editor diagnostics.

## Handoff notes

Prefer the smallest viable completion slice:

1. Save this plan.
2. Add missing regression coverage only if the current implementation gap is test protection rather than product behavior.
3. Re-run focused verification and stop once behavior is proven.
