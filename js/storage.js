/**
 * storage.js
 * All Supabase reads/writes for the ledger live here.
 *
 * Expected table: transactions
 *   id               bigint, primary key, identity
 *   certificate_name text
 *   recipient        text
 *   organization     text
 *   date_issued      date
 *   timestamp        timestamptz
 *   previous_hash    text
 *   current_hash     text
 *   cardano_tx_hash  text (nullable, added once anchoring is wired up)
 */

import { createClient } from '@supabase/supabase-js';
import { createTransaction, GENESIS_HASH } from './blockchain.js';

// --- Configuration ---------------------------------------------------
// Fill these in with your Supabase project's URL and anon (public) key,
// found in Project Settings > API.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getPreviousHash() {
  const { data, error } = await supabaseClient
    .from('transactions')
    .select('current_hash')
    .order('id', { ascending: false })
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) return GENESIS_HASH;
  return data[0].current_hash;
}

async function insertTransaction(tx) {
  const { data, error } = await supabaseClient
    .from('transactions')
    .insert({
      certificate_name: tx.certificateName,
      recipient: tx.recipient,
      organization: tx.organization,
      date_issued: tx.dateIssued,
      timestamp: tx.timestamp,
      previous_hash: tx.previousHash,
      current_hash: tx.currentHash
    })
    .select();

  if (error) throw error;
  return data[0];
}

function mapRow(row) {
  return {
    id: row.id,
    certificateName: row.certificate_name,
    recipient: row.recipient,
    organization: row.organization,
    dateIssued: row.date_issued,
    timestamp: row.timestamp,
    previousHash: row.previous_hash,
    currentHash: row.current_hash,
    cardanoTxHash: row.cardano_tx_hash ?? null
  };
}

async function getAllTransactionsAscending() {
  const { data, error } = await supabaseClient
    .from('transactions')
    .select('*')
    .order('id', { ascending: true });

  if (error) throw error;
  return data.map(mapRow);
}

async function getAllTransactionsDescending() {
  const ascending = await getAllTransactionsAscending();
  return ascending.reverse();
}

async function addCertificateTransaction(certData) {
  const previousHash = await getPreviousHash();
  const tx = await createTransaction(certData, previousHash);
  return insertTransaction(tx);
}

export {
  supabaseClient,
  getPreviousHash,
  insertTransaction,
  getAllTransactionsAscending,
  getAllTransactionsDescending,
  addCertificateTransaction
};
