import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { AccessibilitySettings } from "./settings-sections/AccessibilitySettings";
import { AudioSettings } from "./settings-sections/AudioSettings";
import { ControlSettings } from "./settings-sections/ControlSettings";
import { VisualSettings } from "./settings-sections/VisualSettings";
import {
  MENU_SETTINGS_SURFACE_CLASS,
  MENU_SETTINGS_SURFACE_STYLE,
  MENU_SETTINGS_TABS_LIST_CLASS,
  MENU_SETTINGS_TABS_LIST_STYLE,
} from "./menu-surface-theme";
import type { ResolutionScale } from "../../context/settings-context";

interface GameMenuSettingsDialogPanelProps {
  t: (key: string) => string;
  resolutionScale: ResolutionScale;
  setResolutionScale: (scale: ResolutionScale) => void;
  continuousMode: boolean;
  onToggleContinuousMode?: (enabled: boolean) => void;
}

export function GameMenuSettingsDialogPanel({
  t,
  resolutionScale,
  setResolutionScale,
  continuousMode,
  onToggleContinuousMode,
}: GameMenuSettingsDialogPanelProps) {
  return (
    <Tabs defaultValue="controls" className="flex min-h-0 flex-1 flex-col py-4">
      <TabsList className={MENU_SETTINGS_TABS_LIST_CLASS} style={MENU_SETTINGS_TABS_LIST_STYLE}>
        <TabsTrigger className="menu-settings-tab min-w-0 whitespace-normal px-3 py-2 text-center leading-tight" value="audio">{t("settings.tabs.audio")}</TabsTrigger>
        <TabsTrigger className="menu-settings-tab min-w-0 whitespace-normal px-3 py-2 text-center leading-tight" value="visual">{t("settings.tabs.visual")}</TabsTrigger>
        <TabsTrigger className="menu-settings-tab min-w-0 whitespace-normal px-3 py-2 text-center leading-tight" value="controls">{t("settings.tabs.controls")}</TabsTrigger>
        <TabsTrigger className="menu-settings-tab min-w-0 whitespace-normal px-3 py-2 text-center leading-tight" value="accessibility">
          {t("settings.tabs.accessibility")}
        </TabsTrigger>
      </TabsList>
      <div
        data-testid="settings-surface-panel"
        className={`${MENU_SETTINGS_SURFACE_CLASS} min-h-0 overflow-y-auto`}
        style={MENU_SETTINGS_SURFACE_STYLE}
      >
        <TabsContent value="audio">
          <AudioSettings />
        </TabsContent>
        <TabsContent value="visual">
          <VisualSettings
            resolutionScale={resolutionScale}
            setResolutionScale={setResolutionScale}
          />
        </TabsContent>
        <TabsContent value="controls">
          <ControlSettings
            continuousMode={continuousMode}
            onToggleContinuousMode={onToggleContinuousMode}
          />
        </TabsContent>
        <TabsContent value="accessibility">
          <AccessibilitySettings />
        </TabsContent>
      </div>
    </Tabs>
  );
}