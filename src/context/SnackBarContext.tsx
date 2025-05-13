import React, { createContext, useContext, useState, useEffect } from 'react';
import { setShowSnackbar as registerSnackbar } from '../shared/services/snackbarService';

type SnackbarType = 'success' | 'error';

interface SnackbarContextType {
  showSnackbar: (message: string, type?: SnackbarType) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState<SnackbarType>('success');
  const [visible, setVisible] = useState(false);

  const showSnackbar = (msg: string, type: SnackbarType = 'success') => {
    setMessage(msg);
    setType(type);
    setVisible(true);
  };

  // Register with global service
  useEffect(() => {
    registerSnackbar(showSnackbar);
  }, []);

  // Auto-hide after 3 seconds
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {visible && (
        <div className={`fixed bottom-5 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded shadow-lg text-white text-sm 
          ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {message}
        </div>
      )}
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};
