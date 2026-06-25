package com.example.nagadclone;

import android.content.Context;
import android.os.Bundle;
import android.os.Handler;
import android.text.TextUtils;
import android.view.View;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.GridLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

import java.text.NumberFormat;
import java.util.HashMap;
import java.util.Locale;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Nagad Clone - MainActivity (Java)
 * Implements MFS authentication, "Tap for Balance" animation, and full transaction flows.
 */
public class MainActivity extends AppCompatActivity {

    // Views for Auth Layout
    private LinearLayout layoutAuth;
    private EditText etPhone, etPin;
    private Button btnLogin, btnRegister;

    // Views for Dashboard Layout
    private LinearLayout layoutDashboard;
    private TextView tvUserName, tvUserPhone, tvBalanceText;
    private FrameLayout btnTapForBalance;
    private ProgressBar pbLoading;

    // Feature Grid Buttons
    private LinearLayout btnSendMoney, btnCashOut, btnCashIn, btnRecharge, btnHistory;

    // Current User Session Data
    private String userToken = "";
    private String currentUserPhone = "";
    private String currentUserName = "";
    private double currentUserBalance = 0.0;

    // "Tap for Balance" state
    private boolean isBalanceShowing = false;
    private final Handler balanceHandler = new Handler();
    private Runnable balanceResetRunnable;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        initializeViews();
        setupClickListeners();
    }

    private void initializeViews() {
        // Container Layouts
        layoutAuth = findViewById(R.id.layoutAuth);
        layoutDashboard = findViewById(R.id.layoutDashboard);

        // Authentication Inputs
        etPhone = findViewById(R.id.etPhone);
        etPin = findViewById(R.id.etPin);
        btnLogin = findViewById(R.id.btnLogin);
        btnRegister = findViewById(R.id.btnRegister);

        // Dashboard Header
        tvUserName = findViewById(R.id.tvUserName);
        tvUserPhone = findViewById(R.id.tvUserPhone);
        tvBalanceText = findViewById(R.id.tvBalanceText);
        btnTapForBalance = findViewById(R.id.btnTapForBalance);
        pbLoading = findViewById(R.id.pbLoading);

        // Features Grid
        btnSendMoney = findViewById(R.id.btnSendMoney);
        btnCashOut = findViewById(R.id.btnCashOut);
        btnCashIn = findViewById(R.id.btnCashIn);
        btnRecharge = findViewById(R.id.btnRecharge);
        btnHistory = findViewById(R.id.btnHistory);
    }

    private void setupClickListeners() {
        // Authenticate User Login
        btnLogin.setOnClickListener(v -> performLogin());

        // Dynamic Self-Registration trigger
        btnRegister.setOnClickListener(v -> showRegistrationDialog());

        // "Tap for Balance" Hidden TextView animation (Nagad style interaction)
        btnTapForBalance.setOnClickListener(v -> toggleBalanceTapAnimation());

        // MFS Operations Click Handlers
        btnSendMoney.setOnClickListener(v -> showTransactionDialog("Send Money"));
        btnCashOut.setOnClickListener(v -> showTransactionDialog("Cash Out"));
        btnCashIn.setOnClickListener(v -> showTransactionDialog("Cash In"));
        btnRecharge.setOnClickListener(v -> showRechargeDialog());
        btnHistory.setOnClickListener(v -> showHistoryDialog());
    }

    /**
     * Authenticate via secure Node.js API with Retrofit
     */
    private void performLogin() {
        String phone = etPhone.getText().toString().trim();
        String pin = etPin.getText().toString().trim();

        if (TextUtils.isEmpty(phone) || phone.length() < 11) {
            etPhone.setError("Enter 11-digit Phone Number");
            return;
        }
        if (TextUtils.isEmpty(pin) || pin.length() != 4) {
            etPin.setError("Enter 4-digit PIN");
            return;
        }

        pbLoading.setVisibility(View.VISIBLE);

        HashMap<String, String> credentials = new HashMap<>();
        credentials.put("phone", phone);
        credentials.put("pin", pin);

        ApiService api = RetrofitClient.getApiService();
        api.login(credentials).enqueue(new Callback<AuthResponse>() {
            @Override
            public void onResponse(Call<AuthResponse> call, Response<AuthResponse> response) {
                pbLoading.setVisibility(View.GONE);
                if (response.isSuccessful() && response.body() != null) {
                    AuthResponse auth = response.body();
                    userToken = auth.token;
                    currentUserPhone = auth.user.phone;
                    currentUserName = auth.user.name;
                    currentUserBalance = auth.user.balance;

                    enterDashboard();
                } else {
                    Toast.makeText(MainActivity.this, "Authentication Failed: Invalid Phone or PIN", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<AuthResponse> call, Throwable t) {
                pbLoading.setVisibility(View.GONE);
                Toast.makeText(MainActivity.this, "Network error. Is backend server running?", Toast.LENGTH_LONG).show();
            }
        });
    }

    private void enterDashboard() {
        layoutAuth.setVisibility(View.GONE);
        layoutDashboard.setVisibility(View.VISIBLE);

        tvUserName.setText(currentUserName);
        tvUserPhone.setText(currentUserPhone);
        tvBalanceText.setText("Tap for Balance");
        isBalanceShowing = false;
    }

    /**
     * Sliding / Translation dynamic animation for Nagad-style "Tap for Balance" view
     */
    private void toggleBalanceTapAnimation() {
        if (isBalanceShowing) return;

        isBalanceShowing = true;

        // Load slide-out/in animation of the TextView contents
        Animation slideOut = AnimationUtils.loadAnimation(this, R.anim.balance_slide_out);
        Animation slideIn = AnimationUtils.loadAnimation(this, R.anim.balance_slide_in);

        tvBalanceText.startAnimation(slideOut);

        slideOut.setAnimationListener(new Animation.AnimationListener() {
            @Override
            public void onAnimationStart(Animation animation) {}

            @Override
            public void onAnimationRepeat(Animation animation) {}

            @Override
            public void onAnimationEnd(Animation animation) {
                // Update text to show real balance with BDT currency symbol
                NumberFormat format = NumberFormat.getCurrencyInstance(new Locale("bn", "BD"));
                String currencyBalance = "৳ " + String.format(Locale.US, "%,.2f", currentUserBalance);
                tvBalanceText.setText(currencyBalance);
                tvBalanceText.startAnimation(slideIn);
            }
        });

        // Automatically hide/reset the balance after 3.5 seconds
        if (balanceResetRunnable != null) {
            balanceHandler.removeCallbacks(balanceResetRunnable);
        }

        balanceResetRunnable = () -> {
            if (isBalanceShowing) {
                Animation fadeOut = AnimationUtils.loadAnimation(MainActivity.this, R.anim.balance_slide_out);
                tvBalanceText.startAnimation(fadeOut);
                fadeOut.setAnimationListener(new Animation.AnimationListener() {
                    @Override
                    public void onAnimationStart(Animation animation) {}
                    @Override
                    public void onAnimationRepeat(Animation animation) {}
                    @Override
                    public void onAnimationEnd(Animation animation) {
                        tvBalanceText.setText("Tap for Balance");
                        tvBalanceText.startAnimation(AnimationUtils.loadAnimation(MainActivity.this, R.anim.balance_slide_in));
                        isBalanceShowing = false;
                    }
                });
            }
        };

        balanceHandler.postDelayed(balanceResetRunnable, 3500);
    }

    /**
     * MFS Register Dialog Modal
     */
    private void showRegistrationDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        View dialogView = getLayoutInflater().inflate(R.layout.dialog_register, null);
        builder.setView(dialogView);

        EditText etRegName = dialogView.findViewById(R.id.etRegName);
        EditText etRegPhone = dialogView.findViewById(R.id.etRegPhone);
        EditText etRegPin = dialogView.findViewById(R.id.etRegPin);
        Button btnConfirmReg = dialogView.findViewById(R.id.btnConfirmReg);

        AlertDialog dialog = builder.create();

        btnConfirmReg.setOnClickListener(v -> {
            String name = etRegName.getText().toString().trim();
            String phone = etRegPhone.getText().toString().trim();
            String pin = etRegPin.getText().toString().trim();

            if (TextUtils.isEmpty(name) || TextUtils.isEmpty(phone) || pin.length() != 4) {
                Toast.makeText(MainActivity.this, "Fill all details correctly", Toast.LENGTH_SHORT).show();
                return;
            }

            HashMap<String, String> body = new HashMap<>();
            body.put("name", name);
            body.put("phone", phone);
            body.put("role", "Customer");
            body.put("pin", pin);

            RetrofitClient.getApiService().register(body).enqueue(new Callback<RegisterResponse>() {
                @Override
                public void onResponse(Call<RegisterResponse> call, Response<RegisterResponse> response) {
                    if (response.isSuccessful()) {
                        Toast.makeText(MainActivity.this, "Registration Successful! Log in now", Toast.LENGTH_LONG).show();
                        etPhone.setText(phone);
                        dialog.dismiss();
                    } else {
                        Toast.makeText(MainActivity.this, "Failed: Phone already registered", Toast.LENGTH_SHORT).show();
                    }
                }

                @Override
                public void onFailure(Call<RegisterResponse> call, Throwable t) {
                    Toast.makeText(MainActivity.this, "Network Error", Toast.LENGTH_SHORT).show();
                }
            });
        });

        dialog.show();
    }

    /**
     * Multi-step Transaction Flow (Send Money, Cash In, Cash Out)
     */
    private void showTransactionDialog(final String transType) {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        View dialogView = getLayoutInflater().inflate(R.layout.dialog_transaction, null);
        builder.setView(dialogView);

        TextView tvTitle = dialogView.findViewById(R.id.tvDialogTitle);
        EditText etReceiver = dialogView.findViewById(R.id.etReceiverPhone);
        EditText etAmount = dialogView.findViewById(R.id.etTxnAmount);
        EditText etSecPin = dialogView.findViewById(R.id.etSecPin);
        Button btnAction = dialogView.findViewById(R.id.btnConfirmTxn);
        ProgressBar pbTxnLoading = dialogView.findViewById(R.id.pbTxnLoading);

        tvTitle.setText(transType);
        if (transType.equals("Cash Out")) {
            etReceiver.setHint("Agent Phone Number");
        } else if (transType.equals("Cash In")) {
            etReceiver.setHint("Customer Phone Number");
        }

        AlertDialog dialog = builder.create();

        btnAction.setOnClickListener(v -> {
            String receiver = etReceiver.getText().toString().trim();
            String amountStr = etAmount.getText().toString().trim();
            String pin = etSecPin.getText().toString().trim();

            if (TextUtils.isEmpty(receiver) || TextUtils.isEmpty(amountStr) || TextUtils.isEmpty(pin)) {
                Toast.makeText(MainActivity.this, "Please fill in all inputs", Toast.LENGTH_SHORT).show();
                return;
            }

            double amount = Double.parseDouble(amountStr);
            pbTxnLoading.setVisibility(View.VISIBLE);
            btnAction.setEnabled(false);

            // Retrofit Call Payload depending on types
            HashMap<String, Object> payload = new HashMap<>();
            payload.put("senderPhone", currentUserPhone);
            payload.put("receiverPhone", receiver);
            payload.put("amount", amount);
            payload.put("pin", pin);

            ApiService api = RetrofitClient.getApiService();
            Callback<TxnResponse> txnCallback = new Callback<TxnResponse>() {
                @Override
                public void onResponse(Call<TxnResponse> call, Response<TxnResponse> response) {
                    pbTxnLoading.setVisibility(View.GONE);
                    btnAction.setEnabled(true);

                    if (response.isSuccessful() && response.body() != null) {
                        TxnResponse result = response.body();
                        // Update cache balance dynamically
                        if (transType.equals("Send Money")) {
                            currentUserBalance -= (amount + (amount >= 500 ? 5 : 0));
                        } else if (transType.equals("Cash Out")) {
                            currentUserBalance -= (amount + (amount * 0.015));
                        } else if (transType.equals("Cash In")) {
                            currentUserBalance -= amount; // Agent float reduction
                        }

                        dialog.dismiss();
                        showReceiptDialog(transType, result.transaction);
                    } else {
                        Toast.makeText(MainActivity.this, "Transaction Denied: Insufficient Funds or Invalid PIN", Toast.LENGTH_LONG).show();
                    }
                }

                @Override
                public void onFailure(Call<TxnResponse> call, Throwable t) {
                    pbTxnLoading.setVisibility(View.GONE);
                    btnAction.setEnabled(true);
                    Toast.makeText(MainActivity.this, "Network / Node API Connection Failed", Toast.LENGTH_SHORT).show();
                }
            };

            // Switch Retrofit Endpoints securely
            if (transType.equals("Send Money")) {
                api.sendMoney(payload).enqueue(txnCallback);
            } else if (transType.equals("Cash Out")) {
                api.cashOut(payload).enqueue(txnCallback);
            } else if (transType.equals("Cash In")) {
                api.cashIn(payload).enqueue(txnCallback);
            }
        });

        dialog.show();
    }

    /**
     * Mobile Recharge Dialog (Customer)
     */
    private void showRechargeDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        View dialogView = getLayoutInflater().inflate(R.layout.dialog_recharge, null);
        builder.setView(dialogView);

        EditText etRechargePhone = dialogView.findViewById(R.id.etRechargePhone);
        EditText etRechargeAmt = dialogView.findViewById(R.id.etRechargeAmt);
        EditText etRechargePin = dialogView.findViewById(R.id.etRechargePin);
        TextView tvOperator = dialogView.findViewById(R.id.tvSelectedOperator);
        Button btnRechargeConfirm = dialogView.findViewById(R.id.btnConfirmRecharge);

        AlertDialog dialog = builder.create();

        btnRechargeConfirm.setOnClickListener(v -> {
            String phone = etRechargePhone.getText().toString().trim();
            String amountStr = etRechargeAmt.getText().toString().trim();
            String pin = etRechargePin.getText().toString().trim();

            if (phone.length() < 11 || TextUtils.isEmpty(amountStr) || pin.length() != 4) {
                Toast.makeText(MainActivity.this, "Enter correct recharge values", Toast.LENGTH_SHORT).show();
                return;
            }

            double amount = Double.parseDouble(amountStr);

            HashMap<String, Object> payload = new HashMap<>();
            payload.put("senderPhone", currentUserPhone);
            payload.put("receiverPhone", phone);
            payload.put("operator", tvOperator.getText().toString());
            payload.put("amount", amount);
            payload.put("pin", pin);

            RetrofitClient.getApiService().mobileRecharge(payload).enqueue(new Callback<TxnResponse>() {
                @Override
                public void onResponse(Call<TxnResponse> call, Response<TxnResponse> response) {
                    if (response.isSuccessful() && response.body() != null) {
                        currentUserBalance -= amount;
                        dialog.dismiss();
                        showReceiptDialog("Mobile Recharge", response.body().transaction);
                    } else {
                        Toast.makeText(MainActivity.this, "Recharge Refused: Insufficient balance", Toast.LENGTH_SHORT).show();
                    }
                }

                @Override
                public void onFailure(Call<TxnResponse> call, Throwable t) {
                    Toast.makeText(MainActivity.this, "Connection error", Toast.LENGTH_SHORT).show();
                }
            });
        });

        dialog.show();
    }

    /**
     * Success Receipt Dialog Modal
     */
    private void showReceiptDialog(String type, TxnResponse.TxnObject txn) {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        View view = getLayoutInflater().inflate(R.layout.dialog_receipt, null);
        builder.setView(view);

        TextView tvType = view.findViewById(R.id.tvReceiptType);
        TextView tvTxnId = view.findViewById(R.id.tvReceiptTxnId);
        TextView tvAmt = view.findViewById(R.id.tvReceiptAmount);
        TextView tvFee = view.findViewById(R.id.tvReceiptFee);
        TextView tvStatus = view.findViewById(R.id.tvReceiptStatus);
        Button btnOk = view.findViewById(R.id.btnReceiptOk);

        tvType.setText(type + " Successful");
        tvTxnId.setText("Txn ID: " + txn.txn_id);
        tvAmt.setText("Amount: ৳ " + String.format(Locale.US, "%,.2f", txn.amount));
        tvFee.setText("Charge: ৳ " + String.format(Locale.US, "%,.2f", txn.fee));
        tvStatus.setText("Status: " + txn.status);

        AlertDialog dialog = builder.create();
        btnOk.setOnClickListener(v -> dialog.dismiss());
        dialog.show();
    }

    /**
     * History Ledger Dialog Modal
     */
    private void showHistoryDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Transaction Ledger (" + currentUserPhone + ")");

        RetrofitClient.getApiService().getTransactions(currentUserPhone).enqueue(new Callback<java.util.List<TxnResponse.TxnObject>>() {
            @Override
            public void onResponse(Call<java.util.List<TxnResponse.TxnObject>> call, Response<java.util.List<TxnResponse.TxnObject>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    java.util.List<TxnResponse.TxnObject> txns = response.body();
                    String[] items = new String[txns.size()];
                    for (int i = 0; i < txns.size(); i++) {
                        TxnResponse.TxnObject t = txns.get(i);
                        items[i] = t.type + " - " + t.txn_id + "\nAmount: ৳ " + t.amount + " | Fee: ৳ " + t.fee + "\nStatus: " + t.status;
                    }
                    builder.setItems(items, null);
                } else {
                    builder.setMessage("No transactions logged.");
                }
                builder.setPositiveButton("Close", null).show();
            }

            @Override
            public void onFailure(Call<java.util.List<TxnResponse.TxnObject>> call, Throwable t) {
                Toast.makeText(MainActivity.this, "Failed to load history", Toast.LENGTH_SHORT).show();
            }
        });
    }

    // Models for JSON Responses
    public static class AuthResponse {
        public String token;
        public UserObject user;

        public static class UserObject {
            public int id;
            public String name;
            public String phone;
            public String role;
            public double balance;
        }
    }

    public static class RegisterResponse {
        public String message;
    }

    public static class TxnResponse {
        public String message;
        public TxnObject transaction;

        public static class TxnObject {
            public int id;
            public String type;
            public String sender_phone;
            public String receiver_phone;
            public double amount;
            public double fee;
            public String txn_id;
            public String status;
            public String timestamp;
        }
    }
}
