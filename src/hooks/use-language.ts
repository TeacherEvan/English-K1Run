import { LanguageContext } from "@/context/language";
import { useContext } from "react";

/**
 * Hook to access language context
 * Must be used inside LanguageProvider
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
