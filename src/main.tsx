import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext.tsx';
import { ApiProvider } from './context/ApiContext.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <ApiProvider>
          <NotificationProvider userId={1}>
            <App />
          </NotificationProvider>
        </ApiProvider>
        
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
);
