/**
 * Power-up definitions and spawn logic.
 */

import type { PowerUp } from "./engagement-types";

export const POWER_UPS: PowerUp[] = [
  {
    type: "slow_time",
    name: "Time Freeze",
    emoji: "❄️",
    effectDuration: 5000,
    description: "Slows all falling objects for 5 seconds",
    rarity: "uncommon",
    spawnWeight: 15,
  },
  {
    type: "double_points",
    name: "Star Power",
    emoji: "⭐",
    effectDuration: 8000,
    description: "Double points for 8 seconds",
    rarity: "uncommon",
    spawnWeight: 20,
  },
  {
    type: "bonus_target",
    name: "Golden Target",
    emoji: "🌟",
    effectDuration: 0,
    description: "Instant +30 progress when tapped!",
    rarity: "rare",
    spawnWeight: 5,
  },
];

export const rollPowerUpSpawn = (
  spawnChance: number = 3,
): PowerUp | undefined => {
  if (Math.random() * 100 > spawnChance) {
    return undefined;
  }

  const totalWeight = POWER_UPS.reduce((sum, pu) => sum + pu.spawnWeight, 0);

  let roll = Math.random() * totalWeight;
  for (const powerUp of POWER_UPS) {
    roll -= powerUp.spawnWeight;
    if (roll <= 0) {
      return powerUp;
    }
  }

  return POWER_UPS[0];
};
