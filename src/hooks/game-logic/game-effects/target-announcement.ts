import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";
import { centralAudioManager } from "../../../lib/audio/central-audio-manager";
import { speechSynthesizer } from "../../../lib/audio/speech-synthesizer";
import { getTargetSentence } from "../../../lib/audio/target-announcements";
import { eventTracker } from "../../../lib/event-tracker";
import { soundManager } from "../../../lib/sound-manager";
import type { GameState } from "../../../types/game";

/**
 * Manages the target announcement overlay and speech playback.
 * Uses soundManager.playWord for robust multi-fallback audio delivery.
 */
export const useTargetAnnouncement = (
  gameStarted: boolean,
  currentTarget: string,
  targetEmoji: string,
  setGameState: Dispatch<SetStateAction<GameState>>,
) => {
  useEffect(() => {
    if (!gameStarted) {
      setGameState((prev) => ({
        ...prev,
        announcementActive: false,
      }));
      return;
    }

    if (!currentTarget) return;

    let cancelled = false;
    const language = soundManager.getLanguage();

    const announceTarget = async () => {
      speechSynthesizer.stop();

      // stop any other managed audio so the sentence is isolated
      centralAudioManager.stopAllManaged();
      const active = centralAudioManager.getActiveChannels();
      if (active.length > 0) {
        eventTracker.trackEvent({
          type: "warning",
          category: "audio_overlap",
          message: "active channels present before target announcement",
          data: { active },
        });
      }

      const sentence = getTargetSentence(currentTarget, language);
      if (cancelled) return;

      setGameState((prev) => ({
        ...prev,
        announcementActive: true,
        announcementEmoji: targetEmoji,
        announcementSentence: sentence,
      }));

      // track start/stop so we can audit that only target sentences are played
      eventTracker.trackEvent({
        type: "info",
        category: "audio_announcement",
        message: "start",
        data: { target: currentTarget },
      });

      // Use soundManager.playWord for the full fallback chain and cancel any
      // previous word playback to avoid overlap in rapid category changes.
      await soundManager.playWord(currentTarget, undefined, true);

      eventTracker.trackEvent({
        type: "info",
        category: "audio_announcement",
        message: "end",
        data: { target: currentTarget },
      });

      if (!cancelled) {
        setGameState((prev) => ({
          ...prev,
          announcementActive: false,
        }));
      }
    };

    void announceTarget();

    return () => {
      cancelled = true;
      speechSynthesizer.stop();
    };
  }, [currentTarget, gameStarted, setGameState, targetEmoji]);
};
