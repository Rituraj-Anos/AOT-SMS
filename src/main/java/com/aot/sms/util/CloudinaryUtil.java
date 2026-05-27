package com.aot.sms.util;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;

import java.io.InputStream;
import java.util.Map;

/**
 * Cloudinary file upload/delete utility.
 * Credentials read from environment variables:
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */
public class CloudinaryUtil {

    private static final Cloudinary cloudinary;

    static {
        String cloudName = System.getenv("CLOUDINARY_CLOUD_NAME");
        String apiKey = System.getenv("CLOUDINARY_API_KEY");
        String apiSecret = System.getenv("CLOUDINARY_API_SECRET");

        if (cloudName != null && apiKey != null && apiSecret != null) {
            cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret
            ));
        } else {
            cloudinary = null;
        }
    }

    /** Check if Cloudinary is configured (env vars set). */
    public static boolean isConfigured() {
        return cloudinary != null;
    }

    /** Upload a file and return the secure URL. */
    @SuppressWarnings("unchecked")
    public static String uploadFile(InputStream fileStream, String fileName) throws Exception {
        if (cloudinary == null) throw new IllegalStateException("Cloudinary not configured");
        byte[] data = fileStream.readAllBytes();
        Map<String, Object> result = cloudinary.uploader().upload(data, ObjectUtils.asMap(
            "public_id", "aot-sms/" + System.currentTimeMillis() + "_" + sanitize(fileName),
            "resource_type", "raw",
            "type", "upload"
        ));
        return result.get("secure_url").toString();
    }

    /**
     * Generate a time-limited signed URL for a private raw file.
     * This bypasses the 401 issue when Cloudinary has strict access enabled.
     */
    public static String getSignedUrl(String cloudinaryUrl) {
        if (cloudinary == null || cloudinaryUrl == null) return cloudinaryUrl;
        try {
            // Extract public_id from URL: .../raw/upload/v123/aot-sms/filename.pdf
            String marker = "/raw/upload/";
            int idx = cloudinaryUrl.indexOf(marker);
            if (idx < 0) return cloudinaryUrl;
            String afterMarker = cloudinaryUrl.substring(idx + marker.length());
            // Remove version prefix (v1234567/)
            if (afterMarker.startsWith("v")) {
                int slashIdx = afterMarker.indexOf('/');
                if (slashIdx > 0) afterMarker = afterMarker.substring(slashIdx + 1);
            }
            String publicId = afterMarker; // e.g. "aot-sms/1779885750058_QB_CA3_PCC-CS404.pdf"

            long expiry = System.currentTimeMillis() / 1000 + 3600; // 1 hour
            String signed = cloudinary.url()
                .resourceType("raw")
                .type("upload")
                .signed(true)
                .generate(publicId);
            // Add expiry
            if (signed != null && signed.contains("?")) {
                signed += "&expires_at=" + expiry;
            }
            return signed != null ? signed : cloudinaryUrl;
        } catch (Exception e) {
            return cloudinaryUrl;
        }
    }

    /** Upload raw bytes and return the secure URL. */
    @SuppressWarnings("unchecked")
    public static String uploadBytes(byte[] data, String fileName) throws Exception {
        if (cloudinary == null) throw new IllegalStateException("Cloudinary not configured");
        Map<String, Object> result = cloudinary.uploader().upload(data, ObjectUtils.asMap(
            "public_id", "aot-sms/" + System.currentTimeMillis() + "_" + sanitize(fileName),
            "resource_type", "auto"
        ));
        return result.get("secure_url").toString();
    }

    /** Delete a file by its public ID. */
    public static void deleteFile(String publicId) throws Exception {
        if (cloudinary == null) return;
        cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", "auto"));
    }

    private static String sanitize(String name) {
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
