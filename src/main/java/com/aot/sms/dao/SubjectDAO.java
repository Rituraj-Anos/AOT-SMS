package com.aot.sms.dao;

import com.aot.sms.model.Subject;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/** DAO for Subject lookups and teacher-subject mappings. */
public class SubjectDAO {

    public List<Subject> getByDeptSemester(int deptId, int semester) throws SQLException {
        String sql = "SELECT * FROM subjects WHERE dept_id=? AND semester=? ORDER BY subject_code";
        List<Subject> list = new ArrayList<>();
        try (Connection c = DBConnection.getConnection(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, deptId); ps.setInt(2, semester);
            try (ResultSet rs = ps.executeQuery()) { while (rs.next()) list.add(mapRow(rs)); }
        }
        return list;
    }

    public List<Subject> getByTeacher(int teacherId) throws SQLException {
        String sql = "SELECT sub.* FROM subjects sub " +
                     "JOIN teacher_subject_mapping tsm ON sub.subject_id=tsm.subject_id " +
                     "WHERE tsm.teacher_id=? ORDER BY sub.subject_code";
        List<Subject> list = new ArrayList<>();
        try (Connection c = DBConnection.getConnection(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, teacherId);
            try (ResultSet rs = ps.executeQuery()) { while (rs.next()) list.add(mapRow(rs)); }
        }
        return list;
    }

    public Subject getById(int subjectId) throws SQLException {
        String sql = "SELECT * FROM subjects WHERE subject_id=?";
        try (Connection c = DBConnection.getConnection(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, subjectId);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? mapRow(rs) : null; }
        }
    }

    public Subject getByCode(String code) throws SQLException {
        String sql = "SELECT * FROM subjects WHERE subject_code=?";
        try (Connection c = DBConnection.getConnection(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, code);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? mapRow(rs) : null; }
        }
    }

    public int insert(Subject s) throws SQLException {
        String sql = "INSERT INTO subjects (subject_code,subject_name,dept_id,semester,credits," +
                     "subject_type,l_hours,t_hours,p_hours) VALUES (?,?,?,?,?,?,?,?,?)";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, s.getSubjectCode()); ps.setString(2, s.getSubjectName());
            ps.setInt(3, s.getDeptId()); ps.setInt(4, s.getSemester());
            ps.setInt(5, s.getCredits()); ps.setString(6, s.getSubjectType());
            ps.setInt(7, s.getLHours()); ps.setInt(8, s.getTHours()); ps.setInt(9, s.getPHours());
            ps.executeUpdate();
            try (ResultSet k = ps.getGeneratedKeys()) { return k.next() ? k.getInt(1) : -1; }
        }
    }

    private Subject mapRow(ResultSet rs) throws SQLException {
        Subject s = new Subject();
        s.setSubjectId(rs.getInt("subject_id")); s.setSubjectCode(rs.getString("subject_code"));
        s.setSubjectName(rs.getString("subject_name")); s.setDeptId(rs.getInt("dept_id"));
        s.setSemester(rs.getInt("semester")); s.setCredits(rs.getInt("credits"));
        s.setSubjectType(rs.getString("subject_type"));
        s.setLHours(rs.getInt("l_hours")); s.setTHours(rs.getInt("t_hours")); s.setPHours(rs.getInt("p_hours"));
        return s;
    }
}
