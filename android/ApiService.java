package com.example.nagadclone;

import java.util.HashMap;
import java.util.List;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.Query;

/**
 * Nagad Clone - Secure MFS Retrofit Endpoint Definitions
 */
public interface ApiService {

    @POST("api/v1/login")
    Call<MainActivity.AuthResponse> login(
            @Body HashMap<String, String> credentials
    );

    @POST("api/v1/register")
    Call<MainActivity.RegisterResponse> register(
            @Body HashMap<String, String> userInfo
    );

    @POST("api/v1/send-money")
    Call<MainActivity.TxnResponse> sendMoney(
            @Body HashMap<String, Object> payload
    );

    @POST("api/v1/cash-out")
    Call<MainActivity.TxnResponse> cashOut(
            @Body HashMap<String, Object> payload
    );

    @POST("api/v1/cash-in")
    Call<MainActivity.TxnResponse> cashIn(
            @Body HashMap<String, Object> payload
    );

    @POST("api/v1/recharge")
    Call<MainActivity.TxnResponse> mobileRecharge(
            @Body HashMap<String, Object> payload
    );

    @GET("api/v1/transactions")
    Call<List<MainActivity.TxnResponse.TxnObject>> getTransactions(
            @Query("phone") String phone
    );
}
