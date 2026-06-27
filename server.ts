import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

// Interfaces for our in-memory simulated Postgres database
interface User {
  id: number;
  name: string;
  phone: string;
  role: "Customer" | "Agent" | "Merchant";
  pin_hash: string; // Hashed with simple mechanism
  status: "Active" | "Pending" | "Suspended";
  created_at: string;
}

interface Wallet {
  id: number;
  user_id: number;
  balance: number;
  pending_balance: number; // For cash-out approvals
  currency: string;
}

interface Transaction {
  id: number;
  type: "Send Money" | "Cash Out" | "Cash In" | "Mobile Recharge" | "Merchant Payment" | "Drive Offer" | "Pay Bill" | "Add Money";
  sender_phone: string;
  receiver_phone: string;
  amount: number;
  fee: number;
  txn_id: string;
  status: "Success" | "Pending" | "Rejected";
  timestamp: string;
}

interface DriveOffer {
  id: number;
  operator: string;
  name: string;
  regular: number;
  price: number;
  save: number;
}

interface Notice {
  id: number;
  title: string;
  content: string;
  timestamp: string;
}

interface SettlementConfig {
  bank_name: string;
  account_no: string;
  routing_no: string;
}

interface DBLog {
  timestamp: string;
  type: "SQL" | "SYSTEM" | "API";
  message: string;
}

interface AdminUser {
  username: string;
  password_hash: string;
}

// In-Memory Database State
const DB = {
  users: [] as User[],
  wallets: [] as Wallet[],
  transactions: [] as Transaction[],
  drive_offers: [] as DriveOffer[],
  notices: [] as Notice[],
  settlement_config: {
    bank_name: "Sonali Bank PLC",
    account_no: "1204-55633-221",
    routing_no: "020260124"
  } as SettlementConfig,
  add_money_methods: {
    bkash: "01789456123",
    nagad: "01987654321",
    rocket: "01512345678"
  },
  admin_users: [
    { username: "admin", password_hash: "password123" }
  ] as AdminUser[],
  logs: [] as DBLog[],
};

// Log SQL query or event helper
function logDB(type: "SQL" | "SYSTEM" | "API", message: string) {
  const timestamp = new Date().toISOString();
  DB.logs.push({ timestamp, type, message });
  // Keep logs at a reasonable limit
  if (DB.logs.length > 200) {
    DB.logs.shift();
  }
  console.log(`[${type}] ${message}`);
}

// Helper to generate transaction ID like RB Bank
function generateTxnId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let txn = "RBB";
  for (let i = 0; i < 7; i++) {
    txn += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return txn;
}

// Simple PIN hashing/comparison for simulation
function hashPIN(pin: string): string {
  // Simple representation of a crypt hash (like bcrypt)
  return `sha256$simulated$${pin}`;
}

// Seed Database
function seedDatabase() {
  DB.users = [];
  DB.wallets = [];
  DB.transactions = [];
  DB.drive_offers = [];
  if (!DB.admin_users || DB.admin_users.length === 0) {
    DB.admin_users = [{ username: "admin", password_hash: "password123" }];
  }
  DB.notices = [
    {
      id: 1,
      title: "ঈদ মোবারক - ঈদ অফার!",
      content: "প্রিয় গ্রাহকবৃন্দ, আমাদের সকল ড্রাইভ প্যাকের উপর থাকছে আকর্ষণীয় ক্যাশব্যাক! বিস্তারিত জানতে ড্রাইভ অফার সেকশন দেখুন।",
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 2,
      title: "সিস্টেম রক্ষণাবেক্ষণ নোটিশ",
      content: "আগামী শুক্রবার রাত ১২:০০ টা থেকে ভোর ৪:০০ টা পর্যন্ত আমাদের সার্ভার আপগ্রেড কাজ চলবে। সাময়িক এই অসুবিধার জন্য আমরা আন্তরিকভাবে দুঃখিত।",
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
    }
  ];
  DB.settlement_config = {
    bank_name: "Sonali Bank PLC",
    account_no: "1204-55633-221",
    routing_no: "020260124"
  };
  DB.add_money_methods = {
    bkash: "01789456123",
    nagad: "01987654321",
    rocket: "01512345678"
  };
  DB.logs = [];

  logDB("SYSTEM", "Initializing & Seeding PostgreSQL Database Schema...");

  // Schema creation logs
  logDB("SQL", `CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    role VARCHAR(20) CHECK (role IN ('Customer', 'Agent', 'Merchant')),
    pin_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`);

  logDB("SQL", `CREATE TABLE wallets (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    pending_balance DECIMAL(15, 2) DEFAULT 0.00,
    currency VARCHAR(5) DEFAULT 'BDT'
  );`);

  logDB("SQL", `CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    sender_phone VARCHAR(15) NOT NULL,
    receiver_phone VARCHAR(15) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    fee DECIMAL(15, 2) NOT NULL,
    txn_id VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'Success',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`);

  logDB("SQL", `CREATE TABLE drive_offers (
    id SERIAL PRIMARY KEY,
    operator VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    regular INT NOT NULL,
    price INT NOT NULL,
    save INT NOT NULL
  );`);

  const seedDrives = [
    { id: 1, operator: "Grameenphone", name: "GP 50 GB + 1600 Mins (30 Days)", regular: 998, price: 620, save: 378 },
    { id: 2, operator: "Grameenphone", name: "GP 35 GB + 800 Mins (30 Days)", regular: 799, price: 490, save: 309 },
    { id: 3, operator: "Robi", name: "Robi 45 GB + 1000 Mins (30 Days)", regular: 798, price: 450, save: 348 },
    { id: 4, operator: "Robi", name: "Robi 60 GB Internet Only (30 Days)", regular: 649, price: 395, save: 254 },
    { id: 5, operator: "Banglalink", name: "BL 40 GB + 900 Mins (30 Days)", regular: 699, price: 399, save: 300 },
    { id: 6, operator: "Banglalink", name: "BL 20 GB + 500 Mins (30 Days)", regular: 499, price: 290, save: 209 },
    { id: 7, operator: "Airtel", name: "Airtel 50 GB + 1000 Mins (30 Days)", regular: 748, price: 440, save: 308 },
    { id: 8, operator: "Teletalk", name: "Teletalk 35 GB + 500 Mins (30 Days)", regular: 549, price: 320, save: 229 }
  ];

  seedDrives.forEach((d) => {
    DB.drive_offers.push(d);
    logDB("SQL", `INSERT INTO drive_offers (id, operator, name, regular, price, save) VALUES (${d.id}, '${d.operator}', '${d.name}', ${d.regular}, ${d.price}, ${d.save});`);
  });

  // Users
  const seedUsers = [
    { id: 1, name: "Admin Manager", phone: "01700000001", role: "Customer" as const, pin: "1234", balance: 500000 },
    { id: 2, name: "Arif Rahman", phone: "01811223344", role: "Customer" as const, pin: "2580", balance: 1550 },
    { id: 3, name: "Rahat Agency", phone: "01999887766", role: "Agent" as const, pin: "1122", balance: 85000 },
    { id: 4, name: "Sultans Dine", phone: "01612345678", role: "Merchant" as const, pin: "9900", balance: 12400 },
    { id: 5, name: "Tahmid Hasan", phone: "01555443322", role: "Customer" as const, pin: "5555", balance: 450 },
    { id: 6, name: "Anika Bushra", phone: "01333445566", role: "Customer" as const, pin: "4321", balance: 2800 },
  ];

  seedUsers.forEach((u) => {
    const user: User = {
      id: u.id,
      name: u.name,
      phone: u.phone,
      role: u.role,
      pin_hash: hashPIN(u.pin),
      status: "Active",
      created_at: new Date().toISOString(),
    };
    DB.users.push(user);
    logDB("SQL", `INSERT INTO users (id, name, phone, role, pin_hash, status) VALUES (${user.id}, '${user.name}', '${user.phone}', '${user.role}', '${user.pin_hash}', 'Active');`);

    const wallet: Wallet = {
      id: u.id,
      user_id: user.id,
      balance: u.balance,
      pending_balance: 0,
      currency: "BDT",
    };
    DB.wallets.push(wallet);
    logDB("SQL", `INSERT INTO wallets (id, user_id, balance, pending_balance, currency) VALUES (${wallet.id}, ${wallet.user_id}, ${wallet.balance}, 0.00, 'BDT');`);
  });

  // Historical Transactions
  const seedTxns = [
    { type: "Cash In" as const, sender: "01999887766", receiver: "01811223344", amount: 2000, fee: 0, status: "Success" as const },
    { type: "Send Money" as const, sender: "01811223344", receiver: "01555443322", amount: 450, fee: 5, status: "Success" as const },
    { type: "Mobile Recharge" as const, sender: "01811223344", receiver: "01811223344", amount: 50, fee: 0, status: "Success" as const },
    { type: "Cash Out" as const, sender: "01333445566", receiver: "01999887766", amount: 1000, fee: 15, status: "Success" as const },
    { type: "Cash Out" as const, sender: "01811223344", receiver: "01999887766", amount: 500, fee: 7.5, status: "Pending" as const },
  ];

  seedTxns.forEach((t, index) => {
    const txn: Transaction = {
      id: index + 1,
      type: t.type,
      sender_phone: t.sender,
      receiver_phone: t.receiver,
      amount: t.amount,
      fee: t.fee,
      txn_id: generateTxnId(),
      status: t.status,
      timestamp: new Date(Date.now() - (seedTxns.length - index) * 3600000).toISOString(),
    };
    DB.transactions.push(txn);
    logDB("SQL", `INSERT INTO transactions (type, sender_phone, receiver_phone, amount, fee, txn_id, status, timestamp) VALUES ('${txn.type}', '${txn.sender_phone}', '${txn.receiver_phone}', ${txn.amount}, ${txn.fee}, '${txn.txn_id}', '${txn.status}', '${txn.timestamp}');`);

    // Adjust pending balances for seeded pending cash-out
    if (t.status === "Pending" && t.type === "Cash Out") {
      const sender = DB.users.find((u) => u.phone === t.sender);
      if (sender) {
        const wallet = DB.wallets.find((w) => w.user_id === sender.id);
        if (wallet) {
          wallet.balance -= (t.amount + t.fee);
          wallet.pending_balance += (t.amount + t.fee);
        }
      }
    }
  });

  logDB("SYSTEM", "Database initialized and seeded successfully.");
}

