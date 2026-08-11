import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.teacherevan.kindergartenrace",
  appName: "Kindergarten Race",
  // Vite emits the web bundle to dist/ (Capacitor's default is www/).
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
