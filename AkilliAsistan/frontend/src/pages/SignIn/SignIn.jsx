/* file:frontend/src/pages/SignIn/SignIn.jsx */

import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";

import instance from "../../api/axiosInstance";
import styles from "./SignIn.module.css"; // ya da SignUp.module.css

import { Button } from "../../components/Shared/Button";
import { Input } from "../../components/Shared/Input";
import { FormWrapper } from "../../components/Shared/FormWrapper";
import { EyeIcon, EyeOffIcon } from "../../components/Icons";

import { useUserStore } from "../../store/useUserStore";
import { toast } from "react-toastify";

const SignIn = () => {
  const { t } = useTranslation(); // i18n hook
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const setUserEmail = useUserStore((state) => state.setUserEmail);
  const setIsAuthenticated = useUserStore((state) => state.setIsAuthenticated);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await instance.post("/auth/login", {
        email,
        password,
      });

      if (response.data.success) {
        setUserEmail(response.data.data.email); // Zustand'a yaz
        setIsAuthenticated(true); // Zustand'a yaz
        navigate("/chat");
      }
    } catch (error) {
      const key = error.response?.data?.message;
      toast.error(t(key || "login_failed"));
    }
  };

  const handleGoogleLogin = async (googleToken) => {
    try {
      const response = await instance.post(
        "/auth/google-login",
        { token: googleToken },
        { withCredentials: true }
      );

      if (response.data.success) {
        setUserEmail(response.data.data.email); // Zustand'a yaz
        setIsAuthenticated(true); // Zustand'a yaz
        navigate("/chat");
      }
    } catch (error) {
      console.error(
        "Google login failed:",
        error.response?.data?.message || error.message
      );
      toast.error(t("google_login_failed"));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={styles["sign-in-container"]}>
      <FormWrapper titleKey="sign_in">
        <p>{t("social_login_prompt")}</p>

        <div
          className={styles["social-buttons"]}
          style={{ position: "relative" }}
        >
          <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                handleGoogleLogin(credentialResponse.credential);
              }}
              onError={() => {
                console.log("Google Login Failed");
              }}
            />
          </GoogleOAuthProvider>
        </div>

        <p>{t("or_continue_with_email")}</p>

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

          <div className={styles["input-group"]}>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder={t("password_placeholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className={styles["visibility-toggle"]}
              onClick={togglePasswordVisibility}
            >
              {showPassword ? <EyeIcon /> : <EyeOffIcon />}
            </span>
          </div>

          <Button type="submit" className={styles["start-trading-btn"]}>
            {t("start_now")}
          </Button>
        </form>

        <p className={styles["signup-link"]}>
          {t("no_account")} <Link to="/signup">{t("sign_up")}</Link>
        </p>

        <p className={styles["forgot-password"]}>
          <Link to="/forgot-password">{t("forgot_password")}</Link>
        </p>
      </FormWrapper>
    </div>
  );
};

export default SignIn;
