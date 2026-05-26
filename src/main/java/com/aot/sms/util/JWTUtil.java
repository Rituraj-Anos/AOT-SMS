package com.aot.sms.util;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.NoSuchAlgorithmException;
import java.security.InvalidKeyException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * Manual JSON Web Token (HS256) implementation.
 *
 * NO external library. Uses java.util.Base64 + javax.crypto.Mac for signing.
 *
 * Issued tokens look like:
 *   header.payload.signature
 *
 * Header  = {"alg":"HS256","typ":"JWT"}
 * Payload = { sub, role, name, uid, iat, exp }
 *
 * Suitable for the AOT SMS use case (single-machine deployment, single
 * shared secret). Do NOT use for cross-service / production-grade auth.
 */
public final class JWTUtil {

    /** Secret — override with environment variable APP_JWT_SECRET in prod. */
    private static final String SECRET = System.getenv().getOrDefault(
            "APP_JWT_SECRET",
            "8f5c1a4d9e2b7f3a6c0d8e1b4f7a2d5c8e0b3f6a9d2c5e8b1f4a7d0c3e6b9f2a"
    );

    /** 4 hours by default. */
    public static final long ACCESS_TTL_SECONDS = 4 * 60 * 60;

    /** Cookie name for the httpOnly session token. */
    public static final String COOKIE_NAME = "aot_sms_token";

    private JWTUtil() {}

    /** Issue a signed JWT for the given subject + claims. */
    public static String issue(String userId, String role, String displayName, int entityId) {
        long now = System.currentTimeMillis() / 1000L;
        long exp = now + ACCESS_TTL_SECONDS;

        // Header
        String header = base64UrlEncode(("{\"alg\":\"HS256\",\"typ\":\"JWT\"}").getBytes(StandardCharsets.UTF_8));

        // Payload — minimal hand-rolled JSON; values are short and safe (no quotes inside)
        String payloadJson = "{"
                + "\"sub\":\""  + escape(userId)        + "\","
                + "\"role\":\"" + escape(role)          + "\","
                + "\"name\":\"" + escape(displayName)   + "\","
                + "\"uid\":"    + entityId              + ","
                + "\"iat\":"    + now                   + ","
                + "\"exp\":"    + exp
                + "}";
        String payload = base64UrlEncode(payloadJson.getBytes(StandardCharsets.UTF_8));

        String signingInput = header + "." + payload;
        String signature    = base64UrlEncode(hmacSha256(signingInput));
        return signingInput + "." + signature;
    }

    /** Returns the parsed claims if the token is valid + unexpired, else null. */
    public static Map<String, String> validate(String token) {
        if (token == null || token.isBlank()) return null;
        String[] parts = token.split("\\.");
        if (parts.length != 3) return null;

        String signingInput  = parts[0] + "." + parts[1];
        String expectedSig   = base64UrlEncode(hmacSha256(signingInput));
        if (!constantTimeEquals(expectedSig, parts[2])) return null;

        String payloadJson;
        try {
            payloadJson = new String(base64UrlDecode(parts[1]), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) { return null; }

        Map<String, String> claims = parseJsonFlat(payloadJson);
        try {
            long now = System.currentTimeMillis() / 1000L;
            long exp = Long.parseLong(claims.getOrDefault("exp", "0"));
            if (now >= exp) return null;
        } catch (NumberFormatException e) { return null; }
        return claims;
    }

    // ── helpers ───────────────────────────────────────────────────────

    private static byte[] hmacSha256(String input) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return mac.doFinal(input.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("HmacSHA256 unavailable", e);
        }
    }

    private static String base64UrlEncode(byte[] data) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(data);
    }

    private static byte[] base64UrlDecode(String s) {
        return Base64.getUrlDecoder().decode(s);
    }

    private static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null || a.length() != b.length()) return false;
        int r = 0;
        for (int i = 0; i < a.length(); i++) r |= a.charAt(i) ^ b.charAt(i);
        return r == 0;
    }

    private static String escape(String s) {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder(s.length());
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '\\': sb.append("\\\\"); break;
                case '"':  sb.append("\\\""); break;
                case '\n': sb.append("\\n");  break;
                case '\r': sb.append("\\r");  break;
                case '\t': sb.append("\\t");  break;
                default:   if (c < 0x20) sb.append(String.format("\\u%04x", (int) c));
                           else sb.append(c);
            }
        }
        return sb.toString();
    }

    /**
     * Minimal flat JSON parser that handles the small claim set we issue.
     * Keys are unquoted in the result map. Values are strings, but numeric
     * fields (uid, iat, exp) come back as their raw digit string.
     */
    private static Map<String, String> parseJsonFlat(String json) {
        Map<String, String> out = new HashMap<>();
        if (json == null || json.length() < 2) return out;

        // strip outer braces
        json = json.trim();
        if (json.startsWith("{")) json = json.substring(1);
        if (json.endsWith("}"))   json = json.substring(0, json.length() - 1);

        int i = 0, n = json.length();
        while (i < n) {
            // skip whitespace and commas
            while (i < n && (json.charAt(i) == ' ' || json.charAt(i) == ',' || json.charAt(i) == '\t')) i++;
            if (i >= n) break;
            // expect quoted key
            if (json.charAt(i) != '"') break;
            int kStart = ++i;
            while (i < n && json.charAt(i) != '"') i++;
            String key = json.substring(kStart, i);
            i++; // consume closing "
            // skip until colon
            while (i < n && json.charAt(i) != ':') i++;
            i++; // consume :
            while (i < n && json.charAt(i) == ' ') i++;
            if (i >= n) break;
            String value;
            if (json.charAt(i) == '"') {
                int vStart = ++i;
                while (i < n && json.charAt(i) != '"') {
                    if (json.charAt(i) == '\\' && i + 1 < n) i += 2; else i++;
                }
                value = json.substring(vStart, i);
                i++;
            } else {
                int vStart = i;
                while (i < n && json.charAt(i) != ',' && json.charAt(i) != '}') i++;
                value = json.substring(vStart, i).trim();
            }
            out.put(key, value);
        }
        return out;
    }
}
