package com.aot.sms.servlet;

import com.aot.sms.dao.DBConnection;
import com.aot.sms.dao.GradeDAO;
import com.aot.sms.dao.MarksDAO;
import com.aot.sms.dao.SubjectDAO;
import com.aot.sms.model.Grade;
import com.aot.sms.model.Marks;
import com.aot.sms.model.Subject;
import com.aot.sms.util.HttpUtil;
import com.aot.sms.util.MAKAUTCalculator;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.Connection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Marks APIs — JWT-protected. Only admin/teacher can write.
 *
 *   POST /api/marks                  — upsert CT/ESE marks (auto best2, attendance, total, grade, SGPA)
 *   GET  /api/marks?studentId=&sem=  — marks for a student in a semester
 *   GET  /api/marks?subjectId=&sem=  — marks for all students in a subject (teacher entry view)
 */
@WebServlet("/api/marks")
public class MarksServlet extends HttpServlet {

    private final MarksDAO marksDAO   = new MarksDAO();
    private final GradeDAO gradeDAO   = new GradeDAO();
    private final SubjectDAO subjDAO  = new SubjectDAO();

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) {
        HttpUtil.handlePreflight(req, resp);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        try {
            String studentIdStr = req.getParameter("studentId");
            String subjectIdStr = req.getParameter("subjectId");
            String semStr       = req.getParameter("sem");
            if (semStr == null) { HttpUtil.writeError(resp, 400, "sem is required"); return; }
            int sem = Integer.parseInt(semStr);

            if (studentIdStr != null) {
                List<Marks> rows = marksDAO.getByStudent(Integer.parseInt(studentIdStr), sem);
                HttpUtil.writeOk(resp, rows);
                return;
            }
            if (subjectIdStr != null) {
                List<Marks> rows = marksDAO.getBySubject(Integer.parseInt(subjectIdStr), sem);
                HttpUtil.writeOk(resp, rows);
                return;
            }
            HttpUtil.writeError(resp, 400, "studentId or subjectId is required");
        } catch (NumberFormatException nfe) {
            HttpUtil.writeError(resp, 400, "Invalid numeric parameter.");
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Failed to load marks: " + e.getMessage());
        }
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

            int studentId    = body.get("studentId").getAsInt();
            int subjectId    = body.get("subjectId").getAsInt();
            int semester     = body.get("semester").getAsInt();
            String acYear    = body.has("academicYear") && !body.get("academicYear").isJsonNull()
                                  ? body.get("academicYear").getAsString() : null;
            Double ct1       = optDouble(body, "ct1");
            Double ct2       = optDouble(body, "ct2");
            Double ct3       = optDouble(body, "ct3");
            Double ct4       = optDouble(body, "ct4");
            Double eseMarks  = optDouble(body, "eseMarks");
            Integer attMarks = body.has("attendanceMarks") && !body.get("attendanceMarks").isJsonNull()
                                  ? body.get("attendanceMarks").getAsInt() : null;
            boolean declareResult = body.has("isResultDeclared") && !body.get("isResultDeclared").isJsonNull()
                                  && body.get("isResultDeclared").getAsBoolean();
            int teacherId    = uid == null ? 0 : uid;

            // Admin is not in teachers table — set entered_by to null to avoid FK violation
            Integer enteredBy = null;
            if ("teacher".equals(role)) {
                enteredBy = teacherId;
            }

            // Upsert CTs (and eventually ESE in a single PreparedStatement chain)
            marksDAO.upsertCT(studentId, subjectId, semester, acYear, ct1, ct2, ct3, ct4, enteredBy);
            if (eseMarks != null) {
                marksDAO.updateESE(studentId, subjectId, semester, eseMarks);
            }

            // Recompute best2 and total via direct SQL — keeps us off the recompute spaghetti
            try (Connection conn = DBConnection.getConnection()) {

                // Best-two-of-four
                marksDAO.calculateBestTwo(studentId, subjectId, semester);

                // Set attendance marks if explicitly provided
                if (attMarks != null) {
                    String upd = "UPDATE marks SET attendance_marks = ? WHERE student_id=? AND subject_id=? AND semester=?";
                    try (var ps = conn.prepareStatement(upd)) {
                        ps.setInt(1, attMarks);
                        ps.setInt(2, studentId);
                        ps.setInt(3, subjectId);
                        ps.setInt(4, semester);
                        ps.executeUpdate();
                    }
                }

                // Recompute total = best2 + ese + attendance_marks
                String tot = "UPDATE marks SET total_marks = " +
                             "COALESCE(best_two_marks,0) + COALESCE(ese_marks,0) + COALESCE(attendance_marks,0) " +
                             "WHERE student_id=? AND subject_id=? AND semester=?";
                try (var ps = conn.prepareStatement(tot)) {
                    ps.setInt(1, studentId);
                    ps.setInt(2, subjectId);
                    ps.setInt(3, semester);
                    ps.executeUpdate();
                }

                // Read back current total to compute grade
                Double total = null;
                try (var ps = conn.prepareStatement(
                        "SELECT total_marks FROM marks WHERE student_id=? AND subject_id=? AND semester=?")) {
                    ps.setInt(1, studentId);
                    ps.setInt(2, subjectId);
                    ps.setInt(3, semester);
                    try (var rs = ps.executeQuery()) {
                        if (rs.next()) {
                            double t = rs.getDouble(1);
                            total = rs.wasNull() ? null : t;
                        }
                    }
                }

                // Auto-write grade
                if (total != null) {
                    Subject subject = subjDAO.getById(subjectId);
                    if (subject == null) {
                        HttpUtil.writeError(resp, 404, "Subject not found");
                        return;
                    }
                    MAKAUTCalculator.GradeResult gr = MAKAUTCalculator.calcGrade(total);
                    Grade g = new Grade();
                    g.setStudentId(studentId);
                    g.setSubjectId(subjectId);
                    g.setSemester(semester);
                    g.setAcademicYear(acYear);
                    g.setGrade(gr.grade);
                    g.setGradePoint(gr.point);
                    g.setCredits(subject.getCredits());
                    g.setBacklog("F".equals(gr.grade));
                    gradeDAO.upsert(g);
                }

                // Recalculate SGPA / CGPA / percentage
                MAKAUTCalculator.recalculateSGPA(conn, studentId, semester);

                // Set is_result_declared if requested
                if (declareResult) {
                    String decl = "UPDATE marks SET is_result_declared = TRUE " +
                                  "WHERE student_id=? AND subject_id=? AND semester=? AND total_marks IS NOT NULL";
                    try (var ps = conn.prepareStatement(decl)) {
                        ps.setInt(1, studentId);
                        ps.setInt(2, subjectId);
                        ps.setInt(3, semester);
                        ps.executeUpdate();
                    }
                }
            }

            // Return latest row
            List<Marks> rows = marksDAO.getByStudent(studentId, semester);
            Marks updated = rows.stream()
                    .filter(m -> m.getSubjectId() == subjectId)
                    .findFirst().orElse(null);
            HttpUtil.writeOk(resp, updated, "Marks saved");
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Failed to save marks: " + e.getMessage());
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        // Same logic as POST — upsert
        doPost(req, resp);
    }

    private Double optDouble(JsonObject obj, String key) {
        if (!obj.has(key) || obj.get(key).isJsonNull()) return null;
        try { return obj.get(key).getAsDouble(); } catch (Exception e) { return null; }
    }
}
