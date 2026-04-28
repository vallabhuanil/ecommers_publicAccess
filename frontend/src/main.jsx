import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1a1d2e', color: '#f1f5f9', border: '1px solid #2a2d40' },
          success: { iconTheme: { primary: '#4f6ef7', secondary: '#fff' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
