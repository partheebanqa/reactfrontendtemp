import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import TrialBanner from "./TrialBanner";
import Header from "./Header/index";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronsRight } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { token } = useAuth();
  const [_, setLocation] = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (!token) {
      setLocation('/');
    }
  }, [token]);

  try {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50 relative">
        {/* Sidebar on Desktop */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Mobile Drawer Sidebar */}
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setIsDrawerOpen(false)}
            />
            {/* Drawer */}
            <div className="fixed top-0 left-0 z-50 w-64 h-full bg-white border-r shadow-lg transition-transform duration-300 md:hidden">
              <Sidebar />
            </div>
          </>
        )}

        {/* Drawer Toggle Button (Mobile only) */}
        {/* {!isDrawerOpen && (
          <Button
            size="icon"
            className="fixed top-4 left-4 z-50 bg-primary text-white shadow-md md:hidden"
            onClick={() => setIsDrawerOpen(true)}
          >
            <ChevronsRight size={20} />
          </Button>
        )} */}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
        <Header
  isDrawerOpen={isDrawerOpen}
  toggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
/>

          <div className="px-2 sm:px-0">
            <TrialBanner />
          </div>
          <main className='flex-1 overflow-y-auto p-4 sm:p-6'>{children}</main>
        </div>
      </div>
    );
  } catch (error) {
    console.error("AppLayout error:", error);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">Please refresh the page</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
};

export default AppLayout;
