package com.aot.sms.util;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;

import java.io.InputStream;
import java.util.Map;

public class CloudinaryUtil {

    private static final Cloudinary cloudinary;

    static {
        String cloudName = System.getenv("CLOUDINARY_CLOUD_NAME");
        String apiKey = System.getenv("CLOUDINARY_API_KEY");
        String apiSecret = System.getenv("CLOUDINARY_API_SECRET");
        if (cloudName != null && apiKey != null && apiSecret != null) {
            cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName, "api_key", apiKey, "api_secret", apiSecret, "secure", true
            ));
        } else {
            cloudinary = null;
        }
    }

    public static boolean isConfigured() { return cloudinary != null; }

    @SuppressWarnings("unchecked")
    public static String uploadFile(InputStream fileStream, String fileName) throws Exception {
        if (cloudinary == null) throw new IllegalStateException("Cloudinary not configured");
        byte[] data = fileStream.readAllBytes();
        Map<String, Object> result = cloudinary.uploader().upload(data, ObjectUtils.asMap(
            "public_id", "aot-sms/" + System.currentTimeMillis() + "_" + sanitize(fileName),
            "resource_type", "raw",
            "type", "upload"
        ));
        // Always return https URL
        String url = result.get("secure_url").toString();
        return url.replace("http://", "https://");
    }

    /**
     * Returns a signed HTTPS URL for the given Cloudinary raw file URL.
     */
    public static String getSignedUrl(String cloudinaryUrl) {
        if (cloudinary == null || cloudinaryUrl == null) return ensureHttps(cloudinaryUrl);
        try {
            String marker = "/raw/upload/";
            int idx = cloudinaryUrl.indexOf(marker);
            if (idx < 0) return ensureHttps(cloudinaryUrl);

            String afterMarker = cloudinaryUrl.substring(idx + marker.length());
            // Remove version prefix (v1234567/)
            if (afterMarker.startsWith("v")) {
                int slashIdx = afterMarker.indexOf('/');
                if (slashIdx > 0) afterMarker = afterMarker.substring(slashIdx + 1);
            }

            String signed = cloudinary.url()
                .resourceType("raw")
                .type("upload")
                .signed(true)
                .secure(true)
                .generate(afterMarker);

            return signed != null ? signed : ensureHttps(cloudinaryUrl);
        } catch (Exception e) {
            return ensureHttps(cloudinaryUrl);
        }
    }

    private static String ensureHttps(String url) {
        if (url == null) return null;
        return url.replace("http://res.cloudinary.com", "https://res.cloudinary.com");
    }

    private static String sanitize(String name) {
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
