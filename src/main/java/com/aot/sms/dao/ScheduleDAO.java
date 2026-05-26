package com.aot.sms.dao;

import java.sql.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * DAO for class_schedule + schedule_attendance.
 */
public class ScheduleDAO {

    // ── Schedule CRUD ────────────────────────────────────────

    public int addSchedule(int teacherId, int subjectId, int deptId, int semester, String section,
                           String dayOfWeek, int periodNumber, String startTime, String endTime,
                           String classType, String roomNo, String academicYear) throws SQLException {
        String sql = "INSERT INTO class_schedule (teacher_id, subject_id, dept_id, semester, section, " +
                     "day_of_week, period_number, start_time, end_time, class_type, room_no, academic_year) " +
                     "VALUES (?,?,?,?,?,?,?,?,?,?,?,?)";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, teacherId); ps.setInt(2, subjectId); ps.setInt(3, deptId);
            ps.setInt(4, semester); ps.setString(5, section); ps.setString(6, dayOfWeek);
            ps.setInt(7, periodNumber); ps.setString(8, startTime); ps.setString(9, endTime);
            ps.setString(10, classType != null ? classType : "theory");
            ps.setString(11, roomNo); ps.setString(12, academicYear != null ? academicYear : "2025-26");
            ps.executeUpdate();
            try (ResultSet k = ps.getGeneratedKeys()) { return k.next() ? k.getInt(1) : -1; }
        }
    }

    public boolean updateSchedule(int scheduleId, int subjectId, String dayOfWeek, int periodNumber,
                                  String startTime, String endTime, String classType, String roomNo) throws SQLException {
        String sql = "UPDATE class_schedule SET subject_id=?, day_of_week=?, period_number=?, " +
                     "start_time=?, end_time=?, class_type=?, room_no=? WHERE schedule_id=?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, subjectId); ps.setString(2, dayOfWeek); ps.setInt(3, periodNumber);
            ps.setString(4, startTime); ps.setString(5, endTime);
            ps.setString(6, classType); ps.setString(7, roomNo); ps.setInt(8, scheduleId);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean deleteSchedule(int scheduleId) throws SQLException {
        try (Connection c = DBConnection.getConnection()) {
            c.setAutoCommit(false);
            try (PreparedStatement ps1 = c.prepareStatement("DELETE FROM schedule_attendance WHERE schedule_id=?")) {
                ps1.setInt(1, scheduleId); ps1.executeUpdate();
            }
            try (PreparedStatement ps2 = c.prepareStatement("DELETE FROM class_schedule WHERE schedule_id=?")) {
                ps2.setInt(1, scheduleId); ps2.executeUpdate();
            }
            c.commit(); return true;
        }
    }

    public List<Map<String, Object>> getTeacherSchedule(int teacherId) throws SQLException {
        String sql = "SELECT cs.*, sub.subject_code, sub.subject_name, d.dept_code " +
                     "FROM class_schedule cs " +
                     "JOIN subjects sub ON cs.subject_id = sub.subject_id " +
                     "JOIN departments d ON cs.dept_id = d.dept_id " +
                     "WHERE cs.teacher_id = ? AND cs.is_active = TRUE " +
                     "ORDER BY FIELD(cs.day_of_week,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'), cs.period_number";
        return query(sql, teacherId);
    }

    public List<Map<String, Object>> getStudentSchedule(int deptId, int semester, String section) throws SQLException {
        // Students in section 'A' also see 'A-X' and 'A-Y' lab slots
        String sql = "SELECT cs.*, sub.subject_code, sub.subject_name, t.teacher_name, t.emp_id, d.dept_code " +
                     "FROM class_schedule cs " +
                     "JOIN subjects sub ON cs.subject_id = sub.subject_id " +
                     "JOIN teachers t ON cs.teacher_id = t.teacher_id " +
                     "JOIN departments d ON cs.dept_id = d.dept_id " +
                     "WHERE cs.dept_id = ? AND cs.semester = ? AND (cs.section = ? OR cs.section LIKE CONCAT(?,'-%')) AND cs.is_active = TRUE " +
                     "ORDER BY FIELD(cs.day_of_week,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'), cs.period_number";
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, deptId); ps.setInt(2, semester); ps.setString(3, section); ps.setString(4, section);
            try (ResultSet rs = ps.executeQuery()) { while (rs.next()) list.add(mapScheduleRow(rs)); }
        }
        return list;
    }

    public List<Map<String, Object>> getAllSchedules(Integer deptId, Integer semester, String section) throws SQLException {
        StringBuilder sql = new StringBuilder(
            "SELECT cs.*, sub.subject_code, sub.subject_name, t.teacher_name, t.emp_id, d.dept_code " +
            "FROM class_schedule cs " +
            "JOIN subjects sub ON cs.subject_id = sub.subject_id " +
            "JOIN teachers t ON cs.teacher_id = t.teacher_id " +
            "JOIN departments d ON cs.dept_id = d.dept_id WHERE cs.is_active = TRUE");
        List<Object> params = new ArrayList<>();
        if (deptId != null) { sql.append(" AND cs.dept_id = ?"); params.add(deptId); }
        if (semester != null) { sql.append(" AND cs.semester = ?"); params.add(semester); }
        if (section != null && !section.isBlank()) { sql.append(" AND cs.section = ?"); params.add(section); }
        sql.append(" ORDER BY FIELD(cs.day_of_week,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'), cs.period_number");

        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) ps.setObject(i + 1, params.get(i));
            try (ResultSet rs = ps.executeQuery()) { while (rs.next()) list.add(mapScheduleRow(rs)); }
        }
        return list;
    }

    // ── Schedule Attendance ──────────────────────────────────

    public int markAttendance(int scheduleId, int studentId, String classDate, String status,
                              String substituteTeacher, String substituteSubject, String notes) throws SQLException {
        String sql = "INSERT INTO schedule_attendance (schedule_id, student_id, class_date, status, " +
                     "substitute_teacher, substitute_subject, notes) VALUES (?,?,?,?,?,?,?) " +
                     "ON DUPLICATE KEY UPDATE status=VALUES(status), substitute_teacher=VALUES(substitute_teacher), " +
                     "substitute_subject=VALUES(substitute_subject), notes=VALUES(notes)";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, scheduleId); ps.setInt(2, studentId); ps.setString(3, classDate);
            ps.setString(4, status); ps.setString(5, substituteTeacher);
            ps.setString(6, substituteSubject); ps.setString(7, notes);
            ps.executeUpdate();
            try (ResultSet k = ps.getGeneratedKeys()) { return k.next() ? k.getInt(1) : -1; }
        }
    }

    public List<Map<String, Object>> getAttendanceHistory(int studentId, int scheduleId) throws SQLException {
        String sql = "SELECT * FROM schedule_attendance WHERE student_id = ? AND schedule_id = ? ORDER BY class_date DESC";
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, studentId); ps.setInt(2, scheduleId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapAttRow(rs));
            }
        }
        return list;
    }

    /** Get ALL attendance records for a student across all schedule slots. */
    public List<Map<String, Object>> getAllAttendanceForStudent(int studentId) throws SQLException {
        String sql = "SELECT * FROM schedule_attendance WHERE student_id = ? ORDER BY class_date DESC";
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, studentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapAttRow(rs));
            }
        }
        return list;
    }

    public Map<String, Object> getTodayStatus(int studentId, int scheduleId, String today) throws SQLException {
        String sql = "SELECT * FROM schedule_attendance WHERE student_id=? AND schedule_id=? AND class_date=?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, studentId); ps.setInt(2, scheduleId); ps.setString(3, today);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? mapAttRow(rs) : null;
            }
        }
    }

    private Map<String, Object> mapAttRow(ResultSet rs) throws SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", rs.getInt("id"));
        row.put("scheduleId", rs.getInt("schedule_id"));
        row.put("studentId", rs.getInt("student_id"));
        row.put("classDate", rs.getString("class_date"));
        row.put("status", rs.getString("status"));
        row.put("substituteTeacher", rs.getString("substitute_teacher"));
        row.put("substituteSubject", rs.getString("substitute_subject"));
        row.put("notes", rs.getString("notes"));
        row.put("markedAt", rs.getString("marked_at"));
        return row;
    }

    // ── Helpers ──────────────────────────────────────────────

    private List<Map<String, Object>> query(String sql, int param) throws SQLException {
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, param);
            try (ResultSet rs = ps.executeQuery()) { while (rs.next()) list.add(mapScheduleRow(rs)); }
        }
        return list;
    }

    private Map<String, Object> mapScheduleRow(ResultSet rs) throws SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("scheduleId", rs.getInt("schedule_id"));
        row.put("teacherId", rs.getInt("teacher_id"));
        row.put("subjectId", rs.getInt("subject_id"));
        row.put("deptId", rs.getInt("dept_id"));
        row.put("semester", rs.getInt("semester"));
        row.put("section", rs.getString("section"));
        row.put("dayOfWeek", rs.getString("day_of_week"));
        row.put("periodNumber", rs.getInt("period_number"));
        row.put("startTime", rs.getString("start_time"));
        row.put("endTime", rs.getString("end_time"));
        row.put("classType", rs.getString("class_type"));
        row.put("roomNo", rs.getString("room_no"));
        row.put("academicYear", rs.getString("academic_year"));
        row.put("isActive", rs.getBoolean("is_active"));
        try { row.put("subjectCode", rs.getString("subject_code")); } catch (SQLException ignored) {}
        try { row.put("subjectName", rs.getString("subject_name")); } catch (SQLException ignored) {}
        try { row.put("teacherName", rs.getString("teacher_name")); } catch (SQLException ignored) {}
        try { row.put("empId", rs.getString("emp_id")); } catch (SQLException ignored) {}
        try { row.put("deptCode", rs.getString("dept_code")); } catch (SQLException ignored) {}
        return row;
    }
}
