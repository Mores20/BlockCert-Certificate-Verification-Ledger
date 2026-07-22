import { defineConfig } from 'vite';

// No special config needed now that Lucid Evolution (and its WASM/Node
// polyfill requirements) has been removed. Wallet login uses the
// browser's native window.cardano API, and Blockfrost is called via
// plain fetch() -- both are just regular browser-friendly JS.
export default defineConfig({});
