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
        // Cloudinary requires byte[] not InputStream
        byte[] data = fileStream.readAllBytes();
        Map<String, Object> result = cloudinary.uploader().upload(data, ObjectUtils.asMap(
            "public_id", "aot-sms/" + System.currentTimeMillis() + "_" + sanitize(fileName),
            "resource_type", "auto"
        ));
        return result.get("secure_url").toString();
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
