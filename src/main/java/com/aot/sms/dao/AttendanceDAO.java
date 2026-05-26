package com.aot.sms.dao;

import com.aot.sms.model.Attendance;
import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * DAO for Attendance — bulk marking, summaries, below-75% queries.
 */
public class AttendanceDAO {

    /** Bulk-insert/upsert attendance for a class session */
    public int[] markBulk(List<Attendance> records) throws SQLException {
        String sql = "INSERT INTO attendance (student_id, subject_id, attendance_date, status, marked_by) " +
                     "VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE status=VALUES(status), marked_by=VALUES(marked_by)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            conn.setAutoCommit(false);
            for (Attendance a : records) {
                ps.setInt(1, a.getStudentId());
                ps.setInt(2, a.getSubjectId());
                ps.setString(3, a.getAttendanceDate());
                ps.setString(4, a.getStatus());
                ps.setInt(5, a.getMarkedBy());
                ps.addBatch();
            }
            int[] r = ps.executeBatch();
            conn.commit();
            return r;
        }
    }

    /** Get attendance for a student+subject */
    public List<Attendance> getByStudentSubject(int studentId, int subjectId) throws SQLException {
        String sql = "SELECT a.*, s.roll_no, s.student_name, sub.subject_code, sub.subject_name " +
                     "FROM attendance a JOIN students s ON a.student_id=s.student_id " +
                     "JOIN subjects sub ON a.subject_id=sub.subject_id " +
                     "WHERE a.student_id=? AND a.subject_id=? ORDER BY a.attendance_date DESC";
        List<Attendance> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, studentId); ps.setInt(2, subjectId);
            try (ResultSet rs = ps.executeQuery()) { while (rs.next()) list.add(mapRow(rs)); }
        }
        return list;
    }

    /** Get whole-class attendance for a date+subject */
    public List<Attendance> getByDateSubject(String date, int subjectId) throws SQLException {
        String sql = "SELECT a.*, s.roll_no, s.student_name, sub.subject_code, sub.subject_name " +
                     "FROM attendance a JOIN students s ON a.student_id=s.student_id " +
                     "JOIN subjects sub ON a.subject_id=sub.subject_id " +
                     "WHERE a.attendance_date=? AND a.subject_id=? ORDER BY s.roll_no";
        List<Attendance> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, date); ps.setInt(2, subjectId);
            try (ResultSet rs = ps.executeQuery()) { while (rs.next()) list.add(mapRow(rs)); }
        }
        return list;
    }

    /** Summary: returns [total, present, percentage] */
    public double[] getSummary(int studentId, int subjectId) throws SQLException {
        String sql = "SELECT COUNT(*) AS total, SUM(CASE WHEN status IN ('P','L') THEN 1 ELSE 0 END) AS present " +
                     "FROM attendance WHERE student_id=? AND subject_id=?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, studentId); ps.setInt(2, subjectId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    double t = rs.getInt("total"), p = rs.getInt("present");
                    return new double[]{t, p, t > 0 ? (p / t) * 100.0 : 0};
                }
                return new double[]{0, 0, 0};
            }
        }
    }

    /** Students below 75% using v_below_75 view */
    public List<String[]> getBelow75(int subjectId) throws SQLException {
        String sql = "SELECT * FROM v_below_75 WHERE subject_id=?";
        List<String[]> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, subjectId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(new String[]{rs.getString("roll_no"), rs.getString("student_name"),
                        rs.getString("subject_code"), String.valueOf(rs.getInt("total_classes")),
                        String.valueOf(rs.getInt("classes_present")),
                        String.format("%.1f", rs.getDouble("attendance_pct"))});
                }
            }
        }
        return list;
    }

    private Attendance mapRow(ResultSet rs) throws SQLException {
        Attendance a = new Attendance();
        a.setAttendanceId(rs.getInt("attendance_id"));
        a.setStudentId(rs.getInt("student_id"));
        a.setSubjectId(rs.getInt("subject_id"));
        a.setAttendanceDate(rs.getString("attendance_date"));
        a.setStatus(rs.getString("status"));
        a.setMarkedBy(rs.getInt("marked_by"));
        a.setMarkedAt(rs.getTimestamp("marked_at"));
        a.setRollNo(rs.getString("roll_no"));
        a.setStudentName(rs.getString("student_name"));
        a.setSubjectCode(rs.getString("subject_code"));
        a.setSubjectName(rs.getString("subject_name"));
        return a;
    }
    // ── Enhanced methods for attendance management hub ────────────────

    /** Phase summary: per-student totals for a subject within a date range. */
    public List<Map<String, Object>> getPhaseSummary(int subjectId, int deptId, int semester,
                                                     String startDate, String endDate) throws java.sql.SQLException {
        String sql =
            "SELECT s.student_id, s.roll_no, s.student_name, s.student_type, " +
            "  COUNT(a.attendance_id) AS held, " +
            "  SUM(CASE WHEN a.status IN ('P','L') THEN 1 ELSE 0 END) AS present, " +
            "  SUM(CASE WHEN a.status = 'A' THEN 1 ELSE 0 END) AS absent, " +
            "  SUM(CASE WHEN a.status = 'L' THEN 1 ELSE 0 END) AS leave_count, " +
            "  SUM(CASE WHEN a.status = 'ML' THEN 1 ELSE 0 END) AS ml_count " +
            "FROM students s " +
            "LEFT JOIN attendance a ON s.student_id = a.student_id " +
            "  AND a.subject_id = ? AND a.attendance_date BETWEEN ? AND ? " +
            "WHERE s.dept_id = ? AND s.current_semester = ? AND s.is_active = TRUE " +
            "GROUP BY s.student_id ORDER BY s.roll_no";
        List<Map<String, Object>> list = new java.util.ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, subjectId); ps.setString(2, startDate); ps.setString(3, endDate);
            ps.setInt(4, deptId); ps.setInt(5, semester);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    java.util.Map<String, Object> row = new java.util.LinkedHashMap<>();
                    row.put("studentId",   rs.getInt("student_id"));
                    row.put("rollNo",      rs.getString("roll_no"));
                    row.put("studentName", rs.getString("student_name"));
                    row.put("studentType", rs.getString("student_type"));
                    row.put("held",        rs.getInt("held"));
                    row.put("present",     rs.getInt("present"));
                    row.put("absent",      rs.getInt("absent"));
                    row.put("leave",       rs.getInt("leave_count"));
                    row.put("ml",          rs.getInt("ml_count"));
                    int held = rs.getInt("held");
                    int present = rs.getInt("present");
                    double pct = held > 0 ? (present * 100.0 / held) : 0;
                    row.put("percent", Math.round(pct * 100.0) / 100.0);
                    list.add(row);
                }
            }
        }
        return list;
    }

    /** Full sheet: all subjects × all students totals for a dept+semester. */
    public java.util.Map<String, Object> getFullSheetData(int deptId, int semester) throws java.sql.SQLException {
        // Get all subjects for this dept+semester
        String subjSql = "SELECT subject_id, subject_code, subject_name, subject_type FROM subjects WHERE dept_id=? AND semester=? ORDER BY subject_code";
        List<java.util.Map<String, Object>> subjects = new java.util.ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(subjSql)) {
            ps.setInt(1, deptId); ps.setInt(2, semester);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    java.util.Map<String, Object> s = new java.util.LinkedHashMap<>();
                    s.put("subjectId", rs.getInt("subject_id"));
                    s.put("subjectCode", rs.getString("subject_code"));
                    s.put("subjectName", rs.getString("subject_name"));
                    s.put("subjectType", rs.getString("subject_type"));
                    subjects.add(s);
                }
            }
        }

        // Get all active students
        String stuSql = "SELECT student_id, roll_no, student_name, student_type FROM students WHERE dept_id=? AND current_semester=? AND is_active=TRUE ORDER BY roll_no";
        List<java.util.Map<String, Object>> students = new java.util.ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(stuSql)) {
            ps.setInt(1, deptId); ps.setInt(2, semester);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    java.util.Map<String, Object> s = new java.util.LinkedHashMap<>();
                    s.put("studentId", rs.getInt("student_id"));
                    s.put("rollNo", rs.getString("roll_no"));
                    s.put("studentName", rs.getString("student_name"));
                    s.put("studentType", rs.getString("student_type"));
                    students.add(s);
                }
            }
        }

        // For each student × subject, get totals
        String attSql =
            "SELECT student_id, subject_id, COUNT(*) AS held, " +
            "SUM(CASE WHEN status IN ('P','L') THEN 1 ELSE 0 END) AS present " +
            "FROM attendance WHERE subject_id IN (SELECT subject_id FROM subjects WHERE dept_id=? AND semester=?) " +
            "GROUP BY student_id, subject_id";
        // Build a map: studentId -> subjectId -> {held, present}
        java.util.Map<Integer, java.util.Map<Integer, int[]>> attMap = new java.util.HashMap<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(attSql)) {
            ps.setInt(1, deptId); ps.setInt(2, semester);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int sid = rs.getInt("student_id");
                    int subId = rs.getInt("subject_id");
                    attMap.computeIfAbsent(sid, k -> new java.util.HashMap<>())
                          .put(subId, new int[]{rs.getInt("held"), rs.getInt("present")});
                }
            }
        }

        // Build rows
        List<java.util.Map<String, Object>> rows = new java.util.ArrayList<>();
        for (var stu : students) {
            java.util.Map<String, Object> row = new java.util.LinkedHashMap<>(stu);
            int stuId = (int) stu.get("studentId");
            var stuAtt = attMap.getOrDefault(stuId, java.util.Map.of());
            int theoryHeld = 0, theoryPresent = 0, practicalHeld = 0, practicalPresent = 0;

            for (var subj : subjects) {
                int subId = (int) subj.get("subjectId");
                String code = (String) subj.get("subjectCode");
                String type = (String) subj.get("subjectType");
                int[] hp = stuAtt.getOrDefault(subId, new int[]{0, 0});
                row.put(code + "_held", hp[0]);
                row.put(code + "_present", hp[1]);
                row.put(code + "_pct", hp[0] > 0 ? Math.round(hp[1] * 1000.0 / hp[0]) / 10.0 : 0);
                if ("lab".equals(type)) { practicalHeld += hp[0]; practicalPresent += hp[1]; }
                else if ("theory".equals(type)) { theoryHeld += hp[0]; theoryPresent += hp[1]; }
                // training subjects excluded from totals
            }
            row.put("theoryHeld", theoryHeld); row.put("theoryPresent", theoryPresent);
            row.put("theoryPct", theoryHeld > 0 ? Math.round(theoryPresent * 1000.0 / theoryHeld) / 10.0 : 0);
            row.put("practicalHeld", practicalHeld); row.put("practicalPresent", practicalPresent);
            row.put("practicalPct", practicalHeld > 0 ? Math.round(practicalPresent * 1000.0 / practicalHeld) / 10.0 : 0);
            int totalHeld = theoryHeld + practicalHeld, totalPresent = theoryPresent + practicalPresent;
            row.put("overallHeld", totalHeld); row.put("overallPresent", totalPresent);
            row.put("overallPct", totalHeld > 0 ? Math.round(totalPresent * 1000.0 / totalHeld) / 10.0 : 0);
            rows.add(row);
        }

        java.util.Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("subjects", subjects);
        result.put("rows", rows);
        return result;
    }

    /** Student self-record summary: aggregates schedule_attendance by subject for comparison. */
    public List<Map<String, Object>> getStudentSelfRecordSummary(int studentId) throws SQLException {
        String sql =
            "SELECT sub.subject_id, sub.subject_code, sub.subject_name, " +
            "  COUNT(sa.id) AS self_total, " +
            "  SUM(CASE WHEN sa.status = 'attended' THEN 1 ELSE 0 END) AS self_present, " +
            "  SUM(CASE WHEN sa.status = 'missed' THEN 1 ELSE 0 END) AS self_absent " +
            "FROM schedule_attendance sa " +
            "JOIN class_schedule cs ON sa.schedule_id = cs.schedule_id " +
            "JOIN subjects sub ON cs.subject_id = sub.subject_id " +
            "WHERE sa.student_id = ? AND sa.status IN ('attended','missed') " +
            "GROUP BY sub.subject_id ORDER BY sub.subject_code";
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, studentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("subjectId", rs.getInt("subject_id"));
                    row.put("subjectCode", rs.getString("subject_code"));
                    row.put("subjectName", rs.getString("subject_name"));
                    int total = rs.getInt("self_total");
                    int present = rs.getInt("self_present");
                    row.put("selfTotal", total);
                    row.put("selfPresent", present);
                    row.put("selfAbsent", rs.getInt("self_absent"));
                    row.put("selfPercent", total > 0 ? Math.round(present * 1000.0 / total) / 10.0 : 0);
                    list.add(row);
                }
            }
        }
        return list;
    }

    /** Date-range attendance: day-by-day records per student for a subject. */
    public java.util.Map<String, Object> getDateRangeAttendance(int subjectId, int deptId, int semester,
                                                                String startDate, String endDate) throws SQLException {
        // Distinct dates the subject met within the range
        String dateSql = "SELECT DISTINCT attendance_date FROM attendance " +
                         "WHERE subject_id=? AND attendance_date BETWEEN ? AND ? ORDER BY attendance_date";
        List<String> dates = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(dateSql)) {
            ps.setInt(1, subjectId); ps.setString(2, startDate); ps.setString(3, endDate);
            try (ResultSet rs = ps.executeQuery()) { while (rs.next()) dates.add(rs.getString(1)); }
        }

        // Active students for this dept+sem
        String stuSql = "SELECT student_id, roll_no, student_name, student_type FROM students " +
                        "WHERE dept_id=? AND current_semester=? AND is_active=TRUE ORDER BY roll_no";
        List<Map<String, Object>> students = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(stuSql)) {
            ps.setInt(1, deptId); ps.setInt(2, semester);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> s = new LinkedHashMap<>();
                    s.put("studentId", rs.getInt("student_id"));
                    s.put("rollNo", rs.getString("roll_no"));
                    s.put("studentName", rs.getString("student_name"));
                    s.put("studentType", rs.getString("student_type"));
                    students.add(s);
                }
            }
        }

        // Map of (studentId, date) -> status
        String attSql = "SELECT student_id, attendance_date, status FROM attendance " +
                        "WHERE subject_id=? AND attendance_date BETWEEN ? AND ?";
        Map<Integer, Map<String, String>> attMap = new HashMap<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(attSql)) {
            ps.setInt(1, subjectId); ps.setString(2, startDate); ps.setString(3, endDate);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int sid = rs.getInt("student_id");
                    attMap.computeIfAbsent(sid, k -> new HashMap<>())
                          .put(rs.getString("attendance_date"), rs.getString("status"));
                }
            }
        }

        // Build rows: each student row has a "statuses" map keyed by date
        List<Map<String, Object>> rows = new ArrayList<>();
        for (var stu : students) {
            Map<String, Object> row = new LinkedHashMap<>(stu);
            int stuId = (int) stu.get("studentId");
            Map<String, String> stuAtt = attMap.getOrDefault(stuId, Map.of());
            Map<String, String> statuses = new LinkedHashMap<>();
            int held = 0, present = 0;
            for (String d : dates) {
                String st = stuAtt.get(d);
                statuses.put(d, st);
                if (st != null) {
                    held++;
                    if ("P".equals(st) || "L".equals(st)) present++;
                }
            }
            row.put("statuses", statuses);
            row.put("held", held);
            row.put("present", present);
            row.put("percent", held > 0 ? Math.round(present * 1000.0 / held) / 10.0 : 0);
            rows.add(row);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("dates", dates);
        result.put("rows", rows);
        return result;
    }

}
