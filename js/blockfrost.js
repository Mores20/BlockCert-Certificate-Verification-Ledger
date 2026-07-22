/**
 * blockfrost.js
 * Direct calls to the Blockfrost REST API using plain fetch() --
 * no SDK, no WASM, no bundler workarounds needed.
 *
 * Docs: https://docs.blockfrost.io/
 */

import { bech32 } from 'bech32';

const BLOCKFROST_API_KEY = import.meta.env.VITE_BLOCKFROST_API_KEY;
const BLOCKFROST_URL = 'https://cardano-preprod.blockfrost.io/api/v0';

/**
 * CIP-30 wallets return addresses as hex (raw bytes), but Blockfrost's
 * REST API expects the human-readable bech32 form (addr_test1...).
 * @param {string} hexAddress
 * @returns {string} bech32 address, e.g. "addr_test1..."
 */
function hexAddressToBech32(hexAddress) {
  const bytes = Uint8Array.from(hexAddress.match(/.{1,2}/g).map(b => parseInt(b, 16)));
  const isTestnet = (bytes[0] & 0x0f) === 0x00;
  const hrp = isTestnet ? 'addr_test' : 'addr';
  const words = bech32.toWords(bytes);
  return bech32.encode(hrp, words, 1000); // raise limit -- addresses exceed bech32's default 90-char limit
}

/**
 * Get on-chain info for a Cardano address (balance, tx count, etc.)
 * @param {string} hexAddress - a CIP-30 hex address, e.g. from wallet-auth.js
 */
async function getAddressInfo(hexAddress) {
  const address = hexAddressToBech32(hexAddress);

  const res = await fetch(`${BLOCKFROST_URL}/addresses/${address}`, {
    headers: { project_id: BLOCKFROST_API_KEY }
  });

  if (!res.ok) {
    if (res.status === 404) {
      return null;
    }
    throw new Error(`Blockfrost error: ${res.status}`);
  }

  return res.json();
}

/**
 * Get the latest confirmed block on the network.
 */
async function getLatestBlock() {
  const res = await fetch(`${BLOCKFROST_URL}/blocks/latest`, {
    headers: { project_id: BLOCKFROST_API_KEY }
  });

  if (!res.ok) throw new Error(`Blockfrost error: ${res.status}`);
  return res.json();
}

export { getAddressInfo, getLatestBlock };