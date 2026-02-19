
import React from 'react';
import ReactDOM from 'react-dom/client';
import AppV2 from './App_V2';
import { ToastProvider } from './contexts/ToastContext.tsx';
import { LanguageProvider } from './contexts/LanguageContext.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <ToastProvider>
        <AppV2 />
      </ToastProvider>
    </LanguageProvider>
  </React.StrictMode>,
);
