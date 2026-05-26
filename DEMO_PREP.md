# AOT-SMS — Complete Project Report & Demo Preparation Guide

---

## 1. Project Overview

### What is AOT-SMS?

AOT-SMS (Academy of Technology — Student Management System) is a full-stack college ERP application that digitizes the entire academic workflow for a MAKAUT-affiliated engineering college. It replaces manual Excel-based tracking with a real-time web application serving three user roles: Admin, Teacher, and Student.

### The Problem

Indian engineering colleges under MAKAUT (Maulana Abul Kalam Azad University of Technology) face these challenges:
- **Attendance tracking** is done on paper registers, then manually entered into Excel sheets
- **75% minimum attendance rule** violations are caught too late (often at exam time)
- **Internal marks** (Best-2-of-4 CAs scaled to 25) require complex manual calculations
- **Official attendance sheets** must be generated in a specific format for university submission
- **Fee records, notices, and study materials** are scattered across WhatsApp groups and email

### Who Uses It

| Role | Users | What They Do |
|------|-------|-------------|
| **Admin** | HOD, Office Staff | Manage students/teachers, override marks, view reports, manage fees |
| **Teacher** | Faculty (12 teachers) | Mark attendance, enter CA/ESE marks, post materials, grade assignments |
| **Student** | 60 students (CSE1 Sem4) | View attendance %, check marks/SGPA, download materials, submit assignments |

### Why This is Better

- **Real-time alerts**: Students see "Below 75%" warnings immediately, not at end of semester
- **Auto-calculation**: Best-2-of-4, SGPA, CGPA, attendance marks — all computed automatically
- **Official format export**: One-click CSV matching the exact AOT attendance sheet format
- **Dispute resolution**: Students can flag attendance discrepancies with evidence
- **Accessible anywhere**: Works on mobile, no app install needed

---

## 2. Technical Architecture

### System Architecture

```
┌─────────────────┐     HTTPS      ┌──────────────────┐     SSL/TCP     ┌─────────────────┐
│   React SPA     │ ──────────────► │  Java Servlets   │ ──────────────► │   MySQL 8.0     │
│   (Vercel)      │ ◄────────────── │  (Render/Tomcat) │ ◄────────────── │   (Aiven)       │
│                 │   JSON + JWT    │                  │   JDBC + SQL    │                 │
│ - TypeScript    │   Cookie        │ - Jakarta EE 6   │                 │ - 23 tables     │
│ - Vite          │                 │ - Pure JDBC      │                 │ - 6700+ records │
│ - TanStack Query│                 │ - Gson           │                 │ - Views         │
│ - Tailwind CSS  │                 │ - BCrypt         │                 │                 │
└─────────────────┘                 └──────────────────┘                 └─────────────────┘
```

### Technology Choices

| Technology | Why Chosen |
|-----------|-----------|
| **React 19 + TypeScript** | Type safety, component reuse, rich ecosystem (TanStack Query, Framer Motion) |
| **Java Servlets (Jakarta EE 6)** | Instructor requirement — demonstrates understanding of HTTP protocol without framework magic |
| **Pure JDBC (no ORM)** | Instructor requirement — shows raw SQL skills, connection management, prepared statements |
| **MySQL 8.0** | Relational data with complex JOINs (attendance × students × subjects), ENUM types, views |
| **JWT (manual HMAC-SHA256)** | Stateless auth without session storage; implemented from scratch using `javax.crypto.Mac` |
| **Tailwind CSS + shadcn/ui** | Rapid UI development with consistent design system, fully accessible components |

### How JWT Authentication Works

```
1. Login: POST /api/auth/login {userId, password, role}
2. Server verifies BCrypt hash against DB
3. Server creates JWT: Header.Payload.Signature
   - Header: {"alg":"HS256","typ":"JWT"}
   - Payload: {"sub":"DKM","role":"teacher","name":"Prof. DKM","eid":3,"exp":...}
   - Signature: HMAC-SHA256(base64(header) + "." + base64(payload), SECRET_KEY)
4. JWT set as httpOnly cookie (SameSite=None, Secure in production)
5. Every subsequent request: JWTFilter reads cookie → verifies signature → sets request attributes
6. Servlets read req.getAttribute("auth.role") for authorization
```

Key files:
- `JWTUtil.java` — issue/verify tokens using `javax.crypto.Mac` + `java.util.Base64`
- `JWTFilter.java` — intercepts all `/api/*` requests, skips public paths
- `AuthServlet.java` — login/logout/me/password-change endpoints
- `HttpUtil.java` — cookie builder with SameSite=None for cross-origin

