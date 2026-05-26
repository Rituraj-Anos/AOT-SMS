package com.aot.sms.dao;

import java.sql.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * DAO for study_materials — post, list, delete.
 */
public class MaterialDAO {

    public int insert(int teacherId, int subjectId, int deptId, int semester, String section,
                      String title, String description, String materialType,
                      String fileName, String filePath, long fileSize,
                      String dueDate, boolean isPinned) throws SQLException {
        String sql = "INSERT INTO study_materials (teacher_id, subject_id, dept_id, semester, section, " +
                     "title, description, material_type, file_name, file_path, file_size, due_date, is_pinned) " +
                     "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, teacherId);
            ps.setInt(2, subjectId);
            ps.setInt(3, deptId);
            ps.setInt(4, semester);
            ps.setString(5, section);
            ps.setString(6, title);
            ps.setString(7, description);
            ps.setString(8, materialType);
            ps.setString(9, fileName);
            ps.setString(10, filePath);
            ps.setLong(11, fileSize);
            if (dueDate != null && !dueDate.isBlank()) {
                ps.setString(12, dueDate);
            } else {
                ps.setNull(12, Types.TIMESTAMP);
            }
            ps.setBoolean(13, isPinned);
            ps.executeUpdate();
            try (ResultSet k = ps.getGeneratedKeys()) { return k.next() ? k.getInt(1) : -1; }
        }
    }

    public List<Map<String, Object>> getBySubject(int subjectId, String type) throws SQLException {
        StringBuilder sql = new StringBuilder(
            "SELECT m.*, t.teacher_name, t.emp_id FROM study_materials m " +
            "JOIN teachers t ON m.teacher_id = t.teacher_id " +
            "WHERE m.subject_id = ?");
        List<Object> params = new ArrayList<>();
        params.add(subjectId);
        if (type != null && !type.isBlank() && !"all".equalsIgnoreCase(type)) {
            sql.append(" AND m.material_type = ?");
            params.add(type);
        }
        sql.append(" ORDER BY m.is_pinned DESC, m.posted_at DESC");

        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) ps.setObject(i + 1, params.get(i));
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapRow(rs));
            }
        }
        return list;
    }

    public List<Map<String, Object>> getAll(Integer deptId, Integer subjectId, String type) throws SQLException {
        StringBuilder sql = new StringBuilder(
            "SELECT m.*, t.teacher_name, t.emp_id, sub.subject_code, sub.subject_name " +
            "FROM study_materials m " +
            "JOIN teachers t ON m.teacher_id = t.teacher_id " +
            "JOIN subjects sub ON m.subject_id = sub.subject_id WHERE 1=1");
        List<Object> params = new ArrayList<>();
        if (deptId != null) { sql.append(" AND m.dept_id = ?"); params.add(deptId); }
        if (subjectId != null) { sql.append(" AND m.subject_id = ?"); params.add(subjectId); }
        if (type != null && !type.isBlank() && !"all".equalsIgnoreCase(type)) {
            sql.append(" AND m.material_type = ?"); params.add(type);
        }
        sql.append(" ORDER BY m.posted_at DESC");

        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) ps.setObject(i + 1, params.get(i));
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapRow(rs));
            }
        }
        return list;
    }

    public Map<String, Object> getById(int materialId) throws SQLException {
        String sql = "SELECT m.*, t.teacher_name, t.emp_id FROM study_materials m " +
                     "JOIN teachers t ON m.teacher_id = t.teacher_id WHERE m.material_id = ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, materialId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? mapRow(rs) : null;
            }
        }
    }

    public boolean delete(int materialId) throws SQLException {
        // Also delete submissions for this material
        try (Connection c = DBConnection.getConnection()) {
            c.setAutoCommit(false);
            try (PreparedStatement ps1 = c.prepareStatement("DELETE FROM submissions WHERE material_id = ?")) {
                ps1.setInt(1, materialId); ps1.executeUpdate();
            }
            try (PreparedStatement ps2 = c.prepareStatement("DELETE FROM study_materials WHERE material_id = ?")) {
                ps2.setInt(1, materialId); ps2.executeUpdate();
            }
            c.commit();
            return true;
        }
    }

    private Map<String, Object> mapRow(ResultSet rs) throws SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("materialId",   rs.getInt("material_id"));
        row.put("teacherId",    rs.getInt("teacher_id"));
        row.put("subjectId",    rs.getInt("subject_id"));
        row.put("deptId",       rs.getInt("dept_id"));
        row.put("semester",     rs.getInt("semester"));
        row.put("section",      rs.getString("section"));
        row.put("title",        rs.getString("title"));
        row.put("description",  rs.getString("description"));
        row.put("materialType", rs.getString("material_type"));
        row.put("fileName",     rs.getString("file_name"));
        row.put("filePath",     rs.getString("file_path"));
        row.put("fileSize",     rs.getLong("file_size"));
        row.put("dueDate",      rs.getString("due_date"));
        row.put("isPinned",     rs.getBoolean("is_pinned"));
        row.put("postedAt",     rs.getString("posted_at"));
        row.put("teacherName",  rs.getString("teacher_name"));
        try { row.put("empId", rs.getString("emp_id")); } catch (SQLException ignored) {}
        try { row.put("subjectCode", rs.getString("subject_code")); } catch (SQLException ignored) {}
        try { row.put("subjectName", rs.getString("subject_name")); } catch (SQLException ignored) {}
        return row;
    }
}
