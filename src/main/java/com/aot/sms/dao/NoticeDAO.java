package com.aot.sms.dao;

import com.aot.sms.model.Notice;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/** DAO for Notice board — create, list, target filtering. */
public class NoticeDAO {

    /** Get active notices visible to a role+dept */
    public List<Notice> getVisible(String role, Integer deptId) throws SQLException {
        // If deptId is null (e.g. admin view), show 'all' notices only.
        // If deptId is provided, also show dept-targeted notices for that dept.
        String sql =
            "SELECT n.* FROM notices n " +
            "WHERE (expiry_date IS NULL OR expiry_date >= CURDATE()) " +
            "  AND ( target_type = 'all' " +
            "        OR (target_type IN ('dept','section') AND target_dept_id = ?) ) " +
            "ORDER BY is_pinned DESC, post_date DESC LIMIT 100";
        List<Notice> list = new ArrayList<>();
        try (Connection c = DBConnection.getConnection(); PreparedStatement ps = c.prepareStatement(sql)) {
            if (deptId == null) {
                ps.setNull(1, java.sql.Types.INTEGER);
            } else {
                ps.setInt(1, deptId);
            }
            try (ResultSet rs = ps.executeQuery()) { while (rs.next()) list.add(mapRow(rs)); }
        }
        return list;
    }

    /** Get all notices (admin view) */
    public List<Notice> getAll() throws SQLException {
        String sql = "SELECT * FROM notices ORDER BY is_pinned DESC, post_date DESC";
        List<Notice> list = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) list.add(mapRow(rs));
        }
        return list;
    }

    /** Insert a new notice, returns generated notice_id */
    public int insert(Notice n) throws SQLException {
        String sql = "INSERT INTO notices (title,body,posted_by_role,posted_by_id,target_type," +
                     "target_dept_id,target_section,is_pinned,expiry_date) VALUES (?,?,?,?,?,?,?,?,?)";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, n.getTitle()); ps.setString(2, n.getBody());
            ps.setString(3, n.getPostedByRole()); ps.setInt(4, n.getPostedById());
            ps.setString(5, n.getTargetType());
            ps.setObject(6, n.getTargetDeptId()); ps.setString(7, n.getTargetSection());
            ps.setBoolean(8, n.isPinned()); ps.setDate(9, n.getExpiryDate());
            ps.executeUpdate();
            try (ResultSet k = ps.getGeneratedKeys()) { return k.next() ? k.getInt(1) : -1; }
        }
    }

    /** Delete a notice */
    public boolean delete(int noticeId) throws SQLException {
        String sql = "DELETE FROM notices WHERE notice_id=?";
        try (Connection c = DBConnection.getConnection(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, noticeId); return ps.executeUpdate() > 0;
        }
    }

    /** Toggle pinned status */
    public boolean togglePin(int noticeId) throws SQLException {
        String sql = "UPDATE notices SET is_pinned = NOT is_pinned WHERE notice_id=?";
        try (Connection c = DBConnection.getConnection(); PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, noticeId); return ps.executeUpdate() > 0;
        }
    }

    private Notice mapRow(ResultSet rs) throws SQLException {
        Notice n = new Notice();
        n.setNoticeId(rs.getInt("notice_id")); n.setTitle(rs.getString("title"));
        n.setBody(rs.getString("body")); n.setPostedByRole(rs.getString("posted_by_role"));
        n.setPostedById(rs.getInt("posted_by_id")); n.setTargetType(rs.getString("target_type"));
        int did = rs.getInt("target_dept_id");
        n.setTargetDeptId(rs.wasNull() ? null : did);
        n.setTargetSection(rs.getString("target_section")); n.setPinned(rs.getBoolean("is_pinned"));
        n.setPostDate(rs.getTimestamp("post_date")); n.setExpiryDate(rs.getDate("expiry_date"));
        return n;
    }
}