### How Pure JDBC Works

Every DAO follows this pattern:
```java
public List<Student> getAllStudents(...) throws SQLException {
    String sql = "SELECT s.*, d.dept_code FROM students s JOIN departments d ON ...";
    try (Connection conn = DBConnection.getConnection();
         PreparedStatement ps = conn.prepareStatement(sql)) {
        ps.setInt(1, deptId);  // Parameterized — prevents SQL injection
        try (ResultSet rs = ps.executeQuery()) {
            while (rs.next()) list.add(mapRow(rs));
        }
    }  // Auto-closed via try-with-resources
    return list;
}
```

- **No connection pooling** (each call opens/closes) — simple but works for demo scale
- **Prepared statements** everywhere — SQL injection safe
- **Manual transaction management** for bulk operations (attendance marking)

---

## 3. Feature Deep Dive

### 3.1 Authentication + Role-Based Access

**What**: Three-role login system with JWT cookies, 3-attempt lockout, session persistence.

**Technical**:
- Files: `AuthServlet.java`, `JWTFilter.java`, `JWTUtil.java`, `Login.tsx`, `authStore.ts`
- Tables: `admin_users`, `teachers`, `students`, `login_attempts`
- Each role has its own table with BCrypt-hashed passwords
- `RouteGuard.tsx` component checks role before rendering protected pages
- `useBootstrapAuth` hook calls `/api/auth/me` on app load to restore session

**Special**: JWT is implemented from scratch — no `io.jsonwebtoken` library. Uses raw `javax.crypto.Mac` with `HmacSHA256`.

### 3.2 Attendance Marking System

**What**: Teachers mark P/A/L/ML for entire class in one click. Supports past-date editing, bulk "All Present", live tally.

**Technical**:
- Files: `AttendanceServlet.java`, `AttendanceDAO.java`, `MarkAttendance.tsx`, `useAttendance.ts`
- Table: `attendance` (unique key on student_id + subject_id + date)
- `ON DUPLICATE KEY UPDATE` for upsert — re-marking same date overwrites
- Roster shows each student's overall attendance % badge (red <75%, green ≥75%)
- Below-75% students float to top with red row highlight

**Special**: The 3-tab "Attendance Hub" — Mark + Records + Export — all on one page with Framer Motion slide animations.

### 3.3 Phase-wise Attendance + Full Sheet Export

**What**: View attendance by Phase 1 / Phase 2 / Overall. Export official AOT-format CSV.

**Technical**:
- `getPhaseSummary()` — aggregates per-student totals within date range
- `getFullSheetData()` — all subjects × all students in one query
- `ReportServlet.java` — streams CSV with proper headers, grouping (Regular/Transfer/Lateral)
- Frontend: `usePhaseAttendance`, `useFullSheet` hooks
- Full sheet table: sticky Roll+Name columns, horizontal scroll, color-coded cells

**Special**: CSV matches the exact official AOT attendance PDF format — same column order, same grouping, same header rows.

### 3.4 MAKAUT Marks Calculation

**What**: Enter CA1-4 marks → auto-computes Best-2-of-4 scaled to 25 → adds ESE + attendance marks → total → grade → SGPA.

**Technical**:
- Files: `MarksServlet.java`, `MarksDAO.java`, `MAKAUTCalculator.java`, `Marks.tsx`
- Table: `marks` (unique on student_id + subject_id + semester + academic_year)
- Cascade: save marks → calculate best2 → compute total → determine grade → upsert grade → recalculate SGPA/CGPA
- All in one POST request — atomic operation

**Special**: `MAKAUTCalculator.java` implements the exact MAKAUT grading scheme including attendance marks thresholds.

### 3.5 Class Schedule / Timetable

**What**: Full CSE1 timetable with real teacher codes, room numbers, class types.

**Technical**:
- Files: `ScheduleServlet.java`, `ScheduleDAO.java`, `Schedule.tsx` (3 versions: admin/teacher/student)
- Table: `class_schedule` (27 slots for CSE1)
- Student view: clickable cells open detail drawer with past 8 weeks history
- Self-attendance tracking via `schedule_attendance` table (separate from official)

### 3.6 Dispute System

**What**: Students can flag attendance discrepancies. Teachers review and resolve.

