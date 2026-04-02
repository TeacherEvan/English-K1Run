# English K1 Run Task Notes

## Design Context

_This section synthesizes the current codebase, repository documentation, live UI patterns, and the latest UX defaults gathered on 2026-04-02. The user was unavailable for follow-up design answers, so any unresolved choices default to the strongest product signals already present in the repo._

### Users

English K1 Run is a teacher-launched, child-played classroom game for kindergarten and early-primary learners. It is used on tablets, touch displays, and shared classroom browsers, often with a teacher starting the activity and children taking short turns or replaying fast rounds. Students need large, obvious interaction targets, high contrast at distance, and instant feedback that works even before they can read fluently. Teachers need a menu and settings flow that is quick to launch, easy to supervise, and reliable under classroom pressure. The interface should help children practice vocabulary, recognition, and listening in short, repeatable rounds without reading-heavy friction.

### Brand Personality

Warm, encouraging, outdoorsy.

The product should feel optimistic and reassuring rather than chaotic or hyper-competitive. It should create delight, confidence, and a sense of “I can do this,” with rewards that feel celebratory but never overwhelming. For teachers, the tone should also feel dependable, calm, and easy to trust under repetition. Because the app supports multiple classroom languages, the visual tone should stay universal, friendly, and welcoming across cultures, with meaning carried by imagery and hierarchy before text.

### Aesthetic Direction

Lean into a touch-first, nature-backed, toy-like classroom aesthetic with polished game energy. Keep the turtle mascot, large tactile controls, friendly rounded forms, scenic outdoor imagery, and bright kid-facing colors, but refine them into a more intentional visual system. Favor a light-first presentation for classrooms, with dark mode as optional support rather than the default mood. Use warm ivory surfaces, sunlit amber borders, sky and ocean blues, leaf and meadow greens, and trophy-gold accents, with neutrals subtly tinted toward the palette instead of drifting into generic gray. Nature photography and animal or emoji content are part of the product DNA, so decorative choices should feel outdoorsy, sunny, curious, and alive—not corporate, futuristic, or sterile.

The memorable signature should be a warm nature-meets-playroom world: real outdoor backdrops, a cheerful turtle mascot, soft cream panels, and oversized tactile controls that feel made for small hands.

Current implementation cues worth preserving:

- Turtle-led brand identity in the menu and player-facing surfaces
- Large stacked action buttons with obvious hierarchy for touch use
- Scenic welcome and background imagery that make the world feel real, not abstract
- Light, sunlit surfaces with green/blue/gold action colors rather than dark UI chrome

Recent alignment completed on 2026-04-02:

- PWA manifest naming and iconography now match the `English K1 Run` turtle-and-nature classroom identity
- Global theme tokens now tint neutrals toward the warm classroom palette instead of relying on generic defaults

Reference cues already present in the product:

- Touch-first gameplay on large surfaces
- Nature and animal imagery
- Playful motion and celebratory feedback
- Multilingual classroom use
- High readability at distance
- Teacher-friendly launch flow

Anti-direction:

- No generic SaaS dashboard styling
- No dark neon gamer aesthetic
- No glassmorphism as the default styling language
- No overused card-on-card clutter
- No ad-like mobile game chaos
- No tiny controls, thin contrast, or reading-heavy layouts

Color guardrails:

- Prefer sky blue, ocean blue, leaf green, warm sand, and sun-gold accents
- Avoid pure black or pure white, washed-out gray-on-color, and cyan-purple “AI” palettes

### Design Principles

1. **Teacher-launch, child-play.** Setup must be obvious for adults, while interaction stays effortless for young learners.
2. **Distance-readable touch clarity.** Prioritize big targets, instant comprehension, and strong hierarchy over decorative complexity.
3. **Nature-backed delight.** Use the turtle, landscapes, and cheerful color warmth as the product’s memorable signature.
4. **One brand, one story.** Future UI work should consolidate around the `English K1 Run` name and its turtle-and-nature identity instead of inheriting older generic game branding.
5. **Celebration without chaos.** Motion, color, and reward moments should build confidence without exhausting the classroom, and accessibility requirements are part of that finish—not an afterthought.
