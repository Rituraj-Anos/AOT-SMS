package com.aot.sms.dao;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * Centralized JDBC connection factory.
 * All DAOs obtain connections through this class.
 *
 * Configuration via environment variables (with local fallbacks):
 *   DB_HOST  → default: localhost
 *   DB_PORT  → default: 3306
 *   DB_NAME  → default: aot_sms
 *   DB_USER  → default: root
 *   DB_PASS  → default: root
 *   DB_SSL   → default: false (set to "true" for cloud databases like Aiven)
 */
public class DBConnection {

    private static final String HOST = env("DB_HOST", "localhost");
    private static final String PORT = env("DB_PORT", "3306");
    private static final String NAME = env("DB_NAME", "aot_sms");
    private static final String USER = env("DB_USER", "root");
    private static final String PASS = env("DB_PASS", "root");
    private static final boolean SSL = "true".equalsIgnoreCase(env("DB_SSL", "false"));

    private static final String URL;
    private static final String DRIVER = "com.mysql.cj.jdbc.Driver";

    static {
        String base = "jdbc:mysql://" + HOST + ":" + PORT + "/" + NAME
                    + "?allowPublicKeyRetrieval=true&serverTimezone=Asia/Kolkata";
        if (SSL) {
            base += "&useSSL=true&requireSSL=true";
        } else {
            base += "&useSSL=false";
        }
        URL = base;

        try {
            Class.forName(DRIVER);
        } catch (ClassNotFoundException e) {
            throw new RuntimeException("MySQL JDBC Driver not found on classpath", e);
        }
    }

    /**
     * Returns a new connection to the database.
     * Callers are responsible for closing the connection (use try-with-resources).
     */
    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASS);
    }

    private static String env(String key, String fallback) {
        String val = System.getenv(key);
        return (val != null && !val.isBlank()) ? val : fallback;
    }
}
