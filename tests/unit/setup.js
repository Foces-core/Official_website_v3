// React 19 requires this flag for act() to work outside a testing-library
// setup; without it every act() call logs
// "The current testing environment is not configured to support act(...)".
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// vitest 4 + jsdom 30: the environment's global-key population drops the
// Web Storage accessors from `window` (raw jsdom still has them — verified
// by instantiating JSDOM directly), so any spec touching
// window.localStorage crashes on `undefined.removeItem`. Shim a minimal Web
// Storage onto window ONLY when the accessor is missing, so real jsdom
// semantics still win wherever they exist.
function makeStorageShim() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(String(key)) ? map.get(String(key)) : null),
    setItem: (key, value) => map.set(String(key), String(value)),
    removeItem: (key) => map.delete(String(key)),
    clear: () => map.clear(),
    key: (index) => Array.from(map.keys())[index] ?? null,
    get length() {
      return map.size;
    },
  };
}
if (typeof window !== 'undefined' && typeof window.localStorage === 'undefined') {
  for (const name of ['localStorage', 'sessionStorage']) {
    const storage = makeStorageShim();
    Object.defineProperty(window, name, {
      configurable: true,
      enumerable: true,
      get: () => storage,
    });
  }
}
