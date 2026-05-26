package com.aot.sms.servlet;

import com.aot.sms.dao.SubjectDAO;
import com.aot.sms.model.Subject;
import com.aot.sms.util.HttpUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

/**
 * Subject lookups (read-only).
 *
 *  GET /api/subjects?deptId=1&sem=4
 *  GET /api/subjects?teacherId=5
 *  GET /api/subjects?id=12
 *  GET /api/subjects?code=PCC-CS401
 */
@WebServlet("/api/subjects")
public class SubjectServlet extends HttpServlet {

    private final SubjectDAO dao = new SubjectDAO();

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) {
        HttpUtil.handlePreflight(req, resp);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        try {
            String idStr        = req.getParameter("id");
            String code         = req.getParameter("code");
            String teacherIdStr = req.getParameter("teacherId");
            String deptIdStr    = req.getParameter("deptId");
            String semStr       = req.getParameter("sem");

            if (idStr != null) {
                Subject s = dao.getById(Integer.parseInt(idStr));
                if (s == null) { HttpUtil.writeError(resp, 404, "Subject not found"); return; }
                HttpUtil.writeOk(resp, s);
                return;
            }
            if (code != null && !code.isBlank()) {
                Subject s = dao.getByCode(code);
                if (s == null) { HttpUtil.writeError(resp, 404, "Subject not found"); return; }
                HttpUtil.writeOk(resp, s);
                return;
            }
            if (teacherIdStr != null && !teacherIdStr.isBlank()) {
                List<Subject> list = dao.getByTeacher(Integer.parseInt(teacherIdStr));
                HttpUtil.writeOk(resp, list);
                return;
            }
            if (deptIdStr == null || semStr == null) {
                HttpUtil.writeError(resp, 400, "deptId and sem are required (or use id/code/teacherId)");
                return;
            }
            int deptId = Integer.parseInt(deptIdStr);
            int sem    = Integer.parseInt(semStr);
            List<Subject> list = dao.getByDeptSemester(deptId, sem);
            HttpUtil.writeOk(resp, list);
        } catch (NumberFormatException nfe) {
            HttpUtil.writeError(resp, 400, "Invalid numeric parameter");
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Failed to load subjects: " + e.getMessage());
        }
    }
}
