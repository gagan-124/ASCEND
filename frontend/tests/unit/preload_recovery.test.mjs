import test from 'node:test';
import assert from 'node:assert/strict';
import { setupPreloadErrorHandler, PRELOAD_RETRY_KEY } from '../../src/app/preloadRecovery.ts';

function createMockWindow(storageOptions = {}) {
  const store = new Map();
  const listeners = new Map();
  let reloadCallCount = 0;

  const mockSessionStorage = {
    getItem(key) {
      if (storageOptions.throwOnGet) {
        throw new Error('Access denied to storage');
      }
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      if (storageOptions.throwOnSet) {
        throw new Error('Access denied to storage');
      }
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };

  const mockWin = {
    sessionStorage: mockSessionStorage,
    location: {
      reload() {
        reloadCallCount++;
      },
    },
    addEventListener(event, handler) {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event).push(handler);
    },
    removeEventListener(event, handler) {
      const arr = listeners.get(event);
      if (arr) {
        const idx = arr.indexOf(handler);
        if (idx !== -1) arr.splice(idx, 1);
      }
    },
    dispatchEvent(event) {
      const type = typeof event === 'string' ? event : event.type;
      const arr = listeners.get(type);
      if (arr) {
        for (const fn of arr) {
          fn(event);
        }
      }
    },
    get reloadCount() {
      return reloadCallCount;
    },
    getStore() {
      return store;
    },
  };

  return mockWin;
}

test('Vite Preload Error Recovery', async (t) => {
  await t.test('1. First vite:preloadError triggers location.reload() and sets sessionStorage guard', () => {
    const win = createMockWindow();
    const cleanup = setupPreloadErrorHandler(win);

    assert.equal(win.sessionStorage.getItem(PRELOAD_RETRY_KEY), null);
    assert.equal(win.reloadCount, 0);

    win.dispatchEvent({ type: 'vite:preloadError' });

    assert.equal(win.reloadCount, 1, 'Should trigger exactly one reload on first error');
    assert.equal(win.sessionStorage.getItem(PRELOAD_RETRY_KEY), 'true', 'Should mark guard in storage');

    cleanup();
  });

  await t.test('2. Second consecutive vite:preloadError prevents infinite reload loop', () => {
    const win = createMockWindow();
    const cleanup = setupPreloadErrorHandler(win);

    // First attempt
    win.dispatchEvent({ type: 'vite:preloadError' });
    assert.equal(win.reloadCount, 1);

    // Second attempt (simulating new deployment also being broken)
    win.dispatchEvent({ type: 'vite:preloadError' });
    assert.equal(win.reloadCount, 1, 'Must NOT reload again when guard is already set');

    cleanup();
  });

  await t.test('3. Handles storage exceptions gracefully with in-memory fallback', () => {
    const win = createMockWindow({ throwOnGet: true, throwOnSet: true });
    const cleanup = setupPreloadErrorHandler(win);

    // First attempt should still reload despite storage throwing
    win.dispatchEvent({ type: 'vite:preloadError' });
    assert.equal(win.reloadCount, 1, 'Should fall back to in-memory and reload once');

    // Second attempt in the same session must not loop
    win.dispatchEvent({ type: 'vite:preloadError' });
    assert.equal(win.reloadCount, 1, 'In-memory guard must prevent loop even without sessionStorage');

    cleanup();
  });

  await t.test('4. Unrelated window events do not trigger a reload', () => {
    const win = createMockWindow();
    const cleanup = setupPreloadErrorHandler(win);

    win.dispatchEvent({ type: 'error' });
    win.dispatchEvent({ type: 'unhandledrejection' });
    win.dispatchEvent({ type: 'resize' });

    assert.equal(win.reloadCount, 0, 'Must only react to vite:preloadError');
    assert.equal(win.sessionStorage.getItem(PRELOAD_RETRY_KEY), null);

    cleanup();
  });

  await t.test('5. Cleanup function unregisters listener', () => {
    const win = createMockWindow();
    const cleanup = setupPreloadErrorHandler(win);

    cleanup();

    win.dispatchEvent({ type: 'vite:preloadError' });
    assert.equal(win.reloadCount, 0, 'No reload should happen after cleanup');
  });
});
