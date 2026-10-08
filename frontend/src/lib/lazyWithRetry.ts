import { ComponentType, lazy, LazyExoticComponent } from 'react';

/**
 * Wraps React.lazy with an automated single-reload recovery strategy
 * when a dynamically imported module fails to fetch (e.g. following a new production deployment).
 * Uses sessionStorage to prevent infinite reload loops.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy(async () => {
    const pageHasAlreadyBeenReloaded = sessionStorage.getItem('ascend_chunk_reload_pending');

    try {
      const component = await componentImport();
      if (pageHasAlreadyBeenReloaded) {
        sessionStorage.removeItem('ascend_chunk_reload_pending');
      }
      return component;
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      const isDynamicImportError =
        errorMessage.includes('dynamically imported module') ||
        errorMessage.includes('Failed to fetch dynamically imported module') ||
        errorMessage.includes('error loading dynamically imported module') ||
        errorMessage.includes('Importing a module script failed') ||
        error?.name === 'ChunkLoadError';

      if (isDynamicImportError && !pageHasAlreadyBeenReloaded) {
        sessionStorage.setItem('ascend_chunk_reload_pending', 'true');
        console.warn('[ASCEND] Detected stale chunk after deployment. Performing controlled reload...');
        window.location.reload();
        // Return a pending promise so React Suspense waits during reload
        return new Promise<{ default: T }>(() => {});
      }

      // If already reloaded once or not a dynamic chunk error, clean up and rethrow for ErrorBoundary
      sessionStorage.removeItem('ascend_chunk_reload_pending');
      console.error('[ASCEND] Dynamic import failed:', error);
      throw error;
    }
  });
}
