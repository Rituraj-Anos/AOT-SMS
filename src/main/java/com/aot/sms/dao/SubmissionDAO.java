package com.aot.sms.dao;

import java.sql.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * DAO for submissions — submit, list, grade.
 */
public class SubmissionDAO {

    public int insert(int materialId, int studentId, String fileName, String filePath) throws SQLException {
        String sql = "INSERT INTO submissions (material_id, student_id, file_name, file_path, status) " +
                     "VALUES (?,?,?,?,?)";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, materialId);
            ps.setInt(2, studentId);
            ps.setString(3, fileName);
            ps.setString(4, filePath);

            // Check if past due date → mark as 'late'
            String status = "submitted";
            String dueSql = "SELECT due_date FROM study_materials WHERE material_id = ?";
            try (PreparedStatement dp = c.prepareStatement(dueSql)) {
                dp.setInt(1, materialId);
                try (ResultSet drs = dp.executeQuery()) {
                    if (drs.next()) {
                        Timestamp due = drs.getTimestamp("due_date");
                        if (due != null && new Timestamp(System.currentTimeMillis()).after(due)) {
                            status = "late";
                        }
                    }
                }
            }
            ps.setString(5, status);
            ps.executeUpdate();
            try (ResultSet k = ps.getGeneratedKeys()) { return k.next() ? k.getInt(1) : -1; }
        }
    }

    public List<Map<String, Object>> getByMaterial(int materialId) throws SQLException {
        String sql = "SELECT sub.*, s.roll_no, s.student_name FROM submissions sub " +
                     "JOIN students s ON sub.student_id = s.student_id " +
                     "WHERE sub.material_id = ? ORDER BY sub.submitted_at DESC";
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, materialId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapRow(rs));
            }
        }
        return list;
    }

    /** Get a student's submission for a specific material (or null). */
    public Map<String, Object> getByStudentMaterial(int studentId, int materialId) throws SQLException {
        String sql = "SELECT sub.*, s.roll_no, s.student_name FROM submissions sub " +
                     "JOIN students s ON sub.student_id = s.student_id " +
                     "WHERE sub.student_id = ? AND sub.material_id = ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, studentId);
            ps.setInt(2, materialId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? mapRow(rs) : null;
            }
        }
    }

    public boolean grade(int submissionId, String grade, String feedback) throws SQLException {
        String sql = "UPDATE submissions SET status = 'graded', grade = ?, feedback = ? WHERE submission_id = ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, grade);
            ps.setString(2, feedback);
            ps.setInt(3, submissionId);
            return ps.executeUpdate() > 0;
        }
    }

    /** Count submissions for a material. */
    public int countByMaterial(int materialId) throws SQLException {
        String sql = "SELECT COUNT(*) FROM submissions WHERE material_id = ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, materialId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getInt(1) : 0;
            }
        }
    }

    private Map<String, Object> mapRow(ResultSet rs) throws SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("submissionId", rs.getInt("submission_id"));
        row.put("materialId",   rs.getInt("material_id"));
        row.put("studentId",    rs.getInt("student_id"));
        row.put("fileName",     rs.getString("file_name"));
        row.put("filePath",     rs.getString("file_path"));
        row.put("submittedAt",  rs.getString("submitted_at"));
        row.put("status",       rs.getString("status"));
        row.put("grade",        rs.getString("grade"));
        row.put("feedback",     rs.getString("feedback"));
        row.put("rollNo",       rs.getString("roll_no"));
        row.put("studentName",  rs.getString("student_name"));
        return row;
    }
}
