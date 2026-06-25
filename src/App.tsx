import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Phone,
  Lock,
  User,
  ArrowRight,
  Search,
  ArrowLeftRight,
  Coins,
  FileText,
  ChevronRight,
  CreditCard,
  Umbrella,
  Car,
  Smartphone,
  Train,
  Bell,
  Percent,
  ShoppingBag,
  Clock,
  RefreshCw,
  Sliders,
  Database,
  Terminal,
  FileCode,
  Check,
  X,
  HelpCircle,
  MapPin,
  Settings,
  AlertCircle,
  QrCode,
  Home,
  Users,
  CheckCircle2,
  LockKeyhole,
  UserPlus
} from "lucide-react";

// Types
interface UserType {
  id: number;
  name: string;
  phone: string;
  role: "Customer" | "Agent" | "Merchant";
  pin_hash: string;
  status: string;
  created_at: string;
  balance?: number;
  pending_balance?: number;
}

interface WalletType {
  id: number;
  user_id: number;
  balance: number;
  pending_balance: number;
  currency: string;
}

interface TransactionType {
  id: number;
  type: "Send Money" | "Cash Out" | "Cash In" | "Mobile Recharge" | "Merchant Payment" | "Drive Offer" | "Pay Bill";
  sender_phone: string;
  receiver_phone: string;
  amount: number;
  fee: number;
  txn_id: string;
  status: "Success" | "Pending" | "Rejected";
  timestamp: string;
}

interface DBLogType {
  timestamp: string;
  type: "SQL" | "SYSTEM" | "API";
  message: string;
}

// Drive Offers Static Data
const DRIVE_OFFERS = [
  { id: 1, operator: "Grameenphone", name: "GP 50 GB + 1600 Mins (30 Days)", regular: 998, price: 620, save: 378 },
  { id: 2, operator: "Grameenphone", name: "GP 35 GB + 800 Mins (30 Days)", regular: 799, price: 490, save: 309 },
  { id: 3, operator: "Robi", name: "Robi 45 GB + 1000 Mins (30 Days)", regular: 798, price: 450, save: 348 },
  { id: 4, operator: "Robi", name: "Robi 60 GB Internet Only (30 Days)", regular: 649, price: 395, save: 254 },
  { id: 5, operator: "Banglalink", name: "BL 40 GB + 900 Mins (30 Days)", regular: 699, price: 399, save: 300 },
  { id: 6, operator: "Banglalink", name: "BL 20 GB + 500 Mins (30 Days)", regular: 499, price: 290, save: 209 },
  { id: 7, operator: "Airtel", name: "Airtel 50 GB + 1000 Mins (30 Days)", regular: 748, price: 440, save: 308 },
  { id: 8, operator: "Teletalk", name: "Teletalk 35 GB + 500 Mins (30 Days)", regular: 549, price: 320, save: 229 }
];

// Utility Bill Providers Static Data
const BILL_PROVIDERS = [
  { id: "desco", name: "DESCO Electricity", logo: "⚡", category: "Electricity", charge: 850 },
  { id: "wasa", name: "Dhaka WASA", logo: "💧", category: "Water", charge: 420 },
  { id: "titas", name: "Titas Gas", logo: "🔥", category: "Gas", charge: 1080 },
  { id: "link3", name: "Link3 Broadband", logo: "🌐", category: "Internet", charge: 1150 },
  { id: "nesco", name: "NESCO Electricity", logo: "⚡", category: "Electricity", charge: 650 }
];

// Translation Mapping
const translations = {
  bn: {
    title: "আরবি ব্যাংক",
    tagline: "ডাক বিভাগের ডিজিটাল লেনদেন",
    tagline_sub: "স্মার্ট ডিজিটাল ব্যাংকিং লেনদেন",
    mobile_label: "মোবাইল নাম্বার",
    mobile_placeholder: "১১-ডিজিট মোবাইল নাম্বার",
    pin_label: "পিন",
    pin_placeholder: "৪-ডিজিট পিন",
    login_btn: "লগ ইন",
    forgot_pin: "পিন নাম্বার ভুলে গিয়েছেন?",
    store_locator: "স্টোর সন্ধান",
    offers: "অফার",
    help: "সহায়তা",
    balance_text: "ব্যালেন্স জানতে ট্যাপ করুন",
    balance_loading: "আপডেট হচ্ছে...",
    services_title: "সার্ভিস সমূহ",
    payment_title: "পেমেন্ট",
    send_money: "সেন্ড মানি",
    cash_out: "ক্যাশ আউট",
    recharge: "মোবাইল রিচার্জ",
    add_money: "অ্যাড মানি",
    drive_offer: "ড্রাইভ অফার",
    insurance: "ইন্সুরেন্স পলিসি",
    toll: "টোল",
    metro_pass: "মেট্রো র‍্যাপিড পাস",
    merchant_pay: "মার্চেন্ট পে",
    bill_pay: "বিল পে",
    emi_payment: "ইএমআই পেমেন্ট",
    other_services: "অন্যান্য সেবাসমূহ",
    home_tab: "হোম",
    txn_tab: "লেনদেন",
    contacts_tab: "নোটিশ",
    my_nagad_tab: "আমার নগদ",
    back_btn: "ফিরে যান",
    agent_label: "এজেন্ট নাম্বার",
    merchant_label: "মার্চেন্ট নাম্বার",
    customer_label: "গ্রহীতা মোবাইল নাম্বার",
    amount_label: "পরিমাণ (টাকা)",
    pin_confirm_label: "৪-ডিজিট পিন প্রবেশ করুন",
    confirm_btn: "নিশ্চিত করুন",
    processing: "প্রসেসিং হচ্ছে...",
    success_receipt: "লেনদেন সফল হয়েছে!",
    txn_id: "লেনদেন আইডি (Txn ID)",
    receipt_amount: "পরিমাণ",
    receipt_fee: "চার্জ",
    receipt_target: "গ্রহীতা",
    receipt_date: "তারিখ ও সময়",
    ok_btn: "ঠিক আছে",
    insufficient_balance: "দুঃখিত, পর্যাপ্ত ব্যালেন্স নেই!",
    invalid_pin: "ভুল পিন কোড!",
    general_error: "দুঃখিত, কোনো সমস্যা হয়েছে!",
    demo_accounts: "ডেমো অ্যাকাউন্টসমূহ",
    tap_demo: "ট্যাপ করে ডেমো লগইন করুন",
    drive_title: "ড্রাইভ অফারসমূহ",
    select_operator: "অপারেটর নির্বাচন করুন",
    enter_target_no: "মোবাইল নাম্বার দিন",
    buy_offer_btn: "অফারটি কিনুন",
    drive_success: "ড্রাইভ অফার রিচার্জ সফল!",
    regular_price: "নিয়মিত মূল্য",
    offer_price: "অফার মূল্য",
    save_text: "সাশ্রয়",
    pay_bill_title: "বিল পে (ইউটিলিটি বিল)",
    select_biller: "বিল দাতা প্রতিষ্ঠান",
    enter_bill_ac: "বিল বা অ্যাকাউন্ট নাম্বার দিন",
    fetch_bill_btn: "বিল খুঁজুন",
    bill_amount_info: "চলতি বিলের পরিমাণ",
    pay_bill_btn: "বিল পরিশোধ করুন",
    bill_success: "বিল পরিশোধ সফল হয়েছে!",
    diagnostic_panel: "সিস্টেম টেস্ট ও লাইভ PostgreSQL ডাটাবেস",
    diagnostics_desc: "এই প্যানেলে লাইভ PostgreSQL টেবিল, রিলেশনাল ডাটা ও ব্যাকএন্ড SQL স্টেটমেন্ট দেখা যাবে।",
    reset_db_btn: "ডাটাবেস রিসেট করুন",
    live_sql_stream: "লাইভ এসকিউএল স্ট্রিম",
    active_users: "সিস্টেমের সক্রিয় গ্রাহক তালিকা",
    txn_history_global: "গ্লোবাল ট্রানজেকশন লেজার (Live Monitor)"
  },
  en: {
    title: "RB Bank",
    tagline: "Postal Department Digital MFS",
    tagline_sub: "Smart Digital Banking Transactions",
    mobile_label: "Mobile Number",
    mobile_placeholder: "11-digit phone number",
    pin_label: "PIN",
    pin_placeholder: "4-Digit PIN",
    login_btn: "Log In",
    forgot_pin: "Forgot PIN?",
    store_locator: "Store Locator",
    offers: "Offers",
    help: "Help",
    balance_text: "Tap for Balance",
    balance_loading: "Updating...",
    services_title: "Our Services",
    payment_title: "Payment",
    send_money: "Send Money",
    cash_out: "Cash Out",
    recharge: "Mobile Recharge",
    add_money: "Add Money",
    drive_offer: "Drive Offers",
    insurance: "Insurance Policy",
    toll: "Toll Payment",
    metro_pass: "Metro Rapid Pass",
    merchant_pay: "Merchant Pay",
    bill_pay: "Bill Pay",
    emi_payment: "EMI Payment",
    other_services: "Other Services",
    home_tab: "Home",
    txn_tab: "Transactions",
    contacts_tab: "Notice",
    my_nagad_tab: "My MFS",
    back_btn: "Back",
    agent_label: "Agent Phone Number",
    merchant_label: "Merchant Phone Number",
    customer_label: "Recipient Phone Number",
    amount_label: "Amount (BDT)",
    pin_confirm_label: "Enter Security PIN",
    confirm_btn: "Confirm",
    processing: "Processing...",
    success_receipt: "Transaction Successful!",
    txn_id: "Transaction ID",
    receipt_amount: "Amount",
    receipt_fee: "Fee",
    receipt_target: "Recipient",
    receipt_date: "Date & Time",
    ok_btn: "Done",
    insufficient_balance: "Insufficient balance!",
    invalid_pin: "Incorrect PIN code!",
    general_error: "Something went wrong!",
    demo_accounts: "Demo Accounts",
    tap_demo: "Tap to login",
    drive_title: "Drive Offers",
    select_operator: "Select Operator",
    enter_target_no: "Recipient Mobile No.",
    buy_offer_btn: "Purchase Offer",
    drive_success: "Drive Recharge Successful!",
    regular_price: "Regular Price",
    offer_price: "Offer Price",
    save_text: "Save",
    pay_bill_title: "Utility Bill Pay",
    select_biller: "Utility Provider",
    enter_bill_ac: "Bill / Account Number",
    fetch_bill_btn: "Fetch Bill Amount",
    bill_amount_info: "Current Outstanding Bill",
    pay_bill_btn: "Pay Bill Now",
    bill_success: "Utility Bill Payment Successful!",
    diagnostic_panel: "System Diagnostics & Live PostgreSQL",
    diagnostics_desc: "This console displays the live PostgreSQL relational state and background raw SQL queries executed by Node.js.",
    reset_db_btn: "Reset Database",
    live_sql_stream: "Live SQL Stream",
    active_users: "Active Database Users Table",
    txn_history_global: "Global Transaction Ledger (Live Monitor)"
  }
};

