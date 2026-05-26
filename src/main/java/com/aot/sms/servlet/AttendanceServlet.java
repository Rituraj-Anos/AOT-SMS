package com.aot.sms.servlet;

import com.aot.sms.dao.AttendanceDAO;
import com.aot.sms.dao.DBConnection;
import com.aot.sms.dao.SubjectDAO;
import com.aot.sms.model.Attendance;
import com.aot.sms.model.Subject;
import com.aot.sms.util.HttpUtil;
import com.aot.sms.util.MAKAUTCalculator;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Attendance APIs — JWT-protected.
 *
 *   POST /api/attendance              — bulk mark/upsert (teacher: today only; admin: any date)
 *   GET  /api/attendance?studentId=X  — per-subject summary for a student
 *   GET  /api/attendance?subjectId=X&date=Y   — class roster + statuses
 */
@WebServlet("/api/attendance")
public class AttendanceServlet extends HttpServlet {

    private final AttendanceDAO dao = new AttendanceDAO();
    private final SubjectDAO subjectDAO = new SubjectDAO();

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) {
        HttpUtil.handlePreflight(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        String role = (String) req.getAttribute("auth.role");
        Integer uid = (Integer) req.getAttribute("auth.uid");
        if (!"admin".equals(role) && !"teacher".equals(role)) {
            HttpUtil.writeError(resp, 403, "Admin or teacher role required.");
            return;
        }

        try {
            JsonObject body = JsonParser.parseReader(req.getReader()).getAsJsonObject();
            int subjectId = body.get("subjectId").getAsInt();
            String date   = body.get("date").getAsString();   // yyyy-MM-dd

            if ("teacher".equals(role)) {
                String today = LocalDate.now().toString();
                if (!today.equals(date)) {
                    HttpUtil.writeError(resp, 403,
                            "Teachers can only mark attendance for today (" + today + ").");
                    return;
                }
            }

            JsonArray entries = body.getAsJsonArray("entries");
            List<Attendance> records = new ArrayList<>();
            for (var el : entries) {
                JsonObject e = el.getAsJsonObject();
                Attendance a = new Attendance();
                a.setStudentId(e.get("studentId").getAsInt());
                a.setSubjectId(subjectId);
                a.setAttendanceDate(date);
                a.setStatus(e.get("status").getAsString());
                a.setMarkedBy(uid == null ? 0 : uid);
                records.add(a);
            }

            int[] result = dao.markBulk(records);
            HttpUtil.writeOk(resp, Map.of("saved", result.length), "Attendance saved");
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Failed to mark attendance: " + e.getMessage());
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        try {
            String type = req.getParameter("type");

            // New enhanced endpoints
            if ("phase".equals(type)) {
                int subjectId = Integer.parseInt(req.getParameter("subjectId"));
                int deptId    = Integer.parseInt(req.getParameter("deptId"));
                int semester  = Integer.parseInt(req.getParameter("semester"));
                String start  = req.getParameter("start");
                String end    = req.getParameter("end");
                HttpUtil.writeOk(resp, dao.getPhaseSummary(subjectId, deptId, semester, start, end));
                return;
            }
            if ("fullsheet".equals(type)) {
                int deptId   = Integer.parseInt(req.getParameter("deptId"));
                int semester = Integer.parseInt(req.getParameter("semester"));
                HttpUtil.writeOk(resp, dao.getFullSheetData(deptId, semester));
                return;
            }
            if ("history".equals(type)) {
                int subjectId = Integer.parseInt(req.getParameter("subjectId"));
                String date   = req.getParameter("date");
                List<Attendance> rows = dao.getByDateSubject(date, subjectId);
                HttpUtil.writeOk(resp, rows);
                return;
            }
            if ("daterange".equals(type)) {
                int subjectId = Integer.parseInt(req.getParameter("subjectId"));
                int deptId    = Integer.parseInt(req.getParameter("deptId"));
                int semester  = Integer.parseInt(req.getParameter("semester"));
                String start  = req.getParameter("start");
                String end    = req.getParameter("end");
                HttpUtil.writeOk(resp, dao.getDateRangeAttendance(subjectId, deptId, semester, start, end));
                return;
            }
            if ("selfrecord".equals(type)) {
                int studentId = Integer.parseInt(req.getParameter("studentId"));
                HttpUtil.writeOk(resp, dao.getStudentSelfRecordSummary(studentId));
                return;
            }

            // Original endpoints
            String studentIdStr = req.getParameter("studentId");
            String subjectIdStr = req.getParameter("subjectId");
            String date         = req.getParameter("date");

            // Class roster mode
            if (subjectIdStr != null && date != null) {
                int subjectId = Integer.parseInt(subjectIdStr);
                List<Attendance> rows = dao.getByDateSubject(date, subjectId);
                List<Map<String, Object>> roster = buildRoster(subjectId, date, rows);
                HttpUtil.writeOk(resp, roster);
                return;
            }

            // Student summary mode
            if (studentIdStr != null) {
                int studentId = Integer.parseInt(studentIdStr);
                List<Map<String, Object>> summary = buildStudentSummary(studentId);
                HttpUtil.writeOk(resp, summary);
                return;
            }

            HttpUtil.writeError(resp, 400, "Provide either studentId or (subjectId + date) or type parameter.");
        } catch (NumberFormatException nfe) {
            HttpUtil.writeError(resp, 400, "Invalid numeric parameter.");
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Failed to load attendance: " + e.getMessage());
        }
    }

    /** Roster of active students with their status (or null) for the subject+date,
     *  plus each student's overall attendance % across ALL subjects (for the badge). */
    private List<Map<String, Object>> buildRoster(int subjectId, String date, List<Attendance> existing) throws Exception {
        Map<Integer, String> byStudent = new LinkedHashMap<>();
        for (Attendance a : existing) byStudent.put(a.getStudentId(), a.getStatus());

        // Compute overall % per student in one query
        Map<Integer, Double> pctByStudent = new java.util.HashMap<>();
        String pctSql = "SELECT student_id, COUNT(*) AS held, " +
                        "SUM(CASE WHEN status IN ('P','L') THEN 1 ELSE 0 END) AS present " +
                        "FROM attendance GROUP BY student_id";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(pctSql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                int held = rs.getInt("held"), present = rs.getInt("present");
                double pct = held > 0 ? present * 100.0 / held : 0;
                pctByStudent.put(rs.getInt("student_id"), Math.round(pct * 10.0) / 10.0);
            }
        }

        // Pull the dept+section of the subject so we filter to that cohort
        String subSql = "SELECT dept_id, semester FROM subjects WHERE subject_id=?";
        int subDeptId = 0, subSem = 0;
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(subSql)) {
            ps.setInt(1, subjectId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) { subDeptId = rs.getInt("dept_id"); subSem = rs.getInt("semester"); }
            }
        }

        String sql = "SELECT student_id, roll_no, student_name, section FROM students " +
                     "WHERE is_active = TRUE AND dept_id=? AND current_semester=? ORDER BY roll_no";
        List<Map<String, Object>> out = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, subDeptId); ps.setInt(2, subSem);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int sid = rs.getInt("student_id");
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("studentId",   sid);
                    row.put("rollNo",      rs.getString("roll_no"));
                    row.put("studentName", rs.getString("student_name"));
                    row.put("section",     rs.getString("section"));
                    row.put("status",      byStudent.get(sid));
                    row.put("overallPct",  pctByStudent.getOrDefault(sid, 0.0));
                    out.add(row);
                }
            }
        }
        return out;
    }

    /** Per-subject attendance summary for a student. */
    private List<Map<String, Object>> buildStudentSummary(int studentId) throws Exception {
        String sql =
            "SELECT a.subject_id, sub.subject_code, sub.subject_name, " +
            "  COUNT(*) AS total, " +
            "  SUM(CASE WHEN a.status IN ('P','L') THEN 1 ELSE 0 END) AS present " +
            "FROM attendance a JOIN subjects sub ON a.subject_id = sub.subject_id " +
            "WHERE a.student_id = ? GROUP BY a.subject_id ORDER BY sub.subject_code";
        List<Map<String, Object>> out = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, studentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int held    = rs.getInt("total");
                    int present = rs.getInt("present");
                    double pct  = held == 0 ? 0 : (present * 100.0 / held);
                    int needed  = MAKAUTCalculator.classesNeededFor75(held, present);
                    Map<String, Object> r = new LinkedHashMap<>();
                    r.put("subjectId",          rs.getInt("subject_id"));
                    r.put("subjectCode",        rs.getString("subject_code"));
                    r.put("subjectName",        rs.getString("subject_name"));
                    r.put("held",               held);
                    r.put("present",            present);
                    r.put("absent",             held - present);
                    r.put("percent",            Math.round(pct * 100.0) / 100.0);
                    r.put("classesNeededFor75", needed);
                    out.add(r);
                }
            }
        }
        return out;
    }
}
