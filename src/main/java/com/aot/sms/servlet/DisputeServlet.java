package com.aot.sms.servlet;

import com.aot.sms.dao.DisputeDAO;
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
 * Attendance dispute APIs.
 *
 *   POST /api/disputes           — raise a dispute (student)
 *   GET  /api/disputes           — list disputes (student sees own, teacher sees their subjects')
 *   PUT  /api/disputes           — resolve/reject a dispute (teacher)
 */
@WebServlet("/api/disputes")
public class DisputeServlet extends HttpServlet {

    private final DisputeDAO dao = new DisputeDAO();

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) {
        HttpUtil.handlePreflight(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        String role = (String) req.getAttribute("auth.role");
        Integer uid = (Integer) req.getAttribute("auth.uid");
        if (!"student".equals(role)) {
            HttpUtil.writeError(resp, 403, "Only students can raise disputes.");
            return;
        }
        try {
            JsonObject body = JsonParser.parseReader(req.getReader()).getAsJsonObject();
            int subjectId = body.get("subjectId").getAsInt();
            String classDate = body.get("classDate").getAsString();
            String note = body.get("note").getAsString();

            // uid for student role is the student_id
            int disputeId = dao.raiseDispute(uid, subjectId, classDate, note);
            HttpUtil.writeOk(resp, Map.of("disputeId", disputeId), "Dispute raised successfully");
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Failed to raise dispute: " + e.getMessage());
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        String role = (String) req.getAttribute("auth.role");
        Integer uid = (Integer) req.getAttribute("auth.uid");
        try {
            List<Map<String, Object>> disputes;
            if ("student".equals(role)) {
                disputes = dao.getByStudent(uid);
            } else if ("teacher".equals(role)) {
                disputes = dao.getByTeacher(uid);
            } else if ("admin".equals(role)) {
                // Admin can see all — use teacher method with 0 (gets nothing via JOIN)
                // For now, admin sees nothing specific
                disputes = List.of();
            } else {
                HttpUtil.writeError(resp, 403, "Access denied.");
                return;
            }
            HttpUtil.writeOk(resp, disputes);
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Failed to load disputes: " + e.getMessage());
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        String role = (String) req.getAttribute("auth.role");
        Integer uid = (Integer) req.getAttribute("auth.uid");
        if (!"teacher".equals(role) && !"admin".equals(role)) {
            HttpUtil.writeError(resp, 403, "Only teachers can resolve disputes.");
            return;
        }
        try {
            JsonObject body = JsonParser.parseReader(req.getReader()).getAsJsonObject();
            int disputeId = body.get("disputeId").getAsInt();
            String status = body.get("status").getAsString(); // "resolved" or "rejected"
            String teacherNote = body.has("teacherNote") ? body.get("teacherNote").getAsString() : null;

            boolean ok = dao.resolveDispute(disputeId, status, teacherNote, uid);
            if (ok) {
                HttpUtil.writeOk(resp, Map.of("disputeId", disputeId), "Dispute " + status);
            } else {
                HttpUtil.writeError(resp, 404, "Dispute not found.");
            }
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Failed to resolve dispute: " + e.getMessage());
        }
    }
}
