package com.aot.sms.servlet;

import com.aot.sms.dao.MaterialDAO;
import com.aot.sms.util.HttpUtil;

import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Study Materials API — multipart upload + JSON list + file download + delete.
 *
 *   POST   /api/materials          — upload material (multipart/form-data)
 *   GET    /api/materials?subjectId=&type=  — list materials
 *   GET    /api/materials?id=X     — single material
 *   GET    /api/materials?all=1[&deptId=&subjectId=&type=]  — admin: all materials
 *   GET    /api/materials/download?id=X  — stream file download
 *   DELETE /api/materials?id=X     — delete material + file
 */
@WebServlet({"/api/materials", "/api/materials/download"})
@MultipartConfig(
    fileSizeThreshold = 1024 * 1024,      // 1 MB
    maxFileSize       = 50 * 1024 * 1024,  // 50 MB
    maxRequestSize    = 55 * 1024 * 1024   // 55 MB
)
public class MaterialServlet extends HttpServlet {

    private static final String UPLOAD_DIR = "uploads/materials";
    /**
     * Persistent upload directory OUTSIDE the webapp so files survive WAR redeployments.
     * Falls back to webapp-relative path if this doesn't exist.
     */
    private static final String PERSISTENT_UPLOAD_ROOT = "C:/coding/AOT-SMS/uploads/materials";
    private final MaterialDAO dao = new MaterialDAO();

    private String getUploadDir() {
        File dir = new File(PERSISTENT_UPLOAD_ROOT);
        if (!dir.exists()) dir.mkdirs();
        return PERSISTENT_UPLOAD_ROOT;
    }

    private Path resolveFilePath(String relativePath) {
        // Try persistent location first
        Path persistent = Paths.get(PERSISTENT_UPLOAD_ROOT,
            relativePath.replace(UPLOAD_DIR + "/", "").replace(UPLOAD_DIR + "\\", ""));
        if (Files.exists(persistent)) return persistent;

        // Fallback: try relative to webapp (legacy files)
        String webappPath = getServletContext().getRealPath("") + File.separator + relativePath;
        Path webapp = Paths.get(webappPath);
        if (Files.exists(webapp)) return webapp;

        return persistent; // return persistent path even if not found (for error message)
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) {
        HttpUtil.handlePreflight(req, resp);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        String path = req.getServletPath();

        // Download mode
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

            // Handle file upload
            String fileName = null;
            String filePath = null;
            long fileSize = 0;

            Part filePart = req.getPart("file");
            if (filePart != null && filePart.getSize() > 0) {
                fileName = getFileName(filePart);
                String ext = fileName.contains(".") ? fileName.substring(fileName.lastIndexOf('.')) : "";
                String storedName = UUID.randomUUID() + ext;

                String uploadPath = getUploadDir();
                Path target = Paths.get(uploadPath, storedName);
                try (InputStream is = filePart.getInputStream()) {
                    Files.copy(is, target, StandardCopyOption.REPLACE_EXISTING);
                }
                filePath = UPLOAD_DIR + "/" + storedName;
                fileSize = filePart.getSize();
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

            // Delete file from disk
            Map<String, Object> m = dao.getById(id);
            if (m != null && m.get("filePath") != null) {
                Path path = resolveFilePath((String) m.get("filePath"));
                Files.deleteIfExists(path);
            }

            dao.delete(id);
            HttpUtil.writeOk(resp, null, "Material deleted");
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Delete failed: " + e.getMessage());
        }
    }

    private void download(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            String idStr = req.getParameter("id");
            if (idStr == null) { HttpUtil.writeError(resp, 400, "id required"); return; }
            Map<String, Object> m = dao.getById(Integer.parseInt(idStr));
            if (m == null || m.get("filePath") == null) {
                HttpUtil.writeError(resp, 404, "File not found");
                return;
            }
            Path path = resolveFilePath((String) m.get("filePath"));
            if (!Files.exists(path)) {
                HttpUtil.writeError(resp, 404, "File missing from disk: " + path.toString());
                return;
            }

            String fileName = (String) m.get("fileName");
            resp.setContentType("application/octet-stream");
            resp.setHeader("Content-Disposition", "attachment; filename=\"" + fileName + "\"");
            resp.setContentLengthLong(Files.size(path));
            Files.copy(path, resp.getOutputStream());
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
