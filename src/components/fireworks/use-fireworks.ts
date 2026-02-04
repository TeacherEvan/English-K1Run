import { useCallback, useEffect, useState } from "react";
import { playSoundEffect } from "../../lib/sound-manager";
import { FIREWORK_COLORS } from "./constants";
import type { ConfettiElement, Firework, Particle } from "./types";

interface FireworksState {
  fireworks: Firework[];
  confettiElements: ConfettiElement[];
}

/**
 * Drive fireworks and confetti animation state for the win screen.
 */
export const useFireworks = (isVisible: boolean, winner: boolean) => {
  const [fireworks, setFireworks] = useState<Firework[]>([]);
  const [hasPlayedSticker, setHasPlayedSticker] = useState(false);

  const [confettiElements] = useState<ConfettiElement[]>(() =>
    Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: 3 + Math.random() * 2,
      animationDelay: Math.random() * 2,
      color:
        FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)],
      rotation: Math.random() * 360,
    })),
  );

  const createFirework = useCallback((x: number, y: number): Firework => {
    const particles: Particle[] = [];
    const particleCount = 20;
    const color =
      FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = Math.random() * 4 + 2;

      particles.push({
        id: `particle-${i}-${Date.now()}`,
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        color,
        life: 1,
        maxLife: 1,
      });
    }

    return {
      id: `firework-${Date.now()}-${Math.random()}`,
      x,
      y,
      color,
      particles,
    };
  }, []);

  const updateFireworks = useCallback(() => {
    setFireworks((prev) => {
      if (prev.length === 0) return prev;

      const updated: Firework[] = [];
      for (const firework of prev) {
        const particles = firework.particles
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + 0.15,
            life: particle.life - 0.02,
          }))
          .filter((particle) => particle.life > 0);

        if (particles.length > 0) {
          updated.push({ ...firework, particles });
        }
      }

      return updated;
    });
  }, []);

  useEffect(() => {
    if (!isVisible) {
      const reset = () => {
        setFireworks([]);
        setHasPlayedSticker(false);
      };

      const handle = requestAnimationFrame(reset);
      return () => cancelAnimationFrame(handle);
    }

    return undefined;
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && winner && !hasPlayedSticker) {
      const timer = setTimeout(() => {
        void playSoundEffect.sticker();
        setHasPlayedSticker(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, winner, hasPlayedSticker]);

  useEffect(() => {
    if (!isVisible) return;

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const x = Math.random() * window.innerWidth;
        const y =
          Math.random() * window.innerHeight * 0.6 + window.innerHeight * 0.1;
        setFireworks((prev) => [...prev, createFirework(x, y)]);
      }, i * 300);
    }

    let lastUpdateTime = 0;
    let lastSpawnTimeRaf = 0;
    let animationFrameId: number;
    const UPDATE_INTERVAL = 33;
    const SPAWN_INTERVAL = 1500;

    const animate = (currentTime: number) => {
      if (currentTime - lastUpdateTime >= UPDATE_INTERVAL) {
        lastUpdateTime = currentTime;

        if (lastSpawnTimeRaf === 0) {
          lastSpawnTimeRaf = currentTime;
        }

        if (currentTime - lastSpawnTimeRaf > SPAWN_INTERVAL) {
          const x = Math.random() * window.innerWidth;
          const y =
            Math.random() * window.innerHeight * 0.6 + window.innerHeight * 0.1;
          setFireworks((prev) => {
            if (prev.length > 3) return prev;
            return [...prev, createFirework(x, y)];
          });
          lastSpawnTimeRaf = currentTime;
        }

        updateFireworks();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible, createFirework, updateFireworks]);

  return { fireworks, confettiElements } satisfies FireworksState;
};
