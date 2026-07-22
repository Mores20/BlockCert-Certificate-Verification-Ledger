/**
 * hash.js
 * Wraps the Web Crypto API so the rest of the app can hash a string
 * without touching ArrayBuffers directly.
 */

/**
 * Compute the SHA-256 hash of a string and return it as a hex string.
 * @param {string} message
 * @returns {Promise<string>} 64-character lowercase hex hash
 */
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// The "genesis" previous hash — used for the very first transaction
// in the ledger, since it has no predecessor.
const GENESIS_HASH = '0'.repeat(64);

export { sha256, GENESIS_HASH };
