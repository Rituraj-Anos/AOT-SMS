package com.aot.sms.servlet;

import com.aot.sms.dao.SubmissionDAO;
import com.aot.sms.util.HttpUtil;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

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
 * Submissions API — student upload + teacher grading.
 *
 *   POST   /api/submissions          — student submits assignment (multipart)
 *   GET    /api/submissions?materialId=X  — list submissions for a material (teacher/admin)
 *   GET    /api/submissions?materialId=X&studentId=Y  — student's own submission
 *   PUT    /api/submissions          — grade a submission (JSON: submissionId, grade, feedback)
 */
@WebServlet({"/api/submissions", "/api/submissions/download"})
@MultipartConfig(
    fileSizeThreshold = 1024 * 1024,
    maxFileSize       = 50 * 1024 * 1024,
    maxRequestSize    = 55 * 1024 * 1024
)
public class SubmissionServlet extends HttpServlet {

    private static final String UPLOAD_DIR = "uploads/submissions";
    private static final String PERSISTENT_UPLOAD_ROOT;
    static {
        String envPath = System.getenv("UPLOAD_PATH");
        if (envPath != null && !envPath.isBlank()) {
            PERSISTENT_UPLOAD_ROOT = envPath + "/submissions";
        } else if (System.getProperty("os.name", "").toLowerCase().contains("win")) {
            PERSISTENT_UPLOAD_ROOT = "C:/coding/AOT-SMS/uploads/submissions";
        } else {
            PERSISTENT_UPLOAD_ROOT = "/tmp/aot-uploads/submissions";
        }
    }
    private final SubmissionDAO dao = new SubmissionDAO();

    private String getUploadDir() {
        File dir = new File(PERSISTENT_UPLOAD_ROOT);
        if (!dir.exists()) dir.mkdirs();
        return PERSISTENT_UPLOAD_ROOT;
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) {
        HttpUtil.handlePreflight(req, resp);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);

        // Download mode
        if ("/api/submissions/download".equals(req.getServletPath())) {
            downloadSubmission(req, resp);
            return;
        }

        try {
            String materialIdStr = req.getParameter("materialId");
            String studentIdStr  = req.getParameter("studentId");

            if (materialIdStr == null) {
                HttpUtil.writeError(resp, 400, "materialId required");
                return;
            }
            int materialId = Integer.parseInt(materialIdStr);

            if (studentIdStr != null) {
                // Single student's submission
                Map<String, Object> sub = dao.getByStudentMaterial(Integer.parseInt(studentIdStr), materialId);
                HttpUtil.writeOk(resp, sub); // null if not submitted
                return;
            }

            // All submissions for a material (teacher/admin view)
            List<Map<String, Object>> list = dao.getByMaterial(materialId);
            HttpUtil.writeOk(resp, list);
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Failed to load submissions: " + e.getMessage());
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        String role = (String) req.getAttribute("auth.role");
        Integer uid = (Integer) req.getAttribute("auth.uid");
        if (!"student".equals(role)) {
            HttpUtil.writeError(resp, 403, "Student role required.");
            return;
        }

        try {
            int materialId = Integer.parseInt(req.getParameter("materialId"));
            int studentId  = uid != null ? uid : 0;

            // Check if already submitted
            Map<String, Object> existing = dao.getByStudentMaterial(studentId, materialId);
            if (existing != null) {
                HttpUtil.writeError(resp, 409, "Already submitted. Cannot resubmit.");
                return;
            }

            // Handle file
            Part filePart = req.getPart("file");
            if (filePart == null || filePart.getSize() == 0) {
                HttpUtil.writeError(resp, 400, "File is required.");
                return;
            }

            String fileName = getFileName(filePart);
            String ext = fileName.contains(".") ? fileName.substring(fileName.lastIndexOf('.')) : "";
            String storedName = UUID.randomUUID() + ext;

            String uploadPath = getUploadDir();
            Path target = Paths.get(uploadPath, storedName);
            try (InputStream is = filePart.getInputStream()) {
                Files.copy(is, target, StandardCopyOption.REPLACE_EXISTING);
            }
            String filePath = UPLOAD_DIR + "/" + storedName;

            int id = dao.insert(materialId, studentId, fileName, filePath);
            if (id < 0) { HttpUtil.writeError(resp, 500, "Insert failed"); return; }

            resp.setStatus(HttpServletResponse.SC_CREATED);
            HttpUtil.writeOk(resp, Map.of("submissionId", id), "Assignment submitted");
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Submission failed: " + e.getMessage());
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        String role = (String) req.getAttribute("auth.role");
        if (!"admin".equals(role) && !"teacher".equals(role)) {
            HttpUtil.writeError(resp, 403, "Teacher or admin role required.");
            return;
        }

        try {
            JsonObject body = JsonParser.parseReader(req.getReader()).getAsJsonObject();
            int submissionId = body.get("submissionId").getAsInt();
            String grade     = body.has("grade") ? body.get("grade").getAsString() : null;
            String feedback  = body.has("feedback") ? body.get("feedback").getAsString() : null;

            boolean ok = dao.grade(submissionId, grade, feedback);
            if (!ok) { HttpUtil.writeError(resp, 404, "Submission not found"); return; }
            HttpUtil.writeOk(resp, null, "Graded successfully");
        } catch (Exception e) {
            HttpUtil.writeError(resp, 500, "Grading failed: " + e.getMessage());
        }
    }

    private void downloadSubmission(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            String idStr = req.getParameter("id");
            if (idStr == null) { HttpUtil.writeError(resp, 400, "id required"); return; }
            int submissionId = Integer.parseInt(idStr);

            // Get submission record
            Map<String, Object> sub = dao.getSubmissionById(submissionId);
            if (sub == null || sub.get("filePath") == null) {
                HttpUtil.writeError(resp, 404, "Submission file not found");
                return;
            }

            String relativePath = (String) sub.get("filePath");
            String storedName = relativePath.replace("uploads/submissions/", "");
            java.nio.file.Path path = java.nio.file.Paths.get(getUploadDir(), storedName);

            if (!java.nio.file.Files.exists(path)) {
                // Try webapp-relative fallback
                String webappPath = getServletContext().getRealPath("") + java.io.File.separator + relativePath;
                path = java.nio.file.Paths.get(webappPath);
                if (!java.nio.file.Files.exists(path)) {
                    HttpUtil.writeError(resp, 404, "File missing from disk");
                    return;
                }
            }

            String fileName = (String) sub.get("fileName");
            resp.setContentType("application/octet-stream");
            resp.setHeader("Content-Disposition", "attachment; filename=\"" + fileName + "\"");
            resp.setContentLengthLong(java.nio.file.Files.size(path));
            java.nio.file.Files.copy(path, resp.getOutputStream());
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
        return "submission_" + System.currentTimeMillis();
    }
}
