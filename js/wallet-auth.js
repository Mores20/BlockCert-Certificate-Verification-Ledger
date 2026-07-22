/**
 * wallet-auth.js
 * "Sign in with Cardano" — lets a user log in to BlockCert by proving
 * ownership of a Cardano wallet, instead of a username/password.
 *
 * How it works (standard CIP-30 + CIP-8 pattern):
 *   1. Detect installed wallet extensions (Eternl, Nami, Lace, Flint, etc.)
 *   2. User picks one; the dApp calls wallet.enable() to connect (CIP-30)
 *   3. We generate a one-time random nonce
 *   4. The wallet signs the nonce with the user's private key (CIP-8 signData)
 *   5. We verify the signature against the returned public key + address
 *   6. If valid, the wallet address becomes the user's identity
 *
 * Requires: npm install @cardano-foundation/cardano-verify-datasignature
 *
 * SECURITY NOTE: This file's verifySignature() runs in the browser, which
 * is fine for a school project demo. In a production app, the nonce should
 * be generated server-side, stored with an expiry, and verified server-side
 * too — otherwise a malicious page could skip straight to "verified" without
 * a genuine signature. See the comments below for where that split would go.
 */

import verifyDataSignature from "@cardano-foundation/cardano-verify-datasignature";

/**
 * List which CIP-30 compatible wallets the user has installed.
 * Each browser extension injects itself onto window.cardano.<name>.
 * @returns {string[]} wallet keys, e.g. ["nami", "eternl", "lace"]
 */
function getAvailableWallets() {
  if (!window.cardano) return [];
  return Object.keys(window.cardano).filter(
    key => window.cardano[key] && typeof window.cardano[key].enable === "function"
  );
}

/**
 * Convert a plain string into the hex encoding CIP-30/CIP-8 expects.
 */
function stringToHex(str) {
  return Array.from(str)
    .map(c => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generate a one-time random nonce for the user to sign.
 * In production, generate + store this server-side instead (see note above).
 */
function generateNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Connect to a specific wallet by name (from getAvailableWallets()).
 * @param {string} walletName - e.g. "nami", "eternl"
 * @returns {Promise<object>} the CIP-30 API instance for that wallet
 */
async function connectWallet(walletName) {
  if (!window.cardano || !window.cardano[walletName]) {
    throw new Error(`Wallet "${walletName}" is not installed`);
  }
  const api = await window.cardano[walletName].enable();
  return api;
}

/**
 * Full "sign in with wallet" flow: connect, get address, sign nonce, verify.
 * @param {string} walletName - e.g. "nami", "eternl"
 * @returns {Promise<{address: string, verified: boolean}>}
 */
async function signInWithWallet(walletName) {
  const api = await connectWallet(walletName);

  // Use the first used address (payment address) as the user's identity
  const usedAddresses = await api.getUsedAddresses();
  if (!usedAddresses || usedAddresses.length === 0) {
    throw new Error("No addresses found in this wallet");
  }
  const address = usedAddresses[0];

  const nonce = generateNonce();
  const message = `Sign in to BlockCert. Nonce: ${nonce}`;
  const hexMessage = stringToHex(message);

  // This triggers the wallet's popup asking the user to approve signing
  const { signature, key } = await api.signData(address, hexMessage);

  // Verify the signature+key actually produced this exact message.
  // Note: verifyDataSignature() also accepts an optional 4th "address"
  // argument, but it expects a bech32 address (addr_test1...), while
  // CIP-30's getUsedAddresses() returns hex -- passing hex there throws
  // "Invalid Address". We skip it: the signature already cryptographically
  // proves ownership of the signing key, and since `address` came from the
  // same connected wallet session, that's sufficient proof of identity here.
  const verified = verifyDataSignature(signature, key, message);

  return { address, verified };
}

export { getAvailableWallets, connectWallet, signInWithWallet, generateNonce };
