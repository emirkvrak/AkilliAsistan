/* file: frontend/src/pages/VerifyEmail/VerifyEmail.jsx */

import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import instance from "../../api/axiosInstance";
import styles from "./VerifyEmail.module.css";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const lang = searchParams.get("lang"); // ✅ dil parametresini al
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // ✅ Sayfa açıldığında dil ayarla
  useEffect(() => {
    if (lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang]);

  // ✅ Doğrulama işlemi
  useEffect(() => {
    const verify = async () => {
      try {
        const response = await instance.get(`/auth/verify-email?token=${token}`);
        if (response.status === 200) {
          toast.success(t("email_verified_success"));
          setTimeout(() => navigate("/signin", { replace: true }), 2000);
        }
      } catch (error) {
        const key = error.response?.data?.message;
        toast.error(t(key || 'email_verification_failed'));
        setTimeout(() => navigate("/signin", { replace: true }), 2000);
      }
    };

    if (token) {
      verify();
    }
  }, [token, t, navigate]);

  return (
    <div className={styles.container}>
      <p>{t('verifying_email')}...</p>
    </div>
  );
};

export default VerifyEmail;