export default function App() {
  // Localization state
  const [lang, setLang] = useState<"bn" | "en">("bn");
  const t = translations[lang];

  // Auth States
  const [loggedUser, setLoggedUser] = useState<UserType | null>(null);
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // User Registration States
  const [showUserRegister, setShowUserRegister] = useState(false);
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regRole, setRegRole] = useState<"Customer" | "Agent" | "Merchant">("Customer");
  const [regPin, setRegPin] = useState("");
  const [regConfirmPin, setRegConfirmPin] = useState("");
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Agent-led Registration States
  const [agentRegName, setAgentRegName] = useState("");
  const [agentRegPhone, setAgentRegPhone] = useState("");
  const [agentRegRole, setAgentRegRole] = useState<"Customer" | "Merchant">("Customer");
  const [agentRegPin, setAgentRegPin] = useState("");
  const [agentRegConfirmPin, setAgentRegConfirmPin] = useState("");
  const [agentRegAuthorizePin, setAgentRegAuthorizePin] = useState("");
  const [agentRegError, setAgentRegError] = useState("");
  const [agentRegSuccess, setAgentRegSuccess] = useState("");
  const [isAgentRegistering, setIsAgentRegistering] = useState(false);

  // Admin Control Panel States
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminTab, setAdminTab] = useState<"pending" | "offers" | "users" | "logs" | "notices" | "settlement" | "transactions">("pending");
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // Database Mirror States
  const [dbState, setDbState] = useState<{
    users: UserType[];
    wallets: WalletType[];
    transactions: TransactionType[];
    drive_offers?: any[];
    notices?: any[];
    settlement_config?: {
      bank_name: string;
      account_no: string;
      routing_no: string;
    };
  }>({
    users: [],
    wallets: [],
    transactions: [],
    drive_offers: [],
    notices: [],
    settlement_config: {
      bank_name: "",
      account_no: "",
      routing_no: ""
    }
  });

  // Admin Offer CRUD Inputs
  const [contactsSearch, setContactsSearch] = useState("");
  const [editingOfferId, setEditingOfferId] = useState<number | null>(null);
  const [crudOperator, setCrudOperator] = useState("Grameenphone");
  const [crudName, setCrudName] = useState("");

  // Admin Notice Inputs
  const [adminNoticeTitle, setAdminNoticeTitle] = useState("");
  const [adminNoticeContent, setAdminNoticeContent] = useState("");
  const [isSubmittingNotice, setIsSubmittingNotice] = useState(false);

  // Admin Settlement Destination Config Inputs
  const [settlementBankName, setSettlementBankName] = useState("");
  const [settlementAccountNo, setSettlementAccountNo] = useState("");
  const [settlementRoutingNo, setSettlementRoutingNo] = useState("");
  const [isSavingSettlement, setIsSavingSettlement] = useState(false);

  // Admin User Edit Profile Inputs
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserPhone, setEditUserPhone] = useState("");
  const [editUserRole, setEditUserRole] = useState<"Customer" | "Agent" | "Merchant">("Customer");
  const [editUserBalance, setEditUserBalance] = useState("");
  const [editUserStatus, setEditUserStatus] = useState<"Active" | "Pending" | "Suspended">("Active");
  const [editUserPin, setEditUserPin] = useState("");
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [userEditError, setUserEditError] = useState("");

  useEffect(() => {
    if (dbState?.settlement_config) {
      setSettlementBankName(dbState.settlement_config.bank_name || "");
      setSettlementAccountNo(dbState.settlement_config.account_no || "");
      setSettlementRoutingNo(dbState.settlement_config.routing_no || "");
    }
  }, [dbState?.settlement_config]);
  const [crudRegular, setCrudRegular] = useState("");
  const [crudPrice, setCrudPrice] = useState("");

  // Resolve current live drive offers from PostgreSQL simulation or fallback to static list
  const currentDriveOffers = useMemo(() => {
    return (dbState?.drive_offers && dbState.drive_offers.length > 0) ? dbState.drive_offers : DRIVE_OFFERS;
  }, [dbState?.drive_offers]);

  // App Navigation States
  // home | send_money | cash_out | recharge | merchant_pay | drive_offer | pay_bill | success_receipt
  const [currentScreen, setCurrentScreen] = useState<string>("home");
  const [currentTab, setCurrentTab] = useState<"home" | "txn" | "contacts" | "my_account">("home");
  const [logs, setLogs] = useState<DBLogType[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form input States
  const [targetPhone, setTargetPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [operator, setOperator] = useState("Grameenphone");
  const [pinCode, setPinCode] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Drive Offer Specific State
  const [selectedDrive, setSelectedDrive] = useState<typeof DRIVE_OFFERS[0] | null>(null);

  // Pay Bill Specific State
  const [selectedBiller, setSelectedBiller] = useState<typeof BILL_PROVIDERS[0] | null>(null);
  const [billAccountNo, setBillAccountNo] = useState("");
  const [fetchedBillAmount, setFetchedBillAmount] = useState<number | null>(null);

  // Tap balance states
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);
  const [isBalanceAnimating, setIsBalanceAnimating] = useState(false);
  const balanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Latest Completed Transaction for Receipt
  const [latestTxn, setLatestTxn] = useState<TransactionType | null>(null);

  // Collapsible diagnostics control in "My Account"
  const [isDiagOpen, setIsDiagOpen] = useState(false);

  // Fetch Database state
  const refreshDbState = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch("/api/v1/db-state");
      if (res.ok) {
        const data = await res.json();
        setDbState(data);

        // Keep loggedUser wallet updated in real-time
        if (loggedUser) {
          const matchingUser = data.users.find((u: any) => u.phone === loggedUser.phone);
          const matchingWallet = data.wallets.find((w: any) => w.user_id === matchingUser?.id);
          if (matchingWallet) {
            setLoggedUser((prev) => prev ? { ...prev, balance: matchingWallet.balance } : null);
          }
        }
      }

      // Fetch log history
      const logsRes = await fetch("/api/v1/logs");
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.reverse()); // latest first
      }
    } catch (e) {
      console.error("Error updating DB state:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshDbState();
    // Poll updates every 4 seconds for real-time live synchronization
    const timer = setInterval(refreshDbState, 4000);
    return () => clearInterval(timer);
  }, [loggedUser?.phone]);

  // Clean form variables when switching screens
  const navigateTo = (screen: string) => {
    setTargetPhone("");
    setAmount("");
    setPinCode("");
    setFormError("");
    setSelectedDrive(null);
    setSelectedBiller(null);
    setBillAccountNo("");
    setFetchedBillAmount(null);
    setCurrentScreen(screen);
  };

  // Tap for balance handler
  const handleBalanceTap = () => {
    if (isBalanceAnimating) return;

    if (balanceTimerRef.current) {
      clearTimeout(balanceTimerRef.current);
    }

    setIsBalanceAnimating(true);
    setIsBalanceVisible(true);

    // Slide/Ripple delay
    setTimeout(() => {
      setIsBalanceAnimating(false);
    }, 400);

    // Hide balance after 3.5 seconds
    balanceTimerRef.current = setTimeout(() => {
      setIsBalanceVisible(false);
    }, 3500);
  };

  // Login handler
  const handleLogin = async (phone: string, pin: string) => {
    if (!phone || !pin) {
      setLoginError(lang === "bn" ? "মোবাইল নাম্বার ও পিন আবশ্যক!" : "Phone and PIN are required!");
      return;
    }
    setIsLoggingIn(true);
    setLoginError("");

    try {
      const response = await fetch("/api/v1/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, pin })
      });

      const data = await response.json();
      if (response.ok) {
        // Successful login
        const matchingWallet = dbState.wallets.find(w => w.user_id === data.user.id);
        setLoggedUser({
          ...data.user,
          balance: matchingWallet?.balance || 0
        });
        navigateTo("home");
        setCurrentTab("home");
      } else {
        setLoginError(data.error || (lang === "bn" ? "ভুল মোবাইল নাম্বার অথবা পিন!" : "Invalid credentials"));
      }
    } catch (e) {
      setLoginError(lang === "bn" ? "সার্ভার সংযোগ ত্রুটি!" : "Server connection failure!");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Demo user trigger helper
  const handleDemoLogin = (phone: string, pin: string) => {
    setLoginPhone(phone);
    setLoginPin(pin);
    handleLogin(phone, pin);
  };

  // User Self-Registration Handler
  const handleUserRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");

    if (!regName || !regPhone || !regPin || !regConfirmPin) {
      setRegError(lang === "bn" ? "সবগুলো ঘর পূরণ করা আবশ্যক!" : "All fields are required!");
      return;
    }

    if (regPhone.length < 11) {
      setRegError(lang === "bn" ? "মোবাইল নাম্বারটি অবশ্যই ১১ ডিজিটের হতে হবে!" : "Phone number must be at least 11 digits!");
      return;
    }

    if (regPin.length !== 4 || isNaN(Number(regPin))) {
      setRegError(lang === "bn" ? "পিনটি অবশ্যই ৪ ডিজিটের সংখ্যা হতে হবে!" : "PIN must be a 4-digit number!");
      return;
    }

    if (regPin !== regConfirmPin) {
      setRegError(lang === "bn" ? "দুটো পিন নম্বর মেলেনি!" : "PINs do not match!");
      return;
    }

    setIsRegistering(true);
    try {
      const response = await fetch("/api/v1/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          phone: regPhone,
          role: regRole,
          pin: regPin
        })
      });

      const data = await response.json();
      if (response.ok) {
        setRegSuccess(lang === "bn" ? "নিবন্ধন সফল হয়েছে! অনুগ্রহ করে লগইন করুন।" : "Registration successful! Please login.");
        setRegName("");
        const savedPhone = regPhone;
        setRegPhone("");
        setRegPin("");
        setRegConfirmPin("");
        await refreshDbState();
        setTimeout(() => {
          setShowUserRegister(false);
          setRegSuccess("");
          setLoginPhone(savedPhone);
        }, 2000);
      } else {
        setRegError(data.error || (lang === "bn" ? "নিবন্ধন ব্যর্থ হয়েছে।" : "Registration failed"));
      }
    } catch (e) {
      setRegError(lang === "bn" ? "সার্ভার সংযোগ ত্রুটি!" : "Server connection failure!");
    } finally {
      setIsRegistering(false);
    }
  };

  // Agent-led User Registration Handler
  const handleAgentRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAgentRegError("");
    setAgentRegSuccess("");

    if (!agentRegName || !agentRegPhone || !agentRegPin || !agentRegConfirmPin || !agentRegAuthorizePin) {
      setAgentRegError(lang === "bn" ? "সবগুলো ঘর পূরণ করা আবশ্যক!" : "All fields are required!");
      return;
    }

    if (agentRegPhone.length < 11) {
      setAgentRegError(lang === "bn" ? "মোবাইল নাম্বারটি অবশ্যই ১১ ডিজিটের হতে হবে!" : "Phone number must be at least 11 digits!");
      return;
    }

    if (agentRegPin.length !== 4 || isNaN(Number(agentRegPin))) {
      setAgentRegError(lang === "bn" ? "পিনটি অবশ্যই ৪ ডিজিটের সংখ্যা হতে হবে!" : "PIN must be a 4-digit number!");
      return;
    }

    if (agentRegPin !== agentRegConfirmPin) {
      setAgentRegError(lang === "bn" ? "দুটো পিন নম্বর মেলেনি!" : "PINs do not match!");
      return;
    }

    if (!loggedUser || loggedUser.role !== "Agent") {
      setAgentRegError(lang === "bn" ? "শুধুমাত্র এজেন্টরা এই ফিচারটি ব্যবহার করতে পারেন!" : "Only agents can use this feature!");
      return;
    }

    setIsAgentRegistering(true);
    try {
      const response = await fetch("/api/v1/agent/register-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentPhone: loggedUser.phone,
          agentPin: agentRegAuthorizePin,
          customerName: agentRegName,
          customerPhone: agentRegPhone,
          customerRole: agentRegRole,
          customerPin: agentRegPin
        })
      });

      const data = await response.json();
      if (response.ok) {
        setAgentRegSuccess(
          lang === "bn"
            ? `${agentRegRole === "Customer" ? "গ্রাহক" : "মার্চেন্ট"} অ্যাকাউন্ট সফলভাবে নিবন্ধন করা হয়েছে!`
            : `${agentRegRole} account successfully registered!`
        );
        setAgentRegName("");
        setAgentRegPhone("");
        setAgentRegPin("");
        setAgentRegConfirmPin("");
        setAgentRegAuthorizePin("");
        await refreshDbState();
        setTimeout(() => {
          navigateTo("home");
          setAgentRegSuccess("");
        }, 2000);
      } else {
        setAgentRegError(data.error || (lang === "bn" ? "নিবন্ধন ব্যর্থ হয়েছে।" : "Registration failed"));
      }
    } catch (e) {
      setAgentRegError(lang === "bn" ? "সার্ভার সংযোগ ত্রুটি!" : "Server connection failure!");
    } finally {
      setIsAgentRegistering(false);
    }
  };

  // Admin Notice Creation
  const handleNoticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNoticeTitle.trim() || !adminNoticeContent.trim()) return;
    setIsSubmittingNotice(true);
    try {
      const response = await fetch("/api/v1/admin/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: adminNoticeTitle, content: adminNoticeContent })
      });
      if (response.ok) {
        setAdminNoticeTitle("");
        setAdminNoticeContent("");
        await refreshDbState();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingNotice(false);
    }
  };

  // Admin Notice Deletion
  const handleDeleteNotice = async (id: number) => {
    try {
      const response = await fetch(`/api/v1/admin/notices/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        await refreshDbState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin Settlement Config Save
  const handleSettlementSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlementBankName.trim() || !settlementAccountNo.trim() || !settlementRoutingNo.trim()) return;
    setIsSavingSettlement(true);
    try {
      const response = await fetch("/api/v1/admin/settlement", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bank_name: settlementBankName,
          account_no: settlementAccountNo,
          routing_no: settlementRoutingNo
        })
      });
      if (response.ok) {
        await refreshDbState();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingSettlement(false);
    }
  };

  // Admin User Edit Profile Save
  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    setUserEditError("");
    setIsSavingUser(true);
    try {
      const response = await fetch(`/api/v1/admin/users/${editingUserId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editUserName,
          phone: editUserPhone,
          role: editUserRole,
          balance: Number(editUserBalance),
          status: editUserStatus,
          pin: editUserPin || undefined
        })
      });
      const data = await response.json();
      if (response.ok) {
        setEditingUserId(null);
        setEditUserPin("");
        await refreshDbState();
      } else {
        setUserEditError(data.error || "Failed to update user");
      }
    } catch (err) {
      console.error(err);
      setUserEditError("Connection error");
    } finally {
      setIsSavingUser(false);
    }
  };

  // Reset database helper
  const handleResetDB = async () => {
    try {
      const res = await fetch("/api/v1/admin/reset", { method: "POST" });
      if (res.ok) {
        await refreshDbState();
        if (loggedUser) {
          // Relog user with refreshed data or log them out safely
          setLoggedUser(null);
          navigateTo("login");
        }
        setIsAdminMode(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ADMIN ACTION HANDLERS
  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");
    if (adminUsername === "admin" && adminPassword === "password123") {
      setIsAdminMode(true);
      setAdminTab("pending");
      setAdminError("");
    } else {
      setAdminError(lang === "bn" ? "ভুল ইউজারনেম অথবা পাসওয়ার্ড!" : "Invalid username or password!");
    }
  };

  const handleApproveCashout = async (txnId: string) => {
    try {
      const res = await fetch("/api/v1/admin/cashout/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: txnId })
      });
      if (res.ok) {
        await refreshDbState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectCashout = async (txnId: string) => {
    try {
      const res = await fetch("/api/v1/admin/cashout/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: txnId })
      });
      if (res.ok) {
        await refreshDbState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveDrive = async (txnId: string) => {
    try {
      const res = await fetch("/api/v1/admin/drive-offer/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: txnId })
      });
      if (res.ok) {
        await refreshDbState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectDrive = async (txnId: string) => {
    try {
      const res = await fetch("/api/v1/admin/drive-offer/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: txnId })
      });
      if (res.ok) {
        await refreshDbState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveDriveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crudOperator || !crudName || !crudRegular || !crudPrice) return;
    try {
      const body = {
        operator: crudOperator,
        name: crudName,
        regular: Number(crudRegular),
        price: Number(crudPrice)
      };
      let res;
      if (editingOfferId) {
        res = await fetch(`/api/v1/admin/drive-offers/${editingOfferId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
      } else {
        res = await fetch("/api/v1/admin/drive-offers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
      }

      if (res.ok) {
        setEditingOfferId(null);
        setCrudName("");
        setCrudRegular("");
        setCrudPrice("");
        await refreshDbState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDriveOffer = async (id: number) => {
    try {
      const res = await fetch(`/api/v1/admin/drive-offers/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await refreshDbState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEditDriveOffer = (offer: any) => {
    setEditingOfferId(offer.id);
    setCrudOperator(offer.operator);
    setCrudName(offer.name);
    setCrudRegular(offer.regular.toString());
    setCrudPrice(offer.price.toString());
  };

  // Standard submit logic for core transactions
  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedUser) return;
    setFormError("");

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError(lang === "bn" ? "সঠিক পরিমাণ প্রবেশ করুন" : "Enter a valid amount");
      return;
    }

    if (parsedAmount > (loggedUser.balance || 0)) {
      setFormError(t.insufficient_balance);
      return;
    }

    if (!pinCode || pinCode.length !== 4) {
      setFormError(lang === "bn" ? "৪-ডিজিট পিন আবশ্যক" : "4-digit security PIN is required");
      return;
    }

    setIsSubmitting(true);

    try {
      let endpoint = "";
      const body: any = {
        senderPhone: loggedUser.phone,
        amount: parsedAmount,
        pin: pinCode
      };

      if (currentScreen === "send_money") {
        endpoint = "/api/v1/send-money";
        body.receiverPhone = targetPhone;
      } else if (currentScreen === "cash_out") {
        endpoint = "/api/v1/cash-out";
        body.receiverPhone = targetPhone; // Agent
      } else if (currentScreen === "merchant_pay") {
        endpoint = "/api/v1/merchant-payment";
        body.receiverPhone = targetPhone; // Merchant
      } else if (currentScreen === "recharge") {
        endpoint = "/api/v1/recharge";
        body.receiverPhone = targetPhone;
        body.operator = operator;
      } else if (currentScreen === "drive_offer") {
        if (!selectedDrive) {
          setFormError(lang === "bn" ? "অনুগ্রহ করে অফার সিলেক্ট করুন" : "Please select a drive offer");
          setIsSubmitting(false);
          return;
        }
        endpoint = "/api/v1/drive-offer";
        body.receiverPhone = targetPhone;
        body.offerName = selectedDrive.name;
        body.amount = selectedDrive.price; // Discounted amount
      } else if (currentScreen === "pay_bill") {
        if (!selectedBiller) {
          setFormError(lang === "bn" ? "অনুগ্রহ করে বিলার সিলেক্ট করুন" : "Please select a utility provider");
          setIsSubmitting(false);
          return;
        }
        endpoint = "/api/v1/pay-bill";
        body.billerId = billAccountNo;
        body.billerName = selectedBiller.name;
        body.amount = fetchedBillAmount || selectedBiller.charge;
      } else if (currentScreen === "cash_in") {
        endpoint = "/api/v1/cash-in";
        body.receiverPhone = targetPhone;
      } else if (currentScreen === "merchant_withdraw") {
        endpoint = "/api/v1/merchant-withdraw";
        body.senderPhone = loggedUser.phone;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        setLatestTxn(data.transaction);
        // Deduct from local view
        setLoggedUser((prev) => prev ? { ...prev, balance: data.sender_balance } : null);
        await refreshDbState();
        navigateTo("success_receipt");
      } else {
        setFormError(data.error || t.general_error);
      }
    } catch (err) {
      setFormError(t.general_error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered transactions for the current user's passbook statement
  const userTransactions = useMemo(() => {
    if (!loggedUser) return [];
    return dbState.transactions
      .filter(t => t.sender_phone === loggedUser.phone || t.receiver_phone.includes(loggedUser.phone) || t.receiver_phone === loggedUser.phone)
      .sort((a, b) => b.id - a.id);
  }, [dbState.transactions, loggedUser?.phone]);

  return (
    <div className="w-full min-h-screen bg-slate-100 flex items-center justify-center p-0 md:p-4 font-sans antialiased text-slate-800">
      
      {/* PHONE EMULATOR CONTAINER: Fits perfectly 100% on mobile device, frames beautifully on desktop */}
      <div className="w-full max-w-md min-h-screen md:min-h-[820px] md:max-h-[880px] md:rounded-[40px] md:border-[12px] md:border-slate-800 md:shadow-2xl overflow-hidden flex flex-col bg-slate-50 relative">
        
        {/* TOP STATUS BAR (Realistic Android interface layout) */}
        <div className="bg-orange-600 text-white px-5 pt-3 pb-1 flex items-center justify-between text-xs font-medium tracking-tight shrink-0 select-none">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[11px]">{lang === "bn" ? "আরবি ব্যাংক ৪জি" : "RB Bank 4G"}</span>
          </div>
          
          {/* Subtle Punch-hole Camera simulation for aesthetic precision */}
          <div className="w-3.5 h-3.5 rounded-full bg-slate-900 absolute left-1/2 transform -translate-x-1/2 top-2.5 hidden md:block border-2 border-slate-700/45"></div>

          <div className="flex items-center gap-2 text-[11px]">
            <span>10:30 AM</span>
            <div className="flex items-center gap-1">
              <span>📶</span>
              <span>🔋 98%</span>
            </div>
          </div>
        </div>

        {/* MAIN INTERACTIVE SHELL SCREEN STAGE */}
        <div className="flex-1 overflow-y-auto flex flex-col relative pb-16">
          <AnimatePresence mode="wait">
            
            {/* SCREEN: LOGIN */}
            {!loggedUser ? (
              <motion.div
                key="login-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col justify-between p-6 bg-white min-h-[600px]"
              >
                {/* Top header row with Language Select */}
                <div className="flex justify-between items-center select-none pt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-red-100 text-red-600 font-bold border border-red-200">MFS PRO</span>
                  </div>
                  <button
                    id="lang-toggle"
                    onClick={() => setLang((prev) => (prev === "bn" ? "en" : "bn"))}
                    className="flex items-center gap-1 px-3 py-1 bg-orange-100 hover:bg-orange-200 border border-orange-200 rounded-full text-xs font-bold text-orange-700 cursor-pointer transition active:scale-95"
                  >
                    🌐 {lang === "bn" ? "English" : "বাংলা"}
                  </button>
                </div>

                {/* Central Identity Brand Area (Fidelity design resembling Nagad swirl) */}
                <div className="my-6 text-center select-none">
                  <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                    {/* Glowing outer circle */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-orange-500 via-red-500 to-yellow-400 rounded-full animate-spin-slow opacity-15 blur"></div>
                    
                    {/* Nagad Swirl shape using beautiful native styling */}
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 via-orange-500 to-yellow-400 flex flex-col items-center justify-center shadow-lg relative p-1 text-white">
                      <div className="absolute top-3 left-6 text-yellow-300 font-black text-2xl">⚡</div>
                      <Coins className="w-10 h-10 text-white stroke-[1.5]" />
                      <span className="text-[10px] uppercase font-bold tracking-widest text-orange-100 mt-1">RB Bank</span>
                    </div>
                  </div>

                  <h1 className="text-2xl font-black tracking-tight text-red-600 mt-4 font-sans">
                    {t.title}
                  </h1>
                  <p className="text-xs text-orange-600 font-semibold uppercase tracking-wider mt-0.5">
                    {t.tagline_sub}
                  </p>
                </div>

                {/* Secure PIN Form Panel */}
                <div className="flex-1 max-w-sm mx-auto w-full flex flex-col justify-center">
                  {showUserRegister ? (
                    <form
                      onSubmit={handleUserRegisterSubmit}
                      className="space-y-3"
                    >
                      <div className="bg-orange-50 border border-orange-100 p-2.5 rounded-xl text-center mb-1">
                        <span className="text-[11px] font-black text-orange-700 uppercase tracking-wide">
                          {lang === "bn" ? "নতুন অ্যাকাউন্ট নিবন্ধন করুন" : "Register New Account"}
                        </span>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                          {lang === "bn" ? "পূর্ণ নাম" : "Full Name"}
                        </label>
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder={lang === "bn" ? "আপনার নাম লিখুন" : "Enter your name"}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                          {lang === "bn" ? "মোবাইল নাম্বার" : "Mobile Number"}
                        </label>
                        <input
                          type="tel"
                          required
                          maxLength={11}
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="01XXXXXXXXX"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                          {lang === "bn" ? "অ্যাকাউন্ট টাইপ" : "Account Type"}
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                          {(["Customer", "Agent", "Merchant"] as const).map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setRegRole(r)}
                              className={`py-1.5 rounded-lg text-[10px] font-bold border transition ${
                                regRole === r
                                  ? "bg-orange-500 text-white border-orange-500"
                                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {r === "Customer" ? (lang === "bn" ? "গ্রাহক" : "Customer") :
                               r === "Agent" ? (lang === "bn" ? "এজেন্ট" : "Agent") :
                               (lang === "bn" ? "মার্চেন্ট" : "Merchant")}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                            {lang === "bn" ? "৪-ডিজিট পিন" : "4-Digit PIN"}
                          </label>
                          <input
                            type="password"
                            required
                            maxLength={4}
                            value={regPin}
                            onChange={(e) => setRegPin(e.target.value)}
                            placeholder="••••"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold tracking-widest text-center focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white transition"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                            {lang === "bn" ? "পিন নিশ্চিত করুন" : "Confirm PIN"}
                          </label>
                          <input
                            type="password"
                            required
                            maxLength={4}
                            value={regConfirmPin}
                            onChange={(e) => setRegConfirmPin(e.target.value)}
                            placeholder="••••"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold tracking-widest text-center focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white transition"
                          />
                        </div>
                      </div>

                      {regError && (
                        <div className="p-2.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[10px] font-bold">
                          {regError}
                        </div>
                      )}

                      {regSuccess && (
                        <div className="p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[10px] font-bold">
                          {regSuccess}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isRegistering}
                        className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow transition active:scale-[0.98] flex items-center justify-center gap-1.5"
                      >
                        {isRegistering && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <span>{lang === "bn" ? "নিবন্ধন সম্পন্ন করুন" : "Complete Registration"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowUserRegister(false);
                          setRegError("");
                          setRegSuccess("");
                        }}
                        className="w-full py-2 text-slate-500 hover:text-orange-600 font-bold text-[10px] transition cursor-pointer animate-pulse"
                      >
                        ← {lang === "bn" ? "লগইন স্ক্রিনে ফিরে যান" : "Back to Login"}
                      </button>
                    </form>
                  ) : showAdminLogin ? (
                    <form
                      onSubmit={handleAdminLoginSubmit}
                      className="space-y-4"
                    >
                      <div className="bg-red-50 border border-red-100 p-3 rounded-xl text-center mb-1">
                        <span className="text-xs font-bold text-red-700">🛡️ SYSTEM ADMINISTRATION PORTAL</span>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                          Admin Username
                        </label>
                        <div className="relative">
                          <Users className="absolute left-3 top-3.5 w-4 h-4 text-orange-500" />
                          <input
                            id="admin-username"
                            type="text"
                            value={adminUsername}
                            onChange={(e) => setAdminUsername(e.target.value)}
                            placeholder="e.g. admin"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                          Admin Password
                        </label>
                        <div className="relative">
                          <LockKeyhole className="absolute left-3 top-3.5 w-4 h-4 text-orange-500" />
                          <input
                            id="admin-password"
                            type="password"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            placeholder="e.g. password123"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                          />
                        </div>
                      </div>

                      {adminError && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-bold flex items-center gap-2 animate-shake">
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                          <span>{adminError}</span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAdminLogin(false);
                            setAdminError("");
                          }}
                          className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition active:scale-95"
                        >
                          {lang === "bn" ? "ব্যবহারকারী লগইন" : "User Login"}
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md transition active:scale-95"
                        >
                          {lang === "bn" ? "এডমিন লগইন" : "Admin Login"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleLogin(loginPhone, loginPin);
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                          {t.mobile_label}
                        </label>
                        <div className="relative">
                          <Smartphone className="absolute left-3 top-3.5 w-4 h-4 text-orange-500" />
                          <input
                            id="login-phone"
                            type="tel"
                            value={loginPhone}
                            onChange={(e) => setLoginPhone(e.target.value)}
                            placeholder={t.mobile_placeholder}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                          {t.pin_label}
                        </label>
                        <div className="relative">
                          <LockKeyhole className="absolute left-3 top-3.5 w-4 h-4 text-orange-500" />
                          <input
                            id="login-pin"
                            type="password"
                            value={loginPin}
                            onChange={(e) => setLoginPin(e.target.value)}
                            placeholder={t.pin_placeholder}
                            maxLength={4}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-semibold tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                          />
                        </div>
                      </div>

                      {loginError && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-bold flex items-center gap-2 animate-shake">
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                          <span>{loginError}</span>
                        </div>
                      )}

                      <button
                        id="login-submit"
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-sm rounded-xl cursor-pointer shadow-lg hover:shadow-xl transition active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        {isLoggingIn ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>{t.processing}</span>
                          </>
                        ) : (
                          <>
                            <span>{t.login_btn}</span>
                            <ChevronRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  <div className="text-center mt-3 select-none flex justify-between px-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserRegister(true);
                        setRegError("");
                        setRegSuccess("");
                      }}
                      className="text-xs text-orange-600 hover:text-orange-700 font-bold cursor-pointer transition flex items-center gap-1"
                    >
                      📝 {lang === "bn" ? "নিবন্ধন করুন" : "Register"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAdminLogin(!showAdminLogin);
                        setAdminError("");
                      }}
                      className="text-xs text-red-600 hover:text-red-700 font-bold cursor-pointer transition"
                    >
                      {showAdminLogin ? (lang === "bn" ? "ব্যবহারকারী লগইন" : "User Login") : (lang === "bn" ? "🛡️ এডমিন প্যানেল" : "🛡️ Admin Panel")}
                    </button>
                  </div>

                </div>

                {/* Bottom interactive footer options */}
                <div className="border-t border-slate-100 pt-4 mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-slate-500 select-none">
                  <div className="flex flex-col items-center gap-1 hover:text-orange-500 transition cursor-pointer">
                    <span className="text-base bg-orange-50 p-2 rounded-full">📍</span>
                    <span>{t.store_locator}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 hover:text-orange-500 transition cursor-pointer">
                    <span className="text-base bg-orange-50 p-2 rounded-full">🎁</span>
                    <span>{t.offers}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 hover:text-orange-500 transition cursor-pointer">
                    <span className="text-base bg-orange-50 p-2 rounded-full">❓</span>
                    <span>{t.help}</span>
                  </div>
                </div>
              </motion.div>
            ) : isAdminMode ? (
              /* SCREEN STAGE: ADMIN CONTROL CENTER */
              <motion.div
                key="admin-stage"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col min-h-[600px] bg-slate-900 text-slate-100 flex-1"
              >
                {/* Admin Header */}
                <div className="bg-gradient-to-r from-red-800 to-slate-900 p-4 border-b border-red-900 flex justify-between items-center select-none shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🛡️</span>
                    <div>
                      <h2 className="text-sm font-bold tracking-tight text-white uppercase">RB Admin Panel</h2>
                      <p className="text-[10px] text-red-300 font-mono tracking-widest uppercase">System Core Control</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsAdminMode(false);
                      setAdminUsername("");
                      setAdminPassword("");
                    }}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 font-bold text-xs text-white rounded-lg transition active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    Logout
                  </button>
                </div>

                {/* Tab Navigation */}
                <div className="bg-slate-800 flex border-b border-slate-700 text-xs font-bold select-none overflow-x-auto shrink-0 scrollbar-none">
                  <button
                    onClick={() => setAdminTab("pending")}
                    className={`px-4 py-3 text-center transition shrink-0 ${adminTab === "pending" ? "bg-slate-900 text-red-400 border-b-2 border-red-500" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    Pending ({dbState.transactions.filter(t => t.status === "Pending").length})
                  </button>
                  <button
                    onClick={() => setAdminTab("transactions")}
                    className={`px-4 py-3 text-center transition shrink-0 ${adminTab === "transactions" ? "bg-slate-900 text-red-400 border-b-2 border-red-500" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    Transactions ({dbState.transactions.length})
                  </button>
                  <button
                    onClick={() => setAdminTab("notices")}
                    className={`px-4 py-3 text-center transition shrink-0 ${adminTab === "notices" ? "bg-slate-900 text-red-400 border-b-2 border-red-500" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    Notices ({(dbState.notices || []).length})
                  </button>
                  <button
                    onClick={() => setAdminTab("settlement")}
                    className={`px-4 py-3 text-center transition shrink-0 ${adminTab === "settlement" ? "bg-slate-900 text-red-400 border-b-2 border-red-500" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    Settlement Config
                  </button>
                  <button
                    onClick={() => setAdminTab("offers")}
                    className={`px-4 py-3 text-center transition shrink-0 ${adminTab === "offers" ? "bg-slate-900 text-red-400 border-b-2 border-red-500" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    Drive Offers ({currentDriveOffers.length})
                  </button>
                  <button
                    onClick={() => setAdminTab("users")}
                    className={`px-4 py-3 text-center transition shrink-0 ${adminTab === "users" ? "bg-slate-900 text-red-400 border-b-2 border-red-500" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    Users ({dbState.users.length})
                  </button>
                  <button
                    onClick={() => setAdminTab("logs")}
                    className={`px-4 py-3 text-center transition shrink-0 ${adminTab === "logs" ? "bg-slate-900 text-red-400 border-b-2 border-red-500" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    Live Logs
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {adminTab === "pending" && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Orders List</span>
                        <span className="text-[10px] font-mono bg-red-950 text-red-400 px-2 py-0.5 rounded border border-red-900">Live DB Ledger</span>
                      </div>
                      {dbState.transactions.filter(t => t.status === "Pending").length === 0 ? (
                        <div className="text-center py-12 text-slate-500 text-xs">
                          <p className="text-lg">📭</p>
                          <p className="mt-1 font-semibold">No pending orders found</p>
                        </div>
                      ) : (
                        dbState.transactions.filter(t => t.status === "Pending").map((txn) => (
                          <div key={txn.id} className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 space-y-3.5 shadow-md">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="px-2 py-0.5 text-[9px] bg-amber-900/40 text-amber-300 font-bold rounded-full border border-amber-800/50 uppercase tracking-wide">
                                  {txn.type}
                                </span>
                                <p className="text-xs font-bold text-slate-100 mt-1 font-mono">{txn.txn_id}</p>
                              </div>
                              <span className="text-sm font-black text-red-400 font-mono">
                                ৳{txn.amount}
                              </span>
                            </div>
                            
                            <div className="text-[11px] text-slate-400 space-y-1 font-sans">
                              <p><span className="text-slate-500 font-medium">Customer:</span> {txn.sender_phone}</p>
                              <p><span className="text-slate-500 font-medium">Recipient/Biller:</span> {txn.receiver_phone}</p>
                              <p><span className="text-slate-500 font-medium">Placed At:</span> {new Date(txn.timestamp).toLocaleString()}</p>
                            </div>

                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => txn.type === "Drive Offer" ? handleRejectDrive(txn.txn_id) : handleRejectCashout(txn.txn_id)}
                                className="flex-1 py-2 bg-slate-700 hover:bg-red-900 text-slate-300 hover:text-white font-bold text-xs rounded-lg transition active:scale-95 cursor-pointer"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => txn.type === "Drive Offer" ? handleApproveDrive(txn.txn_id) : handleApproveCashout(txn.txn_id)}
                                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition active:scale-95 cursor-pointer shadow"
                              >
                                Approve
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {adminTab === "offers" && (
                    <div className="space-y-4">
                      {/* CRUD Form */}
                      <form onSubmit={handleSaveDriveOffer} className="bg-slate-800 border border-slate-700 rounded-xl p-3.5 space-y-3 shadow">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wide block pb-1 border-b border-slate-700">
                          {editingOfferId ? "✏️ Edit Drive Offer" : "➕ Add Drive Offer"}
                        </span>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Operator</label>
                            <select
                              value={crudOperator}
                              onChange={(e) => setCrudOperator(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-bold text-white focus:outline-none"
                            >
                              <option value="Grameenphone">Grameenphone</option>
                              <option value="Robi">Robi</option>
                              <option value="Banglalink">Banglalink</option>
                              <option value="Airtel">Airtel</option>
                              <option value="Teletalk">Teletalk</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Offer Name</label>
                            <input
                              type="text"
                              required
                              value={crudName}
                              onChange={(e) => setCrudName(e.target.value)}
                              placeholder="e.g. 50 GB + 1000 Mins"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Regular Price (৳)</label>
                            <input
                              type="number"
                              required
                              value={crudRegular}
                              onChange={(e) => setCrudRegular(e.target.value)}
                              placeholder="e.g. 799"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Offer Price (৳)</label>
                            <input
                              type="number"
                              required
                              value={crudPrice}
                              onChange={(e) => setCrudPrice(e.target.value)}
                              placeholder="e.g. 450"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 pt-1 justify-end">
                          {editingOfferId && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingOfferId(null);
                                setCrudName("");
                                setCrudRegular("");
                                setCrudPrice("");
                              }}
                              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 font-bold text-xs rounded-lg transition"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="submit"
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 font-bold text-xs text-white rounded-lg transition shadow"
                          >
                            {editingOfferId ? "Update Offer" : "Save Offer"}
                          </button>
                        </div>
                      </form>

                      {/* Offer Grid */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Drive Packages</span>
                        {currentDriveOffers.map((o) => (
                          <div key={o.id} className="bg-slate-800 border border-slate-700 rounded-xl p-3 flex justify-between items-center shadow-sm">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400">{o.operator}</p>
                              <p className="text-xs font-bold text-white mt-0.5">{o.name}</p>
                              <p className="text-[10px] text-slate-400 mt-1">
                                Regular: <span className="line-through">৳{o.regular}</span> | Price: <span className="font-bold text-red-400">৳{o.price}</span> | Save: <span className="text-emerald-400 font-bold">৳{o.save}</span>
                              </p>
                            </div>
                            <div className="flex gap-1.5 shrink-0 ml-2 select-none">
                              <button
                                type="button"
                                onClick={() => handleStartEditDriveOffer(o)}
                                className="p-1.5 bg-slate-700 hover:bg-orange-600 rounded-lg transition active:scale-90 text-[11px]"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDriveOffer(o.id)}
                                className="p-1.5 bg-slate-700 hover:bg-red-700 rounded-lg transition active:scale-90 text-[11px]"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {adminTab === "users" && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Wallet Nodes</span>
                        <button
                          type="button"
                          onClick={handleResetDB}
                          className="px-2 py-0.5 rounded bg-red-950 text-red-400 hover:bg-red-900 font-bold text-[9px] border border-red-800 transition active:scale-95"
                        >
                          Hard Reset DB
                        </button>
                      </div>
                      {dbState.users.map((user) => {
                        const wallet = dbState.wallets.find(w => w.user_id === user.id);
                        const isEditing = editingUserId === user.id;

                        return (
                          <div key={user.id} className="bg-slate-800 border border-slate-700 rounded-xl p-3">
                            {isEditing ? (
                              <form onSubmit={handleEditUserSubmit} className="space-y-3.5 text-xs">
                                <div className="flex justify-between items-center border-b border-slate-700 pb-1.5">
                                  <span className="font-black text-red-400 uppercase text-[10px] tracking-wider">
                                    Edit User Node #{user.id}
                                  </span>
                                  <span className="text-[9px] text-slate-500 font-mono">{user.phone}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2.5">
                                  <div>
                                    <label className="text-[9px] text-slate-400 font-bold block mb-1">Name</label>
                                    <input
                                      type="text"
                                      value={editUserName}
                                      onChange={(e) => setEditUserName(e.target.value)}
                                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white font-medium"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-slate-400 font-bold block mb-1">Phone</label>
                                    <input
                                      type="text"
                                      value={editUserPhone}
                                      onChange={(e) => setEditUserPhone(e.target.value)}
                                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white font-medium"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-slate-400 font-bold block mb-1">Role</label>
                                    <select
                                      value={editUserRole}
                                      onChange={(e: any) => setEditUserRole(e.target.value)}
                                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white font-medium"
                                    >
                                      <option value="Customer">Customer</option>
                                      <option value="Agent">Agent</option>
                                      <option value="Merchant">Merchant</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-slate-400 font-bold block mb-1">Balance (৳)</label>
                                    <input
                                      type="number"
                                      value={editUserBalance}
                                      onChange={(e) => setEditUserBalance(Number(e.target.value))}
                                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white font-medium"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-slate-400 font-bold block mb-1">Status</label>
                                    <select
                                      value={editUserStatus}
                                      onChange={(e: any) => setEditUserStatus(e.target.value)}
                                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white font-medium"
                                    >
                                      <option value="Active">Active</option>
                                      <option value="Pending">Pending</option>
                                      <option value="Suspended">Suspended</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-slate-400 font-bold block mb-1">New 4-digit PIN</label>
                                    <input
                                      type="password"
                                      maxLength={4}
                                      placeholder="Leave empty to keep"
                                      value={editUserPin}
                                      onChange={(e) => setEditUserPin(e.target.value)}
                                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white font-medium placeholder:text-slate-600"
                                    />
                                  </div>
                                </div>
                                {userEditError && (
                                  <p className="text-[10px] text-red-400 font-black font-mono">
                                    ⚠️ {userEditError}
                                  </p>
                                )}
                                <div className="flex justify-end gap-2.5 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingUserId(null)}
                                    className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={isSavingUser}
                                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded"
                                  >
                                    {isSavingUser ? "Saving..." : "Save"}
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-xs font-black text-white">{user.name}</p>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{user.phone} ({user.role})</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-right font-mono text-xs">
                                    <p className="font-bold text-emerald-400">৳{wallet?.balance || 0}</p>
                                    {(wallet?.pending_balance || 0) > 0 && (
                                      <p className="text-[9px] text-amber-400 mt-0.5">Frozen: ৳{wallet?.pending_balance}</p>
                                    )}
                                    <span className={`text-[8px] font-black uppercase tracking-wider px-1 py-0.5 rounded ${
                                      user.status === "Active" ? "bg-emerald-950/80 text-emerald-400" :
                                      user.status === "Suspended" ? "bg-red-950/80 text-red-400" : "bg-slate-700 text-slate-300"
                                    }`}>
                                      {user.status || "Active"}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingUserId(user.id);
                                      setEditUserName(user.name);
                                      setEditUserPhone(user.phone);
                                      setEditUserRole(user.role);
                                      setEditUserBalance(wallet?.balance || 0);
                                      setEditUserStatus(user.status || "Active");
                                      setEditUserPin("");
                                      setUserEditError("");
                                    }}
                                    className="p-1.5 bg-slate-700 hover:bg-orange-500 rounded-lg text-xs font-bold transition shrink-0"
                                    title="Edit User Profile"
                                  >
                                    ✏️
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {adminTab === "logs" && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SQL Core Audit Logger</span>
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      </div>
                      <div className="bg-black border border-slate-700 rounded-xl p-3 font-mono text-[10px] leading-relaxed text-emerald-400 max-h-[480px] overflow-y-auto space-y-2 scrollbar-none shadow-inner">
                        {logs.slice(0, 40).map((log, i) => (
                          <div key={i} className="border-b border-slate-900/50 pb-1.5 last:border-0 last:pb-0">
                            <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{" "}
                            <span className={`font-bold ${log.type === "SQL" ? "text-blue-400" : log.type === "API" ? "text-purple-400" : "text-amber-400"}`}>
                              {log.type}
                            </span>{" "}
                            <span className="text-slate-300">{log.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {adminTab === "notices" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Publish Notice & Announcement</span>
                      </div>
                      
                      <form onSubmit={handleNoticeSubmit} className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3 shadow-md text-xs">
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block mb-1">Notice Title</label>
                          <input
                            type="text"
                            value={adminNoticeTitle}
                            onChange={(e) => setAdminNoticeTitle(e.target.value)}
                            placeholder="e.g. ঈদুল ফিতর উপলক্ষে নতুন অফার!"
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-medium"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block mb-1">Notice Content</label>
                          <textarea
                            value={adminNoticeContent}
                            onChange={(e) => setAdminNoticeContent(e.target.value)}
                            placeholder="Type notice message details..."
                            rows={3}
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-medium leading-relaxed"
                            required
                          />
                        </div>
                        <div className="flex justify-end pt-1">
                          <button
                            type="submit"
                            disabled={isSubmittingNotice}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold transition active:scale-95 cursor-pointer"
                          >
                            {isSubmittingNotice ? "Publishing..." : "Publish Announcement"}
                          </button>
                        </div>
                      </form>

                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Notices</span>
                        {(!dbState.notices || dbState.notices.length === 0) ? (
                          <p className="text-slate-500 text-xs italic py-4 text-center">No notices published yet.</p>
                        ) : (
                          dbState.notices.map((notice: any) => (
                            <div key={notice.id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 flex justify-between items-start gap-4">
                              <div className="space-y-1 text-xs">
                                <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                  {notice.title}
                                </h4>
                                <p className="text-slate-400 leading-relaxed font-medium">{notice.content}</p>
                                <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                                  {new Date(notice.timestamp).toLocaleString()}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteNotice(notice.id)}
                                className="p-1 text-slate-400 hover:text-red-500 transition active:scale-90 cursor-pointer text-xs"
                                title="Delete Notice"
                              >
                                🗑️
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {adminTab === "settlement" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settlement Config</span>
                        <span className="text-[9px] bg-emerald-950 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-900">
                          Merchant Withdrawals Target
                        </span>
                      </div>

                      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-xs space-y-3 shadow-md">
                        <p className="text-slate-300 font-medium leading-relaxed">
                          Define the default banking credentials where funds from Merchant withdrawals are settled dynamically. 
                          This specifies the receiver account used in the withdraw process.
                        </p>
                        <form onSubmit={handleSettlementSave} className="space-y-3 pt-2">
                          <div>
                            <label className="text-[10px] text-slate-400 font-bold block mb-1">Bank Name</label>
                            <input
                              type="text"
                              value={settlementBankName}
                              onChange={(e) => setSettlementBankName(e.target.value)}
                              placeholder="e.g. Bank Asia, Sonali Bank"
                              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-medium"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 font-bold block mb-1">Account Number</label>
                            <input
                              type="text"
                              value={settlementAccountNo}
                              onChange={(e) => setSettlementAccountNo(e.target.value)}
                              placeholder="e.g. 102293848123"
                              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-medium"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 font-bold block mb-1">Routing Number</label>
                            <input
                              type="text"
                              value={settlementRoutingNo}
                              onChange={(e) => setSettlementRoutingNo(e.target.value)}
                              placeholder="e.g. 020271231"
                              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-medium"
                              required
                            />
                          </div>
                          <div className="flex justify-end pt-1">
                            <button
                              type="submit"
                              disabled={isSavingSettlement}
                              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold transition active:scale-95 cursor-pointer"
                            >
                              {isSavingSettlement ? "Saving..." : "Save Settlement Account"}
                            </button>
                          </div>
                        </form>
                      </div>

                      {dbState.settlement_config && (
                        <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 text-xs space-y-1.5">
                          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">Current Live Config</span>
                          <div className="grid grid-cols-3 gap-2 font-mono text-[10px] text-slate-300 pt-1">
                            <div>
                              <p className="text-slate-500">BANK</p>
                              <p className="font-bold text-white mt-0.5">{dbState.settlement_config.bank_name}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">ACCOUNT</p>
                              <p className="font-bold text-white mt-0.5">{dbState.settlement_config.account_no}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">ROUTING</p>
                              <p className="font-bold text-white mt-0.5">{dbState.settlement_config.routing_no}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {adminTab === "transactions" && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">All Transaction History Logs</span>
                        <span className="text-[9px] bg-red-950 text-red-400 px-2 py-0.5 rounded border border-red-900 font-mono font-bold">
                          {dbState.transactions.length} Total Txns
                        </span>
                      </div>

                      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                        {dbState.transactions.slice().reverse().map((txn) => {
                          const isPending = txn.status === "Pending";
                          const isApproved = txn.status === "Approved";
                          
                          return (
                            <div key={txn.id} className="bg-slate-800 border border-slate-700 rounded-xl p-3 space-y-2.5 text-xs shadow-md">
                              <div className="flex justify-between items-center">
                                <span className="font-black text-white uppercase text-[10px] tracking-wider bg-slate-700 px-1.5 py-0.5 rounded">
                                  {txn.type}
                                </span>
                                <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                  isApproved ? "bg-emerald-950 text-emerald-400 border border-emerald-900" :
                                  isPending ? "bg-amber-950 text-amber-400 border border-amber-900" : "bg-red-950 text-red-400 border border-red-900"
                                }`}>
                                  {txn.status}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[10px] text-slate-300">
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-bold">From:</span>
                                  <span>{txn.sender_phone}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-bold">To:</span>
                                  <span>{txn.receiver_phone || "N/A"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-bold">Amount:</span>
                                  <span className="text-emerald-400 font-bold">৳{txn.amount}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-bold">Fee:</span>
                                  <span className="text-slate-400">৳{txn.fee || 0}</span>
                                </div>
                              </div>

                              <div className="flex justify-between items-center text-[9px] text-slate-500 border-t border-slate-700/50 pt-1.5 font-mono">
                                <span>Txn ID: {txn.txn_id}</span>
                                <span>{new Date(txn.timestamp).toLocaleString()}</span>
                              </div>
                            </div>
                          );
                        })}

                        {dbState.transactions.length === 0 && (
                          <div className="text-center py-12 text-slate-500 text-xs italic">
                            No transactions processed in this ledger session.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              /* SCREEN STAGE: LOGGED IN SECTION */
              <motion.div
                key="logged-stage"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col min-h-[600px] bg-slate-50"
              >
                
                {/* 1. APP HEADER BLOCK (Red-Orange beautiful gradient with swirl) */}
                <header className="bg-gradient-to-r from-orange-500 via-red-500 to-red-600 text-white p-5 rounded-b-[24px] shadow-md relative overflow-hidden shrink-0 select-none">
                  
                  {/* Nagad-like decorative wave overlay path */}
                  <div className="absolute right-0 bottom-0 top-0 left-0 opacity-10 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path d="M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z" fill="white" />
                    </svg>
                  </div>

                  <div className="flex items-center justify-between relative z-10">
                    
                    {/* User info row */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white text-orange-600 font-black flex items-center justify-center text-sm border-2 border-orange-200/50 shadow shadow-orange-900/10">
                        {loggedUser.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black tracking-tight">{loggedUser.name}</p>
                        <p className="text-[10px] text-orange-100 font-mono font-medium">{loggedUser.phone}</p>
                      </div>
                    </div>

                    {/* Notification & Language Toggle combo */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setLang((prev) => (prev === "bn" ? "en" : "bn"))}
                        className="px-2 py-0.5 bg-white/20 border border-white/20 rounded text-[10px] font-black cursor-pointer uppercase"
                      >
                        {lang === "bn" ? "EN" : "বাং"}
                      </button>
                      <div className="relative bg-white/10 hover:bg-white/25 p-1.5 rounded-full cursor-pointer transition">
                        <Bell className="w-4 h-4 text-white" />
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-400 text-orange-950 font-black text-[8px] rounded-full flex items-center justify-center border border-orange-600">
                          2
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. SIGNATURE BALANCING INTERACTION (Tap to show balance) */}
                  <div className="mt-5 flex justify-center relative z-10">
                    <button
                      id="balance-capsule"
                      onClick={handleBalanceTap}
                      className="bg-white/95 text-slate-800 py-1.5 pl-3.5 pr-4 rounded-full flex items-center gap-2 shadow-inner hover:bg-white active:scale-95 transition cursor-pointer relative overflow-hidden h-9 select-none"
                    >
                      {/* Interactive slide ripple background */}
                      <AnimatePresence>
                        {isBalanceAnimating && (
                          <motion.div
                            initial={{ left: "-100%" }}
                            animate={{ left: "100%" }}
                            transition={{ duration: 0.4 }}
                            className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-orange-500/15 to-transparent pointer-events-none"
                          />
                        )}
                      </AnimatePresence>

                      <div className="w-5 h-5 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-[11px] font-black shrink-0 shadow shadow-orange-600/30">
                        ৳
                      </div>
                      
                      <div className="text-xs font-black tracking-tight">
                        <AnimatePresence mode="wait">
                          {isBalanceVisible ? (
                            <motion.span
                              key="balance-val"
                              initial={{ y: 8, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: -8, opacity: 0 }}
                              className="text-red-600 text-sm font-black font-mono"
                            >
                              ৳ {Number(loggedUser.balance || 0).toLocaleString(lang === "bn" ? "bn-BD" : "en-US", { minimumFractionDigits: 2 })} BDT
                            </motion.span>
                          ) : (
                            <motion.span
                              key="balance-lbl"
                              initial={{ y: -8, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: 8, opacity: 0 }}
                              className="text-slate-600 text-[11px]"
                            >
                              {t.balance_text}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                    </button>
                  </div>
                </header>

                {/* DYNAMIC SCREEN CONTENT DISPLAY */}
                <div className="flex-1 p-4">
                  <AnimatePresence mode="wait">
                    
                    {/* TAB VIEW: HOME SCREEN */}
                    {currentTab === "home" && currentScreen === "home" && (
                      <motion.div
                        key="home-tab-content"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        
                        {/* CONDITIONAL SERVICES SECTIONS BASED ON ROLE */}
                        {loggedUser.role === "Agent" ? (
                          <section className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex justify-between items-center mb-3">
                              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                Agent Operations
                              </h2>
                              <span className="px-2 py-0.5 text-[9px] bg-red-100 text-red-700 font-bold rounded-full">AGENT PORTAL</span>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-y-4 gap-x-2 text-center select-none">
                              {/* Agent Cash In */}
                              <button
                                onClick={() => navigateTo("cash_in")}
                                className="flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer group"
                              >
                                <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-inner group-hover:bg-orange-100 transition duration-200 border border-orange-200">
                                  <ArrowLeftRight className="w-5 h-5 stroke-[2]" />
                                </div>
                                <span className="text-[10px] font-black text-slate-700 leading-tight">
                                  Agent Cash In
                                </span>
                              </button>

                              {/* Mobile Recharge */}
                              <button
                                onClick={() => navigateTo("recharge")}
                                className="flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer group"
                              >
                                <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-inner group-hover:bg-orange-100 transition duration-200 border border-slate-200">
                                  <Smartphone className="w-5 h-5 stroke-[2]" />
                                </div>
                                <span className="text-[10px] font-black text-slate-700 leading-tight">
                                  {t.recharge}
                                </span>
                              </button>

                              {/* Agent Registration of User/Merchant */}
                              <button
                                onClick={() => {
                                  navigateTo("agent_register_user");
                                  setAgentRegError("");
                                  setAgentRegSuccess("");
                                  setAgentRegName("");
                                  setAgentRegPhone("");
                                  setAgentRegPin("");
                                  setAgentRegConfirmPin("");
                                  setAgentRegAuthorizePin("");
                                }}
                                className="flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer group"
                              >
                                <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-inner group-hover:bg-orange-100 transition duration-200 border border-orange-200">
                                  <UserPlus className="w-5 h-5 stroke-[2]" />
                                </div>
                                <span className="text-[10px] font-black text-slate-700 leading-tight animate-pulse">
                                  {lang === "bn" ? "ইউজার নিবন্ধন" : "Register User"}
                                </span>
                              </button>
                            </div>
                          </section>
                        ) : loggedUser.role === "Merchant" ? (
                          <section className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex justify-between items-center mb-3">
                              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                Merchant Operations
                              </h2>
                              <span className="px-2 py-0.5 text-[9px] bg-amber-100 text-amber-700 font-bold rounded-full">MERCHANT PORTAL</span>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-y-4 gap-x-2 text-center select-none">
                              {/* Merchant Withdraw */}
                              <button
                                onClick={() => navigateTo("merchant_withdraw")}
                                className="flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer group"
                              >
                                <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-inner group-hover:bg-orange-100 transition duration-200 border border-orange-200">
                                  <Coins className="w-5 h-5 stroke-[2]" />
                                </div>
                                <span className="text-[10px] font-black text-slate-700 leading-tight">
                                  Withdraw Money
                                </span>
                              </button>
                            </div>
                          </section>
                        ) : (
                          <>
                            {/* SERVICE SECTION 1: CORE SERVICES */}
                            <section className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3.5">
                                {t.services_title}
                              </h2>
                              
                              <div className="grid grid-cols-4 gap-y-4 gap-x-2 text-center select-none">
                                {/* Send Money */}
                                <button
                                  onClick={() => navigateTo("send_money")}
                                  className="flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer group"
                                >
                                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-inner group-hover:bg-orange-100 transition duration-200">
                                    <ArrowLeftRight className="w-5 h-5 stroke-[2]" />
                                  </div>
                                  <span className="text-[10px] font-black text-slate-700 leading-tight">
                                    {t.send_money}
                                  </span>
                                </button>

                                {/* Cash Out */}
                                <button
                                  onClick={() => navigateTo("cash_out")}
                                  className="flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer group"
                                >
                                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-inner group-hover:bg-orange-100 transition duration-200">
                                    <Coins className="w-5 h-5 stroke-[2]" />
                                  </div>
                                  <span className="text-[10px] font-black text-slate-700 leading-tight">
                                    {t.cash_out}
                                  </span>
                                </button>

                                {/* Mobile Recharge */}
                                <button
                                  onClick={() => navigateTo("recharge")}
                                  className="flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer group"
                                >
                                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-inner group-hover:bg-orange-100 transition duration-200">
                                    <Smartphone className="w-5 h-5 stroke-[2]" />
                                  </div>
                                  <span className="text-[10px] font-black text-slate-700 leading-tight">
                                    {t.recharge}
                                  </span>
                                </button>

                                {/* Add Money (Client simulation only) */}
                                <button
                                  onClick={() => navigateTo("add_money")}
                                  className="flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer group opacity-65"
                                >
                                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-inner group-hover:bg-orange-100 transition duration-200">
                                    <FileText className="w-5 h-5 stroke-[2]" />
                                  </div>
                                  <span className="text-[10px] font-black text-slate-700 leading-tight">
                                    {t.add_money}
                                  </span>
                                </button>

                                {/* Drive Offer (NEW AUTOMATED FEATURE) */}
                                <button
                                  onClick={() => navigateTo("drive_offer")}
                                  className="flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer group"
                                >
                                  <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shadow-inner group-hover:bg-red-100 transition border border-red-100 duration-200">
                                    <Percent className="w-5 h-5 stroke-[2.5]" />
                                  </div>
                                  <span className="text-[10px] font-black text-red-600 leading-tight">
                                    {t.drive_offer}
                                  </span>
                                </button>

                                {/* Insurance Policy */}
                                <button className="flex flex-col items-center gap-1.5 opacity-40 select-none">
                                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                                    <Umbrella className="w-5 h-5" />
                                  </div>
                                  <span className="text-[10px] font-semibold text-slate-500 leading-tight">
                                    {t.insurance}
                                  </span>
                                </button>

                                {/* Toll */}
                                <button className="flex flex-col items-center gap-1.5 opacity-40 select-none">
                                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                                    <Car className="w-5 h-5" />
                                  </div>
                                  <span className="text-[10px] font-semibold text-slate-500 leading-tight">
                                    {t.toll}
                                  </span>
                                </button>

                                {/* Metro Rapid Pass */}
                                <button className="flex flex-col items-center gap-1.5 opacity-40 select-none">
                                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                                    <Train className="w-5 h-5" />
                                  </div>
                                  <span className="text-[10px] font-semibold text-slate-500 leading-tight">
                                    {t.metro_pass}
                                  </span>
                                </button>
                              </div>
                            </section>

                            {/* SERVICE SECTION 2: PAYMENT SERVICES */}
                            <section className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3.5">
                                {t.payment_title}
                              </h2>
                              
                              <div className="grid grid-cols-4 gap-y-4 gap-x-2 text-center select-none">
                                {/* Merchant Pay */}
                                <button
                                  onClick={() => navigateTo("merchant_pay")}
                                  className="flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer group"
                                >
                                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-inner group-hover:bg-orange-100 transition duration-200">
                                    <ShoppingBag className="w-5 h-5 stroke-[2]" />
                                  </div>
                                  <span className="text-[10px] font-black text-slate-700 leading-tight">
                                    {t.merchant_pay}
                                  </span>
                                </button>

                                {/* Bill Pay (NEW AUTOMATED FEATURE) */}
                                <button
                                  onClick={() => navigateTo("pay_bill")}
                                  className="flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer group"
                                >
                                  <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shadow-inner group-hover:bg-red-100 transition border border-red-100 duration-200">
                                    <CreditCard className="w-5 h-5 stroke-[2.5]" />
                                  </div>
                                  <span className="text-[10px] font-black text-red-600 leading-tight">
                                    {t.bill_pay}
                                  </span>
                                </button>

                                {/* EMI Payment */}
                                <button className="flex flex-col items-center gap-1.5 opacity-40 select-none">
                                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                                    <Clock className="w-5 h-5" />
                                  </div>
                                  <span className="text-[10px] font-semibold text-slate-500 leading-tight">
                                    {t.emi_payment}
                                  </span>
                                </button>

                                {/* Other Services */}
                                <button className="flex flex-col items-center gap-1.5 opacity-40 select-none">
                                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                                    <Sliders className="w-5 h-5" />
                                  </div>
                                  <span className="text-[10px] font-semibold text-slate-500 leading-tight">
                                    {t.other_services}
                                  </span>
                                </button>
                              </div>
                            </section>
                          </>
                        )}

                        {/* FIDELITY OFFERS BANNER SLIDER */}
                        <div
                          onClick={() => {
                            // Fun easter-egg: recharges 25 BDT instantly when tapped!
                            navigateTo("recharge");
                            setAmount("25");
                            setTargetPhone(loggedUser.phone);
                          }}
                          className="bg-gradient-to-r from-red-600 to-orange-500 rounded-2xl p-4 text-white flex items-center justify-between shadow-md cursor-pointer transition transform hover:scale-[1.01] active:scale-95 select-none"
                        >
                          <div className="space-y-1 max-w-[70%]">
                            <span className="px-2.5 py-0.5 bg-yellow-400 text-red-700 font-black text-[9px] uppercase tracking-wider rounded-full">
                              LIMITLESS RECHARGE
                            </span>
                            <h3 className="text-xs font-black leading-tight">
                              {lang === "bn" ? "২৫ টাকা রিচার্জে ২৫% ক্যাশব্যাক!" : "Get 25% Cashback on 25 BDT Recharge!"}
                            </h3>
                            <p className="text-[9px] text-orange-100 font-semibold">
                              {lang === "bn" ? "দুপুর ৩টা - সন্ধ্যা ৬টা • এখনই রিচার্জ করতে ট্যাপ করুন" : "3 PM - 6 PM • Tap to recharge now"}
                            </p>
                          </div>
                          <div className="text-3xl">🎁</div>
                        </div>

                      </motion.div>
                    )}

                    {/* SCREEN: SEND MONEY */}
                    {currentScreen === "send_money" && (
                      <motion.div
                        key="send-money-screen"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100"
                      >
                        <div className="flex items-center gap-3 mb-4 select-none">
                          <button
                            onClick={() => navigateTo("home")}
                            className="p-1 text-slate-500 hover:text-orange-500 cursor-pointer"
                          >
                            ←
                          </button>
                          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                            {t.send_money}
                          </h2>
                        </div>

                        <form onSubmit={handleTransactionSubmit} className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                              {t.customer_label}
                            </label>
                            <input
                              type="tel"
                              required
                              value={targetPhone}
                              onChange={(e) => setTargetPhone(e.target.value)}
                              placeholder="01XXXXXXXXX"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                              {t.amount_label}
                            </label>
                            <input
                              type="number"
                              required
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              placeholder="৳ 0.00"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-black text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                              {t.pin_confirm_label}
                            </label>
                            <input
                              type="password"
                              required
                              maxLength={4}
                              value={pinCode}
                              onChange={(e) => setPinCode(e.target.value)}
                              placeholder="••••"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold tracking-widest focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
                            />
                          </div>

                          {formError && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-[11px] font-bold">
                              {formError}
                            </div>
                          )}

                          <button
                            id="send-money-submit"
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-black rounded-xl shadow cursor-pointer transition active:scale-[0.98] flex items-center justify-center gap-1.5"
                          >
                            {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                            <span>{t.confirm_btn}</span>
                          </button>
                        </form>
                      </motion.div>
                    )}

                    {/* SCREEN: CASH OUT (AUTOMATIC) */}
                    {currentScreen === "cash_out" && (
                      <motion.div
                        key="cash-out-screen"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100"
                      >
                        <div className="flex items-center gap-3 mb-4 select-none">
                          <button
                            onClick={() => navigateTo("home")}
                            className="p-1 text-slate-500 hover:text-orange-500 cursor-pointer"
                          >
                            ←
                          </button>
                          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                            {t.cash_out}
                          </h2>
                        </div>

                        <form onSubmit={handleTransactionSubmit} className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                              {t.agent_label}
                            </label>
                            <input
                              type="tel"
                              required
                              value={targetPhone}
                              onChange={(e) => setTargetPhone(e.target.value)}
                              placeholder="01XXXXXXXXX"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                              {t.amount_label}
                            </label>
                            <input
                              type="number"
                              required
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              placeholder="৳ 0.00"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-black text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
                            />
                            <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                              * RB Bank Charge: 1.5% (৳ 15.00 per ৳ 1,000.00)
                            </p>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                              {t.pin_confirm_label}
                            </label>
                            <input
                              type="password"
                              required
                              maxLength={4}
                              value={pinCode}
                              onChange={(e) => setPinCode(e.target.value)}
                              placeholder="••••"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold tracking-widest focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
                            />
                          </div>

                          {formError && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-[11px] font-bold">
                              {formError}
                            </div>
                          )}

                          <button
                            id="cash-out-submit"
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-black rounded-xl shadow cursor-pointer transition active:scale-[0.98] flex items-center justify-center gap-1.5"
                          >
                            {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                            <span>{t.confirm_btn}</span>
                          </button>
                        </form>
                      </motion.div>
                    )}

                    {/* SCREEN: MOBILE RECHARGE */}
                    {currentScreen === "recharge" && (
                      <motion.div
                        key="recharge-screen"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100"
                      >
                        <div className="flex items-center gap-3 mb-4 select-none">
                          <button
                            onClick={() => navigateTo("home")}
                            className="p-1 text-slate-500 hover:text-orange-500 cursor-pointer"
                          >
                            ←
                          </button>
                          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                            {t.recharge}
                          </h2>
                        </div>

                        <form onSubmit={handleTransactionSubmit} className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                              {t.customer_label}
                            </label>
                            <input
                              type="tel"
                              required
                              value={targetPhone}
                              onChange={(e) => setTargetPhone(e.target.value)}
                              placeholder="01XXXXXXXXX"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                              {t.select_operator}
                            </label>
                            <select
                              value={operator}
                              onChange={(e) => setOperator(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
                            >
                              <option>Grameenphone</option>
                              <option>Robi</option>
                              <option>Banglalink</option>
                              <option>Airtel</option>
                              <option>Teletalk</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                              {t.amount_label}
                            </label>
                            <input
                              type="number"
                              required
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              placeholder="৳ 0.00"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-black text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                              {t.pin_confirm_label}
                            </label>
                            <input
                              type="password"
                              required
                              maxLength={4}
                              value={pinCode}
                              onChange={(e) => setPinCode(e.target.value)}
                              placeholder="••••"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold tracking-widest focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
                            />
                          </div>

                          {formError && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-[11px] font-bold">
                              {formError}
                            </div>
                          )}

                          <button
                            id="recharge-submit"
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-black rounded-xl shadow cursor-pointer transition active:scale-[0.98] flex items-center justify-center gap-1.5"
                          >
                            {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                            <span>{t.confirm_btn}</span>
                          </button>
                        </form>
                      </motion.div>
                    )}

                    {/* SCREEN: MERCHANT PAY */}
                    {currentScreen === "merchant_pay" && (
                      <motion.div
                        key="merchant-pay-screen"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100"
                      >
                        <div className="flex items-center gap-3 mb-4 select-none">
                          <button
                            onClick={() => navigateTo("home")}
                            className="p-1 text-slate-500 hover:text-orange-500 cursor-pointer"
                          >
                            ←
                          </button>
                          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                            {t.merchant_pay}
                          </h2>
                        </div>

                        <form onSubmit={handleTransactionSubmit} className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                              {t.merchant_label}
                            </label>
                            <input
                              type="tel"
                              required
                              value={targetPhone}
                              onChange={(e) => setTargetPhone(e.target.value)}
                              placeholder="01XXXXXXXXX"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                              {t.amount_label}
                            </label>
                            <input
                              type="number"
                              required
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              placeholder="৳ 0.00"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-black text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                              {t.pin_confirm_label}
                            </label>
                            <input
                              type="password"
                              required
                              maxLength={4}
                              value={pinCode}
                              onChange={(e) => setPinCode(e.target.value)}
                              placeholder="••••"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold tracking-widest focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
                            />
                          </div>

                          {formError && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-[11px] font-bold">
                              {formError}
                            </div>
                          )}

                          <button
                            id="merchant-submit"
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-black rounded-xl shadow cursor-pointer transition active:scale-[0.98] flex items-center justify-center gap-1.5"
                          >
                            {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                            <span>{t.confirm_btn}</span>
                          </button>
                        </form>
                      </motion.div>
                    )}

                    {/* SCREEN: DRIVE OFFER RECHARGE (AUTOMATED SUB-SCREEN) */}
                    {currentScreen === "drive_offer" && (
                      <motion.div
                        key="drive-offer-screen"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100"
                      >
                        <div className="flex items-center gap-3 mb-3 select-none">
                          <button
                            onClick={() => navigateTo("home")}
                            className="p-1 text-slate-500 hover:text-orange-500 cursor-pointer"
                          >
                            ←
                          </button>
                          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                            {t.drive_title}
                          </h2>
                        </div>

                        {/* Pick Operator */}
                        <div className="mb-3">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                            {t.select_operator}
                          </label>
                          <div className="flex gap-1 overflow-x-auto pb-1">
                            {["All", "Grameenphone", "Robi", "Banglalink", "Airtel", "Teletalk"].map((op) => (
                              <button
                                key={op}
                                type="button"
                                onClick={() => setOperator(op)}
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-full border shrink-0 cursor-pointer transition whitespace-nowrap ${
                                  operator === op
                                    ? "bg-red-500 text-white border-red-500"
                                    : "bg-slate-50 text-slate-600 border-slate-200"
                                }`}
                              >
                                {op}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Offers Lists Grid with Select Button */}
                        <div className="max-h-[200px] overflow-y-auto space-y-2 mb-3 pr-1 border-b border-slate-100 pb-3">
                          {DRIVE_OFFERS.filter(d => operator === "All" || d.operator === operator).map((d) => (
                            <div
                              key={d.id}
                              onClick={() => {
                                setSelectedDrive(d);
                                setAmount(d.price.toString());
                              }}
                              className={`p-2.5 rounded-xl border text-left transition duration-200 cursor-pointer relative overflow-hidden flex items-center justify-between ${
                                selectedDrive?.id === d.id
                                  ? "border-red-500 bg-red-50/50"
                                  : "border-slate-150 hover:border-slate-300 bg-slate-50/30"
                              }`}
                            >
                              <div className="space-y-1">
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded text-white ${
                                  d.operator === "Grameenphone" ? "bg-sky-500" :
                                  d.operator === "Robi" ? "bg-red-500" : "bg-orange-500"
                                }`}>
                                  {d.operator}
                                </span>
                                <h3 className="text-[11px] font-black text-slate-700">{d.name}</h3>
                                <div className="flex gap-2 text-[10px] font-medium text-slate-500">
                                  <span>{t.regular_price}: <del>৳ {d.regular}</del></span>
                                  <span className="text-red-500 font-bold">{t.offer_price}: ৳ {d.price}</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="bg-yellow-400 text-red-950 font-black text-[9px] px-2 py-0.5 rounded-full block text-center shadow-sm">
                                  ৳ {d.save} {t.save_text}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Target phone & checkout */}
                        {selectedDrive && (
                          <form onSubmit={handleTransactionSubmit} className="space-y-3 animate-fade-in">
                            <div className="p-2 bg-red-50 border border-red-100/50 rounded-xl">
                              <p className="text-[10px] font-bold text-red-700">Selected pack: {selectedDrive.name}</p>
                              <p className="text-[10px] font-black text-slate-700 mt-0.5">Payable Charge: ৳ {selectedDrive.price} BDT</p>
                            </div>

                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                                {t.enter_target_no}
                              </label>
                              <input
                                type="tel"
                                required
                                value={targetPhone}
                                onChange={(e) => setTargetPhone(e.target.value)}
                                placeholder="01XXXXXXXXX"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                                {t.pin_confirm_label}
                              </label>
                              <input
                                type="password"
                                required
                                maxLength={4}
                                value={pinCode}
                                onChange={(e) => setPinCode(e.target.value)}
                                placeholder="••••"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold tracking-widest focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
                              />
                            </div>

                            {formError && (
                              <div className="p-2 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold">
                                {formError}
                              </div>
                            )}

                            <button
                              id="drive-submit"
                              type="submit"
                              disabled={isSubmitting}
                              className="w-full py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-black rounded-xl shadow cursor-pointer transition active:scale-[0.98] flex items-center justify-center gap-1.5"
                            >
                              {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                              <span>{t.buy_offer_btn}</span>
                            </button>
                          </form>
                        )}
                      </motion.div>
                    )}

                    {/* SCREEN: PAY BILL (AUTOMATED SUB-SCREEN) */}
                    {currentScreen === "pay_bill" && (
                      <motion.div
                        key="pay-bill-screen"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100"
                      >
                        <div className="flex items-center gap-3 mb-3 select-none">
                          <button
                            onClick={() => navigateTo("home")}
                            className="p-1 text-slate-500 hover:text-orange-500 cursor-pointer"
                          >
                            ←
                          </button>
                          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                            {t.pay_bill_title}
                          </h2>
                        </div>

                        {/* Select Biller Provider list */}
                        <div className="mb-3">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                            {t.select_biller}
                          </label>
                          <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
                            {BILL_PROVIDERS.map((b) => (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => {
                                  setSelectedBiller(b);
                                  setFetchedBillAmount(null); // Force recalculate
                                }}
                                className={`p-2 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                                  selectedBiller?.id === b.id
                                    ? "border-red-500 bg-red-50/50"
                                    : "border-slate-150 bg-slate-50/40 hover:border-slate-300"
                                }`}
                              >
                                <span className="text-lg">{b.logo}</span>
                                <div className="leading-tight">
                                  <p className="text-[10px] font-black text-slate-700">{b.name}</p>
                                  <p className="text-[8px] text-slate-400">{b.category}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {selectedBiller && (
                          <div className="space-y-3 animate-fade-in">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                                {t.enter_bill_ac} ({selectedBiller.category})
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  required
                                  value={billAccountNo}
                                  onChange={(e) => setBillAccountNo(e.target.value)}
                                  placeholder="e.g. AC-991204"
                                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (billAccountNo) {
                                      setFetchedBillAmount(selectedBiller.charge);
                                      setAmount(selectedBiller.charge.toString());
                                    }
                                  }}
                                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] px-3.5 rounded-xl cursor-pointer transition active:scale-95 shrink-0"
                                >
                                  {t.fetch_bill_btn}
                                </button>
                              </div>
                            </div>

                            {/* Show auto bill amount fetched info */}
                            {fetchedBillAmount !== null && (
                              <form onSubmit={handleTransactionSubmit} className="space-y-3 animate-slide-up">
                                <div className="p-2.5 bg-yellow-50 border border-yellow-100 rounded-xl flex items-center justify-between">
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-500">{t.bill_amount_info}</p>
                                    <p className="text-sm font-black text-red-600 font-mono">৳ {fetchedBillAmount}.00 BDT</p>
                                  </div>
                                  <span className="text-xs">✅ Bill Found</span>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                                    {t.pin_confirm_label}
                                  </label>
                                  <input
                                    type="password"
                                    required
                                    maxLength={4}
                                    value={pinCode}
                                    onChange={(e) => setPinCode(e.target.value)}
                                    placeholder="••••"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold tracking-widest focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
                                  />
                                </div>

                                {formError && (
                                  <div className="p-2 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold">
                                    {formError}
                                  </div>
                                )}

                                <button
                                  id="bill-submit"
                                  type="submit"
                                  disabled={isSubmitting}
                                  className="w-full py-2.5 bg-gradient-to-r from-red-600 to-orange-500 text-white text-xs font-black rounded-xl shadow cursor-pointer transition active:scale-[0.98] flex items-center justify-center gap-1.5"
                                >
                                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                                  <span>{t.pay_bill_btn}</span>
                                </button>
                              </form>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* SCREEN: AGENT REGISTER CUSTOMER/MERCHANT (AGENT EXCLUSIVE) */}
                    {currentScreen === "agent_register_user" && (
                      <motion.div
                        key="agent-register-user-screen"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100"
                      >
                        <div className="flex items-center gap-3 mb-4 select-none">
                          <button
                            onClick={() => navigateTo("home")}
                            className="p-1 text-slate-500 hover:text-orange-500 cursor-pointer"
                          >
                            ← {lang === "bn" ? "হোম" : "Back"}
                          </button>
                          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                            📝 {lang === "bn" ? "ইউজার নিবন্ধন পোর্টাল" : "Register New User"}
                          </h2>
                        </div>

                        <form onSubmit={handleAgentRegisterSubmit} className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                              {lang === "bn" ? "অ্যাকাউন্টের ধরণ" : "Account Type"}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {(["Customer", "Merchant"] as const).map((r) => (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => setAgentRegRole(r)}
                                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                                    agentRegRole === r
                                      ? "bg-orange-500 text-white border-orange-500"
                                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  {r === "Customer" ? (lang === "bn" ? "গ্রাহক (Customer)" : "Customer") : (lang === "bn" ? "মার্চেন্ট (Merchant)" : "Merchant")}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                              {lang === "bn" ? "পূর্ণ নাম" : "Full Name"}
                            </label>
                            <input
                              type="text"
                              required
                              value={agentRegName}
                              onChange={(e) => setAgentRegName(e.target.value)}
                              placeholder={lang === "bn" ? "গ্রাহক / মার্চেন্ট এর নাম" : "Customer / Merchant full name"}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                              {lang === "bn" ? "মোবাইল নাম্বার" : "Mobile Number"}
                            </label>
                            <input
                              type="tel"
                              required
                              maxLength={11}
                              value={agentRegPhone}
                              onChange={(e) => setAgentRegPhone(e.target.value)}
                              placeholder="01XXXXXXXXX"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white font-mono"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                                {lang === "bn" ? "৪-ডিজিট পিন" : "4-Digit PIN"}
                              </label>
                              <input
                                type="password"
                                required
                                maxLength={4}
                                value={agentRegPin}
                                onChange={(e) => setAgentRegPin(e.target.value)}
                                placeholder="••••"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold tracking-widest text-center focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                                {lang === "bn" ? "পিন নিশ্চিত করুন" : "Confirm PIN"}
                              </label>
                              <input
                                type="password"
                                required
                                maxLength={4}
                                value={agentRegConfirmPin}
                                onChange={(e) => setAgentRegConfirmPin(e.target.value)}
                                placeholder="••••"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold tracking-widest text-center focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
                              />
                            </div>
                          </div>

                          <div className="border-t border-slate-100 pt-3 mt-1">
                            <label className="block text-[10px] font-black text-slate-750 uppercase tracking-wide mb-1">
                              🛡️ {lang === "bn" ? "এজেন্ট পিন নম্বর (অনুমোদনের জন্য)" : "Agent PIN (Authorize)"}
                            </label>
                            <input
                              type="password"
                              required
                              maxLength={4}
                              value={agentRegAuthorizePin}
                              onChange={(e) => setAgentRegAuthorizePin(e.target.value)}
                              placeholder="••••"
                              className="w-full bg-orange-50/50 border border-orange-200 rounded-xl py-2.5 px-3 text-xs font-bold tracking-widest text-center focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
                            />
                          </div>

                          {agentRegError && (
                            <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-semibold">
                              {agentRegError}
                            </div>
                          )}

                          {agentRegSuccess && (
                            <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-semibold">
                              {agentRegSuccess}
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={isAgentRegistering}
                            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow transition active:scale-[0.98] flex items-center justify-center gap-1.5"
                          >
                            {isAgentRegistering && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                            <span>{lang === "bn" ? "নিবন্ধন সম্পন্ন করুন" : "Complete Registration"}</span>
                          </button>
                        </form>
                      </motion.div>
                    )}

                    {/* SCREEN: CASH IN (AGENT EXCLUSIVE) */}
                    {currentScreen === "cash_in" && (
                      <motion.div
                        key="cash-in-screen"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100"
                      >
                        <div className="flex items-center gap-3 mb-4 select-none">
                          <button
                            onClick={() => navigateTo("home")}
                            className="p-1 text-slate-500 hover:text-orange-500 cursor-pointer animate-pulse"
                          >
                            ← Back
                          </button>
                          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                            💸 Agent Cash In
                          </h2>
                        </div>

                        <form onSubmit={handleTransactionSubmit} className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                              Customer Mobile Number
                            </label>
                            <input
                              type="tel"
                              required
                              value={targetPhone}
                              onChange={(e) => setTargetPhone(e.target.value)}
                              placeholder="01XXXXXXXXX"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                              Amount (৳)
                            </label>
                            <input
                              type="number"
                              required
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              placeholder="৳ 0.00"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-black text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                              Agent 4-Digit PIN
                            </label>
                            <input
                              type="password"
                              required
                              maxLength={4}
                              value={pinCode}
                              onChange={(e) => setPinCode(e.target.value)}
                              placeholder="••••"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold tracking-widest focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
                            />
                          </div>

                          {formError && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-[11px] font-bold">
                              {formError}
                            </div>
                          )}

                          <button
                            id="cash-in-submit"
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-black rounded-xl shadow cursor-pointer transition active:scale-[0.98] flex items-center justify-center gap-1.5"
                          >
                            {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                            <span>Confirm Cash-In</span>
                          </button>
                        </form>
                      </motion.div>
                    )}

                    {/* SCREEN: MERCHANT WITHDRAW / SETTLEMENT */}
                    {currentScreen === "merchant_withdraw" && (
                      <motion.div
                        key="merchant-withdraw-screen"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100"
                      >
                        <div className="flex items-center gap-3 mb-4 select-none">
                          <button
                            onClick={() => navigateTo("home")}
                            className="p-1 text-slate-500 hover:text-orange-500 cursor-pointer animate-pulse"
                          >
                            ← Back
                          </button>
                          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                            🏦 Merchant Withdrawal / Settlement
                          </h2>
                        </div>

                        <form onSubmit={handleTransactionSubmit} className="space-y-4">
                          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Settlement Account</span>
                            <p className="text-xs font-bold text-slate-700 mt-1">Merchant bank settlement card</p>
                            <p className="text-[10px] font-mono text-slate-500 mt-0.5">Route: Standard Auto Clearing (BEFTN)</p>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                              Withdraw Amount (৳)
                            </label>
                            <input
                              type="number"
                              required
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              placeholder="৳ 0.00"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-black text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                              Maximum balance available: ৳{loggedUser.balance}
                            </p>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                              Merchant 4-Digit PIN
                            </label>
                            <input
                              type="password"
                              required
                              maxLength={4}
                              value={pinCode}
                              onChange={(e) => setPinCode(e.target.value)}
                              placeholder="••••"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold tracking-widest focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
                            />
                          </div>

                          {formError && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-[11px] font-bold">
                              {formError}
                            </div>
                          )}

                          <button
                            id="merchant-withdraw-submit"
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-black rounded-xl shadow cursor-pointer transition active:scale-[0.98] flex items-center justify-center gap-1.5"
                          >
                            {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                            <span>Confirm Settlement</span>
                          </button>
                        </form>
                      </motion.div>
                    )}

                    {/* SCREEN: SUCCESS RECEIPT */}
                    {currentScreen === "success_receipt" && latestTxn && (
                      <motion.div
                        key="receipt-screen"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white p-5 rounded-2xl shadow-md border border-slate-100 text-center select-none"
                      >
                        {/* Interactive success seal */}
                        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto text-white shadow-lg animate-bounce mt-2 relative">
                          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                          <span className="absolute -top-1 -right-1 animate-ping w-4 h-4 bg-emerald-400 rounded-full opacity-50"></span>
                        </div>

                        <h2 className="text-base font-black text-slate-800 mt-4">
                          {t.success_receipt}
                        </h2>
                        <p className="text-[10px] text-slate-400 font-bold tracking-wider mt-0.5">
                          {latestTxn.type} Successful
                        </p>

                        {/* Transaction Receipt Block */}
                        <div className="mt-5 bg-slate-50 rounded-xl p-4 text-left space-y-2.5 border border-slate-100 font-sans">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold">{t.txn_id}:</span>
                            <span className="font-mono font-black text-red-600 text-[11px]">
                              {latestTxn.txn_id}
                            </span>
                          </div>

                          <div className="border-t border-dashed border-slate-200 my-1"></div>

                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold">{t.receipt_target}:</span>
                            <span className="font-bold text-slate-700">{latestTxn.receiver_phone}</span>
                          </div>

                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold">{t.receipt_amount}:</span>
                            <span className="font-black text-slate-800 font-mono">
                              ৳ {latestTxn.amount.toFixed(2)} BDT
                            </span>
                          </div>

                          {latestTxn.fee > 0 && (
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400 font-bold">{t.receipt_fee}:</span>
                              <span className="font-black text-red-500 font-mono">
                                ৳ {latestTxn.fee.toFixed(2)} BDT
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold">{t.receipt_date}:</span>
                            <span className="font-semibold text-slate-500 text-[10px]">
                              {new Date(latestTxn.timestamp).toLocaleString(lang === "bn" ? "bn-BD" : "en-US")}
                            </span>
                          </div>
                        </div>

                        <button
                          id="receipt-done"
                          onClick={() => {
                            setLatestTxn(null);
                            navigateTo("home");
                          }}
                          className="mt-6 w-full py-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black rounded-xl shadow cursor-pointer transition active:scale-[0.98]"
                        >
                          {t.ok_btn}
                        </button>
                      </motion.div>
                    )}

                    {/* TAB SCREEN: STATEMENT STATEMENT LOGS */}
                    {currentTab === "txn" && (
                      <motion.div
                        key="txn-tab-content"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-3"
                      >
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            {lang === "bn" ? "লেনদেন বিবরণী" : "Passbook Statement"}
                          </h2>
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                            {userTransactions.length} Total
                          </span>
                        </div>

                        {/* Transactions Statement List */}
                        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                          {userTransactions.map((tx) => {
                            const isIncoming = tx.receiver_phone.includes(loggedUser.phone) || tx.receiver_phone === loggedUser.phone;
                            return (
                              <div
                                key={tx.id}
                                className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`px-2 py-0.5 text-[8px] font-bold rounded text-white ${
                                      tx.type === "Send Money" ? "bg-blue-500" :
                                      tx.type === "Cash Out" ? "bg-amber-500" :
                                      tx.type === "Cash In" ? "bg-emerald-500" : 
                                      tx.type === "Merchant Payment" ? "bg-indigo-500" :
                                      tx.type === "Drive Offer" ? "bg-red-500" : "bg-purple-500"
                                    }`}>
                                      {tx.type}
                                    </span>
                                    {tx.status === "Pending" && (
                                      <span className="px-1.5 py-0.2 text-[8px] font-bold bg-amber-100 text-amber-800 border border-amber-300 rounded animate-pulse">
                                        Pending
                                      </span>
                                    )}
                                    {tx.status === "Rejected" && (
                                      <span className="px-1.5 py-0.2 text-[8px] font-bold bg-red-100 text-red-700 border border-red-200 rounded">
                                        Rejected
                                      </span>
                                    )}
                                    <span className="font-mono text-[9px] font-bold text-slate-400">{tx.txn_id}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-500">
                                    {isIncoming ? `${lang === "bn" ? "প্রেরক" : "Sender"}: ${tx.sender_phone}` : `${lang === "bn" ? "গ্রহীতা" : "Recipient"}: ${tx.receiver_phone}`}
                                  </p>
                                  <p className="text-[8px] text-slate-400">
                                    {new Date(tx.timestamp).toLocaleString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className={`text-xs font-black font-mono ${isIncoming ? "text-emerald-600" : "text-slate-800"}`}>
                                    {isIncoming ? "+" : "-"} ৳ {tx.amount.toFixed(2)}
                                  </p>
                                  {tx.fee > 0 && (
                                    <p className="text-[8px] text-red-500">Fee: ৳ {tx.fee.toFixed(2)}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {userTransactions.length === 0 && (
                            <p className="text-center text-slate-400 text-xs py-8">
                              {lang === "bn" ? "কোনো লেনদেন রেকর্ড পাওয়া যায়নি।" : "No transaction logs found."}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* TAB SCREEN: NOTICE BOARD */}
                    {currentTab === "contacts" && (
                      <motion.div
                        key="notices-tab-content"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-3"
                      >
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-1.5">
                              <Bell className="w-4 h-4 text-red-500 animate-bounce" />
                              <h2 className="text-sm font-black text-slate-800">
                                {lang === "bn" ? "বিজ্ঞপ্তি বোর্ড" : "Notice Board"}
                              </h2>
                            </div>
                            <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold">
                              {(dbState.notices || []).length} {lang === "bn" ? "টি নোটিশ" : "Notices"}
                            </span>
                          </div>

                          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                            {(dbState.notices || []).map((notice: any) => (
                              <div
                                key={notice.id}
                                className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 hover:border-red-200 transition"
                              >
                                <div className="flex justify-between items-start gap-2">
                                  <h3 className="text-xs font-black text-slate-800 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                                    {notice.title}
                                  </h3>
                                  <span className="text-[8px] font-mono font-bold text-slate-400 whitespace-nowrap">
                                    {new Date(notice.timestamp).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit"
                                    })}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                                  {notice.content}
                                </p>
                              </div>
                            ))}

                            {(!dbState.notices || dbState.notices.length === 0) && (
                              <div className="text-center py-12 space-y-2">
                                <span className="text-3xl">📭</span>
                                <p className="text-slate-400 text-xs font-bold">
                                  {lang === "bn" ? "বর্তমানে কোনো নোটিশ নেই।" : "No notices available currently."}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* TAB SCREEN: MY ACCOUNT & DIAGNOSTICS */}
                    {currentTab === "my_account" && (
                      <motion.div
                        key="my-account-tab-content"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        {/* Profile Info block */}
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-orange-500 text-white font-black flex items-center justify-center text-base shadow shadow-orange-500/20">
                            {loggedUser.name.charAt(0)}
                          </div>
                          <div className="leading-tight">
                            <h3 className="text-sm font-black text-slate-800">{loggedUser.name}</h3>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{loggedUser.phone}</p>
                            <span className="inline-block px-2 py-0.5 rounded text-[8px] font-black bg-orange-100 text-orange-600 border border-orange-200 uppercase tracking-widest mt-1">
                              {loggedUser.role} Account
                            </span>
                          </div>
                        </div>

                        {/* Language Selection menu */}
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center select-none">
                          <span className="text-xs font-bold text-slate-700">Language / ভাষা</span>
                          <button
                            onClick={() => setLang((prev) => (prev === "bn" ? "en" : "bn"))}
                            className="px-3.5 py-1 bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 border border-slate-200 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer"
                          >
                            {lang === "bn" ? "English এ পরিবর্তন" : "বাংলা তে পরিবর্তন"}
                          </button>
                        </div>

                        {/* Interactive sign-out */}
                        <button
                          id="btn-logout"
                          onClick={() => setLoggedUser(null)}
                          className="w-full py-3 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl text-red-600 font-bold text-xs text-center transition active:scale-[0.98] cursor-pointer"
                        >
                          {lang === "bn" ? "লগ আউট করুন" : "Log Out"}
                        </button>

                        {/* DISCREET SYSTEM CONTROL PANEL & POSTGRESQL VIEWS (Tucked away professionally) */}
                        <div className="border-t border-slate-200/80 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsDiagOpen(!isDiagOpen)}
                            className="w-full py-2 px-3.5 bg-slate-900 hover:bg-slate-950 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-between transition cursor-pointer"
                          >
                            <span>⚙️ {t.diagnostic_panel}</span>
                            <span>{isDiagOpen ? "▲ Close" : "▼ Open"}</span>
                          </button>

                          {isDiagOpen && (
                            <div className="mt-3 bg-slate-900 text-slate-300 p-4 rounded-2xl border border-slate-850 space-y-4 text-[10px] font-medium leading-relaxed font-mono animate-slide-up select-text">
                              <div>
                                <p className="text-yellow-400 font-bold uppercase tracking-wider">🔒 DEVELOPER DECK & SQL TRANSACTION AUDITS</p>
                                <p className="text-[9px] text-slate-400 mt-0.5 leading-snug">{t.diagnostics_desc}</p>
                              </div>

                              <button
                                onClick={handleResetDB}
                                className="w-full py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-[9px] uppercase tracking-wider rounded border border-red-500 transition active:scale-95 cursor-pointer"
                              >
                                ⚠️ {t.reset_db_btn}
                              </button>

                              {/* Users details */}
                              <div className="space-y-1">
                                <p className="text-sky-400 font-bold uppercase tracking-wider">👥 {t.active_users}</p>
                                <div className="overflow-x-auto max-h-[140px] border border-slate-800 rounded bg-slate-950">
                                  <table className="w-full text-left border-collapse text-[9px]">
                                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 sticky top-0">
                                      <tr>
                                        <th className="p-1">Name</th>
                                        <th className="p-1">Phone</th>
                                        <th className="p-1">Role</th>
                                        <th className="p-1 text-right">Balance</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-850">
                                      {dbState.users.map((u) => {
                                        const wallet = dbState.wallets.find(w => w.user_id === u.id);
                                        return (
                                          <tr key={u.id} className="hover:bg-slate-900">
                                            <td className="p-1 font-bold">{u.name}</td>
                                            <td className="p-1 text-slate-300">{u.phone}</td>
                                            <td className="p-1 text-yellow-500">{u.role}</td>
                                            <td className="p-1 text-right text-emerald-400 font-bold">৳{wallet?.balance}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* Transaction monitor ledger */}
                              <div className="space-y-1">
                                <p className="text-sky-400 font-bold uppercase tracking-wider">📊 {t.txn_history_global}</p>
                                <div className="overflow-x-auto max-h-[140px] border border-slate-800 rounded bg-slate-950">
                                  <table className="w-full text-left border-collapse text-[9px]">
                                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 sticky top-0">
                                      <tr>
                                        <th className="p-1">TXN</th>
                                        <th className="p-1">Type</th>
                                        <th className="p-1">Sender</th>
                                        <th className="p-1">Receiver</th>
                                        <th className="p-1 text-right">Amount</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-850">
                                      {dbState.transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-slate-900">
                                          <td className="p-1 font-bold text-red-400">{tx.txn_id}</td>
                                          <td className="p-1">{tx.type}</td>
                                          <td className="p-1">{tx.sender_phone}</td>
                                          <td className="p-1 truncate max-w-[80px]">{tx.receiver_phone}</td>
                                          <td className="p-1 text-right text-emerald-400 font-bold">৳{tx.amount}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* Live raw SQL stream logs */}
                              <div className="space-y-1">
                                <p className="text-sky-400 font-bold uppercase tracking-wider">⚡ {t.live_sql_stream}</p>
                                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 max-h-[140px] overflow-y-auto space-y-1.5 text-[9px] leading-relaxed select-text">
                                  {logs.map((log, idx) => (
                                    <div key={idx} className="border-b border-slate-900 pb-1 flex flex-col">
                                      <span className="text-[8px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                      <span className="text-slate-300 font-normal">
                                        <span className="text-emerald-400 font-bold uppercase mr-1">[{log.type}]</span>
                                        {log.message}
                                      </span>
                                    </div>
                                  ))}
                                  {logs.length === 0 && <span className="text-slate-500 italic">Waiting for SQL statements...</span>}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>

                {/* BOTTOM NAVIGATION TAB BAR */}
                <nav className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 flex justify-around items-center select-none shrink-0 z-20">
                  <button
                    onClick={() => {
                      navigateTo("home");
                      setCurrentTab("home");
                    }}
                    className={`flex-1 h-full flex flex-col items-center justify-center gap-1 cursor-pointer transition ${
                      currentTab === "home" ? "text-red-500 font-bold" : "text-slate-400"
                    }`}
                  >
                    <Home className="w-5 h-5" />
                    <span className="text-[10px]">{t.home_tab}</span>
                  </button>

                  <button
                    onClick={() => {
                      navigateTo("home");
                      setCurrentTab("txn");
                    }}
                    className={`flex-1 h-full flex flex-col items-center justify-center gap-1 cursor-pointer transition ${
                      currentTab === "txn" ? "text-red-500 font-bold" : "text-slate-400"
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                    <span className="text-[10px]">{t.txn_tab}</span>
                  </button>

                  <button
                    onClick={() => {
                      navigateTo("home");
                      setCurrentTab("contacts");
                    }}
                    className={`flex-1 h-full flex flex-col items-center justify-center gap-1 cursor-pointer transition ${
                      currentTab === "contacts" ? "text-red-500 font-bold" : "text-slate-400"
                    }`}
                  >
                    <Bell className="w-5 h-5" />
                    <span className="text-[10px]">{t.contacts_tab}</span>
                  </button>

                  <button
                    onClick={() => {
                      navigateTo("home");
                      setCurrentTab("my_account");
                    }}
                    className={`flex-1 h-full flex flex-col items-center justify-center gap-1 cursor-pointer transition ${
                      currentTab === "my_account" ? "text-red-500 font-bold" : "text-slate-400"
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <span className="text-[10px]">{t.my_nagad_tab}</span>
                  </button>
                </nav>

              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
