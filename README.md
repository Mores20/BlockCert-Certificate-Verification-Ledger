# BlockCert: Certificate Verification Ledger (Solo Project)

BlockCert is a blockchain-inspired web application that records certificate
information as immutable transactions. Each certificate issued is stored
with a unique transaction hash (generated using SHA-256), and every
transaction links to the hash of the one before it — forming a tamper-evident
chain of records, similar to how a real blockchain works.

## Features

- **Dashboard** — total certificates issued, latest certificate, and latest
  transaction at a glance
- **Add Certificate** — issue a new certificate (name, recipient, organization,
  date issued) as a new transaction
- **Certificate Ledger** — table of all transactions, newest first
- **Transaction Details** — click any row to view its full details, including
  its hash and the hash of the previous transaction
- **Hash Chaining** — every transaction stores the previous transaction's
  hash, so any tampering with an old record breaks the chain and can be
  detected

## Tech Stack

- HTML5
- CSS3
- JavaScript (Vanilla)
- [Supabase](https://supabase.com/) — database and backend
- Web Crypto API — SHA-256 hashing

## Project Structure

```
BlockCert/
│
├── index.html
├── css/
│   └── style.css
│
├── js/
│   ├── app.js          # UI logic, event handlers
│   ├── blockchain.js   # Transaction creation & chain verification
│   ├── storage.js      # Supabase reads/writes
│   └── hash.js         # SHA-256 helper (Web Crypto API)
│
├── assets/
│   └── logo.png
│
└── README.md
```

## How the Hash Chain Works

Each transaction stores two hashes:

- **Previous Hash** — the `currentHash` of the transaction before it (or a
  genesis hash of all zeros if it's the first transaction)
- **Current Hash** — a SHA-256 hash computed from the certificate's data,
  timestamp, and the previous hash

```
Transaction 1                Transaction 2                Transaction 3
Hash: A123        ─────►     Previous Hash: A123  ─────►   Previous Hash: B456
                              Current Hash:  B456           Current Hash:  C789
```

Because each hash depends on the one before it, changing any single
transaction's data would change its hash — breaking the chain for every
transaction after it. This makes the ledger tamper-evident without requiring
an actual distributed blockchain network.

## Database Schema (Supabase)

Table: `transactions`

| Column           | Type        | Description                          |
|------------------|-------------|---------------------------------------|
| id               | bigint (PK) | Auto-incrementing transaction ID     |
| certificate_name | text        | Name of the certificate              |
| recipient        | text        | Recipient's name                     |
| organization     | text        | Issuing organization                 |
| date_issued      | date        | Date the certificate was issued      |
| timestamp        | timestamptz | Time the transaction was created     |
| previous_hash    | text        | Hash of the previous transaction     |
| current_hash     | text        | SHA-256 hash of this transaction     |

## Getting Started

1. Clone the repository
   ```
   git clone <your-repo-url>
   ```
2. Create a Supabase project and set up the `transactions` table using the
   schema above
3. Add your Supabase URL and anon key to `app.js`
4. Open `index.html` in a browser (or serve it with a local dev server)

## Project Status

**Phase 1 (MVP)**
- [x] Dashboard (total certificates, latest certificate, latest transaction)
- [x] Add Certificate form
- [x] Certificate Ledger table
- [x] Transaction Details view
- [x] Linked hash chain between transactions

## License

This project was created for educational purposes.
