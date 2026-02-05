/**
 * Shared types for the home window UI and its tabs.
 * Keeps props consistent across extracted components.
 */
export interface HomeWindowProps {
  onStartGame: (levelIndex: number, continuousMode: boolean) => void;
  onSettingsChange?: (settings: {
    fontScale: number;
    objectScale: number;
  }) => void;
  levels: string[];
  continuousMode?: boolean;
  onToggleContinuousMode?: (enabled: boolean) => void;
}

export type TabId = "levels" | "settings" | "credits";

export interface TabProps {
  activeTab: TabId;
  levels: string[];
  continuousMode: boolean;
  onStartGame: (levelIndex: number, continuousMode: boolean) => void;
  onToggleContinuousMode?: (enabled: boolean) => void;
  fontScale: number;
  objectScale: number;
  onFontScaleChange: (value: number) => void;
  onObjectScaleChange: (value: number) => void;
  onApplySettings: () => void;
  isApplyingSettings: boolean;
}

export interface TabConfig {
  id: TabId;
  label: string;
  icon: string;
}
