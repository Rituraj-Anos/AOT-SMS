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
 * Schedule Attendance API — student marks their own attendance per slot per day.
 *
 *   GET  /api/schedule-attendance?studentId=&scheduleId=  — history
 *   GET  /api/schedule-attendance?studentId=&scheduleId=&date=  — single day status
 *   POST /api/schedule-attendance  — mark/update { scheduleId, classDate, status, substituteTeacher?, substituteSubject?, notes? }
 */
@WebServlet("/api/schedule-attendance")
public class ScheduleAttendanceServlet extends HttpServlet {

    private final ScheduleDAO dao = new ScheduleDAO();

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) {
        HttpUtil.handlePreflight(req, resp);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        try {
            String studentIdStr = req.getParameter("studentId");
            String scheduleIdStr = req.getParameter("scheduleId");
            String date = req.getParameter("date");

            if (studentIdStr == null) {
                HttpUtil.writeError(resp, 400, "studentId required");
                return;
            }
            int studentId = Integer.parseInt(studentIdStr);

            // If no scheduleId — return ALL attendance records for this student
            if (scheduleIdStr == null) {
                List<Map<String, Object>> all = dao.getAllAttendanceForStudent(studentId);
                HttpUtil.writeOk(resp, all);
                return;
            }

            int scheduleId = Integer.parseInt(scheduleIdStr);

            if (date != null && !date.isBlank()) {
                Map<String, Object> status = dao.getTodayStatus(studentId, scheduleId, date);
                HttpUtil.writeOk(resp, status);
                return;
            }

            List<Map<String, Object>> history = dao.getAttendanceHistory(studentId, scheduleId);
            HttpUtil.writeOk(resp, history);
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Failed: " + e.getMessage());
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        Integer uid = (Integer) req.getAttribute("auth.uid");
        String role = (String) req.getAttribute("auth.role");

        try {
            JsonObject body = JsonParser.parseReader(req.getReader()).getAsJsonObject();
            int scheduleId = body.get("scheduleId").getAsInt();
            String classDate = body.get("classDate").getAsString();
            String status = body.get("status").getAsString();
            String subTeacher = body.has("substituteTeacher") && !body.get("substituteTeacher").isJsonNull()
                                ? body.get("substituteTeacher").getAsString() : null;
            String subSubject = body.has("substituteSubject") && !body.get("substituteSubject").isJsonNull()
                                ? body.get("substituteSubject").getAsString() : null;
            String notes = body.has("notes") && !body.get("notes").isJsonNull()
                           ? body.get("notes").getAsString() : null;

            // Students mark their own; admin/teacher can mark for any student
            int studentId;
            if ("student".equals(role)) {
                studentId = uid != null ? uid : 0;
            } else {
                studentId = body.has("studentId") ? body.get("studentId").getAsInt() : (uid != null ? uid : 0);
            }

            int id = dao.markAttendance(scheduleId, studentId, classDate, status, subTeacher, subSubject, notes);
            HttpUtil.writeOk(resp, Map.of("id", id), "Status updated");
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Failed: " + e.getMessage());
        }
    }
}