**Technical**:
- Files: `DisputeServlet.java`, `DisputeDAO.java`, `useDisputes.ts`
- Table: `attendance_disputes` (unique on student + subject + date)
- Student raises → status=pending → Teacher resolves/rejects with note
- Comparison view: Official % vs Self-Record % side by side

### 3.7 Classroom Module

**What**: Teachers post notes/assignments/question papers. Students download, view (PDF inline), submit assignments.

**Technical**:
- Files: `MaterialServlet.java`, `SubmissionServlet.java`, `MaterialDAO.java`, `SubmissionDAO.java`
- Tables: `study_materials`, `submissions`, `material_comments`
- Multipart file upload with UUID-based storage
- View button opens PDF inline in browser (Content-Disposition: inline)
- Comment thread on each material (real-time discussion)

### 3.8 Fee Management

**What**: Track semester fees, payments, balances per student.

**Technical**:
- Files: `FeeServlet.java`, `FeeDAO.java`, `Fees.tsx`, `MyFees.tsx`
- Table: `fees` (student_id, semester, total, paid, balance, receipt)

### 3.9 Notice Board

**What**: Targeted announcements — all/dept/section/student level. Pin support.

**Technical**:
- Files: `NoticeServlet.java`, `NoticeDAO.java`, `NoticeBoard.tsx`
- Table: `notices` (target_type, target_dept_id, target_section, is_pinned)
- Shared component used across all 3 roles

---

## 4. MAKAUT Business Logic

### Best-2-of-4 Formula

```
Given: CA1=18, CA2=15, CA3=12, CA4=10
Sort descending: [18, 15, 12, 10]
Best 2 raw: 18 + 15 = 33
Scaled to 25: (33 / 40) × 25 = 20.625
```

Implementation: `MAKAUTCalculator.java` → `calculateBestTwo()` in `MarksDAO.java`

### Attendance Marks (out of 5)

| Attendance % | Marks Awarded |
|-------------|--------------|
| ≥ 90% | 5 |
| ≥ 80% | 4 |
| ≥ 75% | 3 |
| ≥ 65% | 2 |
| ≥ 55% | 1 |
| < 55% | 0 |

### Grade Boundaries

| Total Marks (out of 100) | Grade | Grade Point |
|--------------------------|-------|-------------|
| ≥ 90 | O (Outstanding) | 10 |
| ≥ 80 | E (Excellent) | 9 |
| ≥ 70 | A (Very Good) | 8 |
| ≥ 60 | B (Good) | 7 |
| ≥ 50 | C (Average) | 6 |
| ≥ 40 | D (Below Average) | 5 |
| < 40 | F (Fail) | 0 |

### SGPA Formula

```
SGPA = Σ(Credit_i × GradePoint_i) / Σ(Credit_i)

Example for Sem 4:
PCC-CS401 (4 credits) × Grade B (7) = 28
PCC-CS402 (3 credits) × Grade A (8) = 24
PCC-CS403 (3 credits) × Grade B (7) = 21
PCC-CS404 (3 credits) × Grade C (6) = 18
BSC-401   (3 credits) × Grade D (5) = 15
MC-401    (1 credits) × Grade A (8) = 8
PCC-CS492 (2 credits) × Grade B (7) = 14
PCC-CS494 (2 credits) × Grade F (0) = 0

SGPA = (28+24+21+18+15+8+14+0) / (4+3+3+3+3+1+2+2) = 128/21 = 6.10
```

### 75% Attendance Rule

```
Classes needed to reach 75% = ⌈(0.75 × held - present) / 0.25⌉

Example: Student has 14 present out of 20 held (70%)
Needed = ⌈(0.75 × 20 - 14) / 0.25⌉ = ⌈(15 - 14) / 0.25⌉ = ⌈4⌉ = 4 more classes
```

### Why MAKAUT-Specific

- Best-2-of-4 (not best-3-of-5 like some universities)
- Attendance marks as separate component (not all universities do this)
- Specific grade point scale (10-point, not 4-point)
- 75% minimum (some universities use 80%)
- Phase-wise attendance reporting (Phase 1 + Phase 2 + Overall)

---

## 5. Database Design

