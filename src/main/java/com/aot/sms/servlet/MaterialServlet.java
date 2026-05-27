package com.aot.sms.servlet;

import com.aot.sms.dao.MaterialDAO;
import com.aot.sms.util.CloudinaryUtil;
import com.aot.sms.util.HttpUtil;

import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;

/**
 * Study Materials API — Cloudinary upload + JSON list + redirect download + delete.
 *
 *   POST   /api/materials              — upload material (multipart/form-data → Cloudinary)
 *   GET    /api/materials?subjectId=&type=  — list materials
 *   GET    /api/materials?id=X         — single material
 *   GET    /api/materials?all=1        — admin: all materials
 *   GET    /api/materials/download?id=X  — redirect to Cloudinary URL
 *   DELETE /api/materials?id=X         — delete material
 */
@WebServlet({"/api/materials", "/api/materials/download"})
@MultipartConfig(
    fileSizeThreshold = 1024 * 1024,
    maxFileSize       = 50 * 1024 * 1024,
    maxRequestSize    = 55 * 1024 * 1024
)
public class MaterialServlet extends HttpServlet {

    private final MaterialDAO dao = new MaterialDAO();

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) {
        HttpUtil.handlePreflight(req, resp);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        String path = req.getServletPath();

        if ("/api/materials/download".equals(path)) {
            download(req, resp);
            return;
        }

        try {
            String idStr = req.getParameter("id");
            if (idStr != null) {
                Map<String, Object> m = dao.getById(Integer.parseInt(idStr));
                if (m == null) { HttpUtil.writeError(resp, 404, "Material not found"); return; }
                HttpUtil.writeOk(resp, m);
                return;
            }

            String all = req.getParameter("all");
            if ("1".equals(all)) {
                Integer deptId = parseIntOrNull(req.getParameter("deptId"));
                Integer subjectId = parseIntOrNull(req.getParameter("subjectId"));
                String type = req.getParameter("type");
                HttpUtil.writeOk(resp, dao.getAll(deptId, subjectId, type));
                return;
            }

            String subjectIdStr = req.getParameter("subjectId");
            if (subjectIdStr == null) { HttpUtil.writeError(resp, 400, "subjectId required"); return; }
            String type = req.getParameter("type");
            HttpUtil.writeOk(resp, dao.getBySubject(Integer.parseInt(subjectIdStr), type));
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Failed to load materials: " + e.getMessage());
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        String role = (String) req.getAttribute("auth.role");
        Integer uid = (Integer) req.getAttribute("auth.uid");
        if (!"admin".equals(role) && !"teacher".equals(role)) {
            HttpUtil.writeError(resp, 403, "Teacher or admin role required.");
            return;
        }

        try {
            int teacherId    = uid != null ? uid : 0;
            int subjectId    = Integer.parseInt(req.getParameter("subjectId"));
            int deptId       = Integer.parseInt(req.getParameter("deptId"));
            int semester     = Integer.parseInt(req.getParameter("semester"));
            String section   = req.getParameter("section");
            String title     = req.getParameter("title");
            String desc      = req.getParameter("description");
            String type      = req.getParameter("materialType");
            String dueDate   = req.getParameter("dueDate");
            boolean pinned   = "true".equalsIgnoreCase(req.getParameter("isPinned"));

            String fileName = null;
            String filePath = null;  // Will store Cloudinary URL
            long fileSize = 0;

            Part filePart = req.getPart("file");
            if (filePart != null && filePart.getSize() > 0) {
                fileName = getFileName(filePart);
                fileSize = filePart.getSize();

                // Upload to Cloudinary
                try (InputStream is = filePart.getInputStream()) {
                    filePath = CloudinaryUtil.uploadFile(is, fileName);
                }
            }

            int id = dao.insert(teacherId, subjectId, deptId, semester, section,
                                title, desc, type, fileName, filePath, fileSize, dueDate, pinned);
            if (id < 0) { HttpUtil.writeError(resp, 500, "Insert failed"); return; }

            resp.setStatus(HttpServletResponse.SC_CREATED);
            HttpUtil.writeOk(resp, Map.of("materialId", id), "Material posted");
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Upload failed: " + e.getMessage());
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        String role = (String) req.getAttribute("auth.role");
        if (!"admin".equals(role) && !"teacher".equals(role)) {
            HttpUtil.writeError(resp, 403, "Teacher or admin role required.");
            return;
        }
        try {
            String idStr = req.getParameter("id");
            if (idStr == null) { HttpUtil.writeError(resp, 400, "id required"); return; }
            int id = Integer.parseInt(idStr);
            dao.delete(id);
            HttpUtil.writeOk(resp, null, "Material deleted");
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Delete failed: " + e.getMessage());
        }
    }

    /**
     * Download/View: return a signed Cloudinary URL that the frontend can open.
     */
    private void download(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            String idStr = req.getParameter("id");
            if (idStr == null) { HttpUtil.writeError(resp, 400, "id required"); return; }
            Map<String, Object> m = dao.getById(Integer.parseInt(idStr));
            if (m == null || m.get("filePath") == null) {
                HttpUtil.writeError(resp, 404, "File not found");
                return;
            }

            String filePath = (String) m.get("filePath");

            if (filePath.startsWith("http")) {
                // Return signed URL as JSON so frontend can open it
                String signedUrl = CloudinaryUtil.getSignedUrl(filePath);
                HttpUtil.writeOk(resp, Map.of("url", signedUrl, "fileName", m.getOrDefault("fileName", "file")));
                return;
            }

            HttpUtil.writeError(resp, 404, "File not available");
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Download failed: " + e.getMessage());
        }
    }

    private String getFileName(Part part) {
        String header = part.getHeader("content-disposition");
        if (header != null) {
            for (String token : header.split(";")) {
                if (token.trim().startsWith("filename")) {
                    return token.substring(token.indexOf('=') + 1).trim().replace("\"", "");
                }
            }
        }
        return "file_" + System.currentTimeMillis();
    }

    private static Integer parseIntOrNull(String v) {
        if (v == null || v.isBlank()) return null;
        try { return Integer.parseInt(v.trim()); } catch (Exception e) { return null; }
    }
}
