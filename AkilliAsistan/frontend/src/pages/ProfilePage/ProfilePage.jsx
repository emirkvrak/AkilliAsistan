/* file: frontend/src/pages/ProfilePage/ProfilePage.jsx */

import { useTranslation } from 'react-i18next';
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import instance from "../../api/axiosInstance";
import styles from "./ProfilePage.module.css";

import { Button } from "../../components/Shared/Button";
import { Input } from "../../components/Shared/Input";
import { FormWrapper } from "../../components/Shared/FormWrapper";
import { EyeIcon, EyeOffIcon } from "../../components/Icons";
import { useUserStore } from "../../store/useUserStore";

import { toast } from "react-toastify"; // ✅ toast import

function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const userEmail = useUserStore(state => state.userEmail);
  const setIsAuthenticated = useUserStore(state => state.setIsAuthenticated);
  const setUserEmail = useUserStore(state => state.setUserEmail);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      const response = await instance.post('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword
      });

      toast.success(response.data.message || t('password_changed_successfully')); // ✅
      setOldPassword("");
      setNewPassword("");
    } catch (error) {
      console.error("Şifre değiştirme hatası:", error);

      if (error.response?.status === 403) {
        setIsAuthenticated(false);
        setUserEmail("");
        navigate("/signin");
        return;
      }

      const key = error.response?.data?.message;
      toast.error(t(key || 'something_went_wrong'));

    }
  };

  return (
    <div className={styles["profile-page-container"]}>
      <FormWrapper titleKey="profile_info">
        <p>
          <strong>{t('email')}:</strong> {userEmail || "-"}
        </p>

        <h3>{t('change_password')}</h3>
        <form onSubmit={handlePasswordChange}>
          <div className={styles["input-group"]}>
            <Input
              type={showOldPassword ? "text" : "password"}
              placeholder={t('old_password_placeholder')}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
            <span
              className={styles["visibility-toggle"]}
              onClick={() => setShowOldPassword(!showOldPassword)}
            >
              {showOldPassword ? <EyeIcon /> : <EyeOffIcon />}
            </span>
          </div>

          <div className={styles["input-group"]}>
            <Input
              type={showNewPassword ? "text" : "password"}
              placeholder={t('new_password_placeholder')}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <span
              className={styles["visibility-toggle"]}
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? <EyeIcon /> : <EyeOffIcon />}
            </span>
          </div>

          <Button type="submit" className={styles["change-password-btn"]}>
            {t('change_password_button')}
          </Button>
        </form>
      </FormWrapper>
    </div>
  );
}

export default ProfilePage;
