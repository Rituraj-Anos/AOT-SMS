package com.aot.sms.filter;

import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Set;

/**
 * CORS filter for all /api/* routes.
 * Allows credentialed cross-origin requests from the React frontend
 * (both local dev and production Vercel deployment).
 */
@WebFilter(urlPatterns = "/api/*", filterName = "CORSFilter")
public class CORSFilter implements Filter {

    private static final Set<String> ALLOWED_ORIGINS = Set.of(
        "http://localhost:5173",
        "http://localhost:4173",
        "https://aot-sms.vercel.app"
    );

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;

        String origin = req.getHeader("Origin");

        // Echo back the origin if it's in our whitelist
        if (origin != null && isAllowed(origin)) {
            resp.setHeader("Access-Control-Allow-Origin", origin);
        } else if (origin != null && origin.endsWith(".vercel.app")) {
            // Allow Vercel preview deployments
            resp.setHeader("Access-Control-Allow-Origin", origin);
        }

        resp.setHeader("Access-Control-Allow-Credentials", "true");
        resp.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        resp.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
        resp.setHeader("Vary", "Origin");

        // Handle preflight OPTIONS — return 200 immediately
        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            resp.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        chain.doFilter(request, response);
    }

    private boolean isAllowed(String origin) {
        return ALLOWED_ORIGINS.contains(origin);
    }
}
