import React from 'react';
import './Footer.css';
import { useLanguage } from "../../LanguageContext";

 
const Footer = () => {

  // Obtenemos las funciones de traducción
  const { t } = useLanguage();

  return (
    <footer className="main-footer">
      {/* Decorative separator line */}
      <div className="footer-line"></div>
      
      <span className="footer-name">Carina Bosio</span>
      
      <p className="footer-copy">
        {/* Dynamic year ensures the copyright is always up to date */}
        © {new Date().getFullYear()} — {t("copyright")}
      </p>
    </footer>
  );
};

export default Footer;