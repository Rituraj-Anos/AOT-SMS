package com.aot.sms.dao;

import java.sql.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * DAO for material_comments — add, list, delete.
 */
public class CommentDAO {

    public int addComment(int materialId, String role, int postedById, String postedByName, String text) throws SQLException {
        String sql = "INSERT INTO material_comments (material_id, posted_by_role, posted_by_id, posted_by_name, comment_text) " +
                     "VALUES (?,?,?,?,?)";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, materialId);
            ps.setString(2, role);
            ps.setInt(3, postedById);
            ps.setString(4, postedByName);
            ps.setString(5, text);
            ps.executeUpdate();
            try (ResultSet k = ps.getGeneratedKeys()) { return k.next() ? k.getInt(1) : -1; }
        }
    }

    public List<Map<String, Object>> getComments(int materialId) throws SQLException {
        String sql = "SELECT * FROM material_comments WHERE material_id = ? ORDER BY posted_at ASC";
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, materialId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("commentId",    rs.getInt("comment_id"));
                    row.put("materialId",   rs.getInt("material_id"));
                    row.put("postedByRole", rs.getString("posted_by_role"));
                    row.put("postedById",   rs.getInt("posted_by_id"));
                    row.put("postedByName", rs.getString("posted_by_name"));
                    row.put("commentText",  rs.getString("comment_text"));
                    row.put("postedAt",     rs.getString("posted_at"));
                    list.add(row);
                }
            }
        }
        return list;
    }

    public int countByMaterial(int materialId) throws SQLException {
        String sql = "SELECT COUNT(*) FROM material_comments WHERE material_id = ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, materialId);
            try (ResultSet rs = ps.executeQuery()) { return rs.next() ? rs.getInt(1) : 0; }
        }
    }

    public boolean deleteComment(int commentId) throws SQLException {
        String sql = "DELETE FROM material_comments WHERE comment_id = ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, commentId);
            return ps.executeUpdate() > 0;
        }
    }

    /** Get a single comment to check ownership before delete. */
    public Map<String, Object> getById(int commentId) throws SQLException {
        String sql = "SELECT * FROM material_comments WHERE comment_id = ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, commentId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("commentId",    rs.getInt("comment_id"));
                row.put("materialId",   rs.getInt("material_id"));
                row.put("postedByRole", rs.getString("posted_by_role"));
                row.put("postedById",   rs.getInt("posted_by_id"));
                row.put("postedByName", rs.getString("posted_by_name"));
                row.put("commentText",  rs.getString("comment_text"));
                row.put("postedAt",     rs.getString("posted_at"));
                return row;
            }
        }
    }
}
