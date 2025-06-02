import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../LanguageSwitcher/LanguageSwitcher";
import styles from "./shared.module.css";
import { memo } from "react";

const FormWrapperComponent = ({ children, titleKey, className = "" }) => {
  const { t } = useTranslation();

  return (
    <div className={`${styles["form-wrapper"]} ${className}`}>
      {titleKey && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
          marginBottom: "16px"
        }}>
          <LanguageSwitcher />
          <h1 className={styles.title}>{t(titleKey)}</h1>
        </div>
      )}
      {children}
    </div>
  );
};

export const FormWrapper = memo(FormWrapperComponent);
