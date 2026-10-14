import React, { useState } from "react";
import countries from "i18n-iso-countries";
import { translations } from "./translations";
import { LanguageContext } from "./LanguageContext";

// Registramos español e inglés
import esLocale from "i18n-iso-countries/langs/es.json";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(esLocale);
countries.registerLocale(enLocale);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState("es");

  const t = (key) => translations[lang]?.[key] || key;

  const getLocalizedCountryName = (countryCode, defaultName) => {
    if (!countryCode) return defaultName;

    // Traduce directo por código Alpha-3 ("ARG", "USA", etc.) o Alpha-2
    const translated = countries.getName(countryCode, lang);
    return translated || defaultName;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, getLocalizedCountryName }}>
      {children}
    </LanguageContext.Provider>
  );
};