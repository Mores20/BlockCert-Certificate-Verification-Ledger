/**
 * app.js
 * Wires up the BlockCert UI: wallet login, dashboard, add-certificate
 * form, ledger table, and transaction details.
 *
 * Simplified scope: wallet login (CIP-30/CIP-8) gates certificate
 * creation; Blockfrost is used directly via fetch() to show real
 * on-chain info for the logged-in wallet. Certificate hashing/chaining
 * stays local (Supabase), matching what was actually required.
 */

import { addCertificateTransaction, getAllTransactionsDescending } from './storage.js';
import { getAvailableWallets, signInWithWallet } from './wallet-auth.js';
import { getAddressInfo } from './blockfrost.js';

let loggedInAddress = null;

function setFormEnabled(enabled) {
  const form = document.getElementById('cert-form');
  form.querySelectorAll('input, button').forEach(el => el.disabled = !enabled);
  document.getElementById('login-notice').hidden = enabled;
}

// --- Wallet login ------------------------------------------------------
function renderWalletButtons() {
  const wallets = getAvailableWallets();
  const container = document.getElementById('wallet-section');

  if (wallets.length === 0) {
    container.innerHTML = `<p>No Cardano wallet detected. Install Eternl or Lace to log in.</p>`;
    return;
  }

  container.innerHTML = wallets
    .map(name => `<button class="wallet-btn" data-wallet="${name}">Connect ${name}</button>`)
    .join('');

  container.querySelectorAll('.wallet-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const walletName = btn.dataset.wallet;
      try {
        const { address, verified } = await signInWithWallet(walletName);
        if (verified) {
          loggedInAddress = address;
          setFormEnabled(true);

          // Direct Blockfrost call -- proves real on-chain data, no SDK needed
          let balanceLine = '';
          try {
            const info = await getAddressInfo(address);
            if (info) {
              const lovelace = info.amount.find(a => a.unit === 'lovelace')?.quantity ?? '0';
              const ada = (Number(lovelace) / 1_000_000).toFixed(2);
              balanceLine = ` — ${ada} tADA`;
            } else {
              balanceLine = ' — no on-chain activity yet';
            }
          } catch (bfErr) {
            console.error('Blockfrost lookup failed:', bfErr);
          }

          container.innerHTML = `<p>Logged in as ${address.slice(0, 12)}...${balanceLine}</p>`;
          await refreshDashboardAndLedger();
        } else {
          alert('Signature verification failed. Please try again.');
        }
      } catch (err) {
        console.error(err);
        alert(`Wallet connection failed: ${err.message}`);
      }
    });
  });
}

// --- Dashboard + Ledger --------------------------------------------------
async function refreshDashboardAndLedger() {
  const transactions = await getAllTransactionsDescending(); // newest first

  document.getElementById('total-certs').textContent = transactions.length;
  if (transactions.length > 0) {
    document.getElementById('latest-cert').textContent = transactions[0].certificateName;
    document.getElementById('latest-tx').textContent = transactions[0].currentHash.slice(0, 12) + '...';
  }

  const tbody = document.querySelector('#ledger-table tbody');
  tbody.innerHTML = transactions
    .map(tx => `
      <tr data-id="${tx.id}">
        <td>${tx.id}</td>
        <td>${tx.certificateName}</td>
        <td>${tx.recipient}</td>
        <td>${tx.organization}</td>
        <td>${tx.dateIssued}</td>
        <td>${tx.currentHash.slice(0, 10)}...</td>
      </tr>
    `)
    .join('');

  tbody.querySelectorAll('tr').forEach(row => {
    row.addEventListener('click', () => {
      const tx = transactions.find(t => t.id === Number(row.dataset.id));
      showTransactionDetails(tx);
    });
  });
}

function showTransactionDetails(tx) {
  const section = document.getElementById('transaction-details');
  const content = document.getElementById('tx-detail-content');
  section.hidden = false;

  content.innerHTML = `
    <p><strong>Certificate:</strong> ${tx.certificateName}</p>
    <p><strong>Recipient:</strong> ${tx.recipient}</p>
    <p><strong>Organization:</strong> ${tx.organization}</p>
    <p><strong>Date Issued:</strong> ${tx.dateIssued}</p>
    <p><strong>Timestamp:</strong> ${tx.timestamp}</p>
    <p><strong>Previous Hash:</strong> ${tx.previousHash}</p>
    <p><strong>Current Hash:</strong> ${tx.currentHash}</p>
  `;
}

// --- Add Certificate form ------------------------------------------------
document.getElementById('cert-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!loggedInAddress) {
    alert('Please connect your wallet before creating a certificate.');
    return;
  }

  const certData = {
    certificateName: document.getElementById('certificateName').value,
    recipient: document.getElementById('recipient').value,
    organization: document.getElementById('organization').value,
    dateIssued: document.getElementById('dateIssued').value
  };

  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating...';

  try {
    await addCertificateTransaction(certData);
    e.target.reset();
    await refreshDashboardAndLedger();
  } catch (err) {
    console.error(err);
    alert(`Failed to create certificate: ${err.message}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Transaction';
  }
});

// --- Init ------------------------------------------------------------
setFormEnabled(false);
renderWalletButtons();
refreshDashboardAndLedger();
