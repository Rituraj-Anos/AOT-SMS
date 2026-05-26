package com.aot.sms.servlet;

import com.aot.sms.dao.ScheduleDAO;
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
 * Class Schedule API.
 *
 *   GET  /api/schedule?teacherId=X              — teacher's full schedule
 *   GET  /api/schedule?deptId=&semester=&section= — student/admin schedule
 *   GET  /api/schedule?all=1[&deptId=&semester=&section=] — admin: all schedules
 *   POST /api/schedule                          — add slot (admin/teacher)
 *   PUT  /api/schedule                          — update slot
 *   DELETE /api/schedule?id=X                   — delete slot
 */
@WebServlet("/api/schedule")
public class ScheduleServlet extends HttpServlet {

    private final ScheduleDAO dao = new ScheduleDAO();

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) {
        HttpUtil.handlePreflight(req, resp);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        try {
            String teacherIdStr = req.getParameter("teacherId");
            String all = req.getParameter("all");

            if ("1".equals(all)) {
                Integer deptId = parseIntOrNull(req.getParameter("deptId"));
                Integer sem = parseIntOrNull(req.getParameter("semester"));
                String section = req.getParameter("section");
                HttpUtil.writeOk(resp, dao.getAllSchedules(deptId, sem, section));
                return;
            }

            if (teacherIdStr != null) {
                HttpUtil.writeOk(resp, dao.getTeacherSchedule(Integer.parseInt(teacherIdStr)));
                return;
            }

            String deptIdStr = req.getParameter("deptId");
            String semStr = req.getParameter("semester");
            String section = req.getParameter("section");
            if (deptIdStr == null || semStr == null || section == null) {
                HttpUtil.writeError(resp, 400, "Provide teacherId OR (deptId + semester + section)");
                return;
            }
            HttpUtil.writeOk(resp, dao.getStudentSchedule(
                Integer.parseInt(deptIdStr), Integer.parseInt(semStr), section));
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Failed to load schedule: " + e.getMessage());
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        String role = (String) req.getAttribute("auth.role");
        Integer uid = (Integer) req.getAttribute("auth.uid");
        if (!"admin".equals(role) && !"teacher".equals(role)) {
            HttpUtil.writeError(resp, 403, "Admin or teacher role required."); return;
        }
        try {
            JsonObject body = JsonParser.parseReader(req.getReader()).getAsJsonObject();
            int teacherId = body.has("teacherId") ? body.get("teacherId").getAsInt() : (uid != null ? uid : 0);
            int subjectId = body.get("subjectId").getAsInt();
            int deptId = body.get("deptId").getAsInt();
            int semester = body.get("semester").getAsInt();
            String section = body.get("section").getAsString();
            String dayOfWeek = body.get("dayOfWeek").getAsString();
            int periodNumber = body.get("periodNumber").getAsInt();
            String startTime = body.get("startTime").getAsString();
            String endTime = body.get("endTime").getAsString();
            String classType = body.has("classType") ? body.get("classType").getAsString() : "theory";
            String roomNo = body.has("roomNo") ? body.get("roomNo").getAsString() : null;
            String academicYear = body.has("academicYear") ? body.get("academicYear").getAsString() : "2025-26";

            int id = dao.addSchedule(teacherId, subjectId, deptId, semester, section,
                                     dayOfWeek, periodNumber, startTime, endTime, classType, roomNo, academicYear);
            if (id < 0) { HttpUtil.writeError(resp, 500, "Insert failed"); return; }
            resp.setStatus(HttpServletResponse.SC_CREATED);
            HttpUtil.writeOk(resp, Map.of("scheduleId", id), "Schedule slot added");
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Failed to add schedule: " + e.getMessage());
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        String role = (String) req.getAttribute("auth.role");
        if (!"admin".equals(role) && !"teacher".equals(role)) {
            HttpUtil.writeError(resp, 403, "Admin or teacher role required."); return;
        }
        try {
            JsonObject body = JsonParser.parseReader(req.getReader()).getAsJsonObject();
            int scheduleId = body.get("scheduleId").getAsInt();
            int subjectId = body.get("subjectId").getAsInt();
            String dayOfWeek = body.get("dayOfWeek").getAsString();
            int periodNumber = body.get("periodNumber").getAsInt();
            String startTime = body.get("startTime").getAsString();
            String endTime = body.get("endTime").getAsString();
            String classType = body.has("classType") ? body.get("classType").getAsString() : "theory";
            String roomNo = body.has("roomNo") ? body.get("roomNo").getAsString() : null;

            boolean ok = dao.updateSchedule(scheduleId, subjectId, dayOfWeek, periodNumber,
                                            startTime, endTime, classType, roomNo);
            if (!ok) { HttpUtil.writeError(resp, 404, "Schedule not found"); return; }
            HttpUtil.writeOk(resp, null, "Schedule updated");
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Update failed: " + e.getMessage());
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        String role = (String) req.getAttribute("auth.role");
        if (!"admin".equals(role) && !"teacher".equals(role)) {
            HttpUtil.writeError(resp, 403, "Admin or teacher role required."); return;
        }
        try {
            String idStr = req.getParameter("id");
            if (idStr == null) { HttpUtil.writeError(resp, 400, "id required"); return; }
            dao.deleteSchedule(Integer.parseInt(idStr));
            HttpUtil.writeOk(resp, null, "Schedule slot deleted");
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Delete failed: " + e.getMessage());
        }
    }

    private static Integer parseIntOrNull(String v) {
        if (v == null || v.isBlank()) return null;
        try { return Integer.parseInt(v.trim()); } catch (Exception e) { return null; }
    }
}
