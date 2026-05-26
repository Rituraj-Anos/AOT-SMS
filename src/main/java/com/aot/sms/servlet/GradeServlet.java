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
}
