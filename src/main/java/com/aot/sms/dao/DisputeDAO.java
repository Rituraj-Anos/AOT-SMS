package com.aot.sms.dao;

import java.sql.*;
import java.util.*;

/**
 * DAO for attendance disputes between students and teachers.
 */
public class DisputeDAO {

    /** Raise a new dispute (student action). */
    public int raiseDispute(int studentId, int subjectId, String classDate, String studentNote) throws SQLException {
        String sql = "INSERT INTO attendance_disputes (student_id, subject_id, class_date, student_note) " +
                     "VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE student_note=VALUES(student_note), status='pending'";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, studentId);
            ps.setInt(2, subjectId);
            ps.setString(3, classDate);
            ps.setString(4, studentNote);
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                return rs.next() ? rs.getInt(1) : 0;
            }
        }
    }

    /** Get disputes for a student. */
    public List<Map<String, Object>> getByStudent(int studentId) throws SQLException {
        String sql = "SELECT d.*, sub.subject_code, sub.subject_name " +
                     "FROM attendance_disputes d " +
                     "JOIN subjects sub ON d.subject_id = sub.subject_id " +
                     "WHERE d.student_id = ? ORDER BY d.created_at DESC";
        return queryDisputes(sql, studentId);
    }

    /** Get pending disputes for subjects taught by a teacher. */
    public List<Map<String, Object>> getByTeacher(int teacherId) throws SQLException {
        String sql = "SELECT d.*, sub.subject_code, sub.subject_name, " +
                     "s.roll_no, s.student_name " +
                     "FROM attendance_disputes d " +
                     "JOIN subjects sub ON d.subject_id = sub.subject_id " +
                     "JOIN students s ON d.student_id = s.student_id " +
                     "JOIN teacher_subject_mapping tsm ON tsm.subject_id = d.subject_id AND tsm.teacher_id = ? " +
                     "ORDER BY d.status ASC, d.created_at DESC";
        return queryDisputes(sql, teacherId);
    }

    /** Resolve or reject a dispute (teacher action). */
    public boolean resolveDispute(int disputeId, String status, String teacherNote, int resolvedBy) throws SQLException {
        String sql = "UPDATE attendance_disputes SET status=?, teacher_note=?, resolved_at=NOW(), resolved_by=? " +
                     "WHERE dispute_id=?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setString(2, teacherNote);
            ps.setInt(3, resolvedBy);
            ps.setInt(4, disputeId);
            return ps.executeUpdate() > 0;
        }
    }

    /** Count pending disputes for a subject. */
    public int countPending(int subjectId) throws SQLException {
        String sql = "SELECT COUNT(*) FROM attendance_disputes WHERE subject_id=? AND status='pending'";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, subjectId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getInt(1) : 0;
            }
        }
    }

    private List<Map<String, Object>> queryDisputes(String sql, int paramId) throws SQLException {
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, paramId);
            try (ResultSet rs = ps.executeQuery()) {
                ResultSetMetaData meta = rs.getMetaData();
                int cols = meta.getColumnCount();
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    for (int i = 1; i <= cols; i++) {
                        String col = meta.getColumnLabel(i);
                        // Convert snake_case to camelCase
                        String camel = toCamel(col);
                        row.put(camel, rs.getObject(i));
                    }
                    list.add(row);
                }
            }
        }
        return list;
    }

    private static String toCamel(String snake) {
        StringBuilder sb = new StringBuilder();
        boolean upper = false;
        for (char c : snake.toCharArray()) {
            if (c == '_') { upper = true; continue; }
            sb.append(upper ? Character.toUpperCase(c) : c);
            upper = false;
        }
        return sb.toString();
    }
}
