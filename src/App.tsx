import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ApiProvider } from "./context/ApiContext";
import AuthModal from "./features/auth/Login";
import Dashboard from "./components/dashboard/dashboard";
import MainLayout from "./layouts/MainLayout";
import App2 from "./components/collections/App2";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  return (
    <BrowserRouter>
     <ThemeProvider>
        <ToastProvider>
          <ApiProvider>
            <NotificationProvider userId={1}>
              <Routes>
                {/* Public Route */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<AuthModal />} />

                {/* Protected Routes */}
                <Route element={<MainLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/api-test" element={<App2/>} />
                  {/* Add more routes here */}
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
