import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import TrialBanner from './TrialBanner';
import Header from './Header/index';
import { useAuth } from '@/hooks/useAuth';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ChevronsRight } from 'lucide-react';
import LogoFull from '../assests/images/OptraLogo.png';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { token } = useAuth();
  const [_, setLocation] = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isDrawerOpen]);

  // ✅ ESC to close
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsDrawerOpen(false);
    };
    if (isDrawerOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDrawerOpen]);

  useEffect(() => {
    if (!token) {
      setLocation('/');
    }
  }, [token]);

  try {
    return (
      <div className='flex h-screen overflow-hidden bg-gray-50 relative'>
        {/* Sidebar on Desktop */}
        <div className='hidden md:block'>
          <Sidebar />
        </div>

        <div className="md:hidden">

          <div
            className={[
              "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300",
              isDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
            ].join(" ")}
            onClick={() => setIsDrawerOpen(false)}
          />


          <div
            className={[
              "fixed top-0 left-0 z-50 h-full w-[280px] max-w-[85vw] bg-white border-r shadow-xl",
              "transform transition-transform duration-300 ease-out will-change-transform",
              isDrawerOpen ? "translate-x-0" : "-translate-x-full",
            ].join(" ")}
            role="dialog"
            aria-modal="true"
            aria-label="Sidebar"
          >

            <div className="h-14 flex items-center justify-between px-3 border-b">
              <Link to='/' className='flex items-center space-x-2'>
                <img
                  src={LogoFull}
                  alt='Optraflow'
                  style={{ width: '100%', height: '50px' }}
                />
              </Link>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded hover:bg-gray-100"
                aria-label="Close sidebar"
              >
                ✕
              </button>
            </div>

            {/* Sidebar content */}
            <div className="h-[calc(100%-56px)] overflow-y-auto">
              <Sidebar onNavigate={() => setIsDrawerOpen(false)} />
            </div>
          </div>
        </div>


        {/* Main Content */}
        <div className='flex-1 flex flex-col overflow-hidden'>
          <Header
            isDrawerOpen={isDrawerOpen}
            toggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
          />

          <div className='px-2 sm:px-0'>
            <TrialBanner />
          </div>
          <main className='flex-1 overflow-y-auto p-1 sm:p-4 scrollbar-thin'>
            {children}
          </main>
        </div>
      </div>
    );
  } catch (error) {
    console.error('AppLayout error:', error);
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold mb-2'>Something went wrong</h2>
          <p className='text-gray-600 mb-4'>Please refresh the page</p>
          <button
            onClick={() => window.location.reload()}
            className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
};

export default AppLayout;
