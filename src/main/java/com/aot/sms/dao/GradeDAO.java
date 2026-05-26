package com.aot.sms.dao;

import com.aot.sms.model.Grade;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * DAO for Grades — MAKAUT O-F grading, SGPA/CGPA, backlog tracking.
 */
public class GradeDAO {

    /** Get grades for a student in a semester */
    public List<Grade> getByStudent(int studentId, int semester) throws SQLException {
        String sql = "SELECT g.*, sub.subject_code, sub.subject_name FROM grades g " +
                     "JOIN subjects sub ON g.subject_id=sub.subject_id " +
                     "WHERE g.student_id=? AND g.semester=? ORDER BY sub.subject_code";
        List<Grade> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, studentId); ps.setInt(2, semester);
            try (ResultSet rs = ps.executeQuery()) { while (rs.next()) list.add(mapRow(rs)); }
        }
        return list;
    }

    /** Insert or update a grade */
    public boolean upsert(Grade g) throws SQLException {
        String sql = "INSERT INTO grades (student_id, subject_id, semester, academic_year, grade, " +
                     "grade_point, credits, is_backlog) VALUES (?,?,?,?,?,?,?,?) " +
                     "ON DUPLICATE KEY UPDATE grade=VALUES(grade), grade_point=VALUES(grade_point), " +
                     "is_backlog=VALUES(is_backlog)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, g.getStudentId()); ps.setInt(2, g.getSubjectId());
            ps.setInt(3, g.getSemester()); ps.setString(4, g.getAcademicYear());
            ps.setString(5, g.getGrade()); ps.setInt(6, g.getGradePoint());
            ps.setInt(7, g.getCredits()); ps.setBoolean(8, g.isBacklog());
            return ps.executeUpdate() > 0;
        }
    }

    /** Calculate SGPA for a student-semester */
    public double calculateSGPA(int studentId, int semester) throws SQLException {
        String sql = "SELECT SUM(grade_point * credits) AS weighted, SUM(credits) AS total_credits " +
                     "FROM grades WHERE student_id=? AND semester=?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, studentId); ps.setInt(2, semester);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next() && rs.getInt("total_credits") > 0) {
                    return rs.getDouble("weighted") / rs.getInt("total_credits");
                }
                return 0.0;
            }
        }
    }

    /** Get backlog subjects for a student */
    public List<Grade> getBacklogs(int studentId) throws SQLException {
        String sql = "SELECT g.*, sub.subject_code, sub.subject_name FROM grades g " +
                     "JOIN subjects sub ON g.subject_id=sub.subject_id " +
                     "WHERE g.student_id=? AND g.is_backlog=TRUE AND g.backlog_cleared=FALSE";
        List<Grade> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, studentId);
            try (ResultSet rs = ps.executeQuery()) { while (rs.next()) list.add(mapRow(rs)); }
        }
        return list;
    }

    /** Mark a backlog as cleared */
    public boolean clearBacklog(int gradeId) throws SQLException {
        String sql = "UPDATE grades SET backlog_cleared=TRUE WHERE grade_id=?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, gradeId);
            return ps.executeUpdate() > 0;
        }
    }

    private Grade mapRow(ResultSet rs) throws SQLException {
        Grade g = new Grade();
        g.setGradeId(rs.getInt("grade_id")); g.setStudentId(rs.getInt("student_id"));
        g.setSubjectId(rs.getInt("subject_id")); g.setSemester(rs.getInt("semester"));
        g.setAcademicYear(rs.getString("academic_year")); g.setGrade(rs.getString("grade"));
        g.setGradePoint(rs.getInt("grade_point")); g.setCredits(rs.getInt("credits"));
        g.setBacklog(rs.getBoolean("is_backlog")); g.setBacklogCleared(rs.getBoolean("backlog_cleared"));
        g.setSubjectCode(rs.getString("subject_code")); g.setSubjectName(rs.getString("subject_name"));
        return g;
    }
}
