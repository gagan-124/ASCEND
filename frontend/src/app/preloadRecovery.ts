export const PRELOAD_RETRY_KEY = 'ascend_preload_retry';

/**
 * Handles Vite's vite:preloadError event when dynamic chunks fail to load
 * (e.g. following a production deployment where old hashed chunks are replaced).
 * Employs a loop-protected single-reload recovery strategy.
 */
export function setupPreloadErrorHandler(win: Window = window): () => void {
  let inMemoryRetried = false;

  const onPreloadError = (event: Event) => {
    let hasRetried = false;
    try {
      hasRetried = win.sessionStorage.getItem(PRELOAD_RETRY_KEY) === 'true';
    } catch {
      hasRetried = inMemoryRetried;
    }

    if (!hasRetried) {
      try {
        win.sessionStorage.setItem(PRELOAD_RETRY_KEY, 'true');
      } catch {
        inMemoryRetried = true;
      }
      console.warn('[ASCEND] Detected stale deployment chunk via vite:preloadError. Performing recovery reload...');
      win.location.reload();
    } else {
      console.error('[ASCEND] Deployment recovery reload already attempted; letting error boundary handle chunk failure.', event);
    }
  };

  win.addEventListener('vite:preloadError', onPreloadError);

  // Clear reload guard after application has been active and stable for 10 seconds
  const cleanupTimer = setTimeout(() => {
    try {
      win.sessionStorage.removeItem(PRELOAD_RETRY_KEY);
    } catch {
      // Safe no-op
    }
  }, 10000);

  return () => {
    win.removeEventListener('vite:preloadError', onPreloadError);
    clearTimeout(cleanupTimer);
  };
}
