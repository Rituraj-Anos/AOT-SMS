package com.aot.sms.model;

/**
 * POJO for a student's grade in a subject.
 * Maps to the 'grades' table.
 */
public class Grade {

    private int gradeId;
    private int studentId;
    private int subjectId;
    private int semester;
    private String academicYear;
    private String grade;       // O, E, A, B, C, D, F
    private int gradePoint;     // 10, 9, 8, 7, 6, 5, 0
    private int credits;
    private boolean isBacklog;
    private boolean backlogCleared;

    // Joined fields
    private String subjectCode;
    private String subjectName;

    public Grade() {}

    public int getGradeId() { return gradeId; }
    public void setGradeId(int gradeId) { this.gradeId = gradeId; }

    public int getStudentId() { return studentId; }
    public void setStudentId(int studentId) { this.studentId = studentId; }

    public int getSubjectId() { return subjectId; }
    public void setSubjectId(int subjectId) { this.subjectId = subjectId; }

    public int getSemester() { return semester; }
    public void setSemester(int semester) { this.semester = semester; }

    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }

    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }

    public int getGradePoint() { return gradePoint; }
    public void setGradePoint(int gradePoint) { this.gradePoint = gradePoint; }

    public int getCredits() { return credits; }
    public void setCredits(int credits) { this.credits = credits; }

    public boolean isBacklog() { return isBacklog; }
    public void setBacklog(boolean backlog) { isBacklog = backlog; }

    public boolean isBacklogCleared() { return backlogCleared; }
    public void setBacklogCleared(boolean backlogCleared) { this.backlogCleared = backlogCleared; }

    public String getSubjectCode() { return subjectCode; }
    public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }

    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }
}
