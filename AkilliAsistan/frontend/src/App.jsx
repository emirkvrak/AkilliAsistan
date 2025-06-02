/* file: frontend/src/App.jsx */

import './locales/i18n';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import instance from "./api/axiosInstance";

// Pages
import SignIn from "./pages/SignIn/SignIn";
import SignUp from "./pages/SignUp/SignUp";
import VerifyEmail from "./pages/VerifyEmail/VerifyEmail";
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import ChatPage from "./features/chat/ChatPage";

import { useUserStore } from "./store/useUserStore"; // ✅ Zustand import


import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Spinner from "./components/Shared/Spinner";




function PrivateRoute({ children }) {
  const isAuthenticated = useUserStore(state => state.isAuthenticated);
  const setUserEmail = useUserStore(state => state.setUserEmail);
  const setIsAuthenticated = useUserStore(state => state.setIsAuthenticated);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await instance.get('/auth/me');
        if (res.data.success) {
          setUserEmail(res.data.data.email);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        setIsAuthenticated(false);
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, [setUserEmail, setIsAuthenticated]);

  if (checking) return <Spinner />;


  if (!isAuthenticated) return <Navigate to="/signin" />;

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/chat" element={
          <PrivateRoute>
            <ChatPage />
          </PrivateRoute>
        } />

        <Route path="/profile" element={
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        } />

        <Route path="/" element={<Navigate to="/signin" />} />
      </Routes>

      <ToastContainer position="top-right" autoClose={3000} pauseOnHover />
    </Router>
  );
}

export default App;
