// frontend/src/api/axiosInstance.js

import axios from "axios";
import { useUserStore } from "../store/useUserStore";
import { toast } from "react-toastify";
import i18n from "../locales/i18n";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  withCredentials: true,
  timeout: 0,
});

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 403) {
      originalRequest._retryCount = originalRequest._retryCount || 0;

      if (originalRequest._retryCount >= 1) {
        return Promise.reject(error);
      }

      originalRequest._retryCount += 1;

      try {
        const res = await instance.post("/auth/refresh");

        if (res.status === 200) {
          return instance(originalRequest); // ✅ Token yenilendiyse isteği tekrar gönder
        }
      } catch (refreshError) {
        console.error("Refresh token expired:", refreshError);

        try {
          await instance.post("/auth/logout");
          toast.success(i18n.t("logout_successful"));
        } catch (logoutError) {
          console.error("Logout error:", logoutError);
          toast.error(i18n.t("logout_failed"));
        }

        // ✅ Oturum süresi doldu uyarısı
        toast.error(i18n.t("session_expired"));

        const { setUserEmail, setIsAuthenticated } = useUserStore.getState();
        setUserEmail("");
        setIsAuthenticated(false);

        // ✅ 2 saniye bekle → sonra yönlendir
        setTimeout(() => {
          window.location.href = "/signin";
        }, 2000);

        return;
      }
    }

    // ✅ Hata mesajı varsa i18n çevirisi uygula
    const rawMessage = error.response?.data?.message;
    const fallbackMessage = i18n.t("unknown_error");

    const message =
      rawMessage && i18n.exists(rawMessage)
        ? i18n.t(rawMessage)
        : rawMessage || fallbackMessage;

    toast.error(message);

    return Promise.reject(error);
  }
);

export default instance;
