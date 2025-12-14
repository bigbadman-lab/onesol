// Safely set up fetch polyfill with error handling
try {
  const updatedFetch = require('./fetch').default;
  if (typeof updatedFetch === 'function') {
    // @ts-ignore
    global.fetch = updatedFetch;
  } else {
    console.error('[Polyfills] Failed to load fetch polyfill - updatedFetch is not a function');
  }
} catch (error) {
  console.error('[Polyfills] Error setting up fetch polyfill:', error);
  // Don't crash - fall back to default fetch if available
  if (typeof global.fetch === 'undefined' && typeof fetch !== 'undefined') {
    // @ts-ignore
    global.fetch = fetch;
  }
}
