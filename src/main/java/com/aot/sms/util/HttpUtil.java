package com.aot.sms.util;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Set;

/**
 * Common HTTP helpers used across servlets:
 *  • CORS for React frontend (local dev + production) with credentials
 *  • JSON write helpers
 *  • Cookie reader
 */
public final class HttpUtil {

    /**
     * Allowed origins for credentialed CORS requests.
     * The CORS spec forbids "*" with Allow-Credentials: true,
     * so we echo the exact requesting origin if it's in our whitelist.
     */
    private static final Set<String> ALLOWED_ORIGINS = Set.of(
        "http://localhost:5173",
        "http://localhost:4173",
        "https://aot-sms.vercel.app"
    );

    /** Extra origin from env var (e.g. custom domain). */
    private static final String EXTRA_ORIGIN = System.getenv("APP_CORS_ORIGIN");

    private HttpUtil() {}

    private static boolean isAllowedOrigin(String origin) {
        if (origin == null) return false;
        if (ALLOWED_ORIGINS.contains(origin)) return true;
        if (EXTRA_ORIGIN != null && EXTRA_ORIGIN.equals(origin)) return true;
        // Allow any *.vercel.app subdomain for preview deployments
        if (origin.endsWith(".vercel.app") && origin.startsWith("https://")) return true;
        return false;
    }

    public static void applyCors(HttpServletRequest req, HttpServletResponse resp) {
        // Skip if CORSFilter already set the headers
        if (resp.getHeader("Access-Control-Allow-Origin") != null) return;

        String origin = req.getHeader("Origin");
        if (isAllowedOrigin(origin)) {
            resp.setHeader("Access-Control-Allow-Origin", origin);
        } else if (origin != null) {
            resp.setHeader("Access-Control-Allow-Origin", "https://aot-sms.vercel.app");
        }
        resp.setHeader("Vary", "Origin");
        resp.setHeader("Access-Control-Allow-Credentials", "true");
        resp.setHeader("Access-Control-Allow-Methods",
                "GET, POST, PUT, DELETE, PATCH, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers",
                "Content-Type, Authorization, X-Requested-With");
        resp.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    }

    /** OPTIONS preflight responder. */
    public static boolean handlePreflight(HttpServletRequest req, HttpServletResponse resp) {
        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            applyCors(req, resp);
            resp.setStatus(HttpServletResponse.SC_OK);
            return true;
        }
        return false;
    }

    public static void writeJson(HttpServletResponse resp, Object body) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        try (PrintWriter out = resp.getWriter()) {
            out.write(JSONUtil.toJson(body));
        }
    }

    public static void writeOk(HttpServletResponse resp, Object data) throws IOException {
        writeJson(resp, ApiResponse.ok(data));
    }

    public static void writeOk(HttpServletResponse resp, Object data, String message) throws IOException {
        writeJson(resp, ApiResponse.ok(data, message));
    }

    public static void writeError(HttpServletResponse resp, int status, String message) throws IOException {
        resp.setStatus(status);
        writeJson(resp, ApiResponse.error(message));
    }

    /** Read a cookie by name, or return null. */
    public static String readCookie(HttpServletRequest req, String name) {
        Cookie[] cookies = req.getCookies();
        if (cookies == null) return null;
        for (Cookie c : cookies) {
            if (name.equals(c.getName())) return c.getValue();
        }
        return null;
    }

    /**
     * Build the JWT cookie.
     * In production (cross-origin HTTPS), we need SameSite=None + Secure.
     * In local dev (same-origin HTTP), SameSite=Lax is fine.
     */
    public static Cookie buildAuthCookie(String token, int maxAgeSeconds) {
        Cookie c = new Cookie(JWTUtil.COOKIE_NAME, token);
        c.setHttpOnly(true);
        c.setPath("/");
        c.setMaxAge(maxAgeSeconds);
        c.setSecure(isProduction());
        return c;
    }

    /**
     * Add Set-Cookie header manually to include SameSite attribute
     * (Jakarta Servlet 6 Cookie API doesn't support SameSite directly).
     */
    public static void addAuthCookieWithSameSite(HttpServletResponse resp, String token, int maxAgeSeconds) {
        String sameSite = isProduction() ? "None" : "Lax";
        String secure = isProduction() ? "; Secure" : "";
        String header = String.format(
            "%s=%s; Path=/; Max-Age=%d; HttpOnly%s; SameSite=%s",
            JWTUtil.COOKIE_NAME, token, maxAgeSeconds, secure, sameSite
        );
        resp.addHeader("Set-Cookie", header);
    }

    public static void clearAuthCookie(HttpServletResponse resp) {
        String sameSite = isProduction() ? "None" : "Lax";
        String secure = isProduction() ? "; Secure" : "";
        String header = String.format(
            "%s=; Path=/; Max-Age=0; HttpOnly%s; SameSite=%s",
            JWTUtil.COOKIE_NAME, secure, sameSite
        );
        resp.addHeader("Set-Cookie", header);
    }

    private static boolean isProduction() {
        // If DB_SSL is set to true, we're in production (Aiven cloud DB)
        String ssl = System.getenv("DB_SSL");
        return "true".equalsIgnoreCase(ssl);
    }
}