### Tables (23 total)

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `departments` | CSE, ECE, MECH, etc. | Referenced by students, teachers, subjects |
| `subjects` | 12 subjects (theory/lab/training) | dept_id FK |
| `students` | 60 students with full profile | dept_id FK |
| `teachers` | 12 faculty members | dept_id FK |
| `teacher_subject_mapping` | Who teaches what | teacher_id + subject_id FKs |
| `attendance` | Official records (P/A/L/ML) | student_id + subject_id + date (unique) |
| `marks` | CA1-4, ESE, best2, total | student_id + subject_id + semester (unique) |
| `grades` | O/E/A/B/C/D/F per subject | student_id + subject_id + semester (unique) |
| `sgpa_cgpa` | Computed SGPA per sem + CGPA | student_id (unique) |
| `fees` | Payment records | student_id FK |
| `notices` | Announcements | target_dept_id FK |
| `admin_users` | Admin credentials | — |
| `study_materials` | Uploaded files | teacher_id + subject_id FKs |
| `submissions` | Student assignment uploads | material_id + student_id (unique) |
| `material_comments` | Discussion threads | material_id FK |
| `class_schedule` | Timetable slots | teacher_id + subject_id FKs |
| `schedule_attendance` | Student self-record | schedule_id + student_id + date (unique) |
| `attendance_phases` | Phase date ranges | dept_id FK |
| `attendance_disputes` | Discrepancy flags | student_id + subject_id + date (unique) |
| `login_sessions` | Active sessions | — |
| `login_attempts` | Failed login tracking | — |

### Important Views

- `v_attendance_summary` — Pre-computed attendance % per student per subject
- `v_below_75` — Students below 75% (used for quick alerts)

### Design Decisions

