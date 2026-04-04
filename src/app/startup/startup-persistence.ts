export interface StartupState {
  languageGateCompleted: boolean;
  startupPackVersion: string | null;
}

const STORAGE_KEY = "k1-startup-state";
const WARMED_LANGUAGE_PACKS_KEY = "k1-startup-language-packs";

const DEFAULT_STATE: StartupState = {
  languageGateCompleted: false,
  startupPackVersion: null,
};

const isBrowser = () => typeof window !== "undefined";

const writeStartupState = (state: StartupState) => {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const getStartupState = (): StartupState => {
  if (!isBrowser()) return DEFAULT_STATE;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_STATE;

  try {
    const parsed = JSON.parse(raw) as Partial<StartupState>;
    return {
      languageGateCompleted: parsed.languageGateCompleted === true,
      startupPackVersion:
        typeof parsed.startupPackVersion === "string"
          ? parsed.startupPackVersion
          : null,
    };
  } catch {
    return DEFAULT_STATE;
  }
};

export const hasCompletedStartupLanguageGate = (): boolean =>
  getStartupState().languageGateCompleted;

export const markStartupLanguageGateCompleted = (): void => {
  const state = getStartupState();
  writeStartupState({ ...state, languageGateCompleted: true });
};

export const hasReadyStartupPack = (version: string): boolean =>
  getStartupState().startupPackVersion === version;

export const markStartupPackReady = (version: string): void => {
  const state = getStartupState();
  writeStartupState({ ...state, startupPackVersion: version });
};

export const clearStartupState = (): void => {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(WARMED_LANGUAGE_PACKS_KEY);
};

const getWarmedLanguagePacks = (): string[] => {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(WARMED_LANGUAGE_PACKS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
};

export const hasWarmedLanguagePack = (language: string): boolean =>
  getWarmedLanguagePacks().includes(language);

export const markWarmedLanguagePack = (language: string): void => {
  if (!isBrowser()) return;
  const next = Array.from(new Set([...getWarmedLanguagePacks(), language]));
  localStorage.setItem(WARMED_LANGUAGE_PACKS_KEY, JSON.stringify(next));
};
