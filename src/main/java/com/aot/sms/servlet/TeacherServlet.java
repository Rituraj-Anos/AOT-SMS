package com.aot.sms.servlet;

import com.aot.sms.dao.TeacherDAO;
import com.aot.sms.model.Teacher;
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
 * Teacher CRUD — JWT-protected by JWTFilter.
 *
 *   GET    /api/teachers[?deptId=]
 *   GET    /api/teachers?empId=TCH123
 *   GET    /api/teachers?id=5&mappings=true
 *   POST   /api/teachers                  — admin (default password: Teacher@123)
 *   PUT    /api/teachers                  — admin
 *   DELETE /api/teachers?id=5             — admin (soft delete)
 */
@WebServlet("/api/teachers")
public class TeacherServlet extends HttpServlet {

    private static final String DEFAULT_PASSWORD = "Teacher@123";
    private final TeacherDAO dao = new TeacherDAO();

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) {
        HttpUtil.handlePreflight(req, resp);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        try {
            String empId = req.getParameter("empId");
            String idStr = req.getParameter("id");
            String mappings = req.getParameter("mappings");

            if ("true".equalsIgnoreCase(mappings) && idStr != null) {
                int teacherId = Integer.parseInt(idStr);
                List<Map<String, Object>> rows = dao.getSubjectMappings(teacherId);
                HttpUtil.writeOk(resp, rows);
                return;
            }

            if (empId != null && !empId.isBlank()) {
                Teacher t = dao.getByEmpId(empId);
                if (t == null) { HttpUtil.writeError(resp, 404, "Teacher not found"); return; }
                HttpUtil.writeOk(resp, t);
                return;
            }

            Integer deptId = parseIntOrNull(req.getParameter("deptId"));
            List<Teacher> list = dao.getTeachers(deptId);
            HttpUtil.writeOk(resp, list);

        } catch (NumberFormatException nfe) {
            HttpUtil.writeError(resp, 400, "Invalid id parameter");
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Failed to load teachers: " + e.getMessage());
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        if (!requireAdmin(req, resp)) return;
        try {
            JsonObject body = JsonParser.parseReader(req.getReader()).getAsJsonObject();
            Teacher t = parseTeacher(body, false);
            if (t.getEmpId() == null || t.getTeacherName() == null || t.getDeptId() == 0) {
                HttpUtil.writeError(resp, 400, "empId, teacherName and deptId are required");
                return;
            }
            String hash = AuthUtil.hashPassword(DEFAULT_PASSWORD);
            int id = dao.insert(t, hash);
            if (id < 0) { HttpUtil.writeError(resp, 500, "Insert failed"); return; }
            Map<String, Object> result = new HashMap<>();
            result.put("teacherId", id);
            resp.setStatus(HttpServletResponse.SC_CREATED);
            HttpUtil.writeOk(resp, result, "Teacher created. Default password: " + DEFAULT_PASSWORD);
        } catch (java.sql.SQLIntegrityConstraintViolationException dup) {
            HttpUtil.writeError(resp, 409, "Employee ID already exists");
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
            Teacher t = parseTeacher(body, true);
            if (t.getTeacherId() <= 0) { HttpUtil.writeError(resp, 400, "teacherId required"); return; }
            boolean ok = dao.update(t);
            if (!ok) { HttpUtil.writeError(resp, 404, "Teacher not found or no change"); return; }
            HttpUtil.writeOk(resp, null, "Teacher updated");
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
            if (idStr == null) idStr = req.getParameter("teacherId");
            if (idStr == null) { HttpUtil.writeError(resp, 400, "id required"); return; }
            int id = Integer.parseInt(idStr);
            boolean ok = dao.deactivate(id);
            if (!ok) { HttpUtil.writeError(resp, 404, "Teacher not found"); return; }
            HttpUtil.writeOk(resp, null, "Teacher deactivated");
        } catch (NumberFormatException nfe) {
            HttpUtil.writeError(resp, 400, "id must be an integer");
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Delete failed: " + e.getMessage());
        }
    }

    private static boolean requireAdmin(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String role = (String) req.getAttribute("auth.role");
        if (!"admin".equals(role)) {
            HttpUtil.writeError(resp, 403, "Admin role required.");
            return false;
        }
        return true;
    }

    private Teacher parseTeacher(JsonObject body, boolean expectId) {
        Teacher t = new Teacher();
        if (expectId && body.has("teacherId")) t.setTeacherId(body.get("teacherId").getAsInt());
        if (body.has("empId") && !body.get("empId").isJsonNull())
            t.setEmpId(body.get("empId").getAsString());
        if (body.has("teacherName") && !body.get("teacherName").isJsonNull())
            t.setTeacherName(body.get("teacherName").getAsString());
        if (body.has("deptId") && !body.get("deptId").isJsonNull())
            t.setDeptId(body.get("deptId").getAsInt());
        if (body.has("designation") && !body.get("designation").isJsonNull())
            t.setDesignation(body.get("designation").getAsString());
        if (body.has("phone") && !body.get("phone").isJsonNull())
            t.setPhone(body.get("phone").getAsString());
        else t.setPhone(null);
        if (body.has("email") && !body.get("email").isJsonNull())
            t.setEmail(body.get("email").getAsString());
        else t.setEmail(null);
        if (body.has("photoPath") && !body.get("photoPath").isJsonNull())
            t.setPhotoPath(body.get("photoPath").getAsString());
        else t.setPhotoPath(null);
        if (body.has("dateJoined") && !body.get("dateJoined").isJsonNull()) {
            String d = body.get("dateJoined").getAsString();
            if (!d.isBlank()) t.setDateJoined(Date.valueOf(d));
        }
        return t;
    }

    private static Integer parseIntOrNull(String v) {
        if (v == null || v.isBlank()) return null;
        try { return Integer.parseInt(v.trim()); } catch (Exception e) { return null; }
    }
}
