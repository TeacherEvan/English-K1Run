/**
 * Background class pool for the main app container.
 */
export const BACKGROUND_CLASSES = [
  "app-bg-mountain-sunrise",
  "app-bg-ocean-sunset",
  "app-bg-forest-path",
  "app-bg-lavender-field",
  "app-bg-aurora-night",
  "app-bg-nebula-galaxy",
  "app-bg-tropical-waterfall",
  "app-bg-colorful-buildings",
  "app-bg-cherry-blossom",
  "app-bg-starry-art",
];

/**
 * Pick a random background, optionally excluding the current one.
 */
export const pickRandomBackground = (exclude?: string) => {
  const pool = BACKGROUND_CLASSES.filter((bg) => bg !== exclude);
  const choices = pool.length > 0 ? pool : BACKGROUND_CLASSES;
  const index = Math.floor(Math.random() * choices.length);
  return choices[index];
};