- **ENUM types** for status fields (attendance: P/A/L/ML, grades: O/E/A/B/C/D/F) — DB-level validation
- **Unique composite keys** prevent duplicate entries (can't mark same student twice for same date)
- **ON DUPLICATE KEY UPDATE** enables upsert pattern — re-marking overwrites cleanly
- **Soft delete** (is_active flag) instead of hard delete — preserves history

---

## 6. Security Implementation

### JWT (Manual Implementation)

```java
// JWTUtil.java — No external JWT library
public static String issue(String userId, String role, String name, int entityId) {
    String header = base64({"alg":"HS256","typ":"JWT"});
    String payload = base64({"sub":userId, "role":role, "name":name, "eid":entityId, "exp":...});
    String signature = hmacSha256(header + "." + payload, SECRET_KEY);
    return header + "." + payload + "." + signature;
}
```

### BCrypt Password Hashing

- All passwords stored as BCrypt hashes (60-char strings)
- `org.mindrot.jbcrypt.BCrypt.hashpw(password, BCrypt.gensalt())`
- Verification: `BCrypt.checkpw(plaintext, storedHash)`

### Role-Based Guards

- Backend: Every servlet checks `req.getAttribute("auth.role")` before processing
- Frontend: `RouteGuard.tsx` wraps routes, redirects unauthorized users
- Admin-only operations: student/teacher CRUD, marks override, fee management

### CORS Configuration

- Dedicated `CORSFilter.java` registered before JWTFilter in web.xml
- Whitelist: localhost:5173, aot-sms.vercel.app, *.vercel.app (previews)
- Credentials: true (cookies sent cross-origin)
- SameSite=None + Secure for production cookies

---

## 7. Real Data

### Students (60 total)

- **Regular**: 24CSE001–24CSE053 (53 students, gap at 24CSE025 and 24CSE030)
- **Lateral Entry**: L204–L208 (5 students)
- **Transfer**: T006, T063, T098, T191 (4 students from ECE)

### Attendance Data (6,722 records)

Seeded from the official CSE1 4th Semester attendance sheet (as of 08-05-2026):
- PCC-CS401: 20 classes held (Teacher: RP)
- PCC-CS402: 21 classes held (Teacher: SBR)
- PCC-CS403: 17 classes held (Teacher: SRJS)
- PCC-CS404: 20 classes held (Teacher: DKM)
- BSC-401: 8 classes held (Teacher: ARD)
- MC-401: 5 classes held (Teacher: DG)
- PCC-CS492: 8/12 classes (X/Y batch, Teacher: JC)
- PCC-CS494: 12/10 classes (X/Y batch, Teacher: DKM)

### Teachers (12)

DKM, RP, ARD, JC, ND, ABP, AAT, SRJS, SBR, BBH, DG, SD

### Schedule (27 slots)

Real CSE1 timetable: Tuesday through Saturday, periods 1-6, matching the official routine PDF.

---

## 8. Frontend Architecture

### Component Structure

```
src/
├── components/shared/    # Reusable: Sidebar, Header, StatCard, CommentThread
├── components/ui/        # shadcn/ui primitives: Button, Card, Dialog, Tabs, etc.
├── hooks/                # TanStack Query hooks (one per API domain)
├── pages/admin/          # 12 admin pages
├── pages/teacher/        # 7 teacher pages
├── pages/student/        # 8 student pages
├── store/                # Zustand auth store
├── lib/                  # Axios config, MAKAUT calculator, utils
└── types/                # TypeScript interfaces matching backend JSON
```

### TanStack Query Pattern

```typescript
export function useStudentAttendance(studentId?: number) {
  return useQuery({
    queryKey: ['attendance', 'student', studentId],
    enabled: !!studentId,  // Don't fetch until ID is available
    queryFn: async () => {
      const r = await api.get<ApiResponse<AttendanceSummary[]>>('/attendance', { params: { studentId } });
      return r.data.data ?? [];
    },
  });
}
```

Benefits: automatic caching, background refetch, loading/error states, query invalidation on mutations.

### Bundle Optimization (9 chunks)

```
react.js      — React core (103 KB)
query.js      — TanStack Query + Table (96 KB)
charts.js     — Recharts (410 KB)
motion.js     — Framer Motion (121 KB)
forms.js      — React Hook Form + Zod (80 KB)
radix.js      — Radix UI primitives (116 KB)
index.js      — App code (570 KB)
index.css     — Tailwind styles (38 KB)
```

Total: ~1.5 MB uncompressed, ~530 KB gzipped.

---

## 9. Deployment

| Service | What | URL |
|---------|------|-----|
| **Vercel** | React frontend (static SPA) | https://aot-sms.vercel.app |
| **Render** | Java backend (Docker/Tomcat) | https://aot-sms-backend.onrender.com |
| **Aiven** | MySQL 8.0 database | mysql-3b81f602-aot-sms.h.aivencloud.com:26498 |

### Environment Variables (Render)

```
DB_HOST=mysql-3b81f602-aot-sms.h.aivencloud.com
DB_PORT=26498
DB_NAME=defaultdb
DB_USER=avnadmin
DB_PASS=***
DB_SSL=true
```

### Environment Variables (Vercel)

```
VITE_API_BASE_URL=https://aot-sms-backend.onrender.com
```

---

## 10. Challenges Faced & Solutions

| Challenge | Solution |
|-----------|----------|
| JWT without library | Implemented HMAC-SHA256 manually using `javax.crypto.Mac` |
| Cross-origin cookies | SameSite=None + Secure + CORS filter with origin whitelist |
| 60 sequential API calls (slow) | Replaced with single batch endpoints (fullsheet, batch grades) |
| File uploads lost on Render redeploy | Use `/tmp` with graceful 404 handling; noted S3 as production fix |
| TanStack Query `useQueries` causing subscription leaks | Replaced with single `useQuery` + sequential loop |
| Attendance showing 0 after cloud deploy | Student IDs differed between local and Aiven; re-seeded with correct IDs |
| Browser tab showing generic icon | Added custom SVG favicon |
| CSV export 404 in production | Replaced `window.open` with `fetch` + blob download (credentials needed) |

---

## 11. Possible Evaluator Questions & Answers

**Q1: Why Java Servlets instead of Spring Boot?**
A: Instructor requirement to demonstrate understanding of HTTP protocol, request/response lifecycle, and filter chains without framework abstraction.

**Q2: Why no ORM (Hibernate/JPA)?**
A: Instructor requirement. Pure JDBC demonstrates SQL proficiency, connection management, prepared statements, and transaction handling.

**Q3: How does your JWT implementation work?**
A: We create a JSON header + payload, Base64URL-encode both, then compute HMAC-SHA256 signature using a secret key. The token is stored in an httpOnly cookie. On each request, JWTFilter verifies the signature and checks expiry.

**Q4: How do you prevent SQL injection?**
A: All queries use PreparedStatement with parameterized placeholders (?). No string concatenation of user input into SQL.

**Q5: What happens if a teacher marks attendance for a date that already has records?**
A: The INSERT uses ON DUPLICATE KEY UPDATE — it overwrites the existing status. The unique key is (student_id, subject_id, attendance_date).

**Q6: How is Best-2-of-4 calculated?**
A: Sort all 4 CA scores descending, take top 2, sum them (max 40), then scale to 25: (sum/40)×25.

**Q7: How do you handle the 75% attendance rule?**
A: Formula: classes_needed = ceil((0.75 × held - present) / 0.25). Students below 75% are flagged with red badges and sorted to top.

**Q8: What's the difference between official attendance and student self-record?**
A: Official = teacher-marked in `attendance` table (affects academic standing). Self-record = student's personal log in `schedule_attendance` table (for dispute evidence only).

**Q9: How does the full sheet export match the official AOT format?**
A: The CSV has the exact same structure: title rows, column headers (Subject Held/Present/%), theory total, practical total, overall, grouped by Regular/Transfer/Lateral students.

**Q10: How do you handle file uploads?**
A: Multipart form data → UUID-renamed file → stored on disk → path saved in DB. Backend uses `@MultipartConfig` annotation.

**Q11: What's your database normalization level?**
A: 3NF. Departments, subjects, students, teachers are separate entities. Junction tables (teacher_subject_mapping) handle many-to-many. No redundant data.

**Q12: How does role-based access work?**
A: JWT contains the role claim. JWTFilter extracts it and sets `req.setAttribute("auth.role", role)`. Each servlet checks this before processing. Frontend has RouteGuard component.

**Q13: Why TanStack Query instead of useEffect + useState?**
A: Automatic caching, background refetch, loading/error states, query invalidation on mutations, no stale data issues, deduplication of concurrent requests.

**Q14: How do you handle CORS in production?**
A: Dedicated CORSFilter registered in web.xml before JWTFilter. Echoes the requesting origin if it's in the whitelist. OPTIONS preflight returns 200 immediately.

**Q15: What's the SGPA calculation?**
A: SGPA = Σ(Credit × GradePoint) / ΣCredits. Computed in MAKAUTCalculator.recalculateSGPA() after every marks save.

**Q16: How many API endpoints does the system have?**
A: 18 servlet classes handling ~45 distinct endpoints (GET/POST/PUT/DELETE variations).

**Q17: How do you handle concurrent attendance marking?**
A: The unique key constraint + ON DUPLICATE KEY UPDATE ensures only one record per student per subject per date. Last write wins.

**Q18: What security measures are in place?**
A: BCrypt passwords, JWT with HMAC-SHA256, httpOnly cookies, CORS whitelist, prepared statements (SQL injection prevention), role-based authorization, 3-attempt lockout.

**Q19: How is the frontend deployed?**
A: Vite builds static files → deployed to Vercel. SPA routing handled by vercel.json rewrite rule. API calls go to Render backend via VITE_API_BASE_URL env var.

**Q20: What would you improve if you had more time?**
A: Connection pooling (HikariCP), cloud file storage (S3), WebSocket for real-time notifications, PWA for offline access, automated testing, email notifications for below-75% alerts.

---

## 12. Demo Script (5 minutes)

### Setup
- Open https://aot-sms.vercel.app in browser
- Have credentials ready (see below)

### Minute 1: Admin Overview (admin / Admin@AOT2026)
1. Login as Admin → Show dashboard with real stats (60 students, charts)
2. Go to Students → Show 60 real students, search "Rituraj", filter by type
3. Go to Attendance → Show full sheet with color-coded percentages

### Minute 2: Teacher Workflow (DKM / Teacher@123)
1. Login as Teacher DKM
2. Mark Attendance → Select PCC-CS404, today → Mark a few students → Save
3. Show Attendance Records tab → Phase 1 data with Safe/At Risk/Detained badges
4. Show Full Sheet view → Sticky columns, horizontal scroll
5. Export tab → Download Official CSV

### Minute 3: Student Experience (24CSE041 / Student@123)
1. Login as Student (Rituraj Mukhopadhyay)
2. My Attendance → Show 8 subjects with real percentages (70%, 50%, 80%, etc.)
3. Show "Need X more classes" counter
4. Schedule → Show timetable, mark today's class as Attended
5. Classroom → View a PDF inline, show Discussion thread

### Minute 4: Marks & Results
1. Switch to Admin → Marks → Select PCC-CS401
2. Enter CA marks for one student → Show auto Best-2-of-4 calculation
3. Show Grade badge updating in real-time
4. Switch to Student → My Marks → Show SGPA

### Minute 5: Special Features
1. Show CSV export opening in Excel (official AOT format)
2. Show mobile responsive sidebar (resize browser)
3. Show the dispute system (student raises, teacher resolves)
4. Mention: Real data from official attendance PDF, 6700+ records, 12 teachers, 60 students

### Credentials Quick Reference

| Role | ID | Password |
|------|-----|----------|
| Admin | admin | Admin@AOT2026 |
| Teacher | DKM | Teacher@123 |
| Student | 24CSE041 | Student@123 |

---

*Generated for AOT-SMS v1.0 — Academy of Technology, Adisaptagram*
