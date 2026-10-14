// src/components/LanguageToggle/LanguageToggle.jsx
import React from "react";
import { useLanguage } from "../../LanguageContext";
import "./LanguageToggle.css";

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <nav className="lang-toggle-wrapper" aria-label="Language selector">
      <button
        type="button"
        className={`lang-btn ${lang === "es" ? "active" : ""}`}
        onClick={() => setLang("es")}
        data-cursor="pointer"
      >
        ES
      </button>
      <span className="lang-separator">/</span>
      <button
        type="button"
        className={`lang-btn ${lang === "en" ? "active" : ""}`}
        onClick={() => setLang("en")}
        data-cursor="pointer"
      >
        EN
      </button>
    </nav>
  );
}