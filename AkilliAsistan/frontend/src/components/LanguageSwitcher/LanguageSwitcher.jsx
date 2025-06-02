/* file: frontend/src/components/LanguageSwitcher/LanguageSwitcher.jsx */

import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState("tr");

  useEffect(() => {
    const savedLang = localStorage.getItem("lng");
    if (savedLang) {
      setCurrentLang(savedLang);
      i18n.changeLanguage(savedLang);
    } else {
      i18n.changeLanguage("tr");
    }
  }, []);

  const changeLanguage = (lang) => {
    if (lang !== currentLang) {
      setCurrentLang(lang);
      i18n.changeLanguage(lang);
      localStorage.setItem("lng", lang);
    }
  };

  return (
    <div
      style={{
        fontSize: "16px",
        fontWeight: "normal",
        display: "flex", // 🔧 Butonları yatay sırala
        alignItems: "center",
        gap: "8px" // Butonlar arası boşluk
      }}
    >
      <button
        onClick={() => changeLanguage("tr")}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontWeight: currentLang === "tr" ? "bold" : "normal",
          color: currentLang === "tr" ? "#000" : "#777",
        }}
      >
        TR
      </button>
      <span>|</span>
      <button
        onClick={() => changeLanguage("en")}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontWeight: currentLang === "en" ? "bold" : "normal",
          color: currentLang === "en" ? "#000" : "#777",
        }}
      >
        EN
      </button>
    </div>
  );
  
}
