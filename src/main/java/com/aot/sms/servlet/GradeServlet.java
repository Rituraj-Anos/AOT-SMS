package com.aot.sms.servlet;

import com.aot.sms.dao.DBConnection;
import com.aot.sms.dao.GradeDAO;
import com.aot.sms.model.Grade;
import com.aot.sms.util.HttpUtil;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * Grade + SGPA/CGPA APIs.
 *
 *   GET /api/grades?studentId=X            — full result bundle: grades + sgpa-by-sem + cgpa + %
 *   GET /api/grades?studentId=X&sem=4      — semester-specific grade list
 *   GET /api/grades?studentId=X&backlogs=1 — only F-graded subjects
 */
@WebServlet("/api/grades")
public class GradeServlet extends HttpServlet {

    private final GradeDAO dao = new GradeDAO();

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) {
        HttpUtil.handlePreflight(req, resp);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        try {
            // Batch mode: returns summary for all students in a dept+semester (single query)
            if ("batch".equals(req.getParameter("type"))) {
                int deptId = Integer.parseInt(req.getParameter("deptId"));
                int semester = Integer.parseInt(req.getParameter("semester"));
                List<Map<String, Object>> results = getBatchResults(deptId, semester);
                HttpUtil.writeOk(resp, results);
                return;
            }

            String idStr = req.getParameter("studentId");
            if (idStr == null) { HttpUtil.writeError(resp, 400, "studentId required"); return; }
            int studentId = Integer.parseInt(idStr);

            if ("1".equals(req.getParameter("backlogs"))) {
                HttpUtil.writeOk(resp, dao.getBacklogs(studentId));
                return;
            }

            String semStr = req.getParameter("sem");
            if (semStr != null) {
                HttpUtil.writeOk(resp, dao.getByStudent(studentId, Integer.parseInt(semStr)));
                return;
            }

            // Full result bundle: pull from sgpa_cgpa table + grades summary
            Map<String, Object> bundle = new LinkedHashMap<>();
            bundle.put("studentId", studentId);

            // SGPA per semester
            Map<Integer, Double> sgpaBySem = new TreeMap<>();
            Double cgpa = null, percentage = null;
            String sql = "SELECT sem1_sgpa, sem2_sgpa, sem3_sgpa, sem4_sgpa, sem5_sgpa, sem6_sgpa, " +
                         "sem7_sgpa, sem8_sgpa, cgpa, percentage FROM sgpa_cgpa WHERE student_id=?";
            try (Connection c = DBConnection.getConnection();
                 PreparedStatement ps = c.prepareStatement(sql)) {
                ps.setInt(1, studentId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        for (int i = 1; i <= 8; i++) {
                            double v = rs.getDouble("sem" + i + "_sgpa");
                            if (!rs.wasNull() && v > 0) sgpaBySem.put(i, v);
                        }
                        double c1 = rs.getDouble("cgpa");
                        cgpa = rs.wasNull() ? null : c1;
                        double p = rs.getDouble("percentage");
                        percentage = rs.wasNull() ? null : p;
                    }
                }
            }
            bundle.put("sgpaBySemester", sgpaBySem);
            bundle.put("cgpa",           cgpa);
            bundle.put("percentage",     percentage);

            // Backlogs + total grades
            List<Grade> backlogs = dao.getBacklogs(studentId);
            bundle.put("backlogCount", backlogs.size());

            List<Grade> all = new ArrayList<>();
            for (int s = 1; s <= 8; s++) all.addAll(dao.getByStudent(studentId, s));
            bundle.put("grades", all);

            HttpUtil.writeOk(resp, bundle);
        } catch (NumberFormatException nfe) {
            HttpUtil.writeError(resp, 400, "Invalid numeric parameter.");
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Failed to load grades: " + e.getMessage());
        }
    }

    /** Batch: get CGPA/backlog summary for all students in a dept+semester in ONE query. */
    private List<Map<String, Object>> getBatchResults(int deptId, int semester) throws Exception {
        String sql =
            "SELECT s.student_id, s.roll_no, s.student_name, " +
            "  sc.cgpa, sc.percentage, " +
            "  (SELECT COUNT(*) FROM grades g WHERE g.student_id = s.student_id AND g.grade = 'F' AND g.is_backlog = TRUE AND g.backlog_cleared = FALSE) AS backlogs, " +
            "  (SELECT MAX(g2.semester) FROM grades g2 WHERE g2.student_id = s.student_id) AS max_sem " +
            "FROM students s " +
            "LEFT JOIN sgpa_cgpa sc ON s.student_id = sc.student_id " +
            "WHERE s.dept_id = ? AND s.current_semester = ? AND s.is_active = TRUE " +
            "ORDER BY s.roll_no";
        List<Map<String, Object>> out = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, deptId); ps.setInt(2, semester);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("studentId", rs.getInt("student_id"));
                    row.put("rollNo", rs.getString("roll_no"));
                    row.put("studentName", rs.getString("student_name"));
                    double cgpa = rs.getDouble("cgpa");
                    row.put("cgpa", rs.wasNull() ? 0 : cgpa);
                    double pct = rs.getDouble("percentage");
                    row.put("percentage", rs.wasNull() ? 0 : pct);
                    row.put("backlogs", rs.getInt("backlogs"));
                    int maxSem = rs.getInt("max_sem");
                    row.put("semestersDone", rs.wasNull() ? 0 : maxSem);
                    out.add(row);
                }
            }
        }
        return out;
    }
}
