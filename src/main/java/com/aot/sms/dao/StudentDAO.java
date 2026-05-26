package com.aot.sms.dao;

import com.aot.sms.model.Student;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object for Student CRUD operations.
 */
public class StudentDAO {

    private Connection conn;

    /** No-arg constructor — each method creates its own connection */
    public StudentDAO() {}

    /** Constructor with shared connection (used by LoginServlet) */
    public StudentDAO(Connection conn) { this.conn = conn; }

    // ── PRD Login Interface ──────────────────────────────────

    /** Verify student credentials by roll_no (used by LoginServlet) */
    public boolean verify(String rollNo, String password) throws SQLException {
        String sql = "SELECT password_hash FROM students WHERE roll_no=? AND is_active=TRUE";
        Connection c = (this.conn != null) ? this.conn : DBConnection.getConnection();
        try (PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, rollNo);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return org.mindrot.jbcrypt.BCrypt.checkpw(password, rs.getString("password_hash"));
                return false;
            }
        } finally {
            if (this.conn == null && c != null) c.close();
        }
    }

    /** Get student display name by roll_no (used by LoginServlet) */
    public String getName(String rollNo) throws SQLException {
        String sql = "SELECT student_name FROM students WHERE roll_no=?";
        Connection c = (this.conn != null) ? this.conn : DBConnection.getConnection();
        try (PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, rollNo);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getString("student_name");
                return "Student";
            }
        } finally {
            if (this.conn == null && c != null) c.close();
        }
    }

    // ── Existing Methods ─────────────────────────────────────

    /**
     * Filtered list — accepts dept, semester, section, studentType, and free-text search.
     * Any null filter is ignored. Search matches against roll_no or student_name (LIKE %term%).
     */
    public List<Student> getAllStudents(Integer deptId, Integer semester, String section,
                                        String studentType, String search) throws SQLException {
        StringBuilder sql = new StringBuilder(
            "SELECT s.*, d.dept_code FROM students s " +
            "JOIN departments d ON s.dept_id = d.dept_id WHERE s.is_active = TRUE");
        List<Object> params = new ArrayList<>();

        if (deptId != null)      { sql.append(" AND s.dept_id = ?");          params.add(deptId); }
        if (semester != null)    { sql.append(" AND s.current_semester = ?"); params.add(semester); }
        if (section != null && !section.isBlank()) {
            sql.append(" AND s.section = ?");                                  params.add(section);
        }
        if (studentType != null && !studentType.isBlank()) {
            sql.append(" AND s.student_type = ?");                             params.add(studentType);
        }
        if (search != null && !search.isBlank()) {
            sql.append(" AND (s.roll_no LIKE ? OR s.student_name LIKE ?)");
            String like = "%" + search.trim() + "%";
            params.add(like); params.add(like);
        }
        sql.append(" ORDER BY s.roll_no");

        List<Student> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) ps.setObject(i + 1, params.get(i));
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapRow(rs));
            }
        }
        return list;
    }

    /** Backward-compatible 3-arg version. */
    public List<Student> getStudents(Integer deptId, Integer semester, String section) throws SQLException {
        StringBuilder sql = new StringBuilder(
            "SELECT s.*, d.dept_code FROM students s " +
            "JOIN departments d ON s.dept_id = d.dept_id WHERE s.is_active = TRUE");
        List<Object> params = new ArrayList<>();

        if (deptId != null) { sql.append(" AND s.dept_id = ?"); params.add(deptId); }
        if (semester != null) { sql.append(" AND s.current_semester = ?"); params.add(semester); }
        if (section != null) { sql.append(" AND s.section = ?"); params.add(section); }
        sql.append(" ORDER BY s.roll_no");

        List<Student> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) ps.setObject(i + 1, params.get(i));
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapRow(rs));
            }
        }
        return list;
    }

    /** Get a single student by roll number */
    public Student getByRollNo(String rollNo) throws SQLException {
        String sql = "SELECT s.*, d.dept_code FROM students s " +
                     "JOIN departments d ON s.dept_id = d.dept_id WHERE s.roll_no = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, rollNo);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? mapRow(rs) : null;
            }
        }
    }

    /** Get a single student by internal student_id */
    public Student getById(int studentId) throws SQLException {
        String sql = "SELECT s.*, d.dept_code FROM students s " +
                     "JOIN departments d ON s.dept_id = d.dept_id WHERE s.student_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, studentId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? mapRow(rs) : null;
            }
        }
    }

    /** Insert a new student, returns generated student_id */
    public int insert(Student s, String passwordHash) throws SQLException {
        String sql = "INSERT INTO students (roll_no, student_name, student_type, dept_id, " +
                     "current_semester, section, dob, gender, blood_group, aadhar_no, phone, email, " +
                     "parent_name, parent_phone, address, photo_path, admission_year, password_hash) " +
                     "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1,  s.getRollNo());
            ps.setString(2,  s.getStudentName());
            ps.setString(3,  s.getStudentType());
            ps.setInt(4,     s.getDeptId());
            ps.setInt(5,     s.getCurrentSemester());
            ps.setString(6,  s.getSection());
            ps.setDate(7,    s.getDob());
            ps.setString(8,  s.getGender());
            ps.setString(9,  s.getBloodGroup());
            ps.setString(10, s.getAadharNo());
            ps.setString(11, s.getPhone());
            ps.setString(12, s.getEmail());
            ps.setString(13, s.getParentName());
            ps.setString(14, s.getParentPhone());
            ps.setString(15, s.getAddress());
            ps.setString(16, s.getPhotoPath());
            ps.setInt(17,    s.getAdmissionYear());
            ps.setString(18, passwordHash);
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                return keys.next() ? keys.getInt(1) : -1;
            }
        }
    }

    /** Update student profile fields */
    public boolean update(Student s) throws SQLException {
        String sql = "UPDATE students SET student_name=?, student_type=?, dept_id=?, " +
                     "current_semester=?, section=?, dob=?, gender=?, blood_group=?, " +
                     "aadhar_no=?, phone=?, email=?, parent_name=?, parent_phone=?, " +
                     "address=?, photo_path=? WHERE student_id=?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1,  s.getStudentName());
            ps.setString(2,  s.getStudentType());
            ps.setInt(3,     s.getDeptId());
            ps.setInt(4,     s.getCurrentSemester());
            ps.setString(5,  s.getSection());
            ps.setDate(6,    s.getDob());
            ps.setString(7,  s.getGender());
            ps.setString(8,  s.getBloodGroup());
            ps.setString(9,  s.getAadharNo());
            ps.setString(10, s.getPhone());
            ps.setString(11, s.getEmail());
            ps.setString(12, s.getParentName());
            ps.setString(13, s.getParentPhone());
            ps.setString(14, s.getAddress());
            ps.setString(15, s.getPhotoPath());
            ps.setInt(16,    s.getStudentId());
            return ps.executeUpdate() > 0;
        }
    }

    /** Soft-delete: set is_active = FALSE */
    public boolean deactivate(int studentId) throws SQLException {
        String sql = "UPDATE students SET is_active = FALSE WHERE student_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, studentId);
            return ps.executeUpdate() > 0;
        }
    }

    /** Authenticate student login: returns Student if password matches, null otherwise */
    public Student authenticate(String rollNo, String plainPassword) throws SQLException {
        String sql = "SELECT s.*, d.dept_code FROM students s " +
                     "JOIN departments d ON s.dept_id = d.dept_id " +
                     "WHERE s.roll_no = ? AND s.is_active = TRUE";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, rollNo);
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

    /** Count students by filters */
    public int count(Integer deptId, Integer semester) throws SQLException {
        StringBuilder sql = new StringBuilder(
            "SELECT COUNT(*) FROM students WHERE is_active = TRUE");
        List<Object> params = new ArrayList<>();
        if (deptId != null) { sql.append(" AND dept_id = ?"); params.add(deptId); }
        if (semester != null) { sql.append(" AND current_semester = ?"); params.add(semester); }

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) ps.setObject(i + 1, params.get(i));
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getInt(1) : 0;
            }
        }
    }

    // --- Row Mapper ---
    private Student mapRow(ResultSet rs) throws SQLException {
        Student s = new Student();
        s.setStudentId(rs.getInt("student_id"));
        s.setRollNo(rs.getString("roll_no"));
        s.setStudentName(rs.getString("student_name"));
        s.setStudentType(rs.getString("student_type"));
        s.setDeptId(rs.getInt("dept_id"));
        s.setDeptCode(rs.getString("dept_code"));
        s.setCurrentSemester(rs.getInt("current_semester"));
        s.setSection(rs.getString("section"));
        s.setDob(rs.getDate("dob"));
        s.setGender(rs.getString("gender"));
        s.setBloodGroup(rs.getString("blood_group"));
        s.setAadharNo(rs.getString("aadhar_no"));
        s.setPhone(rs.getString("phone"));
        s.setEmail(rs.getString("email"));
        s.setParentName(rs.getString("parent_name"));
        s.setParentPhone(rs.getString("parent_phone"));
        s.setAddress(rs.getString("address"));
        s.setPhotoPath(rs.getString("photo_path"));
        s.setAdmissionYear(rs.getInt("admission_year"));
        s.setActive(rs.getBoolean("is_active"));
        s.setCreatedAt(rs.getTimestamp("created_at"));
        return s;
    }
}
