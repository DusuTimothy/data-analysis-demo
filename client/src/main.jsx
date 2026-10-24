/**
 * React entry point.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { CampaignProvider } from './context/CampaignContext.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <CampaignProvider>
        <App />
      </CampaignProvider>
    </BrowserRouter>
  </StrictMode>,
);
