import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import '@/styles/globals.css';

import { setupPreloadErrorHandler, PRELOAD_RETRY_KEY } from './preloadRecovery';
export { setupPreloadErrorHandler, PRELOAD_RETRY_KEY };

// Initialize handler in browser environments
if (typeof window !== 'undefined') {
  setupPreloadErrorHandler(window);
}

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

