package com.aot.sms.listener;

import com.aot.sms.dao.DBConnection;

import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;

import java.net.HttpURLConnection;
import java.net.URI;
import java.sql.Connection;
import java.sql.Statement;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Keeps the Aiven MySQL DB awake AND keeps the Render server warm.
 *
 * - DB ping: SELECT 1 every 5 minutes (prevents Aiven free tier from suspending).
 * - Self-ping: HTTP GET to backend's own /api/health every 10 minutes
 *   (prevents Render free tier from sleeping the server after 15min idle).
 */
@WebListener
public class KeepAliveListener implements ServletContextListener {

    private ScheduledExecutorService scheduler;

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        scheduler = Executors.newScheduledThreadPool(2, r -> {
            Thread t = new Thread(r, "aot-sms-keepalive");
            t.setDaemon(true);
            return t;
        });

        // DB keep-alive: ping every 5 minutes
        scheduler.scheduleAtFixedRate(this::pingDatabase, 30, 300, TimeUnit.SECONDS);

        // Server self-ping: hit /api/health every 10 minutes
        scheduler.scheduleAtFixedRate(this::pingSelf, 60, 600, TimeUnit.SECONDS);

        System.out.println("[KeepAlive] Scheduler started — DB ping every 5min, self-ping every 10min");
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        if (scheduler != null) {
            scheduler.shutdownNow();
            System.out.println("[KeepAlive] Scheduler stopped");
        }
    }

    private void pingDatabase() {
        try (Connection conn = DBConnection.getConnection();
             Statement st = conn.createStatement()) {
            st.execute("SELECT 1");
            // Silent success — only log failures
        } catch (Exception e) {
            System.err.println("[KeepAlive] DB ping failed: " + e.getMessage());
        }
    }

    private void pingSelf() {
        // Use SELF_URL env var (e.g. https://aot-sms-backend.onrender.com)
        String selfUrl = System.getenv("SELF_URL");
        if (selfUrl == null || selfUrl.isBlank()) return;

        try {
            URI uri = URI.create(selfUrl + "/api/health");
            HttpURLConnection conn = (HttpURLConnection) uri.toURL().openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(10_000);
            conn.setReadTimeout(15_000);
            int code = conn.getResponseCode();
            conn.disconnect();
            if (code != 200) {
                System.err.println("[KeepAlive] Self-ping returned: " + code);
            }
        } catch (Exception e) {
            System.err.println("[KeepAlive] Self-ping failed: " + e.getMessage());
        }
    }
}
