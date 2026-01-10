import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LANGUAGE } from "./lib/constants/language-config";

// Import locale files
import enTranslations from "./locales/en.json";
import frTranslations from "./locales/fr.json";
import jaTranslations from "./locales/ja.json";
import thTranslations from "./locales/th.json";
import zhCnTranslations from "./locales/zh-CN.json";
import zhHkTranslations from "./locales/zh-HK.json";

const resources = {
  en: { translation: enTranslations },
  fr: { translation: frTranslations },
  ja: { translation: jaTranslations },
  th: { translation: thTranslations },
  "zh-CN": { translation: zhCnTranslations },
  "zh-HK": { translation: zhHkTranslations },
};

i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: {
    escapeValue: false, // React already safes from xss
  },
  react: {
    useSuspense: false, // Disable suspense for now, can enable with Suspense boundary later
  },
});

export default i18n;
