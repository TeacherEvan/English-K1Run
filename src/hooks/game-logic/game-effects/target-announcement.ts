import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";
import { speechSynthesizer } from "../../../lib/audio/speech-synthesizer";
import { getTargetSentence } from "../../../lib/audio/target-announcements";
import { soundManager } from "../../../lib/sound-manager";
import type { GameState } from "../../../types/game";

/**
 * Manages the target announcement overlay and speech playback.
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
      const sentence = getTargetSentence(currentTarget, language);
      if (cancelled) return;

      setGameState((prev) => ({
        ...prev,
        announcementActive: true,
        announcementEmoji: targetEmoji,
        announcementSentence: sentence,
      }));

      if (!sentence) {
        setGameState((prev) => ({
          ...prev,
          announcementActive: false,
        }));
        return;
      }

      await speechSynthesizer.speakAsync(sentence, { langCode: language });

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
