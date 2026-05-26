package com.aot.sms.util;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;

/**
 * Common HTTP helpers used across servlets:
 *  • CORS for the React dev server (http://localhost:5173) with credentials
 *  • JSON write helpers
 *  • Cookie reader
 */
public final class HttpUtil {

    /**
     * The single allowed origin for credentialed requests. The CORS spec
     * forbids "*" with Allow-Credentials: true, so we echo this exact value.
     */
    public static final String ALLOWED_ORIGIN = System.getenv()
            .getOrDefault("APP_CORS_ORIGIN", "http://localhost:5173");

    private HttpUtil() {}

    public static void applyCors(HttpServletRequest req, HttpServletResponse resp) {
        String origin = req.getHeader("Origin");
        if (origin != null && (origin.equals(ALLOWED_ORIGIN) || origin.equals("http://localhost:4173"))) {
            resp.setHeader("Access-Control-Allow-Origin", origin);
        } else {
            resp.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
        }
        resp.setHeader("Vary", "Origin");
        resp.setHeader("Access-Control-Allow-Credentials", "true");
        resp.setHeader("Access-Control-Allow-Methods",
                "GET, POST, PUT, DELETE, PATCH, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers",
                "Content-Type, Authorization, X-Requested-With");
        resp.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    }

    /** OPTIONS preflight responder — returns true when handled. */
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

    /** Build the JWT cookie. */
    public static Cookie buildAuthCookie(String token, int maxAgeSeconds) {
        Cookie c = new Cookie(JWTUtil.COOKIE_NAME, token);
        c.setHttpOnly(true);
        c.setPath("/");
        c.setMaxAge(maxAgeSeconds);
        // SameSite=Lax via header workaround — Servlet 6 still lacks setAttribute("SameSite")
        // We rely on Tomcat's default SameSite handling (LegacyCookieProcessor) or set it on response below.
        return c;
    }

    public static void clearAuthCookie(HttpServletResponse resp) {
        Cookie c = new Cookie(JWTUtil.COOKIE_NAME, "");
        c.setHttpOnly(true);
        c.setPath("/");
        c.setMaxAge(0);
        resp.addCookie(c);
    }
}
