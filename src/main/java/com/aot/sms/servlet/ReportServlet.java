package com.aot.sms.servlet;

import com.aot.sms.dao.DBConnection;
import com.aot.sms.util.CSVExporter;
import com.aot.sms.util.HttpUtil;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

/**
 * CSV report exports.
 *
 *   GET /api/reports?type=attendance[&deptId=&sem=]   — attendance summary CSV
 *   GET /api/reports?type=marks[&sem=]                — marks sheet CSV
 *   GET /api/reports?type=fees[&deptId=]               — fee defaulters CSV
 */
@WebServlet("/api/reports")
public class ReportServlet extends HttpServlet {

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) {
        HttpUtil.handlePreflight(req, resp);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        String role = (String) req.getAttribute("auth.role");
        if (!"admin".equals(role) && !"teacher".equals(role)) {
            HttpUtil.writeError(resp, 403, "Admin or teacher role required.");
            return;
        }

        String type = req.getParameter("type");
        if (type == null) { HttpUtil.writeError(resp, 400, "type is required"); return; }

        resp.setContentType("text/csv; charset=UTF-8");
        resp.setCharacterEncoding("UTF-8");

        switch (type) {
            case "attendance": exportAttendance(req, resp); break;
            case "marks":      exportMarks(req, resp);      break;
            case "fees":       exportFees(req, resp);       break;
            case "fullsheet":  exportFullSheet(req, resp);  break;
            case "phase":      exportPhase(req, resp);      break;
            case "daterange":  exportDateRange(req, resp);  break;
            default:
                HttpUtil.writeError(resp, 400, "Unknown report type: " + type);
        }
    }

    private void exportAttendance(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setHeader("Content-Disposition", "attachment; filename=attendance_report.csv");
        StringBuilder sql = new StringBuilder(
            "SELECT s.roll_no AS RollNo, s.student_name AS Name, d.dept_code AS Dept, " +
            "       s.current_semester AS Sem, sub.subject_code AS Subject, " +
            "       COUNT(*) AS Held, " +
            "       SUM(CASE WHEN a.status IN ('P','L') THEN 1 ELSE 0 END) AS Present, " +
            "       ROUND(SUM(CASE WHEN a.status IN ('P','L') THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS Pct " +
            "FROM attendance a " +
            "JOIN students s   ON a.student_id = s.student_id " +
            "JOIN departments d ON s.dept_id   = d.dept_id " +
            "JOIN subjects sub ON a.subject_id = sub.subject_id " +
            "WHERE 1=1 ");
        if (req.getParameter("deptId") != null) sql.append("AND s.dept_id=").append(intParam(req, "deptId")).append(" ");
        if (req.getParameter("sem") != null)    sql.append("AND s.current_semester=").append(intParam(req, "sem")).append(" ");
        sql.append("GROUP BY s.student_id, sub.subject_id ORDER BY s.roll_no, sub.subject_code");

        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql.toString());
             ResultSet rs = ps.executeQuery();
             PrintWriter w = resp.getWriter()) {
            CSVExporter.exportResultSet(rs, w);
        } catch (Exception e) {
            // Already partial CSV may have been written — best we can do
            try { resp.getWriter().write("\nERROR: " + e.getMessage()); } catch (Exception ignored) {}
        }
    }

    private void exportMarks(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setHeader("Content-Disposition", "attachment; filename=marks_report.csv");
        StringBuilder sql = new StringBuilder(
            "SELECT s.roll_no AS RollNo, s.student_name AS Name, sub.subject_code AS Subject, " +
            "       m.semester AS Sem, m.ct1 AS CA1, m.ct2 AS CA2, m.ct3 AS CA3, m.ct4 AS CA4, " +
            "       m.best_two_marks AS Best2, m.ese_marks AS ESE, " +
            "       m.attendance_marks AS AttMarks, m.total_marks AS Total " +
            "FROM marks m " +
            "JOIN students s   ON m.student_id = s.student_id " +
            "JOIN subjects sub ON m.subject_id = sub.subject_id " +
            "WHERE 1=1 ");
        if (req.getParameter("sem") != null) sql.append("AND m.semester=").append(intParam(req, "sem")).append(" ");
        sql.append("ORDER BY s.roll_no, sub.subject_code");

        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql.toString());
             ResultSet rs = ps.executeQuery();
             PrintWriter w = resp.getWriter()) {
            CSVExporter.exportResultSet(rs, w);
        } catch (Exception e) {
            try { resp.getWriter().write("\nERROR: " + e.getMessage()); } catch (Exception ignored) {}
        }
    }

    private void exportFees(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setHeader("Content-Disposition", "attachment; filename=fees_report.csv");
        StringBuilder sql = new StringBuilder(
            "SELECT s.roll_no AS RollNo, s.student_name AS Name, d.dept_code AS Dept, " +
            "       f.semester AS Sem, f.total_amount AS Total, f.amount_paid AS Paid, " +
            "       f.balance_due AS Balance, f.payment_mode AS Mode, f.receipt_no AS Receipt " +
            "FROM fees f " +
            "JOIN students s    ON f.student_id = s.student_id " +
            "JOIN departments d ON s.dept_id    = d.dept_id " +
            "WHERE 1=1 ");
        if (req.getParameter("deptId") != null) sql.append("AND s.dept_id=").append(intParam(req, "deptId")).append(" ");
        sql.append("ORDER BY s.roll_no");

        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql.toString());
             ResultSet rs = ps.executeQuery();
             PrintWriter w = resp.getWriter()) {
            CSVExporter.exportResultSet(rs, w);
        } catch (Exception e) {
            try { resp.getWriter().write("\nERROR: " + e.getMessage()); } catch (Exception ignored) {}
        }
    }

    /** Official AOT-style full attendance sheet CSV — matches the official CSE1 format. */
    private void exportFullSheet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        int deptId   = intParam(req, "deptId");
        int semester = intParam(req, "semester");
        if (deptId == 0 || semester == 0) {
            HttpUtil.writeError(resp, 400, "deptId and semester are required");
            return;
        }
        try {
            var data = new com.aot.sms.dao.AttendanceDAO().getFullSheetData(deptId, semester);
            @SuppressWarnings("unchecked")
            var allSubjects = (java.util.List<java.util.Map<String, Object>>) data.get("subjects");
            @SuppressWarnings("unchecked")
            var rows = (java.util.List<java.util.Map<String, Object>>) data.get("rows");

            // Filter out training subjects (AAT, ABP, EET, SST-JAVA)
            java.util.Set<String> excludeCodes = java.util.Set.of("AAT", "ABP", "EET", "SST-JAVA");
            java.util.List<java.util.Map<String, Object>> subjects = new java.util.ArrayList<>();
            for (var s : allSubjects) {
                String code = (String) s.get("subjectCode");
                if (!excludeCodes.contains(code)) subjects.add(s);
            }

            // Separate theory and lab subjects (official order)
            java.util.List<java.util.Map<String, Object>> theorySubjects = new java.util.ArrayList<>();
            java.util.List<java.util.Map<String, Object>> labSubjects = new java.util.ArrayList<>();
            // Official order for CSE1 Sem4
            String[] officialOrder = {"PCC-CS401","PCC-CS402","PCC-CS403","PCC-CS404","BSC-401","MC-401","PCC-CS492","PCC-CS494"};
            java.util.Map<String, java.util.Map<String, Object>> byCode = new java.util.LinkedHashMap<>();
            for (var s : subjects) byCode.put((String) s.get("subjectCode"), s);

            for (String code : officialOrder) {
                var s = byCode.get(code);
                if (s == null) continue;
                String type = String.valueOf(s.get("subjectType"));
                if ("lab".equals(type)) labSubjects.add(s);
                else theorySubjects.add(s);
            }
            // Add any remaining subjects not in official order
            for (var s : subjects) {
                String code = (String) s.get("subjectCode");
                if (!byCode.containsKey(code)) continue;
                boolean found = false;
                for (String oc : officialOrder) if (oc.equals(code)) { found = true; break; }
                if (!found) {
                    String type = String.valueOf(s.get("subjectType"));
                    if ("lab".equals(type)) labSubjects.add(s);
                    else theorySubjects.add(s);
                }
            }

            // Look up dept code for header
            String deptCode = "";
            try (Connection c = DBConnection.getConnection();
                 PreparedStatement ps = c.prepareStatement("SELECT dept_code FROM departments WHERE dept_id=?")) {
                ps.setInt(1, deptId);
                try (ResultSet rs = ps.executeQuery()) { if (rs.next()) deptCode = rs.getString(1); }
            }

            String fileName = String.format("attendance_fullsheet_%s_sem%d.csv", deptCode, semester);
            resp.setHeader("Content-Disposition", "attachment; filename=" + fileName);

            try (PrintWriter w = resp.getWriter()) {
                String today = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy"));

                // Title rows
                w.println("ATTENDANCE REPORT OF EVEN SEMESTER 2026");
                w.println("DEPARTMENT:," + deptCode + ",SEMESTER:," + semester + "th,DATE:," + today);
                w.println();

                // Column headers — official format
                StringBuilder header = new StringBuilder("Roll No,Name");
                for (var s : theorySubjects) {
                    String code = (String) s.get("subjectCode");
                    header.append(',').append(code).append(" Held")
                          .append(',').append(code).append(" Present")
                          .append(',').append(code).append(" %");
                }
                header.append(",Theory Total Held,Theory Total Present,Theory Total %");
                for (var s : labSubjects) {
                    String code = (String) s.get("subjectCode");
                    header.append(',').append(code).append(" Held")
                          .append(',').append(code).append(" Present")
                          .append(',').append(code).append(" %");
                }
                header.append(",Practical Total Held,Practical Total Present,Practical Total %");
                header.append(",Overall Held,Overall Present,Overall %,ECA");
                w.println(header.toString());

                // Group rows: regular, then transfer, then lateral
                java.util.List<java.util.Map<String, Object>> regular  = new java.util.ArrayList<>();
                java.util.List<java.util.Map<String, Object>> lateral  = new java.util.ArrayList<>();
                java.util.List<java.util.Map<String, Object>> transfer = new java.util.ArrayList<>();
                for (var r : rows) {
                    String t = String.valueOf(r.get("studentType"));
                    if ("lateral".equals(t)) lateral.add(r);
                    else if ("transfer".equals(t)) transfer.add(r);
                    else regular.add(r);
                }

                // Regular students
                w.println();
                w.println(",Regular Students");
                for (var r : regular) writeStudentRow(w, r, theorySubjects, labSubjects);

                // Transfer students
                if (!transfer.isEmpty()) {
                    w.println();
                    w.println(",Transfer Students");
                    for (var r : transfer) writeStudentRow(w, r, theorySubjects, labSubjects);
                }

                // Lateral entry
                if (!lateral.isEmpty()) {
                    w.println();
                    w.println(",Lateral Entry");
                    for (var r : lateral) writeStudentRow(w, r, theorySubjects, labSubjects);
                }

                // Total Classes Held row
                w.println();
                StringBuilder totals = new StringBuilder(",TOTAL CLASSES HELD");
                for (var s : theorySubjects) {
                    String code = (String) s.get("subjectCode");
                    int maxHeld = getMaxHeld(rows, code);
                    totals.append(',').append(maxHeld).append(",,");
                }
                // Theory total
                int theoryTotalHeld = 0;
                for (var s : theorySubjects) theoryTotalHeld += getMaxHeld(rows, (String) s.get("subjectCode"));
                totals.append(',').append(theoryTotalHeld).append(",,");
                for (var s : labSubjects) {
                    String code = (String) s.get("subjectCode");
                    int maxHeld = getMaxHeld(rows, code);
                    totals.append(',').append(maxHeld).append(",,");
                }
                // Practical total
                int practicalTotalHeld = 0;
                for (var s : labSubjects) practicalTotalHeld += getMaxHeld(rows, (String) s.get("subjectCode"));
                totals.append(',').append(practicalTotalHeld).append(",,");
                // Overall
                totals.append(',').append(theoryTotalHeld + practicalTotalHeld).append(",,,");
                w.println(totals.toString());

                w.flush();
            }
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Failed to export full sheet: " + e.getMessage());
        }
    }

    private void writeStudentRow(PrintWriter w, java.util.Map<String, Object> r,
                                 java.util.List<java.util.Map<String, Object>> theorySubjects,
                                 java.util.List<java.util.Map<String, Object>> labSubjects) {
        StringBuilder line = new StringBuilder();
        line.append(escape(String.valueOf(r.get("rollNo"))))
            .append(',').append(escape(String.valueOf(r.get("studentName"))));

        // Theory subjects
        for (var s : theorySubjects) {
            String code = (String) s.get("subjectCode");
            int held = toInt(r.get(code + "_held"));
            int present = toInt(r.get(code + "_present"));
            line.append(',').append(held)
                .append(',').append(present)
                .append(',').append(fmtPct(r.get(code + "_pct")));
        }
        // Theory totals
        line.append(',').append(toInt(r.get("theoryHeld")))
            .append(',').append(toInt(r.get("theoryPresent")))
            .append(',').append(fmtPct(r.get("theoryPct")));

        // Lab subjects
        for (var s : labSubjects) {
            String code = (String) s.get("subjectCode");
            int held = toInt(r.get(code + "_held"));
            int present = toInt(r.get(code + "_present"));
            line.append(',').append(held)
                .append(',').append(present)
                .append(',').append(fmtPct(r.get(code + "_pct")));
        }
        // Practical totals
        line.append(',').append(toInt(r.get("practicalHeld")))
            .append(',').append(toInt(r.get("practicalPresent")))
            .append(',').append(fmtPct(r.get("practicalPct")));

        // Overall
        line.append(',').append(toInt(r.get("overallHeld")))
            .append(',').append(toInt(r.get("overallPresent")))
            .append(',').append(fmtPct(r.get("overallPct")));

        // ECA (placeholder — 0 for now)
        line.append(',').append(0);

        w.println(line.toString());
    }

    private int getMaxHeld(java.util.List<java.util.Map<String, Object>> rows, String code) {
        int max = 0;
        for (var r : rows) {
            int v = toInt(r.get(code + "_held"));
            if (v > max) max = v;
        }
        return max;
    }

    private static int toInt(Object o) {
        if (o instanceof Number n) return n.intValue();
        return 0;
    }

    /** Format percentage as integer with % sign (e.g. "80%"), no decimals. */
    private static String fmtPct(Object o) {
        if (o instanceof Number n) {
            long v = Math.round(n.doubleValue());
            return v + "%";
        }
        return "0%";
    }

    /** Phase summary CSV. */
    private void exportPhase(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        int subjectId = intParam(req, "subjectId");
        int deptId    = intParam(req, "deptId");
        int semester  = intParam(req, "semester");
        String start  = req.getParameter("start");
        String end    = req.getParameter("end");
        String phaseName = req.getParameter("phase");
        if (subjectId == 0 || deptId == 0 || semester == 0 || start == null || end == null) {
            HttpUtil.writeError(resp, 400, "subjectId, deptId, semester, start, end required");
            return;
        }
        try {
            var rows = new com.aot.sms.dao.AttendanceDAO()
                .getPhaseSummary(subjectId, deptId, semester, start, end);

            String subjectCode = "";
            try (Connection c = DBConnection.getConnection();
                 PreparedStatement ps = c.prepareStatement("SELECT subject_code FROM subjects WHERE subject_id=?")) {
                ps.setInt(1, subjectId);
                try (ResultSet rs = ps.executeQuery()) { if (rs.next()) subjectCode = rs.getString(1); }
            }
            String label = phaseName != null ? phaseName.replaceAll("[^A-Za-z0-9_-]", "_") : "phase";
            resp.setHeader("Content-Disposition",
                "attachment; filename=" + subjectCode + "_" + label + ".csv");

            try (PrintWriter w = resp.getWriter()) {
                w.println("Subject:," + subjectCode + ",Phase:," + (phaseName == null ? "" : phaseName)
                          + ",From:," + start + ",To:," + end);
                w.println();
                w.println("Roll No,Name,Type,Held,Present,Absent,Leave,ML,%,Status");
                for (var r : rows) {
                    double pct = r.get("percent") instanceof Number n ? n.doubleValue() : 0;
                    String status = pct >= 75 ? "Safe" : pct >= 65 ? "At Risk" : "Detained";
                    w.println(escape(String.valueOf(r.get("rollNo"))) + ","
                            + escape(String.valueOf(r.get("studentName"))) + ","
                            + r.get("studentType") + ","
                            + r.get("held") + "," + r.get("present") + ","
                            + r.get("absent") + "," + r.get("leave") + "," + r.get("ml") + ","
                            + pct + "%," + status);
                }
                w.flush();
            }
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Failed to export phase: " + e.getMessage());
        }
    }

    /** Date range CSV: day-by-day grid. */
    private void exportDateRange(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        int subjectId = intParam(req, "subjectId");
        int deptId    = intParam(req, "deptId");
        int semester  = intParam(req, "semester");
        String start  = req.getParameter("start");
        String end    = req.getParameter("end");
        if (subjectId == 0 || deptId == 0 || semester == 0 || start == null || end == null) {
            HttpUtil.writeError(resp, 400, "subjectId, deptId, semester, start, end required");
            return;
        }
        try {
            var data = new com.aot.sms.dao.AttendanceDAO()
                .getDateRangeAttendance(subjectId, deptId, semester, start, end);
            @SuppressWarnings("unchecked")
            var dates = (java.util.List<String>) data.get("dates");
            @SuppressWarnings("unchecked")
            var rows = (java.util.List<java.util.Map<String, Object>>) data.get("rows");

            String subjectCode = "";
            try (Connection c = DBConnection.getConnection();
                 PreparedStatement ps = c.prepareStatement("SELECT subject_code FROM subjects WHERE subject_id=?")) {
                ps.setInt(1, subjectId);
                try (ResultSet rs = ps.executeQuery()) { if (rs.next()) subjectCode = rs.getString(1); }
            }
            resp.setHeader("Content-Disposition",
                "attachment; filename=" + subjectCode + "_" + start + "_to_" + end + ".csv");

            try (PrintWriter w = resp.getWriter()) {
                w.println("Subject:," + subjectCode + ",From:," + start + ",To:," + end);
                w.println();
                StringBuilder header = new StringBuilder("Roll No,Name,Type");
                for (String d : dates) header.append(',').append(d);
                header.append(",Held,Present,%");
                w.println(header.toString());
                for (var r : rows) {
                    StringBuilder line = new StringBuilder();
                    line.append(escape(String.valueOf(r.get("rollNo"))))
                        .append(',').append(escape(String.valueOf(r.get("studentName"))))
                        .append(',').append(r.get("studentType"));
                    @SuppressWarnings("unchecked")
                    var statuses = (java.util.Map<String, String>) r.get("statuses");
                    for (String d : dates) {
                        String s = statuses.get(d);
                        line.append(',').append(s == null ? "-" : s);
                    }
                    line.append(',').append(r.get("held"))
                        .append(',').append(r.get("present"))
                        .append(',').append(r.get("percent")).append('%');
                    w.println(line.toString());
                }
                w.flush();
            }
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Failed to export date range: " + e.getMessage());
        }
    }

    private static String escape(String s) {
        if (s == null) return "";
        if (s.contains(",") || s.contains("\"") || s.contains("\n")) {
            return "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }

    /** Simple integer-parameter sanitizer to avoid string-injecting the query. */
    private int intParam(HttpServletRequest req, String name) {
        try { return Integer.parseInt(req.getParameter(name)); }
        catch (Exception e) { return 0; }
    }
}
