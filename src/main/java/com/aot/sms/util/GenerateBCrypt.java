package com.aot.sms.util;

import org.mindrot.jbcrypt.BCrypt;

/**
 * One-time utility to generate BCrypt hashes for default passwords.
 * Run this with:  mvn exec:java -Dexec.mainClass="com.aot.sms.util.GenerateBCrypt"
 * Or just run main() in your IDE.
 *
 * Then paste the printed hashes into database/seed_admin.sql.
 */
public class GenerateBCrypt {

    public static void main(String[] args) {
        System.out.println("=== BCrypt Hash Generator ===\n");

        String adminPassword   = "Admin@AOT2026";
        String studentPassword = "Student@123";
        String teacherPassword = "Teacher@123";

        String adminHash   = BCrypt.hashpw(adminPassword,   BCrypt.gensalt(12));
        String studentHash = BCrypt.hashpw(studentPassword, BCrypt.gensalt(12));
        String teacherHash = BCrypt.hashpw(teacherPassword, BCrypt.gensalt(12));

        System.out.println("Admin   (" + adminPassword   + "):");
        System.out.println("  " + adminHash);
        System.out.println();
        System.out.println("Student (" + studentPassword + "):");
        System.out.println("  " + studentHash);
        System.out.println();
        System.out.println("Teacher (" + teacherPassword + "):");
        System.out.println("  " + teacherHash);
        System.out.println();

        System.out.println("=== SQL for admin seed ===");
        System.out.println("INSERT INTO admin_users (user_id, admin_name, role_level, email, password_hash)");
        System.out.println("VALUES ('admin', 'AOT Admin', 'superadmin', 'admin@aot.edu.in',");
        System.out.println("        '" + adminHash + "');");
    }
}