// Initial seed
seedDatabase();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API logs endpoint
  app.get("/api/v1/logs", (req, res) => {
    res.json(DB.logs);
  });

  // DB State (for DB Explorer UI)
  app.get("/api/v1/db-state", (req, res) => {
    res.json({
      users: DB.users,
      wallets: DB.wallets,
      transactions: DB.transactions,
      drive_offers: DB.drive_offers,
      notices: DB.notices,
      settlement_config: DB.settlement_config,
      add_money_methods: DB.add_money_methods || { bkash: "01789456123", nagad: "01987654321", rocket: "01512345678" },
    });
  });

  // DB reset/seed endpoint
  app.post("/api/v1/admin/reset", (req, res) => {
    seedDatabase();
    res.json({ message: "Database re-seeded successfully." });
  });

  // USER AUTHENTICATION: REGISTER
  app.post("/api/v1/register", (req, res) => {
    let { name, phone, role, pin } = req.body;
    if (phone !== undefined && phone !== null) phone = String(phone);
    if (pin !== undefined && pin !== null) pin = String(pin);

    logDB("API", `POST /api/v1/register - Phone: ${phone}, Role: ${role}`);

    if (!name || !phone || !role || !pin) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (phone.length < 11) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    if (pin.length !== 4 || isNaN(Number(pin))) {
      return res.status(400).json({ error: "PIN must be a 4-digit number" });
    }

    // Check if user already exists
    logDB("SQL", `SELECT id FROM users WHERE phone = '${phone}' LIMIT 1;`);
    const existing = DB.users.find((u) => u.phone === phone);
    if (existing) {
      logDB("SYSTEM", `Registration failed: Phone ${phone} is already registered.`);
      return res.status(409).json({ error: "Phone number already registered" });
    }

    // Begin Transaction
    logDB("SQL", "BEGIN;");
    try {
      const newUserId = DB.users.length > 0 ? Math.max(...DB.users.map(u => u.id)) + 1 : 1;
      const user: User = {
        id: newUserId,
        name,
        phone,
        role: role as "Customer" | "Agent" | "Merchant",
        pin_hash: hashPIN(pin),
        status: "Active",
        created_at: new Date().toISOString(),
      };
      DB.users.push(user);
      logDB("SQL", `INSERT INTO users (id, name, phone, role, pin_hash) VALUES (${user.id}, '${user.name}', '${user.phone}', '${user.role}', '${user.pin_hash}');`);

      const wallet: Wallet = {
        id: newUserId,
        user_id: user.id,
        balance: 0, // initial balance is now 0 BDT as requested
        pending_balance: 0,
        currency: "BDT",
      };
      DB.wallets.push(wallet);
      logDB("SQL", `INSERT INTO wallets (user_id, balance) VALUES (${wallet.user_id}, ${wallet.balance});`);

      logDB("SQL", "COMMIT;");

      res.status(201).json({
        message: "Registration successful",
        user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
      });
    } catch (err: any) {
      logDB("SQL", "ROLLBACK;");
      res.status(500).json({ error: "Internal Database Error" });
    }
  });

  // AGENT SERVICE: REGISTER CUSTOMER OR MERCHANT
  app.post("/api/v1/agent/register-user", (req, res) => {
    let { agentPhone, agentPin, customerName, customerPhone, customerRole, customerPin } = req.body;
    if (agentPhone !== undefined && agentPhone !== null) agentPhone = String(agentPhone);
    if (agentPin !== undefined && agentPin !== null) agentPin = String(agentPin);
    if (customerPhone !== undefined && customerPhone !== null) customerPhone = String(customerPhone);
    if (customerPin !== undefined && customerPin !== null) customerPin = String(customerPin);

    logDB("API", `POST /api/v1/agent/register-user - Agent: ${agentPhone}, Target Phone: ${customerPhone}, Role: ${customerRole}`);

    if (!agentPhone || !agentPin || !customerName || !customerPhone || !customerRole || !customerPin) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (customerPhone.length < 11) {
      return res.status(400).json({ error: "Invalid customer phone number" });
    }

    if (customerPin.length !== 4 || isNaN(Number(customerPin))) {
      return res.status(400).json({ error: "Customer PIN must be a 4-digit number" });
    }

    // Verify Agent
    logDB("SQL", `SELECT * FROM users WHERE phone = '${agentPhone}' LIMIT 1;`);
    const agent = DB.users.find((u) => u.phone === agentPhone);
    if (!agent || agent.role !== "Agent" || agent.status !== "Active") {
      logDB("SYSTEM", `Agent registration authorization failed: Agent ${agentPhone} not found or inactive.`);
      return res.status(403).json({ error: "Invalid or inactive Agent account." });
    }

    // Verify Agent PIN
    if (agent.pin_hash !== hashPIN(agentPin)) {
      logDB("SYSTEM", `Agent registration authorization failed: Incorrect PIN for agent ${agentPhone}.`);
      return res.status(401).json({ error: "Incorrect Agent PIN" });
    }

    // Check if target customer already exists
    logDB("SQL", `SELECT id FROM users WHERE phone = '${customerPhone}' LIMIT 1;`);
    const existing = DB.users.find((u) => u.phone === customerPhone);
    if (existing) {
      logDB("SYSTEM", `Agent Registration failed: Target phone ${customerPhone} is already registered.`);
      return res.status(409).json({ error: "Phone number already registered" });
    }

    // Begin Transaction
    logDB("SQL", "BEGIN;");
    try {
      const newUserId = DB.users.length > 0 ? Math.max(...DB.users.map(u => u.id)) + 1 : 1;
      const user: User = {
        id: newUserId,
        name: customerName,
        phone: customerPhone,
        role: customerRole as "Customer" | "Merchant",
        pin_hash: hashPIN(customerPin),
        status: "Active",
        created_at: new Date().toISOString(),
      };
      DB.users.push(user);
      logDB("SQL", `INSERT INTO users (id, name, phone, role, pin_hash) VALUES (${user.id}, '${user.name}', '${user.phone}', '${user.role}', '${user.pin_hash}');`);

      const wallet: Wallet = {
        id: newUserId,
        user_id: user.id,
        balance: 0, // initial balance is now 0 BDT as requested
        pending_balance: 0,
        currency: "BDT",
      };
      DB.wallets.push(wallet);
      logDB("SQL", `INSERT INTO wallets (user_id, balance) VALUES (${wallet.user_id}, ${wallet.balance});`);

      // Log agent's action
      logDB("SYSTEM", `Agent ${agent.name} (${agentPhone}) successfully registered new ${customerRole}: ${customerName} (${customerPhone})`);
      logDB("SQL", "COMMIT;");

      res.status(201).json({
        message: "Account registered successfully by Agent",
        user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
      });
    } catch (err: any) {
      logDB("SQL", "ROLLBACK;");
      res.status(500).json({ error: "Internal Database Error during Agent-led registration." });
    }
  });

  // USER AUTHENTICATION: LOGIN
  app.post("/api/v1/login", (req, res) => {
    let { phone, pin } = req.body;
    if (phone !== undefined && phone !== null) phone = String(phone);
    if (pin !== undefined && pin !== null) pin = String(pin);

    logDB("API", `POST /api/v1/login - Phone: ${phone}`);

    if (!phone || !pin) {
      return res.status(400).json({ error: "Phone and PIN are required" });
    }

    logDB("SQL", `SELECT * FROM users WHERE phone = '${phone}' LIMIT 1;`);
    const user = DB.users.find((u) => u.phone === phone);

    if (!user) {
      logDB("SYSTEM", `Login failed: Phone ${phone} not found.`);
      return res.status(401).json({ error: "Invalid phone number or PIN" });
    }

    const inputPinHash = hashPIN(pin);
    if (user.pin_hash !== inputPinHash) {
      logDB("SYSTEM", `Login failed: Incorrect PIN for phone ${phone}.`);
      return res.status(401).json({ error: "Invalid phone number or PIN" });
    }

    logDB("SQL", `SELECT * FROM wallets WHERE user_id = ${user.id} LIMIT 1;`);
    const wallet = DB.wallets.find((w) => w.user_id === user.id);

    // Generate simulated JWT Token
    const mockToken = `jwt-token-header.${Buffer.from(JSON.stringify({ userId: user.id, phone: user.phone })).toString("base64")}.mocksignature`;

    logDB("SYSTEM", `User login successful: ${user.name} (${user.role})`);
    res.json({
      token: mockToken,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        balance: wallet ? wallet.balance : 0,
      },
    });
  });

  // ADMIN AUTHENTICATION: LOGIN
  app.post("/api/v1/admin/login", (req, res) => {
    const { username, password } = req.body;
    logDB("API", `POST /api/v1/admin/login - Username: ${username}`);

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const matchedAdmin = DB.admin_users.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password_hash === password
    );

    if (matchedAdmin || (username === "admin" && password === "password123")) {
      logDB("SYSTEM", `Admin authentication successful for: ${username}`);
      res.json({
        success: true,
        token: "mock-admin-jwt-token-xyz123",
        role: "Administrator",
      });
    } else {
      logDB("SYSTEM", `Admin login failed for username: ${username}`);
      res.status(401).json({ error: "Invalid admin credentials" });
    }
  });

  // ADMIN AUTHENTICATION: REGISTER
  app.post("/api/v1/admin/register", (req, res) => {
    const { username, password, serverKey } = req.body;
    logDB("API", `POST /api/v1/admin/register - Username: ${username}`);

    if (!username || !password || !serverKey) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (serverKey !== "ADMIN_KEY_2026") {
      logDB("SYSTEM", `Admin registration failed: Invalid server key ${serverKey}`);
      return res.status(403).json({ error: "Invalid Admin Server Key" });
    }

    const existing = DB.admin_users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existing) {
      logDB("SYSTEM", `Admin registration failed: Username ${username} already exists`);
      return res.status(409).json({ error: "Username already exists" });
    }

    DB.admin_users.push({
      username,
      password_hash: password
    });

    logDB("SYSTEM", `Admin registered successfully: ${username}`);
    res.status(201).json({ message: "Admin registered successfully!" });
  });

  // GET ALL TRANSACTIONS
  app.get("/api/v1/transactions", (req, res) => {
    const { phone } = req.query;
    if (phone) {
      logDB("SQL", `SELECT * FROM transactions WHERE sender_phone = '${phone}' OR receiver_phone = '${phone}' ORDER BY timestamp DESC;`);
      const filtered = DB.transactions
        .filter((t) => t.sender_phone === phone || t.receiver_phone === phone)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return res.json(filtered);
    }

    logDB("SQL", "SELECT * FROM transactions ORDER BY timestamp DESC;");
    res.json([...DB.transactions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  });

  // GET ALL USERS (Admin / API inspection)
  app.get("/api/v1/users", (req, res) => {
    logDB("SQL", "SELECT users.*, wallets.balance FROM users JOIN wallets ON users.id = wallets.user_id;");
    const detailedUsers = DB.users.map((u) => {
      const wallet = DB.wallets.find((w) => w.user_id === u.id);
      return {
        ...u,
        balance: wallet ? wallet.balance : 0,
        pending_balance: wallet ? wallet.pending_balance : 0,
      };
    });
    res.json(detailedUsers);
  });

  // TRANSACTION ENGINE: SEND MONEY (Customer to Customer)
  app.post("/api/v1/send-money", (req, res) => {
    const { senderPhone, receiverPhone, amount, pin } = req.body;
    logDB("API", `POST /api/v1/send-money - Sender: ${senderPhone}, Receiver: ${receiverPhone}, Amount: ${amount}`);

    const transferAmount = Number(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount value" });
    }

    const fee = transferAmount >= 500 ? 5 : 0; // RB Bank standard Send Money fee: 5 BDT above 500, otherwise free
    const totalDeduction = transferAmount + fee;

    // 1. START DATABASE TRANSACTION (Enterprise Safety against race conditions)
    logDB("SQL", "BEGIN TRANSACTION;");

    try {
      // 2. Fetch & Lock Sender User
      logDB("SQL", `SELECT * FROM users WHERE phone = '${senderPhone}' LIMIT 1 FOR UPDATE;`);
      const sender = DB.users.find((u) => u.phone === senderPhone);
      if (!sender) {
        logDB("SQL", "ROLLBACK;");
        logDB("SYSTEM", `Transaction rolled back: Sender ${senderPhone} not found.`);
        return res.status(404).json({ error: "Sender account not found" });
      }

      // Check PIN
      if (sender.pin_hash !== hashPIN(pin)) {
        logDB("SQL", "ROLLBACK;");
        logDB("SYSTEM", "Transaction rolled back: Incorrect security PIN entered.");
        return res.status(401).json({ error: "Incorrect security PIN" });
      }

      // Fetch & Lock Receiver User
      logDB("SQL", `SELECT * FROM users WHERE phone = '${receiverPhone}' LIMIT 1 FOR UPDATE;`);
      const receiver = DB.users.find((u) => u.phone === receiverPhone);
      if (!receiver) {
        logDB("SQL", "ROLLBACK;");
        logDB("SYSTEM", `Transaction rolled back: Receiver ${receiverPhone} not found.`);
        return res.status(404).json({ error: "Receiver phone number not registered on RB Bank" });
      }

      if (senderPhone === receiverPhone) {
        logDB("SQL", "ROLLBACK;");
        logDB("SYSTEM", "Transaction rolled back: Cannot transfer to self.");
        return res.status(400).json({ error: "Cannot send money to your own number" });
      }

      if (receiver.role !== "Customer") {
        logDB("SQL", "ROLLBACK;");
        logDB("SYSTEM", `Transaction rolled back: Receiver ${receiverPhone} is an agent/merchant. Use Cash-Out or Pay Bill instead.`);
        return res.status(400).json({ error: "Send Money is only allowed to other Customer accounts" });
      }

      // 3. Fetch Sender Wallet
      logDB("SQL", `SELECT * FROM wallets WHERE user_id = ${sender.id} FOR UPDATE;`);
      const senderWallet = DB.wallets.find((w) => w.user_id === sender.id);
      if (!senderWallet || senderWallet.balance < totalDeduction) {
        logDB("SQL", "ROLLBACK;");
        logDB("SYSTEM", `Transaction rolled back: Sender balance BDT ${senderWallet?.balance} is insufficient for deduction of BDT ${totalDeduction}.`);
        return res.status(400).json({ error: "Insufficient balance for this transaction" });
      }

      // 4. Fetch Receiver Wallet
      logDB("SQL", `SELECT * FROM wallets WHERE user_id = ${receiver.id} FOR UPDATE;`);
      const receiverWallet = DB.wallets.find((w) => w.user_id === receiver.id);
      if (!receiverWallet) {
        logDB("SQL", "ROLLBACK;");
        return res.status(500).json({ error: "Receiver wallet not found" });
      }

      // 5. Update Balances
      senderWallet.balance -= totalDeduction;
      receiverWallet.balance += transferAmount;

      logDB("SQL", `UPDATE wallets SET balance = balance - ${totalDeduction} WHERE id = ${senderWallet.id};`);
      logDB("SQL", `UPDATE wallets SET balance = balance + ${transferAmount} WHERE id = ${receiverWallet.id};`);

      // 6. Record Transaction
      const txnId = generateTxnId();
      const newTxnId = DB.transactions.length + 1;
      const transaction: Transaction = {
        id: newTxnId,
        type: "Send Money",
        sender_phone: senderPhone,
        receiver_phone: receiverPhone,
        amount: transferAmount,
        fee: fee,
        txn_id: txnId,
        status: "Success",
        timestamp: new Date().toISOString(),
      };
      DB.transactions.push(transaction);

      logDB("SQL", `INSERT INTO transactions (id, type, sender_phone, receiver_phone, amount, fee, txn_id, status) VALUES (${transaction.id}, 'Send Money', '${senderPhone}', '${receiverPhone}', ${transferAmount}, ${fee}, '${txnId}', 'Success');`);

      // 7. COMMIT Transaction
      logDB("SQL", "COMMIT;");
      logDB("SYSTEM", `SUCCESS: BDT ${transferAmount} transferred from ${senderPhone} to ${receiverPhone}. TxnID: ${txnId}`);

      res.status(200).json({
        message: "Transfer successful",
        transaction,
        sender_balance: senderWallet.balance,
      });
    } catch (err) {
      logDB("SQL", "ROLLBACK;");
      logDB("SYSTEM", "Transaction rolled back due to query crash.");
      res.status(500).json({ error: "Database exception occurred during transaction." });
    }
  });

  // TRANSACTION ENGINE: CASH OUT (Customer to Agent)
  app.post("/api/v1/cash-out", (req, res) => {
    const { senderPhone, receiverPhone, amount, pin } = req.body;
    logDB("API", `POST /api/v1/cash-out - Customer: ${senderPhone}, Agent: ${receiverPhone}, Amount: ${amount}`);

    const transferAmount = Number(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount value" });
    }

    // RB Bank Cash-out charge: 1.5% (or 15 BDT per 1000)
    const fee = transferAmount * 0.015;
    const totalDeduction = transferAmount + fee;

    logDB("SQL", "BEGIN TRANSACTION;");

    try {
      logDB("SQL", `SELECT * FROM users WHERE phone = '${senderPhone}' LIMIT 1 FOR UPDATE;`);
      const sender = DB.users.find((u) => u.phone === senderPhone);
      if (!sender || sender.pin_hash !== hashPIN(pin)) {
        logDB("SQL", "ROLLBACK;");
        return res.status(401).json({ error: "Invalid sender phone number or security PIN" });
      }

      logDB("SQL", `SELECT * FROM users WHERE phone = '${receiverPhone}' AND role = 'Agent' LIMIT 1 FOR UPDATE;`);
      const agent = DB.users.find((u) => u.phone === receiverPhone && u.role === "Agent");
      if (!agent) {
        logDB("SQL", "ROLLBACK;");
        logDB("SYSTEM", `Transaction rolled back: Agent ${receiverPhone} not found.`);
        return res.status(404).json({ error: "Agent phone number not registered" });
      }

      logDB("SQL", `SELECT * FROM wallets WHERE user_id = ${sender.id} FOR UPDATE;`);
      const senderWallet = DB.wallets.find((w) => w.user_id === sender.id);
      if (!senderWallet || senderWallet.balance < totalDeduction) {
        logDB("SQL", "ROLLBACK;");
        logDB("SYSTEM", `Insufficient balance for Cash Out: Balance BDT ${senderWallet?.balance} < Deductible BDT ${totalDeduction}`);
        return res.status(400).json({ error: "Insufficient balance for cash out" });
      }

      // Freeze balance in sender's pending wallet
      senderWallet.balance -= totalDeduction;
      senderWallet.pending_balance += totalDeduction;

      logDB("SQL", `UPDATE wallets SET balance = balance - ${totalDeduction}, pending_balance = pending_balance + ${totalDeduction} WHERE id = ${senderWallet.id};`);

      const txnId = generateTxnId();
      const transaction: Transaction = {
        id: DB.transactions.length + 1,
        type: "Cash Out",
        sender_phone: senderPhone,
        receiver_phone: receiverPhone,
        amount: transferAmount,
        fee: fee,
        txn_id: txnId,
        status: "Pending",
        timestamp: new Date().toISOString(),
      };
      DB.transactions.push(transaction);

      logDB("SQL", `INSERT INTO transactions (id, type, sender_phone, receiver_phone, amount, fee, txn_id, status) VALUES (${transaction.id}, 'Cash Out', '${senderPhone}', '${receiverPhone}', ${transferAmount}, ${fee}, '${txnId}', 'Pending');`);

      logDB("SQL", "COMMIT;");
      logDB("SYSTEM", `PENDING: Cash-Out of BDT ${transferAmount} requested by Customer ${senderPhone} at Agent ${receiverPhone}. Pending Admin Approval. TxnID: ${txnId}`);

      res.status(200).json({
        message: "Cash out request placed successfully! Pending admin approval.",
        transaction,
        sender_balance: senderWallet.balance,
      });
    } catch (err) {
      logDB("SQL", "ROLLBACK;");
      res.status(500).json({ error: "Database exception during cash-out." });
    }
  });

  // TRANSACTION ENGINE: CASH IN (Agent to Customer)
  app.post("/api/v1/cash-in", (req, res) => {
    const { senderPhone, receiverPhone, amount, pin } = req.body;
    logDB("API", `POST /api/v1/cash-in - Agent: ${senderPhone}, Customer: ${receiverPhone}, Amount: ${amount}`);

    const transferAmount = Number(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount value" });
    }

    logDB("SQL", "BEGIN TRANSACTION;");

    try {
      logDB("SQL", `SELECT * FROM users WHERE phone = '${senderPhone}' AND role = 'Agent' LIMIT 1 FOR UPDATE;`);
      const agent = DB.users.find((u) => u.phone === senderPhone && u.role === "Agent");
      if (!agent || agent.pin_hash !== hashPIN(pin)) {
        logDB("SQL", "ROLLBACK;");
        return res.status(401).json({ error: "Invalid agent phone number or PIN" });
      }

      logDB("SQL", `SELECT * FROM users WHERE phone = '${receiverPhone}' AND role = 'Customer' LIMIT 1 FOR UPDATE;`);
      const customer = DB.users.find((u) => u.phone === receiverPhone && u.role === "Customer");
      if (!customer) {
        logDB("SQL", "ROLLBACK;");
        return res.status(404).json({ error: "Customer phone number not registered" });
      }

      logDB("SQL", `SELECT * FROM wallets WHERE user_id = ${agent.id} FOR UPDATE;`);
      const agentWallet = DB.wallets.find((w) => w.user_id === agent.id);
      if (!agentWallet || agentWallet.balance < transferAmount) {
        logDB("SQL", "ROLLBACK;");
        logDB("SYSTEM", `Insufficient balance for Cash In: Agent Balance BDT ${agentWallet?.balance} < Cash-In BDT ${transferAmount}`);
        return res.status(400).json({ error: "Insufficient Agent Float balance" });
      }

      logDB("SQL", `SELECT * FROM wallets WHERE user_id = ${customer.id} FOR UPDATE;`);
      const customerWallet = DB.wallets.find((w) => w.user_id === customer.id);
      if (!customerWallet) {
        logDB("SQL", "ROLLBACK;");
        return res.status(500).json({ error: "Customer wallet not found" });
      }

      agentWallet.balance -= transferAmount;
      customerWallet.balance += transferAmount;

      logDB("SQL", `UPDATE wallets SET balance = balance - ${transferAmount} WHERE id = ${agentWallet.id};`);
      logDB("SQL", `UPDATE wallets SET balance = balance + ${transferAmount} WHERE id = ${customerWallet.id};`);

      const txnId = generateTxnId();
      const transaction: Transaction = {
        id: DB.transactions.length + 1,
        type: "Cash In",
        sender_phone: senderPhone,
        receiver_phone: receiverPhone,
        amount: transferAmount,
        fee: 0,
        txn_id: txnId,
        status: "Success",
        timestamp: new Date().toISOString(),
      };
      DB.transactions.push(transaction);

      logDB("SQL", `INSERT INTO transactions (id, type, sender_phone, receiver_phone, amount, fee, txn_id, status) VALUES (${transaction.id}, 'Cash In', '${senderPhone}', '${receiverPhone}', ${transferAmount}, 0.00, '${txnId}', 'Success');`);

      logDB("SQL", "COMMIT;");
      logDB("SYSTEM", `SUCCESS: BDT ${transferAmount} Cash-In processed for Customer ${receiverPhone} by Agent ${senderPhone}. TxnID: ${txnId}`);

      res.status(200).json({
        message: "Cash-In transaction successful",
        transaction,
        agent_balance: agentWallet.balance,
      });
    } catch (err) {
      logDB("SQL", "ROLLBACK;");
      res.status(500).json({ error: "Database exception during cash-in." });
    }
  });

  // TRANSACTION ENGINE: MOBILE RECHARGE (Customer to Self/Other Prepaid Provider)
  app.post("/api/v1/recharge", (req, res) => {
    const { senderPhone, receiverPhone, operator, amount, pin } = req.body;
    logDB("API", `POST /api/v1/recharge - Customer: ${senderPhone}, Target: ${receiverPhone} (${operator}), Amount: ${amount}`);

    const rechargeAmount = Number(amount);
    if (isNaN(rechargeAmount) || rechargeAmount <= 0) {
      return res.status(400).json({ error: "Invalid recharge amount" });
    }

    logDB("SQL", "BEGIN TRANSACTION;");

    try {
      logDB("SQL", `SELECT * FROM users WHERE phone = '${senderPhone}' LIMIT 1 FOR UPDATE;`);
      const sender = DB.users.find((u) => u.phone === senderPhone);
      if (!sender || sender.pin_hash !== hashPIN(pin)) {
        logDB("SQL", "ROLLBACK;");
        return res.status(401).json({ error: "Invalid PIN" });
      }

      logDB("SQL", `SELECT * FROM wallets WHERE user_id = ${sender.id} FOR UPDATE;`);
      const wallet = DB.wallets.find((w) => w.user_id === sender.id);
      if (!wallet || wallet.balance < rechargeAmount) {
        logDB("SQL", "ROLLBACK;");
        return res.status(400).json({ error: "Insufficient balance for Recharge" });
      }

      wallet.balance -= rechargeAmount;
      logDB("SQL", `UPDATE wallets SET balance = balance - ${rechargeAmount} WHERE id = ${wallet.id};`);

      const txnId = generateTxnId();
      const transaction: Transaction = {
        id: DB.transactions.length + 1,
        type: "Mobile Recharge",
        sender_phone: senderPhone,
        receiver_phone: `${receiverPhone} (${operator})`,
        amount: rechargeAmount,
        fee: 0,
        txn_id: txnId,
        status: "Success",
        timestamp: new Date().toISOString(),
      };
      DB.transactions.push(transaction);

      logDB("SQL", `INSERT INTO transactions (id, type, sender_phone, receiver_phone, amount, fee, txn_id, status) VALUES (${transaction.id}, 'Mobile Recharge', '${senderPhone}', '${receiverPhone} (${operator})', ${rechargeAmount}, 0.00, '${txnId}', 'Success');`);

      logDB("SQL", "COMMIT;");
      logDB("SYSTEM", `SUCCESS: Mobile Recharge of BDT ${rechargeAmount} on ${receiverPhone} (${operator}) by Customer ${senderPhone}. TxnID: ${txnId}`);

      res.status(200).json({
        message: "Mobile Recharge processed successfully",
        transaction,
        sender_balance: wallet.balance,
      });
    } catch (err) {
      logDB("SQL", "ROLLBACK;");
      res.status(500).json({ error: "Database exception during mobile recharge." });
    }
  });

  // TRANSACTION ENGINE: DRIVE OFFER RECHARGE (Customer to operator package)
  app.post("/api/v1/drive-offer", (req, res) => {
    const { senderPhone, receiverPhone, offerName, amount, pin } = req.body;
    logDB("API", `POST /api/v1/drive-offer - Customer: ${senderPhone}, Target: ${receiverPhone}, Offer: ${offerName}, Amount: ${amount}`);

    const packAmount = Number(amount);
    if (isNaN(packAmount) || packAmount <= 0) {
      return res.status(400).json({ error: "Invalid package amount" });
    }

    logDB("SQL", "BEGIN TRANSACTION;");

    try {
      logDB("SQL", `SELECT * FROM users WHERE phone = '${senderPhone}' LIMIT 1 FOR UPDATE;`);
      const sender = DB.users.find((u) => u.phone === senderPhone);
      if (!sender || sender.pin_hash !== hashPIN(pin)) {
        logDB("SQL", "ROLLBACK;");
        return res.status(401).json({ error: "Invalid PIN" });
      }

      logDB("SQL", `SELECT * FROM wallets WHERE user_id = ${sender.id} FOR UPDATE;`);
      const wallet = DB.wallets.find((w) => w.user_id === sender.id);
      if (!wallet || wallet.balance < packAmount) {
        logDB("SQL", "ROLLBACK;");
        return res.status(400).json({ error: "Insufficient balance for this Drive Offer" });
      }

      wallet.balance -= packAmount;
      wallet.pending_balance += packAmount;
      logDB("SQL", `UPDATE wallets SET balance = balance - ${packAmount}, pending_balance = pending_balance + ${packAmount} WHERE id = ${wallet.id};`);

      const txnId = generateTxnId();
      const transaction: Transaction = {
        id: DB.transactions.length + 1,
        type: "Drive Offer",
        sender_phone: senderPhone,
        receiver_phone: `${receiverPhone} (${offerName})`,
        amount: packAmount,
        fee: 0,
        txn_id: txnId,
        status: "Pending",
        timestamp: new Date().toISOString(),
      };
      DB.transactions.push(transaction);

      logDB("SQL", `INSERT INTO transactions (id, type, sender_phone, receiver_phone, amount, fee, txn_id, status) VALUES (${transaction.id}, 'Drive Offer', '${senderPhone}', '${receiverPhone} (${offerName})', ${packAmount}, 0.00, '${txnId}', 'Pending');`);

      logDB("SQL", "COMMIT;");
      logDB("SYSTEM", `PENDING: Drive Offer Recharge [${offerName}] of BDT ${packAmount} placed for ${receiverPhone} by Customer ${senderPhone}. TxnID: ${txnId}`);

      res.status(200).json({
        message: "Drive Offer Recharge order placed! Pending admin approval.",
        transaction,
        sender_balance: wallet.balance,
      });
    } catch (err) {
      logDB("SQL", "ROLLBACK;");
      res.status(500).json({ error: "Database exception during Drive Offer recharge." });
    }
  });

  // TRANSACTION ENGINE: PAY BILL (Customer to Utility Provider)
  app.post("/api/v1/pay-bill", (req, res) => {
    const { senderPhone, billerId, billerName, amount, pin } = req.body;
    logDB("API", `POST /api/v1/pay-bill - Customer: ${senderPhone}, Bill: ${billerName} A/C: ${billerId}, Amount: ${amount}`);

    const billAmount = Number(amount);
    if (isNaN(billAmount) || billAmount <= 0) {
      return res.status(400).json({ error: "Invalid bill amount" });
    }

    logDB("SQL", "BEGIN TRANSACTION;");

    try {
      logDB("SQL", `SELECT * FROM users WHERE phone = '${senderPhone}' LIMIT 1 FOR UPDATE;`);
      const sender = DB.users.find((u) => u.phone === senderPhone);
      if (!sender || sender.pin_hash !== hashPIN(pin)) {
        logDB("SQL", "ROLLBACK;");
        return res.status(401).json({ error: "Invalid PIN" });
      }

      logDB("SQL", `SELECT * FROM wallets WHERE user_id = ${sender.id} FOR UPDATE;`);
      const wallet = DB.wallets.find((w) => w.user_id === sender.id);
      if (!wallet || wallet.balance < billAmount) {
        logDB("SQL", "ROLLBACK;");
        return res.status(400).json({ error: "Insufficient balance to pay this Utility Bill" });
      }

      wallet.balance -= billAmount;
      logDB("SQL", `UPDATE wallets SET balance = balance - ${billAmount} WHERE id = ${wallet.id};`);

      const txnId = generateTxnId();
      const transaction: Transaction = {
        id: DB.transactions.length + 1,
        type: "Pay Bill",
        sender_phone: senderPhone,
        receiver_phone: `${billerName} (A/C: ${billerId})`,
        amount: billAmount,
        fee: 0,
        txn_id: txnId,
        status: "Success",
        timestamp: new Date().toISOString(),
      };
      DB.transactions.push(transaction);

      logDB("SQL", `INSERT INTO transactions (id, type, sender_phone, receiver_phone, amount, fee, txn_id, status) VALUES (${transaction.id}, 'Pay Bill', '${senderPhone}', '${billerName} (A/C: ${billerId})', ${billAmount}, 0.00, '${txnId}', 'Success');`);

      logDB("SQL", "COMMIT;");
      logDB("SYSTEM", `SUCCESS: Paid BDT ${billAmount} Utility Bill [${billerName}] A/C: ${billerId} by Customer ${senderPhone}. TxnID: ${txnId}`);

      res.status(200).json({
        message: "Utility Bill payment processed successfully!",
        transaction,
        sender_balance: wallet.balance,
      });
    } catch (err) {
      logDB("SQL", "ROLLBACK;");
      res.status(500).json({ error: "Database exception during Pay Bill transaction." });
    }
  });

  // TRANSACTION ENGINE: MERCHANT PAYMENT (Customer to Merchant)
  app.post("/api/v1/merchant-payment", (req, res) => {
    const { senderPhone, receiverPhone, amount, pin } = req.body;
    logDB("API", `POST /api/v1/merchant-payment - Customer: ${senderPhone}, Merchant: ${receiverPhone}, Amount: ${amount}`);

    const transferAmount = Number(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount value" });
    }

    const fee = 0; // Usually free for customer in RB Bank merchant payment
    const totalDeduction = transferAmount;

    logDB("SQL", "BEGIN TRANSACTION;");

    try {
      logDB("SQL", `SELECT * FROM users WHERE phone = '${senderPhone}' LIMIT 1 FOR UPDATE;`);
      const sender = DB.users.find((u) => u.phone === senderPhone);
      if (!sender) {
        logDB("SQL", "ROLLBACK;");
        logDB("SYSTEM", `Transaction rolled back: Sender ${senderPhone} not found.`);
        return res.status(404).json({ error: "Sender account not found" });
      }

      // Check PIN
      if (sender.pin_hash !== hashPIN(pin)) {
        logDB("SQL", "ROLLBACK;");
        logDB("SYSTEM", "Transaction rolled back: Incorrect security PIN entered.");
        return res.status(401).json({ error: "Incorrect security PIN" });
      }

      logDB("SQL", `SELECT * FROM users WHERE phone = '${receiverPhone}' AND role = 'Merchant' LIMIT 1 FOR UPDATE;`);
      const merchant = DB.users.find((u) => u.phone === receiverPhone && u.role === "Merchant");
      if (!merchant) {
        logDB("SQL", "ROLLBACK;");
        logDB("SYSTEM", `Transaction rolled back: Merchant ${receiverPhone} not found or is not a Merchant account.`);
        return res.status(404).json({ error: "Merchant receiver phone number not registered on RB Bank" });
      }

      logDB("SQL", `SELECT * FROM wallets WHERE user_id = ${sender.id} FOR UPDATE;`);
      const senderWallet = DB.wallets.find((w) => w.user_id === sender.id);
      if (!senderWallet || senderWallet.balance < totalDeduction) {
        logDB("SQL", "ROLLBACK;");
        logDB("SYSTEM", `Transaction rolled back: Sender balance BDT ${senderWallet?.balance} is insufficient for deduction of BDT ${totalDeduction}.`);
        return res.status(400).json({ error: "Insufficient balance for this transaction" });
      }

      logDB("SQL", `SELECT * FROM wallets WHERE user_id = ${merchant.id} FOR UPDATE;`);
      const merchantWallet = DB.wallets.find((w) => w.user_id === merchant.id);
      if (!merchantWallet) {
        logDB("SQL", "ROLLBACK;");
        return res.status(500).json({ error: "Merchant wallet not found" });
      }

      // Update balances
      senderWallet.balance -= totalDeduction;
      merchantWallet.balance += transferAmount;

      logDB("SQL", `UPDATE wallets SET balance = balance - ${totalDeduction} WHERE id = ${senderWallet.id};`);
      logDB("SQL", `UPDATE wallets SET balance = balance + ${transferAmount} WHERE id = ${merchantWallet.id};`);

      const txnId = generateTxnId();
      const transaction: Transaction = {
        id: DB.transactions.length + 1,
        type: "Merchant Payment",
        sender_phone: senderPhone,
        receiver_phone: receiverPhone,
        amount: transferAmount,
        fee: fee,
        txn_id: txnId,
        status: "Success",
        timestamp: new Date().toISOString(),
      };
      DB.transactions.push(transaction);

      logDB("SQL", `INSERT INTO transactions (id, type, sender_phone, receiver_phone, amount, fee, txn_id, status) VALUES (${transaction.id}, 'Merchant Payment', '${senderPhone}', '${receiverPhone}', ${transferAmount}, 0.00, '${txnId}', 'Success');`);

      logDB("SQL", "COMMIT;");
      logDB("SYSTEM", `SUCCESS: BDT ${transferAmount} Merchant Payment processed from Customer ${senderPhone} to Merchant ${receiverPhone}. TxnID: ${txnId}`);

      res.status(200).json({
        message: "Merchant Payment successful",
        transaction,
        sender_balance: senderWallet.balance,
      });
    } catch (err) {
      logDB("SQL", "ROLLBACK;");
      res.status(500).json({ error: "Database exception during merchant payment." });
    }
  });

  // ADMIN ENDPOINT: APPROVE PENDING CASH-OUT
  app.post("/api/v1/admin/cashout/approve", (req, res) => {
    const { transactionId } = req.body;
    logDB("API", `POST /api/v1/admin/cashout/approve - TxnID: ${transactionId}`);

    logDB("SQL", "BEGIN TRANSACTION;");

    try {
      logDB("SQL", `SELECT * FROM transactions WHERE txn_id = '${transactionId}' LIMIT 1 FOR UPDATE;`);
      const txn = DB.transactions.find((t) => t.txn_id === transactionId);
      if (!txn) {
        logDB("SQL", "ROLLBACK;");
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (txn.status !== "Pending" || txn.type !== "Cash Out") {
        logDB("SQL", "ROLLBACK;");
        return res.status(400).json({ error: "Transaction is not pending or is not a Cash Out request" });
      }

      // Fetch Customer (Sender)
      logDB("SQL", `SELECT * FROM users WHERE phone = '${txn.sender_phone}' FOR UPDATE;`);
      const sender = DB.users.find((u) => u.phone === txn.sender_phone);

      // Fetch Agent (Receiver)
      logDB("SQL", `SELECT * FROM users WHERE phone = '${txn.receiver_phone}' FOR UPDATE;`);
      const agent = DB.users.find((u) => u.phone === txn.receiver_phone);

      if (!sender || !agent) {
        logDB("SQL", "ROLLBACK;");
        return res.status(404).json({ error: "Sender or Agent account missing" });
      }

      // Fetch Wallets
      const senderWallet = DB.wallets.find((w) => w.user_id === sender.id);
      const agentWallet = DB.wallets.find((w) => w.user_id === agent.id);

      if (!senderWallet || !agentWallet) {
        logDB("SQL", "ROLLBACK;");
        return res.status(500).json({ error: "Wallets not found" });
      }

      const totalDeduction = txn.amount + txn.fee;

      // Move from pending_balance to success
      senderWallet.pending_balance -= totalDeduction;
      agentWallet.balance += txn.amount; // Agent gets the cash amount, admin gets the fee or company share

      logDB("SQL", `UPDATE wallets SET pending_balance = pending_balance - ${totalDeduction} WHERE id = ${senderWallet.id};`);
      logDB("SQL", `UPDATE wallets SET balance = balance + ${txn.amount} WHERE id = ${agentWallet.id};`);

      txn.status = "Success";
      logDB("SQL", `UPDATE transactions SET status = 'Success' WHERE txn_id = '${transactionId}';`);

      logDB("SQL", "COMMIT;");
      logDB("SYSTEM", `APPROVED: Cash-Out of BDT ${txn.amount} from Customer ${txn.sender_phone} to Agent ${txn.receiver_phone} is successful. TxnID: ${transactionId}`);

      res.json({ message: "Transaction approved successfully", transaction: txn });
    } catch (err) {
      logDB("SQL", "ROLLBACK;");
      res.status(500).json({ error: "Database exception during transaction approval." });
    }
  });

  // ADMIN ENDPOINT: REJECT PENDING CASH-OUT
  app.post("/api/v1/admin/cashout/reject", (req, res) => {
    const { transactionId } = req.body;
    logDB("API", `POST /api/v1/admin/cashout/reject - TxnID: ${transactionId}`);

    logDB("SQL", "BEGIN TRANSACTION;");

    try {
      logDB("SQL", `SELECT * FROM transactions WHERE txn_id = '${transactionId}' LIMIT 1 FOR UPDATE;`);
      const txn = DB.transactions.find((t) => t.txn_id === transactionId);
      if (!txn) {
        logDB("SQL", "ROLLBACK;");
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (txn.status !== "Pending" || txn.type !== "Cash Out") {
        logDB("SQL", "ROLLBACK;");
        return res.status(400).json({ error: "Transaction is not pending or is not a Cash Out request" });
      }

      // Fetch Customer (Sender)
      logDB("SQL", `SELECT * FROM users WHERE phone = '${txn.sender_phone}' FOR UPDATE;`);
      const sender = DB.users.find((u) => u.phone === txn.sender_phone);

      if (!sender) {
        logDB("SQL", "ROLLBACK;");
        return res.status(404).json({ error: "Sender account missing" });
      }

      const senderWallet = DB.wallets.find((w) => w.user_id === sender.id);
      if (!senderWallet) {
        logDB("SQL", "ROLLBACK;");
        return res.status(500).json({ error: "Wallet not found" });
      }

      const totalDeduction = txn.amount + txn.fee;

      // Revert deducted amount from pending_balance back to balance
      senderWallet.balance += totalDeduction;
      senderWallet.pending_balance -= totalDeduction;

      logDB("SQL", `UPDATE wallets SET balance = balance + ${totalDeduction}, pending_balance = pending_balance - ${totalDeduction} WHERE id = ${senderWallet.id};`);

      txn.status = "Rejected";
      logDB("SQL", `UPDATE transactions SET status = 'Rejected' WHERE txn_id = '${transactionId}';`);

      logDB("SQL", "COMMIT;");
      logDB("SYSTEM", `REJECTED: Cash-Out of BDT ${txn.amount} from Customer ${txn.sender_phone} has been rejected. Funds BDT ${totalDeduction} returned. TxnID: ${transactionId}`);

      res.json({ message: "Transaction rejected successfully, funds returned.", transaction: txn });
    } catch (err) {
      logDB("SQL", "ROLLBACK;");
      res.status(500).json({ error: "Database exception during transaction rejection." });
    }
  });

  // ADMIN ENDPOINT: APPROVE PENDING DRIVE OFFER
  app.post("/api/v1/admin/drive-offer/approve", (req, res) => {
    const { transactionId } = req.body;
    logDB("API", `POST /api/v1/admin/drive-offer/approve - TxnID: ${transactionId}`);

    logDB("SQL", "BEGIN TRANSACTION;");

    try {
      logDB("SQL", `SELECT * FROM transactions WHERE txn_id = '${transactionId}' LIMIT 1 FOR UPDATE;`);
      const txn = DB.transactions.find((t) => t.txn_id === transactionId);
      if (!txn) {
        logDB("SQL", "ROLLBACK;");
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (txn.status !== "Pending" || txn.type !== "Drive Offer") {
        logDB("SQL", "ROLLBACK;");
        return res.status(400).json({ error: "Transaction is not pending or is not a Drive Offer purchase" });
      }

      // Fetch Customer (Sender)
      logDB("SQL", `SELECT * FROM users WHERE phone = '${txn.sender_phone}' FOR UPDATE;`);
      const sender = DB.users.find((u) => u.phone === txn.sender_phone);

      if (!sender) {
        logDB("SQL", "ROLLBACK;");
        return res.status(404).json({ error: "Sender account missing" });
      }

      const senderWallet = DB.wallets.find((w) => w.user_id === sender.id);
      if (!senderWallet) {
        logDB("SQL", "ROLLBACK;");
        return res.status(500).json({ error: "Wallet not found" });
      }

      // Deduct from pending_balance
      senderWallet.pending_balance -= txn.amount;
      logDB("SQL", `UPDATE wallets SET pending_balance = pending_balance - ${txn.amount} WHERE id = ${senderWallet.id};`);

      txn.status = "Success";
      logDB("SQL", `UPDATE transactions SET status = 'Success' WHERE txn_id = '${transactionId}';`);

      logDB("SQL", "COMMIT;");
      logDB("SYSTEM", `APPROVED: Drive Offer of BDT ${txn.amount} for Customer ${txn.sender_phone} is successful. TxnID: ${transactionId}`);

      res.json({ message: "Drive Offer approved successfully", transaction: txn });
    } catch (err) {
      logDB("SQL", "ROLLBACK;");
      res.status(500).json({ error: "Database exception during Drive Offer approval." });
    }
  });

  // ADMIN ENDPOINT: REJECT PENDING DRIVE OFFER
  app.post("/api/v1/admin/drive-offer/reject", (req, res) => {
    const { transactionId } = req.body;
    logDB("API", `POST /api/v1/admin/drive-offer/reject - TxnID: ${transactionId}`);

    logDB("SQL", "BEGIN TRANSACTION;");

    try {
      logDB("SQL", `SELECT * FROM transactions WHERE txn_id = '${transactionId}' LIMIT 1 FOR UPDATE;`);
      const txn = DB.transactions.find((t) => t.txn_id === transactionId);
      if (!txn) {
        logDB("SQL", "ROLLBACK;");
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (txn.status !== "Pending" || txn.type !== "Drive Offer") {
        logDB("SQL", "ROLLBACK;");
        return res.status(400).json({ error: "Transaction is not pending or is not a Drive Offer purchase" });
      }

      // Fetch Customer (Sender)
      logDB("SQL", `SELECT * FROM users WHERE phone = '${txn.sender_phone}' FOR UPDATE;`);
      const sender = DB.users.find((u) => u.phone === txn.sender_phone);

      if (!sender) {
        logDB("SQL", "ROLLBACK;");
        return res.status(404).json({ error: "Sender account missing" });
      }

      const senderWallet = DB.wallets.find((w) => w.user_id === sender.id);
      if (!senderWallet) {
        logDB("SQL", "ROLLBACK;");
        return res.status(500).json({ error: "Wallet not found" });
      }

      // Revert amount back to balance
      senderWallet.balance += txn.amount;
      senderWallet.pending_balance -= txn.amount;
      logDB("SQL", `UPDATE wallets SET balance = balance + ${txn.amount}, pending_balance = pending_balance - ${txn.amount} WHERE id = ${senderWallet.id};`);

      txn.status = "Rejected";
      logDB("SQL", `UPDATE transactions SET status = 'Rejected' WHERE txn_id = '${transactionId}';`);

      logDB("SQL", "COMMIT;");
      logDB("SYSTEM", `REJECTED: Drive Offer of BDT ${txn.amount} for Customer ${txn.sender_phone} has been rejected. Funds returned. TxnID: ${transactionId}`);

      res.json({ message: "Drive Offer purchase rejected successfully, funds returned.", transaction: txn });
    } catch (err) {
      logDB("SQL", "ROLLBACK;");
      res.status(500).json({ error: "Database exception during Drive Offer rejection." });
    }
  });

  // ADMIN: CREATE DRIVE OFFER
  app.post("/api/v1/admin/drive-offers", (req, res) => {
    const { operator, name, regular, price } = req.body;
    logDB("API", `POST /api/v1/admin/drive-offers - Name: ${name}`);

    if (!operator || !name || !regular || !price) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const reg = Number(regular);
    const prc = Number(price);
    const save = reg - prc;

    const newId = DB.drive_offers.length > 0 ? Math.max(...DB.drive_offers.map(o => o.id)) + 1 : 1;
    const newOffer = { id: newId, operator, name, regular: reg, price: prc, save };
    DB.drive_offers.push(newOffer);

    logDB("SQL", `INSERT INTO drive_offers (id, operator, name, regular, price, save) VALUES (${newId}, '${operator}', '${name}', ${reg}, ${prc}, ${save});`);
    res.status(201).json(newOffer);
  });

  // ADMIN: EDIT DRIVE OFFER
  app.put("/api/v1/admin/drive-offers/:id", (req, res) => {
    const id = Number(req.params.id);
    const { operator, name, regular, price } = req.body;
    logDB("API", `PUT /api/v1/admin/drive-offers/${id}`);

    const offer = DB.drive_offers.find(o => o.id === id);
    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }

    if (operator) offer.operator = operator;
    if (name) offer.name = name;
    if (regular) offer.regular = Number(regular);
    if (price) offer.price = Number(price);
    offer.save = offer.regular - offer.price;

    logDB("SQL", `UPDATE drive_offers SET operator='${offer.operator}', name='${offer.name}', regular=${offer.regular}, price=${offer.price}, save=${offer.save} WHERE id=${id};`);
    res.json(offer);
  });

  // ADMIN: DELETE DRIVE OFFER
  app.delete("/api/v1/admin/drive-offers/:id", (req, res) => {
    const id = Number(req.params.id);
    logDB("API", `DELETE /api/v1/admin/drive-offers/${id}`);

    const index = DB.drive_offers.findIndex(o => o.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Offer not found" });
    }

    DB.drive_offers.splice(index, 1);
    logDB("SQL", `DELETE FROM drive_offers WHERE id=${id};`);
    res.json({ success: true });
  });

  // ADMIN: CREATE NOTICE
  app.post("/api/v1/admin/notices", (req, res) => {
    const { title, content } = req.body;
    logDB("API", `POST /api/v1/admin/notices - Title: ${title}`);
    if (!title || !content) {
      return res.status(400).json({ error: "Title and Content are required" });
    }
    const newId = DB.notices.length > 0 ? Math.max(...DB.notices.map(n => n.id)) + 1 : 1;
    const newNotice = { id: newId, title, content, timestamp: new Date().toISOString() };
    DB.notices.unshift(newNotice); // Prepend new notice
    logDB("SQL", `INSERT INTO notices (id, title, content, timestamp) VALUES (${newId}, '${title}', '${content}', '${newNotice.timestamp}');`);
    res.status(201).json(newNotice);
  });

  // ADMIN: DELETE NOTICE
  app.delete("/api/v1/admin/notices/:id", (req, res) => {
    const id = Number(req.params.id);
    logDB("API", `DELETE /api/v1/admin/notices/${id}`);
    const index = DB.notices.findIndex(n => n.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Notice not found" });
    }
    DB.notices.splice(index, 1);
    logDB("SQL", `DELETE FROM notices WHERE id=${id};`);
    res.json({ success: true });
  });

  // ADMIN: UPDATE SETTLEMENT CONFIG
  app.put("/api/v1/admin/settlement", (req, res) => {
    const { bank_name, account_no, routing_no } = req.body;
    logDB("API", `PUT /api/v1/admin/settlement - Bank: ${bank_name}`);
    if (!bank_name || !account_no || !routing_no) {
      return res.status(400).json({ error: "Bank name, Account number, and Routing number are required" });
    }
    DB.settlement_config = { bank_name, account_no, routing_no };
    logDB("SQL", `UPDATE settlement_config SET bank_name='${bank_name}', account_no='${account_no}', routing_no='${routing_no}';`);
    res.json(DB.settlement_config);
  });

  // ADMIN: EDIT USER
  app.put("/api/v1/admin/users/:id", (req, res) => {
    const id = Number(req.params.id);
    let { name, phone, role, balance, status, pin } = req.body;
    if (phone !== undefined && phone !== null) phone = String(phone);
    if (pin !== undefined && pin !== null) pin = String(pin);

    logDB("API", `PUT /api/v1/admin/users/${id}`);

    const user = DB.users.find(u => u.id === id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check unique phone if phone is updated
    if (phone && phone !== user.phone) {
      const existing = DB.users.find(u => u.phone === phone);
      if (existing) {
        return res.status(400).json({ error: "Phone number already in use" });
      }
      user.phone = phone;
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (status) user.status = status;
    if (pin && String(pin).trim().length === 4) {
      user.pin_hash = hashPIN(String(pin));
    }

    if (balance !== undefined) {
      const wallet = DB.wallets.find(w => w.user_id === id);
      if (wallet) {
        wallet.balance = Number(balance);
        logDB("SQL", `UPDATE wallets SET balance=${wallet.balance} WHERE user_id=${id};`);
      }
    }

    logDB("SQL", `UPDATE users SET name='${user.name}', phone='${user.phone}', role='${user.role}', status='${user.status}' WHERE id=${id};`);
    res.json({ user, wallet: DB.wallets.find(w => w.user_id === id) });
  });

  // TRANSACTION ENGINE: MERCHANT SETTLEMENT / WITHDRAW
  app.post("/api/v1/merchant-withdraw", (req, res) => {
    const { senderPhone, amount, pin } = req.body;
    logDB("API", `POST /api/v1/merchant-withdraw - Merchant: ${senderPhone}, Amount: ${amount}`);

    const withdrawAmount = Number(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount value" });
    }

    logDB("SQL", "BEGIN TRANSACTION;");

    try {
      logDB("SQL", `SELECT * FROM users WHERE phone = '${senderPhone}' AND role = 'Merchant' LIMIT 1 FOR UPDATE;`);
      const merchant = DB.users.find((u) => u.phone === senderPhone && u.role === "Merchant");
      if (!merchant || merchant.pin_hash !== hashPIN(pin)) {
        logDB("SQL", "ROLLBACK;");
        return res.status(401).json({ error: "Invalid PIN" });
      }

      logDB("SQL", `SELECT * FROM wallets WHERE user_id = ${merchant.id} FOR UPDATE;`);
      const wallet = DB.wallets.find((w) => w.user_id === merchant.id);
      if (!wallet || wallet.balance < withdrawAmount) {
        logDB("SQL", "ROLLBACK;");
        return res.status(400).json({ error: "Insufficient balance for settlement withdrawal" });
      }

      wallet.balance -= withdrawAmount;
      logDB("SQL", `UPDATE wallets SET balance = balance - ${withdrawAmount} WHERE id = ${wallet.id};`);

      const destAccount = `${DB.settlement_config.bank_name} (${DB.settlement_config.account_no})`;
      const txnId = generateTxnId();
      const transaction: Transaction = {
        id: DB.transactions.length + 1,
        type: "Cash Out", // Present as Cash Out in logs for simplicity
        sender_phone: senderPhone,
        receiver_phone: destAccount,
        amount: withdrawAmount,
        fee: 0,
        txn_id: txnId,
        status: "Success",
        timestamp: new Date().toISOString(),
      };
      DB.transactions.push(transaction);

      logDB("SQL", `INSERT INTO transactions (id, type, sender_phone, receiver_phone, amount, fee, txn_id, status) VALUES (${transaction.id}, 'Cash Out', '${senderPhone}', '${destAccount}', ${withdrawAmount}, 0.00, '${txnId}', 'Success');`);

      logDB("SQL", "COMMIT;");
      logDB("SYSTEM", `SUCCESS: Merchant Settlement of BDT ${withdrawAmount} completed to ${destAccount} for Merchant ${senderPhone}. TxnID: ${txnId}`);

      res.status(200).json({
        message: "Settlement withdrawal successful!",
        transaction,
        sender_balance: wallet.balance,
      });
    } catch (err) {
      logDB("SQL", "ROLLBACK;");
      res.status(500).json({ error: "Database exception during merchant withdraw." });
    }
  });

  // ADD MONEY API ENDPOINTS (bkash, nagad, rocket)

  // 1. Get Add Money Configuration
  app.get("/api/v1/add-money/config", (req, res) => {
    res.json(DB.add_money_methods || { bkash: "01789456123", nagad: "01987654321", rocket: "01512345678" });
  });

  // 2. Save Add Money Configuration (Admin only)
  app.put("/api/v1/admin/add-money/config", (req, res) => {
    const { bkash, nagad, rocket } = req.body;
    logDB("API", `PUT /api/v1/admin/add-money/config - bKash: ${bkash}, Nagad: ${nagad}, Rocket: ${rocket}`);
    
    if (!bkash || !nagad || !rocket) {
      return res.status(400).json({ error: "All configuration numbers are required" });
    }

    DB.add_money_methods = { bkash, nagad, rocket };
    logDB("SYSTEM", `UPDATED: Add Money methods configured to bKash: ${bkash}, Nagad: ${nagad}, Rocket: ${rocket}`);
    res.json({ message: "Add Money config updated successfully", config: DB.add_money_methods });
  });

  // 3. User Add Money Request
  app.post("/api/v1/add-money", (req, res) => {
    const { senderPhone, method, amount, txnId } = req.body;
    logDB("API", `POST /api/v1/add-money - Phone: ${senderPhone}, Method: ${method}, Amount: ${amount}, TxID: ${txnId}`);

    const addAmount = Number(amount);
    if (isNaN(addAmount) || addAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    if (!txnId || txnId.trim().length < 4) {
      return res.status(400).json({ error: "Invalid Transaction ID" });
    }

    // Check if user exists
    const user = DB.users.find(u => u.phone === senderPhone);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if txnId already used
    const duplicate = DB.transactions.find(t => t.txn_id === txnId);
    if (duplicate) {
      return res.status(409).json({ error: "This Transaction ID has already been submitted or processed" });
    }

    logDB("SQL", "BEGIN TRANSACTION;");
    try {
      // Create a pending transaction
      const transaction: Transaction = {
        id: DB.transactions.length + 1,
        type: "Add Money",
        sender_phone: senderPhone,
        receiver_phone: method, // e.g. "bKash" or "Nagad" or "Rocket"
        amount: addAmount,
        fee: 0,
        txn_id: txnId,
        status: "Pending",
        timestamp: new Date().toISOString()
      };
      DB.transactions.push(transaction);

      logDB("SQL", `INSERT INTO transactions (id, type, sender_phone, receiver_phone, amount, fee, txn_id, status) VALUES (${transaction.id}, 'Add Money', '${senderPhone}', '${method}', ${addAmount}, 0.00, '${txnId}', 'Pending');`);
      logDB("SQL", "COMMIT;");
      logDB("SYSTEM", `PENDING: Add Money request created for BDT ${addAmount} via ${method} by user ${senderPhone}. TxnID: ${txnId}`);

      res.status(201).json({
        message: "Add Money request submitted successfully! Waiting for admin approval.",
        transaction
      });
    } catch (err) {
      logDB("SQL", "ROLLBACK;");
      res.status(500).json({ error: "Database exception during Add Money submission." });
    }
  });

  // 4. Admin Approve Add Money Request
  app.post("/api/v1/admin/add-money/approve", (req, res) => {
    const { transactionId } = req.body; // Actually contains txn_id
    logDB("API", `POST /api/v1/admin/add-money/approve - TxnID: ${transactionId}`);

    logDB("SQL", "BEGIN TRANSACTION;");
    try {
      const txn = DB.transactions.find(t => t.txn_id === transactionId);
      if (!txn) {
        logDB("SQL", "ROLLBACK;");
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (txn.status !== "Pending" || txn.type !== "Add Money") {
        logDB("SQL", "ROLLBACK;");
        return res.status(400).json({ error: "Transaction is not pending or is not an Add Money request" });
      }

      // Find user to credit
      const user = DB.users.find(u => u.phone === txn.sender_phone);
      if (!user) {
        logDB("SQL", "ROLLBACK;");
        return res.status(404).json({ error: "User not found" });
      }

      const wallet = DB.wallets.find(w => w.user_id === user.id);
      if (!wallet) {
        logDB("SQL", "ROLLBACK;");
        return res.status(500).json({ error: "Wallet not found for user" });
      }

      // Add to balance
      wallet.balance += txn.amount;
      txn.status = "Success";

      logDB("SQL", `UPDATE wallets SET balance = balance + ${txn.amount} WHERE id = ${wallet.id};`);
      logDB("SQL", `UPDATE transactions SET status = 'Success' WHERE txn_id = '${transactionId}';`);
      logDB("SQL", "COMMIT;");
      logDB("SYSTEM", `APPROVED: Add Money request of BDT ${txn.amount} for user ${user.phone} via ${txn.receiver_phone} approved. TxnID: ${transactionId}`);

      res.json({ message: "Add Money approved and credited successfully!", transaction: txn });
    } catch (err) {
      logDB("SQL", "ROLLBACK;");
      res.status(500).json({ error: "Database exception during approval." });
    }
  });

  // 5. Admin Reject Add Money Request
  app.post("/api/v1/admin/add-money/reject", (req, res) => {
    const { transactionId } = req.body;
    logDB("API", `POST /api/v1/admin/add-money/reject - TxnID: ${transactionId}`);

    logDB("SQL", "BEGIN TRANSACTION;");
    try {
      const txn = DB.transactions.find(t => t.txn_id === transactionId);
      if (!txn) {
        logDB("SQL", "ROLLBACK;");
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (txn.status !== "Pending" || txn.type !== "Add Money") {
        logDB("SQL", "ROLLBACK;");
        return res.status(400).json({ error: "Transaction is not pending or is not an Add Money request" });
      }

      txn.status = "Rejected";
      logDB("SQL", `UPDATE transactions SET status = 'Rejected' WHERE txn_id = '${transactionId}';`);
      logDB("SQL", "COMMIT;");
      logDB("SYSTEM", `REJECTED: Add Money request of BDT ${txn.amount} for user ${txn.sender_phone} rejected. TxnID: ${transactionId}`);

      res.json({ message: "Add Money request rejected successfully", transaction: txn });
    } catch (err) {
      logDB("SQL", "ROLLBACK;");
      res.status(500).json({ error: "Database exception during rejection." });
    }
  });

  // Vite integration middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`RB Bank MFS express server running on http://localhost:${PORT}`);
    logDB("SYSTEM", `Server started and successfully listening on port ${PORT}`);
  });
}

startServer();
