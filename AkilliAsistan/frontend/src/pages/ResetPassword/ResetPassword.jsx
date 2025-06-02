/* file: frontend/src/pages/ResetPassword/ResetPassword.jsx */

import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import instance from "../../api/axiosInstance";
import styles from "./ResetPassword.module.css";

import { Button } from "../../components/Shared/Button";
import { Input } from "../../components/Shared/Input";
import { FormWrapper } from "../../components/Shared/FormWrapper";
import { EyeIcon, EyeOffIcon } from "../../components/Icons";
import { toast } from "react-toastify";

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [newPassword, setNewPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!token) {
        toast.error(t("invalid_reset_link"));
        return;
      }

      const response = await instance.post("/auth/reset-password", {
        token,
        new_password: newPassword,
      });

      toast.success(t("password_reset_success"));
      setNewPassword("");
      setTimeout(() => {
        navigate("/signin");
      }, 2000);
    } catch (error) {
      const serverMessage = error.response?.data?.message;

      if (serverMessage === "expired_token") {
        toast.error(t("token_expired"));
      } else if (serverMessage === "invalid_token") {
        toast.error(t("token_invalid"));
      } else if (serverMessage === "weak_password") {
        toast.error(t("password_weak"));
      } else if (serverMessage === "no_change") {
        toast.error(t("new_password_same_as_old"));
      } else {
        toast.error(t("password_reset_error"));
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={styles["reset-password-container"]}>
      <FormWrapper titleKey="reset_password_title">
        {token ? (
          <form onSubmit={handleSubmit}>
            <div className={styles["input-group"]}>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={t("new_password_placeholder")}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <span
                className={styles["visibility-toggle"]}
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <EyeIcon /> : <EyeOffIcon />}
              </span>
            </div>

            <Button type="submit" className={styles["reset-btn"]}>
              {t("reset_password")}
            </Button>
          </form>
        ) : (
          <p>{t("invalid_reset_link")}</p>
        )}
      </FormWrapper>
    </div>
  );
};

export default ResetPassword;
