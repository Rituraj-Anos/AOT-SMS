package com.aot.sms.dao;

import com.aot.sms.model.Fee;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * DAO for Fee management — payment recording, balance queries.
 */
public class FeeDAO {

    /** Get fee records for a student */
    public List<Fee> getByStudent(int studentId) throws SQLException {
        String sql = "SELECT f.*, s.roll_no, s.student_name FROM fees f " +
                     "JOIN students s ON f.student_id=s.student_id WHERE f.student_id=? ORDER BY f.semester";
        List<Fee> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, studentId);
            try (ResultSet rs = ps.executeQuery()) { while (rs.next()) list.add(mapRow(rs)); }
        }
        return list;
    }

    /** Get students with pending fees */
    public List<Fee> getPendingFees(Integer deptId, Integer semester) throws SQLException {
        StringBuilder sql = new StringBuilder(
            "SELECT f.*, s.roll_no, s.student_name FROM fees f " +
            "JOIN students s ON f.student_id=s.student_id WHERE f.balance_due > 0");
        List<Object> params = new ArrayList<>();
        if (deptId != null) { sql.append(" AND s.dept_id=?"); params.add(deptId); }
        if (semester != null) { sql.append(" AND f.semester=?"); params.add(semester); }
        sql.append(" ORDER BY s.roll_no");

        List<Fee> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) ps.setObject(i + 1, params.get(i));
            try (ResultSet rs = ps.executeQuery()) { while (rs.next()) list.add(mapRow(rs)); }
        }
        return list;
    }

    /** Insert a fee record */
    public int insert(Fee f) throws SQLException {
        String sql = "INSERT INTO fees (student_id, academic_year, semester, total_amount, " +
                     "amount_paid, balance_due, due_date, payment_date, payment_mode, receipt_no, remarks) " +
                     "VALUES (?,?,?,?,?,?,?,?,?,?,?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, f.getStudentId()); ps.setString(2, f.getAcademicYear());
            ps.setInt(3, f.getSemester()); ps.setDouble(4, f.getTotalAmount());
            ps.setDouble(5, f.getAmountPaid()); ps.setDouble(6, f.getBalanceDue());
            ps.setDate(7, f.getDueDate()); ps.setDate(8, f.getPaymentDate());
            ps.setString(9, f.getPaymentMode()); ps.setString(10, f.getReceiptNo());
            ps.setString(11, f.getRemarks());
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) { return keys.next() ? keys.getInt(1) : -1; }
        }
    }

    /** Record a payment against an existing fee */
    public boolean recordPayment(int feeId, double amount, String mode, String receiptNo) throws SQLException {
        String sql = "UPDATE fees SET amount_paid=amount_paid+?, balance_due=balance_due-?, " +
                     "payment_date=CURDATE(), payment_mode=?, receipt_no=? WHERE fee_id=? AND balance_due>=?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDouble(1, amount); ps.setDouble(2, amount);
            ps.setString(3, mode); ps.setString(4, receiptNo);
            ps.setInt(5, feeId); ps.setDouble(6, amount);
            return ps.executeUpdate() > 0;
        }
    }

    private Fee mapRow(ResultSet rs) throws SQLException {
        Fee f = new Fee();
        f.setFeeId(rs.getInt("fee_id")); f.setStudentId(rs.getInt("student_id"));
        f.setAcademicYear(rs.getString("academic_year")); f.setSemester(rs.getInt("semester"));
        f.setTotalAmount(rs.getDouble("total_amount")); f.setAmountPaid(rs.getDouble("amount_paid"));
        f.setBalanceDue(rs.getDouble("balance_due")); f.setDueDate(rs.getDate("due_date"));
        f.setPaymentDate(rs.getDate("payment_date")); f.setPaymentMode(rs.getString("payment_mode"));
        f.setReceiptNo(rs.getString("receipt_no")); f.setRemarks(rs.getString("remarks"));
        f.setRollNo(rs.getString("roll_no")); f.setStudentName(rs.getString("student_name"));
        return f;
    }
}
