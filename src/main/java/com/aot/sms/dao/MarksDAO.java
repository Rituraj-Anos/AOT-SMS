package com.aot.sms.dao;

import com.aot.sms.model.Marks;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * DAO for Marks — CT entry, best-two calculation, ESE, totals.
 */
public class MarksDAO {

    /** Get marks for a student in a semester */
    public List<Marks> getByStudent(int studentId, int semester) throws SQLException {
        String sql = "SELECT m.*, s.roll_no, s.student_name, sub.subject_code, sub.subject_name, sub.credits " +
                     "FROM marks m JOIN students s ON m.student_id=s.student_id " +
                     "JOIN subjects sub ON m.subject_id=sub.subject_id " +
                     "WHERE m.student_id=? AND m.semester=? ORDER BY sub.subject_code";
        List<Marks> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, studentId); ps.setInt(2, semester);
            try (ResultSet rs = ps.executeQuery()) { while (rs.next()) list.add(mapRow(rs)); }
        }
        return list;
    }

    /** Get marks for all students in a subject */
    public List<Marks> getBySubject(int subjectId, int semester) throws SQLException {
        String sql = "SELECT m.*, s.roll_no, s.student_name, sub.subject_code, sub.subject_name, sub.credits " +
                     "FROM marks m JOIN students s ON m.student_id=s.student_id " +
                     "JOIN subjects sub ON m.subject_id=sub.subject_id " +
                     "WHERE m.subject_id=? AND m.semester=? ORDER BY s.roll_no";
        List<Marks> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, subjectId); ps.setInt(2, semester);
            try (ResultSet rs = ps.executeQuery()) { while (rs.next()) list.add(mapRow(rs)); }
        }
        return list;
    }

    /** Upsert CT marks for a student+subject */
    public boolean upsertCT(int studentId, int subjectId, int semester, String academicYear,
                            Double ct1, Double ct2, Double ct3, Double ct4, Integer teacherId) throws SQLException {
        String sql = "INSERT INTO marks (student_id, subject_id, semester, academic_year, ct1, ct2, ct3, ct4, entered_by) " +
                     "VALUES (?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE " +
                     "ct1=COALESCE(VALUES(ct1),ct1), ct2=COALESCE(VALUES(ct2),ct2), " +
                     "ct3=COALESCE(VALUES(ct3),ct3), ct4=COALESCE(VALUES(ct4),ct4), entered_by=COALESCE(VALUES(entered_by),entered_by)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, studentId); ps.setInt(2, subjectId);
            ps.setInt(3, semester); ps.setString(4, academicYear);
            setNullableDouble(ps, 5, ct1); setNullableDouble(ps, 6, ct2);
            setNullableDouble(ps, 7, ct3); setNullableDouble(ps, 8, ct4);
            if (teacherId == null) ps.setNull(9, java.sql.Types.INTEGER);
            else ps.setInt(9, teacherId);
            return ps.executeUpdate() > 0;
        }
    }

    /** Update ESE marks */
    public boolean updateESE(int studentId, int subjectId, int semester, double eseMarks) throws SQLException {
        String sql = "UPDATE marks SET ese_marks=? WHERE student_id=? AND subject_id=? AND semester=?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDouble(1, eseMarks); ps.setInt(2, studentId);
            ps.setInt(3, subjectId); ps.setInt(4, semester);
            return ps.executeUpdate() > 0;
        }
    }

    /** Calculate and store best-two-of-four CT marks (scaled to 25) */
    public boolean calculateBestTwo(int studentId, int subjectId, int semester) throws SQLException {
        String sql = "SELECT ct1, ct2, ct3, ct4 FROM marks WHERE student_id=? AND subject_id=? AND semester=?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, studentId); ps.setInt(2, subjectId); ps.setInt(3, semester);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return false;
                List<Double> scores = new ArrayList<>();
                for (String col : new String[]{"ct1","ct2","ct3","ct4"}) {
                    double v = rs.getDouble(col);
                    if (!rs.wasNull()) scores.add(v);
                }
                if (scores.size() < 2) return false;
                scores.sort((a, b) -> Double.compare(b, a));
                double bestTwo = ((scores.get(0) + scores.get(1)) / 50.0) * 25.0;
                String upd = "UPDATE marks SET best_two_marks=? WHERE student_id=? AND subject_id=? AND semester=?";
                try (PreparedStatement ps2 = conn.prepareStatement(upd)) {
                    ps2.setDouble(1, bestTwo); ps2.setInt(2, studentId);
                    ps2.setInt(3, subjectId); ps2.setInt(4, semester);
                    return ps2.executeUpdate() > 0;
                }
            }
        }
    }

    private void setNullableDouble(PreparedStatement ps, int idx, Double val) throws SQLException {
        if (val == null) ps.setNull(idx, Types.DOUBLE); else ps.setDouble(idx, val);
    }

    private Marks mapRow(ResultSet rs) throws SQLException {
        Marks m = new Marks();
        m.setMarksId(rs.getInt("marks_id")); m.setStudentId(rs.getInt("student_id"));
        m.setSubjectId(rs.getInt("subject_id")); m.setSemester(rs.getInt("semester"));
        m.setAcademicYear(rs.getString("academic_year"));
        m.setCt1(rs.getObject("ct1") != null ? rs.getDouble("ct1") : null);
        m.setCt2(rs.getObject("ct2") != null ? rs.getDouble("ct2") : null);
        m.setCt3(rs.getObject("ct3") != null ? rs.getDouble("ct3") : null);
        m.setCt4(rs.getObject("ct4") != null ? rs.getDouble("ct4") : null);
        m.setBestTwoMarks(rs.getObject("best_two_marks") != null ? rs.getDouble("best_two_marks") : null);
        m.setEseMarks(rs.getObject("ese_marks") != null ? rs.getDouble("ese_marks") : null);
        m.setAttendanceMarks(rs.getInt("attendance_marks"));
        m.setTotalMarks(rs.getObject("total_marks") != null ? rs.getDouble("total_marks") : null);
        m.setResultDeclared(rs.getBoolean("is_result_declared"));
        m.setEnteredBy(rs.getInt("entered_by")); m.setUpdatedAt(rs.getTimestamp("updated_at"));
        m.setRollNo(rs.getString("roll_no")); m.setStudentName(rs.getString("student_name"));
        m.setSubjectCode(rs.getString("subject_code")); m.setSubjectName(rs.getString("subject_name"));
        m.setCredits(rs.getInt("credits"));
        return m;
    }
}
