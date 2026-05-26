package com.aot.sms.util;

/**
 * Standard JSON envelope: { success, data, message }.
 * Use with Gson via JSONUtil.toJson(ApiResponse.ok(...)).
 */
public class ApiResponse {

    public boolean success;
    public Object  data;
    public String  message;

    public ApiResponse() {}

    private ApiResponse(boolean success, Object data, String message) {
        this.success = success;
        this.data = data;
        this.message = message;
    }

    public static ApiResponse ok(Object data) {
        return new ApiResponse(true, data, null);
    }

    public static ApiResponse ok(Object data, String message) {
        return new ApiResponse(true, data, message);
    }

    public static ApiResponse error(String message) {
        return new ApiResponse(false, null, message);
    }
}
