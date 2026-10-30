"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Language = "en" | "hi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    topBannerTitle: "National Student Data & Statutory Quota Verification Mesh",
    statutoryArchitecture: "APH 2024–27 Statutory Architecture",
    screenReader: "Screen Reader Access",
    meshActive: "Mesh Status: Active",
    meshConnecting: "Connecting to Cloud Engine...",
    meshLive: "Database Live · Verified",
    brandTitle: "ApaarNet",
    brandTag: "Verification Mesh",
    brandSubtitle: "National Student Data & Quota Verification",
    aphClause: "APH 2024–27",
    switchRoleBtn: "Switch Persona / RBAC Gate",
    scopesActive: "Permitted Scopes",
    rbacMode: "RBAC Mode:",
    strictGate: "Strict Gate",
    juryFastSwitch: "Jury Fast-Switch",
    autoSeed: "Auto-Seed",
    seeding: "Seeding...",
    portalCommand: "National Command",
    portalInstitution: "Institution Registrar",
    portalIntelligence: "Intelligence Chamber",
    portalConsent: "Consent Wallet",
    portalDegree: "Degree Studio",
    tagCommand: "AICTE Compliance",
    tagInstitution: "ERP Sandbox & Verhoeff",
    tagIntelligence: "Graph AI & Tri-Party",
    tagConsent: "DPDP Sovereign Passkey",
    tagDegree: "W3C Verifiable Credentials",
    languageButtonLabel: "हिन्दी",
    languageButtonTitle: "Switch interface language to Hindi / हिन्दी में बदलें",
  },
  hi: {
    topBannerTitle: "राष्ट्रीय छात्र डेटा एवं कोटा सत्यापन नेटवर्क",
    statutoryArchitecture: "एआईसीटीई ए.पी.एच 2024–27 वैधानिक ढांचा",
    screenReader: "स्क्रीन रीडर एक्सेस",
    meshActive: "नेटवर्क स्थिति: सक्रिय",
    meshConnecting: "क्लाउड इंजन कनेक्ट हो रहा है...",
    meshLive: "डेटाबेस सक्रिय · सत्यापित",
    brandTitle: "अपारनेट",
    brandTag: "सत्यापन नेटवर्क",
    brandSubtitle: "राष्ट्रीय छात्र डेटा एवं कोटा सत्यापन",
    aphClause: "ए.पी.एच 2024–27",
    switchRoleBtn: "भूमिका बदलें / आरबीएसी गेट",
    scopesActive: "स्वीकृत अधिकार",
    rbacMode: "आरबीएसी मोड:",
    strictGate: "सख्त गेट",
    juryFastSwitch: "फास्ट-स्विच",
    autoSeed: "ऑटो-सीड",
    seeding: "सीडिंग जारी...",
    portalCommand: "राष्ट्रीय कमान केंद्र",
    portalInstitution: "संस्थान रजिस्ट्रार",
    portalIntelligence: "इंटेलिजेंस चैंबर",
    portalConsent: "सहमति वॉलेट",
    portalDegree: "डिग्री स्टूडियो",
    tagCommand: "एआईसीटीई अनुपालन",
    tagInstitution: "ईआरपी सैंडबॉक्स एवं वेरहोफ",
    tagIntelligence: "ग्राफ विसंगति एवं विवाद निवारण",
    tagConsent: "डीपीडीपी सार्वभौम पासकी",
    tagDegree: "W3C क्रेडेंशियल जारीकर्ता",
    languageButtonLabel: "English",
    languageButtonTitle: "Switch interface language to English / अंग्रेज़ी में बदलें",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  // Load persisted language from localStorage on client mount
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("apaarnet_language") as Language | null;
      if (savedLang === "en" || savedLang === "hi") {
        setLanguageState(savedLang);
      }
    } catch {
      // Ignore localStorage read errors
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("apaarnet_language", lang);
    } catch {}
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const next: Language = prev === "en" ? "hi" : "en";
      try {
        localStorage.setItem("apaarnet_language", next);
      } catch {}
      return next;
    });
  }, []);

  const t = useCallback(
    (key: string): string => {
      return TRANSLATIONS[language]?.[key] ?? TRANSLATIONS.en[key] ?? key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
