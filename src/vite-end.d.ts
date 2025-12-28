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
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const GITHUB_RUNTIME_PERMANENT_NAME: string;
declare const BASE_KV_SERVICE_URL: string;
