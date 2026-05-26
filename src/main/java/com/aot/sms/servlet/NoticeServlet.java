package com.aot.sms.servlet;

import com.aot.sms.dao.NoticeDAO;
import com.aot.sms.model.Notice;
import com.aot.sms.util.HttpUtil;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.Date;
import java.util.List;
import java.util.Map;

/**
 * Notice board APIs.
 *
 *   GET    /api/notices[?deptId=&all=1]   — list (visible by default; all=1 for admin view)
 *   POST   /api/notices                   — create (admin or teacher)
 *   PUT    /api/notices                   — toggle pin (provide noticeId + pin=true|false)
 *   DELETE /api/notices?id=X               — delete (admin only)
 */
@WebServlet("/api/notices")
public class NoticeServlet extends HttpServlet {

    private final NoticeDAO dao = new NoticeDAO();

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) {
        HttpUtil.handlePreflight(req, resp);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        try {
            String all = req.getParameter("all");
            if ("1".equals(all)) {
                HttpUtil.writeOk(resp, dao.getAll());
                return;
            }
            String role = (String) req.getAttribute("auth.role");
            Integer deptId = parseIntOrNull(req.getParameter("deptId"));
            HttpUtil.writeOk(resp, dao.getVisible(role, deptId));
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Failed to load notices: " + e.getMessage());
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
            Notice n = new Notice();
            n.setTitle(body.get("title").getAsString());
            n.setBody(body.get("body").getAsString());
            n.setPostedByRole(role);
            n.setPostedById(uid == null ? 0 : uid);
            n.setTargetType(body.has("targetType") ? body.get("targetType").getAsString() : "all");
            if (body.has("targetDeptId") && !body.get("targetDeptId").isJsonNull()) {
                n.setTargetDeptId(body.get("targetDeptId").getAsInt());
            }
            if (body.has("targetSection") && !body.get("targetSection").isJsonNull()) {
                n.setTargetSection(body.get("targetSection").getAsString());
            }
            n.setPinned(body.has("isPinned") && body.get("isPinned").getAsBoolean());
            if (body.has("expiryDate") && !body.get("expiryDate").isJsonNull()
                && !body.get("expiryDate").getAsString().isBlank()) {
                n.setExpiryDate(Date.valueOf(body.get("expiryDate").getAsString()));
            }

            int id = dao.insert(n);
            if (id < 0) { HttpUtil.writeError(resp, 500, "Insert failed"); return; }
            resp.setStatus(HttpServletResponse.SC_CREATED);
            HttpUtil.writeOk(resp, Map.of("noticeId", id), "Notice posted");
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Create failed: " + e.getMessage());
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        String role = (String) req.getAttribute("auth.role");
        if (!"admin".equals(role)) {
            HttpUtil.writeError(resp, 403, "Admin role required.");
            return;
        }
        try {
            JsonObject body = JsonParser.parseReader(req.getReader()).getAsJsonObject();
            int id = body.get("noticeId").getAsInt();
            boolean ok = dao.togglePin(id);
            if (!ok) { HttpUtil.writeError(resp, 404, "Notice not found"); return; }
            HttpUtil.writeOk(resp, null, "Pin toggled");
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Update failed: " + e.getMessage());
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        String role = (String) req.getAttribute("auth.role");
        if (!"admin".equals(role)) {
            HttpUtil.writeError(resp, 403, "Admin role required.");
            return;
        }
        try {
            String idStr = req.getParameter("id");
            if (idStr == null) { HttpUtil.writeError(resp, 400, "id required"); return; }
            boolean ok = dao.delete(Integer.parseInt(idStr));
            if (!ok) { HttpUtil.writeError(resp, 404, "Notice not found"); return; }
            HttpUtil.writeOk(resp, null, "Notice deleted");
        } catch (NumberFormatException nfe) {
            HttpUtil.writeError(resp, 400, "id must be an integer");
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Delete failed: " + e.getMessage());
        }
    }

    private static Integer parseIntOrNull(String v) {
        if (v == null || v.isBlank()) return null;
        try { return Integer.parseInt(v.trim()); } catch (Exception e) { return null; }
    }
}
