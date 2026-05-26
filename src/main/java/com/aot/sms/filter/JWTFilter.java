package com.aot.sms.filter;

import com.aot.sms.util.HttpUtil;
import com.aot.sms.util.JWTUtil;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

/**
 * Validates the JWT cookie on every protected request.
 *
 *  • Public paths (login / logout / health / OPTIONS) pass straight through.
 *  • For everything else, we read the cookie, verify, and stash claims as
 *    request attributes for downstream servlets:
 *
 *    request.getAttribute("auth.userId") → String
 *    request.getAttribute("auth.role")   → String  ("admin"|"teacher"|"student")
 *    request.getAttribute("auth.name")   → String
 *    request.getAttribute("auth.uid")    → Integer (entity ID — admin_id / teacher_id / student_id)
 *
 *  Filter is mapped to /api/* so it never touches static resources.
 */
@WebFilter(filterName = "JWTFilter", urlPatterns = {"/api/*"})
public class JWTFilter implements Filter {

    /** Endpoints that do NOT require a valid JWT. */
    private static final Set<String> PUBLIC_PATHS = Set.of(
            "/api/auth/login",
            "/api/auth/logout",
            "/api/health"
    );

    @Override
    public void doFilter(ServletRequest req, ServletResponse resp, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest  http = (HttpServletRequest) req;
        HttpServletResponse out  = (HttpServletResponse) resp;

        // CORS preflight — always allow
        if ("OPTIONS".equalsIgnoreCase(http.getMethod())) {
            HttpUtil.applyCors(http, out);
            out.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        String path = http.getServletPath();
        if (PUBLIC_PATHS.contains(path)) {
            chain.doFilter(req, resp);
            return;
        }

        String token = HttpUtil.readCookie(http, JWTUtil.COOKIE_NAME);
        Map<String, String> claims = JWTUtil.validate(token);
        if (claims == null) {
            HttpUtil.applyCors(http, out);
            HttpUtil.writeError(out, HttpServletResponse.SC_UNAUTHORIZED,
                    "Authentication required.");
            return;
        }

        // Stash for downstream
        http.setAttribute("auth.userId", claims.get("sub"));
        http.setAttribute("auth.role",   claims.get("role"));
        http.setAttribute("auth.name",   claims.get("name"));
        try {
            http.setAttribute("auth.uid", Integer.parseInt(claims.getOrDefault("uid", "-1")));
        } catch (NumberFormatException e) {
            http.setAttribute("auth.uid", -1);
        }

        chain.doFilter(req, resp);
    }
}
