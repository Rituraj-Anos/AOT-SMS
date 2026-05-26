package com.aot.sms.servlet;

import com.aot.sms.dao.DBConnection;
import com.aot.sms.util.HttpUtil;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Read-only list of departments — used by frontend dropdowns.
 *
 *   GET /api/departments
 */
@WebServlet("/api/departments")
public class DepartmentServlet extends HttpServlet {

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) {
        HttpUtil.handlePreflight(req, resp);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        String sql = "SELECT dept_id, dept_code, dept_name, total_semesters FROM departments ORDER BY dept_code";
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("deptId",         rs.getInt("dept_id"));
                row.put("deptCode",       rs.getString("dept_code"));
                row.put("deptName",       rs.getString("dept_name"));
                row.put("totalSemesters", rs.getInt("total_semesters"));
                list.add(row);
            }
            HttpUtil.writeOk(resp, list);
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Failed to load departments: " + e.getMessage());
        }
    }
}
