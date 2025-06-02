/* file:frontend/src/pages/SignUp/SignUp.jsx */

import { useTranslation } from 'react-i18next';
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";

import { LanguageSwitcher } from "../../components/LanguageSwitcher/LanguageSwitcher";
import instance from "../../api/axiosInstance";
import styles from "./SignUp.module.css";

import { Button } from "../../components/Shared/Button";
import { Input } from "../../components/Shared/Input";
import { FormWrapper } from "../../components/Shared/FormWrapper";
import { EyeIcon, EyeOffIcon } from "../../components/Icons";

import { useUserStore } from "../../store/useUserStore"; // ✅ Zustand import
import { toast } from 'react-toastify';

const SignUp = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Zustand setter'ları
  const setUserEmail = useUserStore(state => state.setUserEmail);
  const setIsAuthenticated = useUserStore(state => state.setIsAuthenticated);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('');
  const [isPasswordStrong, setIsPasswordStrong] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error(t('passwords_do_not_match'));
      return;
    }

    try {
      const response = await instance.post("/auth/register", {
        firstName,
        lastName,
        email,
        password,
        lang: i18n.language
      });

      // ✅ Zustand'a bilgileri yaz
      setUserEmail(response.data.data.email); // backend "data.email" döndürüyor olmalı
      setIsAuthenticated(true);

      toast.success(t(response.data.message || 'registration_successful'));

      navigate("/signin");
    } catch (error) {
      console.error("Registration error:", error.response?.data?.message || error.message);
      toast.error(t(error.response?.data?.message || 'registration_failed'));
    }
  };

  const handleGoogleLogin = async (googleToken) => {
    try {
      const response = await instance.post('/auth/google-login', { token: googleToken });

      if (response.data.success) {
        // ✅ Zustand'a bilgileri yaz
        setUserEmail(response.data.data.email); // backend "data.email" döndürmeli
        setIsAuthenticated(true);

        navigate('/chat');
      }
    } catch (error) {
      console.error('Google login failed:', error.response?.data?.message || error.message);
      toast.error(t('google_login_failed'));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  function isStrongPassword(password) {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password)
    );
  }

  return (
    <div className={styles["sign-up-container"]}>
      <FormWrapper titleKey="sign_up">
        <p>{t('social_signup_prompt')}</p>

        <div className={styles["social-buttons"]}>
          <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                handleGoogleLogin(credentialResponse.credential);
              }}
              onError={() => {
                console.log("Login Failed");
              }}
            />
          </GoogleOAuthProvider>
        </div>

        <form onSubmit={handleRegister}>
          <div className={styles["input-group"]}>
            <Input
              type="text"
              placeholder={t('first_name_placeholder')}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>

          <div className={styles["input-group"]}>
            <Input
              type="text"
              placeholder={t('last_name_placeholder')}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <div className={styles["input-group"]}>
            <Input
              type="email"
              placeholder={t('email_placeholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles["input-group"]}>
            <div className={styles["input-wrapper"]}>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={t('password_placeholder')}
                value={password}
                onChange={(e) => {
                  const newPassword = e.target.value;
                  setPassword(newPassword);

                  const strong = isStrongPassword(newPassword);
                  setIsPasswordStrong(strong);
                  setPasswordStrengthMessage(
                    strong
                      ? t('password_strong')
                      : t('password_weak')
                  );
                }}
                required
              />
              <span className={styles["visibility-toggle"]} onClick={togglePasswordVisibility}>
                {showPassword ? <EyeIcon /> : <EyeOffIcon />}
              </span>
            </div>
            {password && (
              <p
                className={styles["password-strength-message"]}
                style={{ color: isPasswordStrong ? "green" : "red" }}
              >
                {passwordStrengthMessage}
              </p>
            )}
          </div>

          <div className={styles["input-group"]}>
            <div className={styles["input-wrapper"]}>
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder={t('confirm_password_placeholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <span className={styles["visibility-toggle"]} onClick={toggleConfirmPasswordVisibility}>
                {showConfirmPassword ? <EyeIcon /> : <EyeOffIcon />}
              </span>
            </div>
          </div>

          <Button type="submit" className={styles["start-trading-btn"]}>
            {t('sign_up')}
          </Button>
        </form>

        <p className={styles["signup-link"]}>
          {t('already_have_account')} <Link to="/signin">{t('sign_in')}</Link>
        </p>
      </FormWrapper>
    </div>
  );
};

export default SignUp;
