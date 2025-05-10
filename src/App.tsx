import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ApiProvider } from "./context/ApiContext";
import Dashboard from "./components/dashboard/dashboard";
import MainLayout from "./layouts/MainLayout";
import { ThemeProvider } from "./context/ThemeContext";
import SingleRequest from "./components/api-request/SingleRequest";
import ChainRequestComponent from "./components/api-request/ChainRequest";
import HomePage from "./components/homepage/HomePage";
import AccountSettingsPage from "./components/profile/AccountSettings";
import LoginPage from "./components/auth/Login";
import SignupPage from "./components/auth/SignUp";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPasswordPage from "./components/auth/ResetPassword";
import AccountProfile from "./components/profile/AccountProfile";
import AccountSecurity from "./components/profile/AccountSecurity";
import AccountPreferences from "./components/profile/AccountPreferences";
import AccountBilling from "./components/profile/AccountBilling";

function App() {
  return (
    <BrowserRouter>
     <ThemeProvider>
        <ToastProvider>
          <ApiProvider>
            <NotificationProvider userId={1}>
              <Routes>
                {/* Public Route */}
                <Route path="/" element={<HomePage/>} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                {/* Protected Routes */}
                <Route element={<MainLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/api-test" element={<SingleRequest/>} />
                  <Route path="/request-chain" element={<ChainRequestComponent/>} />
                  <Route path="/settings" element={<AccountSettingsPage />}>
                    <Route index element={<Navigate to="profile" replace />} />
                    <Route path="profile" element={<AccountProfile />} />
                    <Route path="security" element={<AccountSecurity />} />
                    <Route path="preferences" element={<AccountPreferences />} />
                    <Route path="billing" element={<AccountBilling />} />
                  </Route>
                </Route>
              </Routes>
            </NotificationProvider>
          </ApiProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
