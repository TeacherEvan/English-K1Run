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
    language: "en",
    fallbackText:
      "Welcome to Teacher Evan's Super Student! Let's have fun learning together!",
  },
  {
    key: "welcome_evan_intro_thai",
    duration: 4.8,
    source: "elevenlabs",
    category: "welcome",
    language: "th",
    fallbackText:
      "ยินดีต้อนรับสู่ Super Student ของคุณครูอีแวน มาเรียนอย่างสนุกด้วยกันนะ!",
  },
  {
    key: "welcome_sangsom_association",
    duration: 4.8,
    source: "elevenlabs",
    category: "association",
    language: "en",
    fallbackText:
      "In association with Sangsom Kindergarten. Learning through games for everyone.",
  },
  {
    key: "welcome_sangsom_association_thai",
    duration: 3.8,
    source: "elevenlabs",
    category: "association",
    language: "th",
    fallbackText: "ร่วมกับโรงเรียนอนุบาลสังสม",
  },
  {
    key: "welcome_association",
    duration: 2.8,
    source: "generated",
    category: "association",
    language: "en",
    fallbackText: "Welcome to Super Student!",
  },
  {
    key: "welcome_learning",
    duration: 3.0,
    source: "generated",
    category: "learning",
    language: "en",
    fallbackText: "Let's learn together!",
  },
  {
    key: "welcome_association_thai",
    duration: 3.2,
    source: "generated",
    category: "association",
    language: "th",
  },
  {
    key: "welcome_learning_thai",
    duration: 3.4,
    source: "generated",
    category: "learning",
    language: "th",
  },
];
