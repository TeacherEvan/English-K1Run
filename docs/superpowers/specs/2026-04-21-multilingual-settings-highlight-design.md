# Multilingual Settings Highlight Design

## Problem

English K1 Run already supports multiple display and gameplay languages, but the feature is easy to miss in the home menu flow. We want the menu to invite teachers and children to explore more languages without disrupting the main play path.

## Current Context

- The home menu settings entry lives in `src/components/game-menu/GameMenuSettingsDialog.tsx` as the `settings-button` trigger.
- The settings dialog defaults to the `controls` tab, where the language section lives in `src/components/game-menu/settings-sections/ControlSettings.tsx`.
- Language selection UI is rendered by `src/components/ui/language-selector.tsx` from `LANGUAGE_OPTIONS` in `src/lib/constants/language-config.ts`.
- Menu visuals already use a light, warm storybook surface system plus subtle sheen and entrance motion in `game-menu-storybook-surfaces.css` and `game-menu-storybook-motion.css`.
- Reduced motion is already part of app behavior through `settings-context` and existing motion guardrails.

## Goals

- Make multilingual play more discoverable from the home menu.
- Create a clear path: **notice Settings -> open Settings -> notice gameplay language -> explore options**.
- Keep the treatment bold and magical, but still classroom-friendly.
- Turn off the outer promotional cue after Settings has been opened once in the current runtime session.

## Non-Goals

- No new onboarding modal, tooltip, popup, or blocking interstitial.
- No changes to supported languages, language order, or language copy.
- No reward-lock semantics such as "unlocked" or "earned" styling.
- No persistence requirement for discovery state in localStorage.

## Approved Direction

Use the **hero-path spotlight** approach.

1. The **Settings button** gets the strongest discovery treatment before first open.
2. Inside the dialog, the **gameplay language selector** becomes the strongest highlighted control.
3. The **display language selector** gets a lighter sibling treatment.
4. Individual language options echo the parent styling, but never compete with it.

## Visual Design

### Settings Button

- Keep the existing cream button base and rounded menu card silhouette.
- Add a warm gold treatment drawn from the existing `CLASSROOM_BRAND.palette.sun` direction rather than introducing a new neon palette.
- Use a soft halo, a gentle breathing pulse, and an occasional shimmer sweep across the button surface and gear icon.
- Preserve the current English title plus localized subtitle pattern from `MenuActionButtonContent`.
- The title and subtitle should inherit the same visual family as the button rather than looking untouched.

### Settings Dialog Language Area

- Keep the `controls` tab as the default landing surface.
- Treat the language section card as a featured panel with a stronger border, warmer glow, and light reflective sheen.
- The **gameplay language selector** gets the strongest inner emphasis because it directly affects gameplay motivation.
- The **display language selector** should visually relate to the same system, but one step quieter.

### Language Selectors and Options

- Selector trigger text should carry the same gold-accent family as its parent control.
- Expanded option rows should use a lighter echo treatment: warmer edge, brighter label emphasis, and a subtle sheen or elevated state.
- Both the English label and native label should participate so the language names feel intentionally featured.
- Do not pulse every option continuously; options should feel polished, not noisy.

## Motion Rules

- Motion should be slow, readable, and intentional.
- Prefer an occasional shimmer pass over constant sparkle.
- Reuse the repo's existing motion language: one-shot sheen and gentle breathing are acceptable; fast glitter is not.
- Under reduced motion, remove pulse and shimmer entirely and keep a static fallback: stronger border, warmer fill, brighter text, and visible focus treatment.

## Behavior Rules

- A runtime-only `languageDiscoveryActive` flag starts as `true` when the app session begins.
- The first successful Settings open marks discovery as seen.
- Once seen, the **home menu Settings button** drops its promotional pulse and shimmer for the rest of the runtime session.
- The **gameplay language selector** inside Settings continues to use the stronger featured styling whenever the dialog is open.
- The **display language selector** keeps the lighter sibling styling whenever the dialog is open.
- Language option echo styling appears when the selector is rendered or expanded, but remains lighter than the parent controls.

## Component Boundaries

- `GameMenu` should own the runtime-only discovery state so it survives menu hide/show cycles during gameplay and return-to-menu flows.
- `GameMenuSettingsDialog` should consume that state to style the Settings trigger and clear the discovery flag on first open.
- `ControlSettings` should receive the active highlight mode and assign stronger emphasis to gameplay language plus lighter emphasis to display language.
- `LanguageSelector` should render selector-level treatment and option-level echo styling from explicit props or data attributes rather than duplicating local highlight logic.
- Shared visuals should live in a small dedicated menu/settings stylesheet so the effect stays consistent and does not bloat unrelated files.

