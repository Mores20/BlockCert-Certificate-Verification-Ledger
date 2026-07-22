/**
 * blockchain.js
 * Handles building a new transaction (with its hash chain link) and
 * verifying the integrity of the whole ledger.
 */

import { sha256, GENESIS_HASH } from './hash.js';

function buildTransactionPayload(certData, previousHash, timestamp) {
  return JSON.stringify({
    certificateName: certData.certificateName,
    recipient: certData.recipient,
    organization: certData.organization,
    dateIssued: certData.dateIssued,
    timestamp,
    previousHash
  });
}

async function createTransaction(certData, previousHash) {
  const timestamp = new Date().toISOString();
  const payload = buildTransactionPayload(certData, previousHash, timestamp);
  const currentHash = await sha256(payload);

  return {
    certificateName: certData.certificateName,
    recipient: certData.recipient,
    organization: certData.organization,
    dateIssued: certData.dateIssued,
    timestamp,
    previousHash,
    currentHash
  };
}

async function verifyChain(transactions) {
  let expectedPreviousHash = GENESIS_HASH;

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];

    if (tx.previousHash !== expectedPreviousHash) {
      return {
        valid: false,
        brokenAt: i,
        reason: `Transaction ${i} previousHash does not match the prior transaction's currentHash`
      };
    }

    const payload = buildTransactionPayload(tx, tx.previousHash, tx.timestamp);
    const recomputedHash = await sha256(payload);

    if (recomputedHash !== tx.currentHash) {
      return {
        valid: false,
        brokenAt: i,
        reason: `Transaction ${i} data does not match its stored hash (record was likely edited)`
      };
    }

    expectedPreviousHash = tx.currentHash;
  }

  return { valid: true, brokenAt: null, reason: null };
}

export { createTransaction, verifyChain, GENESIS_HASH };
