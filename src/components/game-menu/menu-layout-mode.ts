export type GameMenuCompactLayout = "single-column" | "balanced" | "split";

export function getGameMenuCompactLayout(screenWidth: number): GameMenuCompactLayout {
  if (screenWidth < 768) {
    return "single-column";
  }

  if (screenWidth < 1200) {
    return "balanced";
  }

  return "split";
}