"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { trTranslations } from "./locales/tr";
import { deTranslations, type Translations } from "./locales/de";

export type Language = "tr" | "de";

type LanguageContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = "the-doner-lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("tr");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved && (saved === "tr" || saved === "de")) {
        setLangState(saved);
      }
    } catch {
      // storage disabled / private browsing
    }
    setLoaded(true);
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // storage fallback
    }
  };

  useEffect(() => {
    if (!loaded) return;
    document.documentElement.lang = lang;

    // SEO updates
    const t = lang === "de" ? deTranslations : trTranslations;
    document.title = t.seo.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", t.seo.description);
    }
  }, [lang, loaded]);

  const t = lang === "de" ? deTranslations : trTranslations;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
