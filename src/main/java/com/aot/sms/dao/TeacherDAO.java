package com.aot.sms.dao;

import com.aot.sms.model.Teacher;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object for Teacher CRUD operations.
 */
public class TeacherDAO {

    private Connection conn;

    /** No-arg constructor — each method creates its own connection */
    public TeacherDAO() {}

    /** Constructor with shared connection (used by LoginServlet) */
    public TeacherDAO(Connection conn) { this.conn = conn; }

    // ── PRD Login Interface ──────────────────────────────────

    /** Verify teacher credentials by emp_id (used by LoginServlet) */
    public boolean verify(String empId, String password) throws SQLException {
        String sql = "SELECT password_hash FROM teachers WHERE emp_id=? AND is_active=TRUE";
        Connection c = (this.conn != null) ? this.conn : DBConnection.getConnection();
        try (PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, empId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return org.mindrot.jbcrypt.BCrypt.checkpw(password, rs.getString("password_hash"));
                return false;
            }
        } finally {
            if (this.conn == null && c != null) c.close();
        }
    }

    /** Get teacher display name by emp_id (used by LoginServlet) */
    public String getName(String empId) throws SQLException {
        String sql = "SELECT teacher_name FROM teachers WHERE emp_id=?";
        Connection c = (this.conn != null) ? this.conn : DBConnection.getConnection();
        try (PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, empId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getString("teacher_name");
                return "Teacher";
            }
        } finally {
            if (this.conn == null && c != null) c.close();
        }
    }

    // ── Existing Methods ─────────────────────────────────────
    public List<Teacher> getTeachers(Integer deptId) throws SQLException {
        StringBuilder sql = new StringBuilder(
            "SELECT t.*, d.dept_code FROM teachers t " +
            "JOIN departments d ON t.dept_id = d.dept_id WHERE t.is_active = TRUE");
        if (deptId != null) sql.append(" AND t.dept_id = ?");
        sql.append(" ORDER BY t.teacher_name");

        List<Teacher> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            if (deptId != null) ps.setInt(1, deptId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapRow(rs));
            }
        }
        return list;
    }

    /** Get teacher by employee ID */
    public Teacher getByEmpId(String empId) throws SQLException {
        String sql = "SELECT t.*, d.dept_code FROM teachers t " +
                     "JOIN departments d ON t.dept_id = d.dept_id WHERE t.emp_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, empId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? mapRow(rs) : null;
            }
        }
    }

    /** Get teacher by internal ID */
    public Teacher getById(int teacherId) throws SQLException {
        String sql = "SELECT t.*, d.dept_code FROM teachers t " +
                     "JOIN departments d ON t.dept_id = d.dept_id WHERE t.teacher_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, teacherId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? mapRow(rs) : null;
            }
        }
    }

    /** Insert a new teacher */
    public int insert(Teacher t, String passwordHash) throws SQLException {
        String sql = "INSERT INTO teachers (emp_id, teacher_name, dept_id, designation, " +
                     "phone, email, photo_path, date_joined, password_hash) " +
                     "VALUES (?,?,?,?,?,?,?,?,?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, t.getEmpId());
            ps.setString(2, t.getTeacherName());
            ps.setInt(3,    t.getDeptId());
            ps.setString(4, t.getDesignation());
            ps.setString(5, t.getPhone());
            ps.setString(6, t.getEmail());
            ps.setString(7, t.getPhotoPath());
            ps.setDate(8,   t.getDateJoined());
            ps.setString(9, passwordHash);
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                return keys.next() ? keys.getInt(1) : -1;
            }
        }
    }

    /** Update teacher profile */
    public boolean update(Teacher t) throws SQLException {
        String sql = "UPDATE teachers SET teacher_name=?, dept_id=?, designation=?, " +
                     "phone=?, email=?, photo_path=? WHERE teacher_id=?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, t.getTeacherName());
            ps.setInt(2,    t.getDeptId());
            ps.setString(3, t.getDesignation());
            ps.setString(4, t.getPhone());
            ps.setString(5, t.getEmail());
            ps.setString(6, t.getPhotoPath());
            ps.setInt(7,    t.getTeacherId());
            return ps.executeUpdate() > 0;
        }
    }

    /** Authenticate teacher login */
    public Teacher authenticate(String empId, String plainPassword) throws SQLException {
        String sql = "SELECT t.*, d.dept_code FROM teachers t " +
                     "JOIN departments d ON t.dept_id = d.dept_id " +
                     "WHERE t.emp_id = ? AND t.is_active = TRUE";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, empId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                String storedHash = rs.getString("password_hash");
                if (org.mindrot.jbcrypt.BCrypt.checkpw(plainPassword, storedHash)) {
                    return mapRow(rs);
                }
                return null;
            }
        }
    }

    /** Soft-delete */
    public boolean deactivate(int teacherId) throws SQLException {
        String sql = "UPDATE teachers SET is_active = FALSE WHERE teacher_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, teacherId);
            return ps.executeUpdate() > 0;
        }
    }

    /**
     * Subject mappings for a teacher with subject metadata joined in.
     * Returned as an ordered map per row keyed by mapping_id, subject_code, subject_name,
     * dept_id, semester, section, academic_year.
     */
    public List<java.util.Map<String, Object>> getSubjectMappings(int teacherId) throws SQLException {
        String sql =
            "SELECT tsm.mapping_id, tsm.subject_id, sub.subject_code, sub.subject_name, " +
            "       tsm.dept_id, tsm.semester, tsm.section, tsm.academic_year " +
            "FROM teacher_subject_mapping tsm " +
            "JOIN subjects sub ON tsm.subject_id = sub.subject_id " +
            "WHERE tsm.teacher_id = ? " +
            "ORDER BY tsm.semester, sub.subject_code";

        List<java.util.Map<String, Object>> list = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, teacherId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    java.util.Map<String, Object> row = new java.util.LinkedHashMap<>();
                    row.put("mappingId",    rs.getInt("mapping_id"));
                    row.put("subjectId",    rs.getInt("subject_id"));
                    row.put("subjectCode",  rs.getString("subject_code"));
                    row.put("subjectName",  rs.getString("subject_name"));
                    row.put("deptId",       rs.getInt("dept_id"));
                    row.put("semester",     rs.getInt("semester"));
                    row.put("section",      rs.getString("section"));
                    row.put("academicYear", rs.getString("academic_year"));
                    list.add(row);
                }
            }
        }
        return list;
    }

    private Teacher mapRow(ResultSet rs) throws SQLException {
        Teacher t = new Teacher();
        t.setTeacherId(rs.getInt("teacher_id"));
        t.setEmpId(rs.getString("emp_id"));
        t.setTeacherName(rs.getString("teacher_name"));
        t.setDeptId(rs.getInt("dept_id"));
        t.setDeptCode(rs.getString("dept_code"));
        t.setDesignation(rs.getString("designation"));
        t.setPhone(rs.getString("phone"));
        t.setEmail(rs.getString("email"));
        t.setPhotoPath(rs.getString("photo_path"));
        t.setDateJoined(rs.getDate("date_joined"));
        t.setActive(rs.getBoolean("is_active"));
        t.setCreatedAt(rs.getTimestamp("created_at"));
        return t;
    }
}
