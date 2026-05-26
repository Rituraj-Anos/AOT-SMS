package com.aot.sms.servlet;

import com.aot.sms.dao.CommentDAO;
import com.aot.sms.util.HttpUtil;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Comments API for study materials.
 *
 *   GET    /api/comments?materialId=X   — list comments for a material
 *   POST   /api/comments                — add comment { materialId, text }
 *   DELETE /api/comments?id=X           — delete own comment (students) or any (teacher/admin)
 */
@WebServlet("/api/comments")
public class CommentServlet extends HttpServlet {

    private final CommentDAO dao = new CommentDAO();

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) {
        HttpUtil.handlePreflight(req, resp);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        try {
            String materialIdStr = req.getParameter("materialId");
            if (materialIdStr == null) { HttpUtil.writeError(resp, 400, "materialId required"); return; }
            int materialId = Integer.parseInt(materialIdStr);
            List<Map<String, Object>> comments = dao.getComments(materialId);
            HttpUtil.writeOk(resp, comments);
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Failed to load comments: " + e.getMessage());
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        String role = (String) req.getAttribute("auth.role");
        Integer uid = (Integer) req.getAttribute("auth.uid");
        String name = (String) req.getAttribute("auth.name");

        if (role == null || uid == null) {
            HttpUtil.writeError(resp, 401, "Not authenticated");
            return;
        }

        try {
            JsonObject body = JsonParser.parseReader(req.getReader()).getAsJsonObject();
            int materialId = body.get("materialId").getAsInt();
            String text    = body.get("text").getAsString().trim();

            if (text.isEmpty()) { HttpUtil.writeError(resp, 400, "Comment text is required"); return; }
            if (text.length() > 2000) { HttpUtil.writeError(resp, 400, "Comment too long (max 2000 chars)"); return; }

            int id = dao.addComment(materialId, role, uid, name != null ? name : "User", text);
            if (id < 0) { HttpUtil.writeError(resp, 500, "Insert failed"); return; }

            resp.setStatus(HttpServletResponse.SC_CREATED);
            HttpUtil.writeOk(resp, Map.of("commentId", id), "Comment posted");
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Failed to post comment: " + e.getMessage());
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        String role = (String) req.getAttribute("auth.role");
        Integer uid = (Integer) req.getAttribute("auth.uid");

        try {
            String idStr = req.getParameter("id");
            if (idStr == null) { HttpUtil.writeError(resp, 400, "id required"); return; }
            int commentId = Integer.parseInt(idStr);

            // Check ownership — students can only delete their own
            if ("student".equals(role)) {
                Map<String, Object> comment = dao.getById(commentId);
                if (comment == null) { HttpUtil.writeError(resp, 404, "Comment not found"); return; }
                int postedById = (int) comment.get("postedById");
                if (uid == null || postedById != uid) {
                    HttpUtil.writeError(resp, 403, "You can only delete your own comments.");
                    return;
                }
            }

            boolean ok = dao.deleteComment(commentId);
            if (!ok) { HttpUtil.writeError(resp, 404, "Comment not found"); return; }
            HttpUtil.writeOk(resp, null, "Comment deleted");
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Delete failed: " + e.getMessage());
        }
    }
}
