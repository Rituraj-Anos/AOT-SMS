package com.aot.sms.util;

import com.aot.sms.model.Grade;
import com.aot.sms.dao.GradeDAO;
import com.aot.sms.dao.SubjectDAO;
import com.aot.sms.model.Subject;
import java.sql.*;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Utility class for Maulana Abul Kalam Azad University of Technology (MAKAUT) academic regulations.
 * Implements paper credits, best-two-of-four class tests, attendance weightage, 75% attendance rules,
 * letter grade maps, and SGPA/CGPA formulas.
 */
public class MAKAUTCalculator {

    /**
     * Best 2 of 4 class tests scaled to 25.
     * CTs are originally out of 20. The average of the best two is scaled to 25.
     */
    public static double calcBestTwo(Double ct1, Double ct2, Double ct3, Double ct4) {
        List<Double> marks = new ArrayList<>();
        if (ct1 != null) marks.add(ct1);
        if (ct2 != null) marks.add(ct2);
        if (ct3 != null) marks.add(ct3);
        if (ct4 != null) marks.add(ct4);
        
        if (marks.isEmpty()) {
            return 0.0;
        }
        
        marks.sort(Collections.reverseOrder());
        List<Double> best2 = marks.subList(0, Math.min(2, marks.size()));
        double avg = best2.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        
        // Scale 0-20 to 0-25
        double scaled = (avg / 20.0) * 25.0;
        return Math.round(scaled * 100.0) / 100.0;
    }

    /**
     * Attendance marks (0 to 5) based on attendance percentage.
     */
    public static int calcAttMarks(double attPercent) {
        if (attPercent >= 90) return 5;
        if (attPercent >= 80) return 4;
        if (attPercent >= 75) return 3;
        if (attPercent >= 65) return 2;
        if (attPercent >= 50) return 1;
        return 0;
    }

    /**
     * Grade result containing letter grade and grade points based on total marks (out of 100).
     */
    public static GradeResult calcGrade(double total) {
        if (total >= 90) return new GradeResult("O", 10);
        if (total >= 80) return new GradeResult("E", 9);
        if (total >= 70) return new GradeResult("A", 8);
        if (total >= 60) return new GradeResult("B", 7);
        if (total >= 50) return new GradeResult("C", 6);
        if (total >= 40) return new GradeResult("D", 5);
        return new GradeResult("F", 0);
    }

    /**
     * Calculate SGPA for a semester from a list of Grade POJOs.
     */
    public static double calcSGPA(List<Grade> subjects) {
        if (subjects == null || subjects.isEmpty()) {
            return 0.0;
        }
        int totalCredits = subjects.stream().mapToInt(Grade::getCredits).sum();
        int weightedPoints = subjects.stream().mapToInt(s -> s.getCredits() * s.getGradePoint()).sum();
        if (totalCredits == 0) return 0.0;
        return Math.round(((double) weightedPoints / totalCredits) * 100.0) / 100.0;
    }

    /**
     * CGPA calculation (average of all active/non-zero SGPAs).
     */
    public static double calcCGPA(List<Double> sgpas) {
        if (sgpas == null || sgpas.isEmpty()) {
            return 0.0;
        }
        List<Double> valid = sgpas.stream().filter(s -> s > 0.0).toList();
        if (valid.isEmpty()) return 0.0;
        double avg = valid.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        return Math.round(avg * 100.0) / 100.0;
    }

    /**
     * Convert CGPA to equivalent Percentage.
     * Formula: Percentage = (CGPA - 0.75) * 10
     */
    public static double cgpaToPercentage(double cgpa) {
        if (cgpa <= 0.75) return 0.0;
        double pct = (cgpa - 0.75) * 10.0;
        return Math.round(pct * 100.0) / 100.0;
    }

    /**
     * Solve the number of future classes needed to reach 75% attendance.
     * returns 0 if already >= 75%.
     */
    public static int classesNeededFor75(int totalHeld, int attended) {
        if (totalHeld <= 0) return 0;
        if (((double) attended / totalHeld) * 100.0 >= 75.0) return 0;
        // (attended + x) / (totalHeld + x) = 0.75 => x = (0.75 * totalHeld - attended) / 0.25
        double needed = (0.75 * totalHeld - attended) / 0.25;
        return (int) Math.ceil(needed);
    }

    /**
     * Recalculate SGPA for a semester and trigger CGPA / percentage recalculation.
     */
    public static void recalculateSGPA(Connection conn, int studentId, int semester) throws SQLException {
        GradeDAO gradeDAO = new GradeDAO(); // Connection will be handled internally or passed. Let's use GradeDAO custom instance.
        
        // Wait, GradeDAO retrieves connections internally but let's query with conn or GradeDAO.
        // We'll calculate the SGPA.
        List<Grade> semGrades = gradeDAO.getByStudent(studentId, semester);
        double sgpa = calcSGPA(semGrades);

        // Update semester SGPA
        String col = "sem" + semester + "_sgpa";
        String sql = "INSERT INTO sgpa_cgpa (student_id, " + col + ") VALUES (?, ?) " +
                     "ON DUPLICATE KEY UPDATE " + col + " = VALUES(" + col + ")";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, studentId);
            ps.setDouble(2, sgpa);
            ps.executeUpdate();
        }

        // Recalculate CGPA
        String cgpaSql = "SELECT sem1_sgpa, sem2_sgpa, sem3_sgpa, sem4_sgpa, " +
                         "sem5_sgpa, sem6_sgpa, sem7_sgpa, sem8_sgpa FROM sgpa_cgpa WHERE student_id = ?";
        try (PreparedStatement ps2 = conn.prepareStatement(cgpaSql)) {
            ps2.setInt(1, studentId);
            try (ResultSet rs = ps2.executeQuery()) {
                if (rs.next()) {
                    List<Double> allSGPAs = new ArrayList<>();
                    for (int i = 1; i <= 8; i++) {
                        double s = rs.getDouble("sem" + i + "_sgpa");
                        if (s > 0) {
                            allSGPAs.add(s);
                        }
                    }
                    double cgpa = calcCGPA(allSGPAs);
                    double pct = cgpaToPercentage(cgpa);
                    
                    String updateSql = "UPDATE sgpa_cgpa SET cgpa = ?, percentage = ? WHERE student_id = ?";
                    try (PreparedStatement ps3 = conn.prepareStatement(updateSql)) {
                        ps3.setDouble(1, cgpa);
                        ps3.setDouble(2, pct);
                        ps3.setInt(3, studentId);
                        ps3.executeUpdate();
                    }
                }
            }
        }
    }

    public static class GradeResult {
        public final String grade;
        public final int point;
        
        public GradeResult(String grade, int point) {
            this.grade = grade;
            this.point = point;
        }
    }
}
