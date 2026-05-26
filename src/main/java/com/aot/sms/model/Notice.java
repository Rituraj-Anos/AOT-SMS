package com.aot.sms.model;

import java.sql.Date;
import java.sql.Timestamp;

/**
 * POJO for notice board entries.
 * Maps to the 'notices' table.
 */
public class Notice {

    private int noticeId;
    private String title;
    private String body;
    private String postedByRole;    // admin, teacher
    private int postedById;
    private String targetType;      // all, dept, section, student
    private Integer targetDeptId;
    private String targetSection;
    private boolean isPinned;
    private Timestamp postDate;
    private Date expiryDate;

    // Joined fields
    private String postedByName;
    private String deptName;

    public Notice() {}

    public int getNoticeId() { return noticeId; }
    public void setNoticeId(int noticeId) { this.noticeId = noticeId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public String getPostedByRole() { return postedByRole; }
    public void setPostedByRole(String postedByRole) { this.postedByRole = postedByRole; }

    public int getPostedById() { return postedById; }
    public void setPostedById(int postedById) { this.postedById = postedById; }

    public String getTargetType() { return targetType; }
    public void setTargetType(String targetType) { this.targetType = targetType; }

    public Integer getTargetDeptId() { return targetDeptId; }
    public void setTargetDeptId(Integer targetDeptId) { this.targetDeptId = targetDeptId; }

    public String getTargetSection() { return targetSection; }
    public void setTargetSection(String targetSection) { this.targetSection = targetSection; }

    public boolean isPinned() { return isPinned; }
    public void setPinned(boolean pinned) { isPinned = pinned; }

    public Timestamp getPostDate() { return postDate; }
    public void setPostDate(Timestamp postDate) { this.postDate = postDate; }

    public Date getExpiryDate() { return expiryDate; }
    public void setExpiryDate(Date expiryDate) { this.expiryDate = expiryDate; }

    public String getPostedByName() { return postedByName; }
    public void setPostedByName(String postedByName) { this.postedByName = postedByName; }

    public String getDeptName() { return deptName; }
    public void setDeptName(String deptName) { this.deptName = deptName; }
}
