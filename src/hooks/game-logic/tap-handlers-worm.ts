import { eventTracker } from "../../lib/event-tracker";
import type { PlayerSide } from "../../types/game";
import type { HandleWormTapDependencies } from "./tap-handlers-types";

/**
 * Builds the tap handler for worms.
 */
export const createHandleWormTap = (
  dependencies: HandleWormTapDependencies,
) => {
  const { setWorms, setFairyTransforms, wormSpeedMultiplier, onWormTapped } =
    dependencies;

  return (wormId: string, playerSide: PlayerSide) => {
    try {
      setWorms((prev) => {
        const worm = prev.find((w) => w.id === wormId);
        if (!worm || !worm.alive) return prev;

        setFairyTransforms((prevFairies) => [
          ...prevFairies,
          {
            id: `fairy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            x: worm.x,
            y: worm.y,
            createdAt: Date.now(),
            lane: worm.lane,
          },
        ]);

        const updatedWorms = prev.map((w) =>
          w.id === wormId ? { ...w, alive: false } : w,
        );

        const aliveCount = updatedWorms.filter((w) => w.alive).length;
        if (aliveCount > 0) {
          wormSpeedMultiplier.current *= 1.2;
        }

        eventTracker.trackEvent({
          type: "info",
          category: "worm",
          message: `Worm killed, ${aliveCount} remaining`,
          data: { wormId, playerSide, aliveCount },
        });

        onWormTapped?.(wormId, playerSide);

        return updatedWorms;
      });
    } catch (error) {
      eventTracker.trackError(error as Error, "handleWormTap");
    }
  };
};
