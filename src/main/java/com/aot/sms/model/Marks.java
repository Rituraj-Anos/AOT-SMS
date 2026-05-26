package com.aot.sms.model;

import java.sql.Timestamp;

/**
 * POJO for student marks in a subject.
 * Maps to the 'marks' table.
 */
public class Marks {

    private int marksId;
    private int studentId;
    private int subjectId;
    private int semester;
    private String academicYear;
    private Double ct1;              // out of 20
    private Double ct2;
    private Double ct3;
    private Double ct4;
    private Double bestTwoMarks;     // auto-calculated, out of 25
    private Double eseMarks;         // End Semester Exam, out of 70
    private int attendanceMarks;     // 0-5, auto from attendance %
    private Double totalMarks;       // auto = bestTwo + ese + attMarks
    private boolean isResultDeclared;
    private int enteredBy;           // teacher_id
    private Timestamp updatedAt;

    // Joined fields for display
    private String rollNo;
    private String studentName;
    private String subjectCode;
    private String subjectName;
    private int credits;

    public Marks() {}

    public int getMarksId() { return marksId; }
    public void setMarksId(int marksId) { this.marksId = marksId; }

    public int getStudentId() { return studentId; }
    public void setStudentId(int studentId) { this.studentId = studentId; }

    public int getSubjectId() { return subjectId; }
    public void setSubjectId(int subjectId) { this.subjectId = subjectId; }

    public int getSemester() { return semester; }
    public void setSemester(int semester) { this.semester = semester; }

    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }

    public Double getCt1() { return ct1; }
    public void setCt1(Double ct1) { this.ct1 = ct1; }

    public Double getCt2() { return ct2; }
    public void setCt2(Double ct2) { this.ct2 = ct2; }

    public Double getCt3() { return ct3; }
    public void setCt3(Double ct3) { this.ct3 = ct3; }

    public Double getCt4() { return ct4; }
    public void setCt4(Double ct4) { this.ct4 = ct4; }

    public Double getBestTwoMarks() { return bestTwoMarks; }
    public void setBestTwoMarks(Double bestTwoMarks) { this.bestTwoMarks = bestTwoMarks; }

    public Double getEseMarks() { return eseMarks; }
    public void setEseMarks(Double eseMarks) { this.eseMarks = eseMarks; }

    public int getAttendanceMarks() { return attendanceMarks; }
    public void setAttendanceMarks(int attendanceMarks) { this.attendanceMarks = attendanceMarks; }

    public Double getTotalMarks() { return totalMarks; }
    public void setTotalMarks(Double totalMarks) { this.totalMarks = totalMarks; }

    public boolean isResultDeclared() { return isResultDeclared; }
    public void setResultDeclared(boolean resultDeclared) { isResultDeclared = resultDeclared; }

    public int getEnteredBy() { return enteredBy; }
    public void setEnteredBy(int enteredBy) { this.enteredBy = enteredBy; }

    public Timestamp getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Timestamp updatedAt) { this.updatedAt = updatedAt; }

    public String getRollNo() { return rollNo; }
    public void setRollNo(String rollNo) { this.rollNo = rollNo; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public String getSubjectCode() { return subjectCode; }
    public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }

    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }

    public int getCredits() { return credits; }
    public void setCredits(int credits) { this.credits = credits; }
}
