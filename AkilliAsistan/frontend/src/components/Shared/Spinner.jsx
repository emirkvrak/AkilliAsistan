// src/components/Shared/Spinner.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import "./Spinner.module.css";

const Spinner = () => {
  const { t } = useTranslation();

  console.log("🌀 Spinner rendered"); // ✅ JSX dışında, doğru yer

  return (
    <div className="spinner-container">
      <div className="loading-spinner" />
      <p style={{ marginTop: "12px", fontSize: "1rem", color: "#555" }}>
        {t("loading")}
      </p>
    </div>
  );
};

export default Spinner;
