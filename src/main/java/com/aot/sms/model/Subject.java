package com.aot.sms.model;

/**
 * POJO representing a subject/course.
 * Maps to the 'subjects' table.
 */
public class Subject {

    private int subjectId;
    private String subjectCode;
    private String subjectName;
    private int deptId;
    private int semester;
    private int credits;
    private String subjectType;   // theory, lab, training
    private int lHours;
    private int tHours;
    private int pHours;

    public Subject() {}

    public int getSubjectId() { return subjectId; }
    public void setSubjectId(int subjectId) { this.subjectId = subjectId; }

    public String getSubjectCode() { return subjectCode; }
    public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }

    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }

    public int getDeptId() { return deptId; }
    public void setDeptId(int deptId) { this.deptId = deptId; }

    public int getSemester() { return semester; }
    public void setSemester(int semester) { this.semester = semester; }

    public int getCredits() { return credits; }
    public void setCredits(int credits) { this.credits = credits; }

    public String getSubjectType() { return subjectType; }
    public void setSubjectType(String subjectType) { this.subjectType = subjectType; }

    public int getLHours() { return lHours; }
    public void setLHours(int lHours) { this.lHours = lHours; }

    public int getTHours() { return tHours; }
    public void setTHours(int tHours) { this.tHours = tHours; }

    public int getPHours() { return pHours; }
    public void setPHours(int pHours) { this.pHours = pHours; }
}
