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
import { SnackbarProvider } from "./context/SnackBarContext";
import TermsPage from "./components/auth/TermsPage";
import PrivacyPage from "./components/auth/PrivacyPolicy";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./utils/queryClient";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import Settings from "./components/settings/Settings";
import TestSuites from "./components/testsuites/TestSuites";
import CreateTestSuite from "./components/testsuites/CreateTestSuite";

function App() {
  return (
    <BrowserRouter>
     <ThemeProvider>
        <ToastProvider>
          <SnackbarProvider>
            <ApiProvider>
              <WorkspaceProvider>
                <NotificationProvider userId={1}>
                  <QueryClientProvider client={queryClient}>
                    <Routes>
                      {/* Public Route */}
                      <Route path="/" element={<HomePage/>} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/signup" element={<SignupPage />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPasswordPage />} />
                      <Route path="/terms" element={<TermsPage />} />
                      <Route path="/privacy" element={<PrivacyPage />} />
                      {/* Protected Routes */}
                      <Route element={<MainLayout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/api-test" element={<SingleRequest/>} />
                        <Route path="/request-chain" element={<ChainRequestComponent/>} />
                        <Route path="/test-suites" element={<TestSuites />}/>
                        <Route path="test-suites/create" element={<CreateTestSuite />} />
                        <Route path="/settings" element={<AccountSettingsPage />}>
                          <Route index element={<Navigate to="profile" replace />} />
                          <Route path="profile" element={<AccountProfile />} />
                          <Route path="security" element={<AccountSecurity />} />
                          <Route path="preferences" element={<AccountPreferences />} />
                          <Route path="billing" element={<AccountBilling />} />
                        </Route>
                        <Route path="/setting" element={<Settings/>}></Route>
                      </Route>
                    </Routes>
                  </QueryClientProvider>
                </NotificationProvider>
              </WorkspaceProvider>
            </ApiProvider>
          </SnackbarProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
