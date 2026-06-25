/**
 * ==========================================
 * RB Bank MFS - Secure Production Backend API
 * Framework: Node.js + Express + PG (PostgreSQL Client)
 * Author: Enterprise Software Architect
 * ==========================================
 */

const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt'); // For secure password / PIN hashing
const jwt = require('jsonwebtoken'); // Secure session tokens
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'rb_bank_super_secure_jwt_secret_key_99';

// Middlewares
app.use(cors());
app.use(express.json());

// PostgreSQL Pool Connection config (ACID transactions)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/rb_bank_db',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Helper: Generate RB Bank Transaction ID
function generateTxnId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let txn = 'RBB';
  for (let i = 0; i < 7; i++) {
    txn += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return txn;
}

// =========================================================================
// 1. ENDPOINT: USER & AGENT REGISTRATION
// =========================================================================
app.post('/api/v1/register', async (req, res) => {
  const { name, phone, role, pin } = req.body;

  // Basic Input Validation (SQL Injection defense)
  if (!name || !phone || !role || !pin) {
    return res.status(400).json({ error: 'All fields (name, phone, role, pin) are required.' });
  }

  if (phone.length < 11 || isNaN(Number(phone))) {
    return res.status(400).json({ error: 'Invalid phone number format.' });
  }

  if (pin.length !== 4 || isNaN(Number(pin))) {
    return res.status(400).json({ error: 'PIN must be a 4-digit numeric code.' });
  }

  if (!['Customer', 'Agent', 'Merchant'].includes(role)) {
    return res.status(400).json({ error: 'Invalid user role specified.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN'); // Start Transaction

    // Check if phone number is already registered
    const userCheck = await client.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (userCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Phone number already registered on RB Bank.' });
    }

    // Hash user's 4-digit PIN (Security requirement)
    const saltRounds = 10;
    const pinHash = await bcrypt.hash(pin, saltRounds);

    // Insert user into PostgreSQL using Parameterized Query (SQL Injection protection)
    const userInsertQuery = `
      INSERT INTO users (name, phone, role, pin_hash, status)
      VALUES ($1, $2, $3, $4, 'Active') RETURNING id, name, phone, role;
    `;
    const userResult = await client.query(userInsertQuery, [name, phone, role, pinHash]);
    const newUser = userResult.rows[0];

    // Seed default float balance: Agent gets 100,000 BDT, Customer gets 500 BDT welcome
    const initialBalance = (role === 'Agent') ? 100000.00 : 500.00;

    const walletInsertQuery = `
      INSERT INTO wallets (user_id, balance, pending_balance, currency)
      VALUES ($1, $2, 0.00, 'BDT');
    `;
    await client.query(walletInsertQuery, [newUser.id, initialBalance]);

    await client.query('COMMIT'); // Commit changes safely

    return res.status(201).json({
      message: 'Registration successful',
      user: newUser
    });
  } catch (error) {
    await client.query('ROLLBACK'); // Revert all inserts if any step fails
    console.error('Registration Error:', error);
    return res.status(500).json({ error: 'Database exception occurred during registration.' });
  } finally {
    client.release();
  }
});

// =========================================================================
// 2. ENDPOINT: SECURE LOGIN
// =========================================================================
app.post('/api/v1/login', async (req, res) => {
  const { phone, pin } = req.body;

  if (!phone || !pin) {
    return res.status(400).json({ error: 'Phone number and security PIN are required.' });
  }

  try {
    // Parameterized search to protect against SQL injections
    const result = await pool.query('SELECT * FROM users WHERE phone = $1 LIMIT 1', [phone]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid phone number or PIN.' });
    }

    // Compare input PIN with stored bcrypt hash
    const isPinValid = await bcrypt.compare(pin, user.pin_hash);
    if (!isPinValid) {
      return res.status(401).json({ error: 'Invalid phone number or PIN.' });
    }

    // Fetch account balance
    const walletResult = await pool.query('SELECT balance FROM wallets WHERE user_id = $1', [user.id]);
    const wallet = walletResult.rows[0];

    // Sign JWT token for secure state/session management
    const token = jwt.sign(
      { userId: user.id, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        balance: wallet ? parseFloat(wallet.balance) : 0
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: 'Database error occurred during authentication.' });
  }
});

// =========================================================================
// 3. SECURE ENDPOINT: SEND MONEY (ACID DATABASE TRANSACTION ENGINE)
// =========================================================================
app.post('/api/v1/send-money', async (req, res) => {
  const { senderPhone, receiverPhone, amount, pin } = req.body;

  const transferAmount = parseFloat(amount);
  if (isNaN(transferAmount) || transferAmount <= 0) {
    return res.status(400).json({ error: 'Invalid transfer amount.' });
  }

  // Charge structure: BDT 5 fee for transactions equal/above BDT 500
  const fee = transferAmount >= 500.00 ? 5.00 : 0.00;
  const totalDeduction = transferAmount + fee;

  const client = await pool.connect();
  try {
    // START POSTGRES TRANSACTION - Extremely critical for ACID safety
    await client.query('BEGIN TRANSACTION');

    // Fetch and row-lock sender to avoid parallel balance race conditions (FOR UPDATE)
    const senderResult = await client.query(
      'SELECT id, pin_hash FROM users WHERE phone = $1 FOR UPDATE',
      [senderPhone]
    );
    const sender = senderResult.rows[0];

    if (!sender) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Sender account not found.' });
    }

    // Verify PIN authenticity
    const isPinValid = await bcrypt.compare(pin, sender.pin_hash);
    if (!isPinValid) {
      await client.query('ROLLBACK');
      return res.status(401).json({ error: 'Incorrect security PIN.' });
    }

    // Fetch and row-lock receiver
    const receiverResult = await client.query(
      'SELECT id, role FROM users WHERE phone = $1 FOR UPDATE',
      [receiverPhone]
    );
    const receiver = receiverResult.rows[0];

    if (!receiver) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Receiver phone number is not registered.' });
    }

    if (senderPhone === receiverPhone) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cannot transfer to your own number.' });
    }

    if (receiver.role !== 'Customer') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Send Money is only allowed between Customer accounts.' });
    }

    // Fetch & Lock Sender Balance
    const senderWalletResult = await client.query(
      'SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE',
      [sender.id]
    );
    const senderWallet = senderWalletResult.rows[0];

    if (!senderWallet || parseFloat(senderWallet.balance) < totalDeduction) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient balance for this transaction.' });
    }

    // Deduct total amount from sender wallet
    await client.query(
      'UPDATE wallets SET balance = balance - $1 WHERE user_id = $2',
      [totalDeduction, sender.id]
    );

    // Credit base amount to receiver wallet
    await client.query(
      'UPDATE wallets SET balance = balance + $1 WHERE user_id = $2',
      [transferAmount, receiver.id]
    );

    // Record Immutable Transaction Ledger
    const txnId = generateTxnId();
    const insertTxnQuery = `
      INSERT INTO transactions (type, sender_phone, receiver_phone, amount, fee, txn_id, status)
      VALUES ('Send Money', $1, $2, $3, $4, $5, 'Success') RETURNING *;
    `;
    const txnResult = await client.query(insertTxnQuery, [
      senderPhone,
      receiverPhone,
      transferAmount,
      fee,
      txnId
    ]);

    // Commit SQL changes atomically
    await client.query('COMMIT');

    return res.json({
      message: 'Transaction completed successfully.',
      transaction: txnResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK'); // Revert all modifications if any DB crash occurs
    console.error('Send Money Exception:', error);
    return res.status(500).json({ error: 'Critical database transaction exception occurred.' });
  } finally {
    client.release(); // Return client back to connection pool
  }
});

// Start express server
app.listen(PORT, () => {
  console.log(`RB Bank Production Server running on port ${PORT}`);
});
