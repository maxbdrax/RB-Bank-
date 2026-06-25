-- ==========================================
-- RB Bank MFS - Relational PostgreSQL Schema
-- Author: Enterprise Software Architect
-- Description: Production-ready ACID compliant schema for Mobile Financial Service (MFS).
-- Includes automated balance checks, cascading, and performance indexes.
-- ==========================================

-- 1. Create ENUM Types for roles, transaction status, and transaction types
CREATE TYPE user_role AS ENUM ('Customer', 'Agent', 'Merchant');
CREATE TYPE user_status AS ENUM ('Active', 'Pending', 'Suspended');
CREATE TYPE txn_type AS ENUM ('Send Money', 'Cash Out', 'Cash In', 'Mobile Recharge');
CREATE TYPE txn_status AS ENUM ('Success', 'Pending', 'Rejected');

-- 2. CREATE USERS TABLE
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'Customer',
    pin_hash VARCHAR(255) NOT NULL, -- SHA256 hashed PIN
    status user_status NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on phone for fast lookups during login/transactions
CREATE UNIQUE INDEX idx_users_phone ON users(phone);

-- 3. CREATE WALLETS TABLE (Stores current balance and pending lockouts for safety)
CREATE TABLE wallets (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0.00),
    pending_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00 CHECK (pending_balance >= 0.00),
    currency VARCHAR(5) NOT NULL DEFAULT 'BDT',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on user_id for fast wallet fetches
CREATE INDEX idx_wallets_user_id ON wallets(user_id);

-- 4. CREATE TRANSACTIONS TABLE (Relational storage of transfer trails)
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    type txn_type NOT NULL,
    sender_phone VARCHAR(15) NOT NULL,
    receiver_phone VARCHAR(15) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0.00),
    fee DECIMAL(15, 2) NOT NULL DEFAULT 0.00 CHECK (fee >= 0.00),
    txn_id VARCHAR(50) UNIQUE NOT NULL, -- RB Bank unique Transaction ID
    status txn_status NOT NULL DEFAULT 'Success',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on txn_id for lightning-fast search/verification
CREATE UNIQUE INDEX idx_transactions_txn_id ON transactions(txn_id);
-- Compound index on phones for fast historical query lookups
CREATE INDEX idx_transactions_phones ON transactions(sender_phone, receiver_phone);

-- 5. TRIGGER FOR UPDATING TIMESTAMP ON WALLET MODIFICATION
CREATE OR REPLACE FUNCTION update_wallet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_wallet_time
    BEFORE UPDATE ON wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_timestamp();

-- 6. EXAMPLE TRANSACTIONS (BEGIN, COMMIT, ROLLBACK Demonstration in documentation)
-- To perform a transfer securely under PostgreSQL with ACID protection:
--
-- BEGIN TRANSACTION;
--   -- 1. Lock rows for update to prevent concurrent race conditions
--   SELECT balance FROM wallets WHERE user_id = (SELECT id FROM users WHERE phone = '01811223344') FOR UPDATE;
--   -- 2. Deduct from Sender
--   UPDATE wallets SET balance = balance - 505.00 WHERE user_id = (SELECT id FROM users WHERE phone = '01811223344');
--   -- 3. Add to Receiver
--   UPDATE wallets SET balance = balance + 500.00 WHERE user_id = (SELECT id FROM users WHERE phone = '01555443322');
--   -- 4. Record Transaction
--   INSERT INTO transactions (type, sender_phone, receiver_phone, amount, fee, txn_id, status)
--   VALUES ('Send Money', '01811223344', '01555443322', 500.00, 5.00, 'NGD83KLS8W', 'Success');
-- COMMIT;
