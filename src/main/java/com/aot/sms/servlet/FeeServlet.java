package com.aot.sms.servlet;

import com.aot.sms.dao.FeeDAO;
import com.aot.sms.model.Fee;
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
 * Fees APIs.
 *
 *   GET  /api/fees?studentId=X            — fee history for a student
 *   GET  /api/fees?pending=1[&deptId=&sem=]  — defaulters list (admin)
 *   POST /api/fees                        — create new fee record
 *   PUT  /api/fees                        — record payment (feeId + amount + mode + receiptNo)
 */
@WebServlet("/api/fees")
public class FeeServlet extends HttpServlet {

    private final FeeDAO dao = new FeeDAO();

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) {
        HttpUtil.handlePreflight(req, resp);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        try {
            if ("1".equals(req.getParameter("pending"))) {
                Integer deptId = parseIntOrNull(req.getParameter("deptId"));
                Integer sem    = parseIntOrNull(req.getParameter("sem"));
                List<Fee> rows = dao.getPendingFees(deptId, sem);
                HttpUtil.writeOk(resp, rows);
                return;
            }
            String idStr = req.getParameter("studentId");
            if (idStr == null) { HttpUtil.writeError(resp, 400, "studentId required"); return; }
            int studentId = Integer.parseInt(idStr);
            HttpUtil.writeOk(resp, dao.getByStudent(studentId));
        } catch (NumberFormatException nfe) {
            HttpUtil.writeError(resp, 400, "Invalid numeric parameter");
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Failed to load fees: " + e.getMessage());
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        if (!requireAdmin(req, resp)) return;
        try {
            JsonObject body = JsonParser.parseReader(req.getReader()).getAsJsonObject();
            Fee f = new Fee();
            f.setStudentId(body.get("studentId").getAsInt());
            f.setAcademicYear(body.has("academicYear") ? body.get("academicYear").getAsString() : null);
            f.setSemester(body.has("semester") ? body.get("semester").getAsInt() : 0);
            f.setTotalAmount(body.get("totalAmount").getAsDouble());
            double paid = body.has("amountPaid") && !body.get("amountPaid").isJsonNull()
                            ? body.get("amountPaid").getAsDouble() : 0.0;
            f.setAmountPaid(paid);
            f.setBalanceDue(f.getTotalAmount() - paid);
            if (body.has("dueDate") && !body.get("dueDate").isJsonNull()
                && !body.get("dueDate").getAsString().isBlank()) {
                f.setDueDate(Date.valueOf(body.get("dueDate").getAsString()));
            }
            if (body.has("paymentDate") && !body.get("paymentDate").isJsonNull()
                && !body.get("paymentDate").getAsString().isBlank()) {
                f.setPaymentDate(Date.valueOf(body.get("paymentDate").getAsString()));
            }
            f.setPaymentMode(body.has("paymentMode") ? body.get("paymentMode").getAsString() : null);
            f.setReceiptNo (body.has("receiptNo")    ? body.get("receiptNo").getAsString()    : null);
            f.setRemarks   (body.has("remarks")      ? body.get("remarks").getAsString()      : null);

            int id = dao.insert(f);
            if (id < 0) { HttpUtil.writeError(resp, 500, "Insert failed"); return; }
            resp.setStatus(HttpServletResponse.SC_CREATED);
            HttpUtil.writeOk(resp, Map.of("feeId", id), "Fee record saved");
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
            int feeId        = body.get("feeId").getAsInt();
            double amount    = body.get("amount").getAsDouble();
            String mode      = body.has("mode")      ? body.get("mode").getAsString()      : "Cash";
            String receiptNo = body.has("receiptNo") ? body.get("receiptNo").getAsString() : null;

            boolean ok = dao.recordPayment(feeId, amount, mode, receiptNo);
            if (!ok) { HttpUtil.writeError(resp, 400, "Payment failed (insufficient balance or fee not found)"); return; }
            HttpUtil.writeOk(resp, null, "Payment recorded");
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Update failed: " + e.getMessage());
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

    private static Integer parseIntOrNull(String v) {
        if (v == null || v.isBlank()) return null;
        try { return Integer.parseInt(v.trim()); } catch (Exception e) { return null; }
    }
}
