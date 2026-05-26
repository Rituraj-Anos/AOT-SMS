package com.aot.sms.servlet;

import com.aot.sms.dao.AdminDAO;
import com.aot.sms.dao.DBConnection;
import com.aot.sms.dao.StudentDAO;
import com.aot.sms.dao.TeacherDAO;
import com.aot.sms.model.Student;
import com.aot.sms.model.Teacher;
import com.aot.sms.util.AuthUtil;
import com.aot.sms.util.HttpUtil;
import com.aot.sms.util.JSONUtil;
import com.aot.sms.util.JWTUtil;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.io.IOException;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

/**
 * Authentication endpoints — JWT cookie-based.
 *
 *   POST /api/auth/login   { userId, password, role } → set httpOnly cookie + return profile
 *   POST /api/auth/logout                            → clear cookie
 *   GET  /api/auth/me                                → return current profile (validated by JWTFilter)
 *
 * The path part after /api/auth is read from PATH_INFO. The servlet itself is mapped to /api/auth/* in web.xml.
 */
@WebServlet({"/api/auth/login", "/api/auth/logout", "/api/auth/me", "/api/auth/password"})
public class AuthServlet extends HttpServlet {

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) {
        HttpUtil.handlePreflight(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        String path = req.getServletPath();

        if ("/api/auth/login".equals(path)) {
            login(req, resp);
        } else if ("/api/auth/logout".equals(path)) {
            HttpUtil.clearAuthCookie(resp);
            HttpUtil.writeOk(resp, Map.of("loggedOut", true), "Logged out");
        } else if ("/api/auth/password".equals(path)) {
            changePassword(req, resp);
        } else {
            HttpUtil.writeError(resp, 404, "Unknown auth endpoint");
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        if (!"/api/auth/me".equals(req.getServletPath())) {
            HttpUtil.writeError(resp, 404, "Unknown auth endpoint");
            return;
        }
        // JWTFilter has already validated and populated request attributes
        String userId = (String)  req.getAttribute("auth.userId");
        String role   = (String)  req.getAttribute("auth.role");
        String name   = (String)  req.getAttribute("auth.name");
        Integer uid   = (Integer) req.getAttribute("auth.uid");

        if (userId == null) {
            HttpUtil.writeError(resp, 401, "Not authenticated.");
            return;
        }

        // Look up dept/section from DB so the response stays current.
        Integer deptId = null;
        String  section = null;
        if ("teacher".equals(role) || "student".equals(role)) {
            try (Connection conn = DBConnection.getConnection()) {
                if ("teacher".equals(role)) {
                    Teacher t = new TeacherDAO(conn).getByEmpId(userId);
                    if (t != null) deptId = t.getDeptId();
                } else {
                    Student s = new StudentDAO(conn).getByRollNo(userId);
                    if (s != null) {
                        deptId  = s.getDeptId();
                        section = s.getSection();
                    }
                }
            } catch (SQLException ignored) {}
        }

        Map<String, Object> me = new HashMap<>();
        me.put("userId",   userId);
        me.put("role",     role);
        me.put("name",     name);
        me.put("entityId", uid);
        me.put("deptId",   deptId);
        me.put("section",  section);
        HttpUtil.writeOk(resp, me);
    }

    // ── login implementation ─────────────────────────────────────────

    private void login(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        JsonObject body;
        try {
            body = JsonParser.parseReader(req.getReader()).getAsJsonObject();
        } catch (Exception e) {
            HttpUtil.writeError(resp, 400, "Invalid JSON body");
            return;
        }

        String userId   = body.has("userId")   ? body.get("userId").getAsString().trim()           : "";
        String password = body.has("password") ? body.get("password").getAsString()                 : "";
        String role     = body.has("role")     ? body.get("role").getAsString().trim().toLowerCase(): "";

        if (userId.isEmpty() || password.isEmpty() || role.isEmpty()) {
            HttpUtil.writeError(resp, 400, "userId, password and role are required");
            return;
        }

        try (Connection conn = DBConnection.getConnection()) {

            int failed = AuthUtil.getFailedAttempts(conn, userId);
            if (failed >= 3) {
                HttpUtil.writeError(resp, 403, "Account locked. Contact admin.");
                return;
            }

            boolean ok = false;
            String displayName = "";
            int    entityId    = -1;
            Integer deptId     = null;
            String  section    = null;

            switch (role) {
                case "admin": {
                    AdminDAO dao = new AdminDAO(conn);
                    ok = dao.verify(userId, password);
                    if (ok) displayName = dao.getName(userId);
                    // entityId left -1 — admin id isn't needed downstream for this app
                    break;
                }
                case "teacher": {
                    TeacherDAO dao = new TeacherDAO(conn);
                    ok = dao.verify(userId, password);
                    if (ok) {
                        displayName = dao.getName(userId);
                        Teacher t = dao.getByEmpId(userId);
                        if (t != null) {
                            entityId = t.getTeacherId();
                            deptId   = t.getDeptId();
                        }
                    }
                    break;
                }
                case "student": {
                    StudentDAO dao = new StudentDAO(conn);
                    ok = dao.verify(userId, password);
                    if (ok) {
                        displayName = dao.getName(userId);
                        Student s = dao.getByRollNo(userId);
                        if (s != null) {
                            entityId = s.getStudentId();
                            deptId   = s.getDeptId();
                            section  = s.getSection();
                        }
                    }
                    break;
                }
                default:
                    HttpUtil.writeError(resp, 400, "Unknown role: " + role);
                    return;
            }

            AuthUtil.logAttempt(conn, userId, ok, req.getRemoteAddr());

            if (!ok) {
                int remaining = Math.max(0, 3 - (failed + 1));
                HttpUtil.writeError(resp, 401,
                        "Invalid credentials. " + remaining + " attempt(s) remaining.");
                return;
            }

            // Issue JWT and set cookie (with SameSite for cross-origin production)
            String token = JWTUtil.issue(userId, role, displayName, entityId);
            HttpUtil.addAuthCookieWithSameSite(resp, token, (int) JWTUtil.ACCESS_TTL_SECONDS);

            Map<String, Object> me = new HashMap<>();
            me.put("userId",   userId);
            me.put("role",     role);
            me.put("name",     displayName);
            me.put("entityId", entityId);
            me.put("deptId",   deptId);
            me.put("section",  section);
            HttpUtil.writeOk(resp, me, "Login successful");

        } catch (SQLException e) {
            HttpUtil.writeError(resp, 500, "Database error: " + e.getMessage());
        }
    }

    // ── change-password implementation ───────────────────────────────

    /**
     * POST /api/auth/password
     * Body: { currentPassword, newPassword }
     *
     * The signed-in user (any role) can change their own password.
     */
    private void changePassword(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String userId = (String) req.getAttribute("auth.userId");
        String role   = (String) req.getAttribute("auth.role");
        if (userId == null || role == null) {
            HttpUtil.writeError(resp, 401, "Not authenticated");
            return;
        }

        JsonObject body;
        try { body = JsonParser.parseReader(req.getReader()).getAsJsonObject(); }
        catch (Exception e) { HttpUtil.writeError(resp, 400, "Invalid JSON body"); return; }

        String current = body.has("currentPassword") ? body.get("currentPassword").getAsString() : "";
        String next    = body.has("newPassword")     ? body.get("newPassword").getAsString()     : "";
        if (current.isEmpty() || next.isEmpty()) {
            HttpUtil.writeError(resp, 400, "currentPassword and newPassword are required");
            return;
        }
        if (next.length() < 8) {
            HttpUtil.writeError(resp, 400, "New password must be at least 8 characters");
            return;
        }

        try (Connection conn = DBConnection.getConnection()) {

            // Verify current password against the right user's row
            boolean ok;
            String table, idCol;
            switch (role) {
                case "admin":
                    table = "admin_users";  idCol = "user_id";
                    ok = new AdminDAO(conn).verify(userId, current);
                    break;
                case "teacher":
                    table = "teachers";     idCol = "emp_id";
                    ok = new TeacherDAO(conn).verify(userId, current);
                    break;
                case "student":
                    table = "students";     idCol = "roll_no";
                    ok = new StudentDAO(conn).verify(userId, current);
                    break;
                default:
                    HttpUtil.writeError(resp, 400, "Unknown role: " + role);
                    return;
            }
            if (!ok) {
                HttpUtil.writeError(resp, 401, "Current password is incorrect");
                return;
            }

            String newHash = com.aot.sms.util.AuthUtil.hashPassword(next);
            String sql = "UPDATE " + table + " SET password_hash = ? WHERE " + idCol + " = ?";
            try (var ps = conn.prepareStatement(sql)) {
                ps.setString(1, newHash);
                ps.setString(2, userId);
                int rows = ps.executeUpdate();
                if (rows == 0) { HttpUtil.writeError(resp, 404, "User not found"); return; }
            }
            HttpUtil.writeOk(resp, Map.of("changed", true), "Password updated");
        } catch (SQLException e) {
            HttpUtil.writeError(resp, 500, "Database error: " + e.getMessage());
        }
    }
}
