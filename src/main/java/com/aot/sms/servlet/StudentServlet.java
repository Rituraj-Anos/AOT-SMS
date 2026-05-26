package com.aot.sms.servlet;

import com.aot.sms.dao.StudentDAO;
import com.aot.sms.model.Student;
import com.aot.sms.util.AuthUtil;
import com.aot.sms.util.HttpUtil;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Student CRUD — pure JDBC, JWT-protected by JWTFilter.
 *
 *   GET    /api/students[?deptId=&sem=&section=&type=&search=]
 *   GET    /api/students?rollNo=24CSE001
 *   POST   /api/students                                    — admin only (default password: Student@123)
 *   PUT    /api/students                                    — admin only
 *   DELETE /api/students?id=42                              — admin only (soft delete)
 */
@WebServlet("/api/students")
public class StudentServlet extends HttpServlet {

    private static final String DEFAULT_PASSWORD = "Student@123";
    private final StudentDAO dao = new StudentDAO();

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) {
        HttpUtil.handlePreflight(req, resp);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        try {
            String rollNo = req.getParameter("rollNo");
            if (rollNo != null && !rollNo.isBlank()) {
                Student s = dao.getByRollNo(rollNo);
                if (s == null) { HttpUtil.writeError(resp, 404, "Student not found"); return; }
                HttpUtil.writeOk(resp, s);
                return;
            }

            Integer deptId   = parseIntOrNull(req.getParameter("deptId"));
            Integer semester = parseIntOrNull(req.getParameter("sem"));
            String  section  = blankToNull(req.getParameter("section"));
            String  type     = blankToNull(req.getParameter("type"));
            String  search   = blankToNull(req.getParameter("search"));

            List<Student> list = dao.getAllStudents(deptId, semester, section, type, search);
            HttpUtil.writeOk(resp, list);
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Failed to load students: " + e.getMessage());
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        if (!requireAdmin(req, resp)) return;
        try {
            JsonObject body = JsonParser.parseReader(req.getReader()).getAsJsonObject();
            Student s = parseStudent(body, false);
            if (s.getRollNo() == null || s.getStudentName() == null || s.getDeptId() == 0) {
                HttpUtil.writeError(resp, 400, "rollNo, studentName and deptId are required");
                return;
            }
            String hash = AuthUtil.hashPassword(DEFAULT_PASSWORD);
            int id = dao.insert(s, hash);
            if (id < 0) { HttpUtil.writeError(resp, 500, "Insert failed"); return; }

            Map<String, Object> result = new HashMap<>();
            result.put("studentId", id);
            resp.setStatus(HttpServletResponse.SC_CREATED);
            HttpUtil.writeOk(resp, result, "Student created. Default password: " + DEFAULT_PASSWORD);
        } catch (java.sql.SQLIntegrityConstraintViolationException dup) {
            HttpUtil.writeError(resp, 409, "Roll number already exists");
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Create failed: " + e.getMessage());
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        if (!requireAdmin(req, resp)) return;
        try {
            JsonObject body = JsonParser.parseReader(req.getReader()).getAsJsonObject();
            Student s = parseStudent(body, true);
            if (s.getStudentId() <= 0) { HttpUtil.writeError(resp, 400, "studentId required"); return; }
            boolean ok = dao.update(s);
            if (!ok) { HttpUtil.writeError(resp, 404, "Student not found or no change"); return; }
            HttpUtil.writeOk(resp, null, "Student updated");
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Update failed: " + e.getMessage());
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        if (!requireAdmin(req, resp)) return;
        try {
            String idStr = req.getParameter("id");
            if (idStr == null) idStr = req.getParameter("studentId");
            if (idStr == null) { HttpUtil.writeError(resp, 400, "id required"); return; }
            int id = Integer.parseInt(idStr);
            boolean ok = dao.deactivate(id);
            if (!ok) { HttpUtil.writeError(resp, 404, "Student not found"); return; }
            HttpUtil.writeOk(resp, null, "Student deactivated");
        } catch (NumberFormatException nfe) {
            HttpUtil.writeError(resp, 400, "id must be an integer");
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Delete failed: " + e.getMessage());
        }
    }

    // ── Helpers ─────────────────────────────────────────────

    private static boolean requireAdmin(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String role = (String) req.getAttribute("auth.role");
        if (!"admin".equals(role)) {
            HttpUtil.writeError(resp, 403, "Admin role required.");
            return false;
        }
        return true;
    }

    private Student parseStudent(JsonObject body, boolean expectId) {
        Student s = new Student();
        if (expectId && body.has("studentId")) s.setStudentId(body.get("studentId").getAsInt());
        if (body.has("rollNo") && !body.get("rollNo").isJsonNull())
            s.setRollNo(body.get("rollNo").getAsString());
        if (body.has("studentName") && !body.get("studentName").isJsonNull())
            s.setStudentName(body.get("studentName").getAsString());
        if (body.has("studentType") && !body.get("studentType").isJsonNull())
            s.setStudentType(body.get("studentType").getAsString());
        if (body.has("deptId") && !body.get("deptId").isJsonNull())
            s.setDeptId(body.get("deptId").getAsInt());
        if (body.has("currentSemester") && !body.get("currentSemester").isJsonNull())
            s.setCurrentSemester(body.get("currentSemester").getAsInt());
        if (body.has("section") && !body.get("section").isJsonNull())
            s.setSection(body.get("section").getAsString());
        if (body.has("dob") && !body.get("dob").isJsonNull()) {
            String d = body.get("dob").getAsString();
            if (!d.isBlank()) s.setDob(Date.valueOf(d));
        }
        if (body.has("gender") && !body.get("gender").isJsonNull())
            s.setGender(body.get("gender").getAsString());
        if (body.has("bloodGroup") && !body.get("bloodGroup").isJsonNull())
            s.setBloodGroup(body.get("bloodGroup").getAsString());
        if (body.has("aadharNo") && !body.get("aadharNo").isJsonNull())
            s.setAadharNo(body.get("aadharNo").getAsString());
        if (body.has("phone") && !body.get("phone").isJsonNull())
            s.setPhone(body.get("phone").getAsString());
        if (body.has("email") && !body.get("email").isJsonNull())
            s.setEmail(body.get("email").getAsString());
        if (body.has("parentName") && !body.get("parentName").isJsonNull())
            s.setParentName(body.get("parentName").getAsString());
        if (body.has("parentPhone") && !body.get("parentPhone").isJsonNull())
            s.setParentPhone(body.get("parentPhone").getAsString());
        if (body.has("address") && !body.get("address").isJsonNull())
            s.setAddress(body.get("address").getAsString());
        if (body.has("photoPath") && !body.get("photoPath").isJsonNull())
            s.setPhotoPath(body.get("photoPath").getAsString());
        if (body.has("admissionYear") && !body.get("admissionYear").isJsonNull()) {
            try { s.setAdmissionYear(body.get("admissionYear").getAsInt()); }
            catch (Exception ignore) {}
        }
        return s;
    }

    private static Integer parseIntOrNull(String v) {
        if (v == null || v.isBlank()) return null;
        try { return Integer.parseInt(v.trim()); } catch (Exception e) { return null; }
    }

    private static String blankToNull(String v) {
        return (v == null || v.isBlank()) ? null : v.trim();
    }
}
