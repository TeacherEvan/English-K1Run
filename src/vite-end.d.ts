/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean;
  /**
   * Optional feature flag to control the branded welcome splash screen.
   *
   * As of the current SANGSOM deployment, the SANGSOM‑branded welcome
   * splash sequence is the default experience shown to students.
   *
   * When set to the string "true", this flag can be used to explicitly
   * enable the SANGSOM‑branded sequence in environments that still have
   * legacy Lalitaporn Kindergarten assets or configuration, ensuring a
   * consistent SANGSOM experience across deployments.
   */
  readonly VITE_USE_SANGSOM_SPLASH?: string;

  /** Enable audio sprites ("1" to enable) */
  readonly VITE_AUDIO_SPRITE_ENABLED?: string;
  /** URL to the combined sprite audio file (e.g. /audio-sprites/sprite.mp3) */
  readonly VITE_AUDIO_SPRITE_URL?: string;
  /** URL to the sprite manifest JSON (e.g. /audio-sprites/sprite.json) */
  readonly VITE_AUDIO_SPRITE_MANIFEST_URL?: string;

  /** Enable audio descriptions for accessibility ("1" to enable) */
  readonly VITE_AUDIO_DESCRIPTIONS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const GITHUB_RUNTIME_PERMANENT_NAME: string;
declare const BASE_KV_SERVICE_URL: string;
