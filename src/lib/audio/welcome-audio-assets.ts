/**
 * Welcome audio asset registry.
 */

import type { AudioAssetMetadata } from "./welcome-audio-types";
import { PRIMARY_WELCOME_AUDIO_KEY } from "./welcome-audio-types";

export const WELCOME_AUDIO_ASSETS: AudioAssetMetadata[] = [
  {
    key: PRIMARY_WELCOME_AUDIO_KEY,
    duration: 4.5,
    source: "elevenlabs",
    category: "welcome",
    fallbackText:
      "Welcome to Teacher Evan's Super Student! Let's have fun learning together!",
  },
  {
    key: "welcome_sangsom_association",
    duration: 4.8,
    source: "elevenlabs",
    category: "association",
    fallbackText:
      "In association with Sangsom Kindergarten. Learning through games for everyone.",
  },
  {
    key: "welcome_sangsom_association_thai",
    duration: 3.8,
    source: "elevenlabs",
    category: "association",
    fallbackText: "ร่วมกับโรงเรียนอนุบาลสังสม",
  },
  {
    key: "welcome_association",
    duration: 2.8,
    source: "generated",
    category: "association",
    fallbackText: "Welcome to Super Student!",
  },
  {
    key: "welcome_learning",
    duration: 3.0,
    source: "generated",
    category: "learning",
    fallbackText: "Let's learn together!",
  },
  {
    key: "welcome_association_thai",
    duration: 3.2,
    source: "generated",
    category: "association",
  },
  {
    key: "welcome_learning_thai",
    duration: 3.4,
    source: "generated",
    category: "learning",
  },
];
