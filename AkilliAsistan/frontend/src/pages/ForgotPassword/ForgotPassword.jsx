/* file: frontend/src/pages/ForgotPassword/ForgotPassword.jsx */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import instance from "../../api/axiosInstance";
import styles from "./ForgotPassword.module.css";

import { Button } from "../../components/Shared/Button";
import { Input } from "../../components/Shared/Input";
import { FormWrapper } from "../../components/Shared/FormWrapper";
import { toast } from "react-toastify";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const { t, i18n  } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await instance.post("/auth/forgot-password", {
        email,
        lang: i18n.language // 🌍 aktif dili gönderiyoruz
      });

      toast.success(t("reset_link_sent")); // ✅ Success mesajı
      setEmail("");
    } catch (error) {
      console.error("Şifre sıfırlama isteği hatası:", error);
      const key = error.response?.data?.message;
      toast.error(t(key || "something_went_wrong"));
    }
  };

  return (
    <div className={styles["forgot-password-container"]}>
      <FormWrapper titleKey="forgot_password_title">
        <p>{t("forgot_password_description")}</p>

        <form onSubmit={handleSubmit}>
          <div className={styles["input-group"]}>
            <Input
              type="email"
              placeholder={t("email_placeholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className={styles["reset-password-btn"]}>
            {t("reset_password_button")}
          </Button>
        </form>
      </FormWrapper>
    </div>
  );
};

export default ForgotPassword;
