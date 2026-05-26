package com.aot.sms.dao;

import java.sql.*;
import java.util.LinkedHashMap;
import java.util.Map;

/** DAO for Admin authentication and dashboard statistics. */
public class AdminDAO {

    private Connection conn;

    /** No-arg constructor — each method creates its own connection */
    public AdminDAO() {}

    /** Constructor with shared connection (used by LoginServlet) */
    public AdminDAO(Connection conn) { this.conn = conn; }

    // ── PRD Login Interface ──────────────────────────────────

    /** Verify admin credentials (used by LoginServlet) */
    public boolean verify(String userId, String password) throws java.sql.SQLException {
        String sql = "SELECT password_hash FROM admin_users WHERE user_id=? AND is_active=TRUE";
        java.sql.Connection c = (this.conn != null) ? this.conn : DBConnection.getConnection();
        try (java.sql.PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, userId);
            try (java.sql.ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return org.mindrot.jbcrypt.BCrypt.checkpw(password, rs.getString("password_hash"));
                return false;
            }
        } finally {
            if (this.conn == null && c != null) c.close();
        }
    }

    /** Get admin display name by user_id (used by LoginServlet) */
    public String getName(String userId) throws java.sql.SQLException {
        String sql = "SELECT admin_name FROM admin_users WHERE user_id=?";
        java.sql.Connection c = (this.conn != null) ? this.conn : DBConnection.getConnection();
        try (java.sql.PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, userId);
            try (java.sql.ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getString("admin_name");
                return "Admin";
            }
        } finally {
            if (this.conn == null && c != null) c.close();
        }
    }

    // ── Existing Methods ─────────────────────────────────────

    /** Authenticate admin by user_id + password */
    public String[] authenticate(String userId, String plainPassword) throws SQLException {
        String sql = "SELECT user_id, admin_name, role_level, password_hash FROM admin_users " +
                     "WHERE user_id=? AND is_active=TRUE";
        try (Connection c = DBConnection.getConnection(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                String hash = rs.getString("password_hash");
                if (org.mindrot.jbcrypt.BCrypt.checkpw(plainPassword, hash)) {
                    return new String[]{
                        rs.getString("user_id"),
                        rs.getString("admin_name"),
                        rs.getString("role_level")
                    };
                }
                return null;
            }
        }
    }

    /** Dashboard summary counts — returned as ordered map for JSON serialisation */
    public Map<String, Integer> getDashboardStats() throws SQLException {
        Map<String, Integer> stats = new LinkedHashMap<>();
        String sql =
            "SELECT " +
            "  (SELECT COUNT(*) FROM students WHERE is_active=TRUE)           AS total_students, " +
            "  (SELECT COUNT(*) FROM students WHERE student_type='regular'  AND is_active=TRUE) AS regular_students, " +
            "  (SELECT COUNT(*) FROM students WHERE student_type='lateral'  AND is_active=TRUE) AS lateral_students, " +
            "  (SELECT COUNT(*) FROM students WHERE student_type='transfer' AND is_active=TRUE) AS transfer_students, " +
            "  (SELECT COUNT(*) FROM teachers WHERE is_active=TRUE)           AS total_teachers, " +
            "  (SELECT COUNT(*) FROM subjects)                                AS total_subjects, " +
            "  (SELECT COUNT(*) FROM fees WHERE balance_due > 0)              AS fee_defaulters, " +
            "  (SELECT COUNT(*) FROM notices WHERE expiry_date IS NULL OR expiry_date >= CURDATE()) AS active_notices";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                ResultSetMetaData md = rs.getMetaData();
                for (int i = 1; i <= md.getColumnCount(); i++) {
                    stats.put(md.getColumnLabel(i), rs.getInt(i));
                }
            }
        }
        return stats;
    }

    /** Change password for any user type */
    public boolean changePassword(String table, String idCol, String idVal,
                                  String newHash) throws SQLException {
        String sql = "UPDATE " + table + " SET password_hash=? WHERE " + idCol + "=?";
        try (Connection c = DBConnection.getConnection(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, newHash); ps.setString(2, idVal);
            return ps.executeUpdate() > 0;
        }
    }

    /** Log a login attempt */
    public void logAttempt(String userId, String role, String ip,
                           boolean success) throws SQLException {
        String sql = "INSERT INTO login_attempts (user_id, role, ip_address, success) VALUES (?,?,?,?)";
        try (Connection c = DBConnection.getConnection(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, userId); ps.setString(2, role);
            ps.setString(3, ip); ps.setBoolean(4, success);
            ps.executeUpdate();
        }
    }

    /** Check if account is locked (5+ failed attempts in last 15 min) */
    public boolean isLocked(String userId, String role) throws SQLException {
        String sql = "SELECT COUNT(*) FROM login_attempts WHERE user_id=? AND role=? " +
                     "AND success=FALSE AND attempt_time >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)";
        try (Connection c = DBConnection.getConnection(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, userId); ps.setString(2, role);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() && rs.getInt(1) >= 5; }
        }
    }
}
