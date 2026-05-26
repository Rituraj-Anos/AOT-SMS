package com.aot.sms.util;

import org.mindrot.jbcrypt.BCrypt;
import java.sql.*;
import java.util.UUID;

/**
 * Utility class for Authentication, Session management, and security logging.
 * Matches MAKAUT security and accountability requirements.
 */
public class AuthUtil {

    /**
     * Hash a cleartext password using BCrypt.
     */
    public static String hashPassword(String password) {
        return BCrypt.hashpw(password, BCrypt.gensalt(12));
    }

    /**
     * Verify a cleartext password against a BCrypt hash.
     */
    public static boolean checkPassword(String password, String hashed) {
        if (hashed == null || !hashed.startsWith("$2a$")) {
            return false;
        }
        return BCrypt.checkpw(password, hashed);
    }

    /**
     * Count failed login attempts in the last 30 minutes.
     */
    public static int getFailedAttempts(Connection conn, String userId) throws SQLException {
        String sql = "SELECT COUNT(*) FROM login_attempts " +
                     "WHERE user_id = ? AND success = FALSE " +
                     "AND attempted_at > NOW() - INTERVAL 30 MINUTE";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        }
        return 0;
    }

    /**
     * Log a login attempt.
     */
    public static void logAttempt(Connection conn, String userId, boolean success, String ipAddress) throws SQLException {
        String sql = "INSERT INTO login_attempts (user_id, success, ip_address) VALUES (?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, userId);
            ps.setBoolean(2, success);
            ps.setString(3, ipAddress != null ? ipAddress : "");
            ps.executeUpdate();
        }
    }

    /**
     * Create a new session record upon successful login (convenience overload — no IP).
     */
    public static String createSession(Connection conn, String userId, String role) throws SQLException {
        return createSession(conn, userId, role, "");
    }

    /**
     * Create a new session record upon successful login.
     * Returns the generated session ID.
     */
    public static String createSession(Connection conn, String userId, String role, String ipAddress) throws SQLException {
        String sessionId = UUID.randomUUID().toString();
        String sql = "INSERT INTO login_sessions (session_id, user_id, user_role, ip_address, last_active) VALUES (?, ?, ?, ?, NOW())";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, sessionId);
            ps.setString(2, userId);
            ps.setString(3, role);
            ps.setString(4, ipAddress != null ? ipAddress : "");
            ps.executeUpdate();
        }
        return sessionId;
    }

    /**
     * Validate an active session. Returns the role if valid, null otherwise.
     * Updates the last_active timestamp.
     */
    public static String validateSession(Connection conn, String sessionId) throws SQLException {
        String sql = "SELECT user_role FROM login_sessions WHERE session_id = ? AND is_active = TRUE AND last_active > NOW() - INTERVAL 8 HOUR";
        String role = null;
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, sessionId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    role = rs.getString("user_role");
                }
            }
        }
        if (role != null) {
            String updateSql = "UPDATE login_sessions SET last_active = NOW() WHERE session_id = ?";
            try (PreparedStatement ps = conn.prepareStatement(updateSql)) {
                ps.setString(1, sessionId);
                ps.executeUpdate();
            }
        }
        return role;
    }

    /**
     * Terminate/deactivate a session (Logout).
     */
    public static void invalidateSession(Connection conn, String sessionId) throws SQLException {
        String sql = "UPDATE login_sessions SET is_active = FALSE WHERE session_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, sessionId);
            ps.executeUpdate();
        }
    }
}
