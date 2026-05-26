# AOT STUDENT MANAGEMENT SYSTEM — COMPLETE IMPLEMENTATION PRD

**Academy of Technology | MAKAUT Affiliated | Adisaptagram, West Bengal**

**Version:** 3.0 (Hybrid Stack) | **Date:** May 2026
**Stack:** React 19 + TypeScript (Frontend) · Java Servlets + pure JDBC (Backend) · MySQL (Database)

---

## TABLE OF CONTENTS

1. Project Summary
2. Repo Setup
3. Full Project Folder Structure
4. Database Design (MySQL) — *unchanged*
5. Backend — Java Architecture
6. Backend — All Servlet APIs
7. Backend — JDBC DAO Layer
8. Backend — MAKAUT Business Logic — *unchanged*
9. Frontend — Design System (Tailwind v4 + shadcn/ui)
10. Frontend — Animation System (Framer Motion)
11. Frontend — All Pages (React)
12. Frontend — Reusable Components
13. Frontend — API Integration (Axios + TanStack Query)
14. Frontend — MAKAUT Logic in TypeScript — *mirrors backend*
15. AI-Assisted Development with Kiro
16. Deployment & Running Locally
17. AI Agent Build Order
18. Full Quality Checklist

---

# SECTION 1 — PROJECT SUMMARY

## 1.1 What We Are Building
A complete college ERP system for Academy of Technology (AOT), affiliated to MAKAUT, West Bengal. Students, teachers, attendance, marks, SGPA/CGPA, fees, notices — built around MAKAUT's official rules. Three roles, role-based access, JWT cookie sessions, MAKAUT auto-calculations.

## 1.2 Three Roles
| Role | Who | What They Can Do |
|------|-----|-----------------|
| Admin | HOD / Principal / Office Staff | Full system control |
| Teacher | Subject faculty | Own subject attendance + marks |
| Student | Regular + Lateral entry | View-only own data |

## 1.3 MAKAUT-Specific Rules Built In
- Paper codes: PCC-CS401, PCC-CS402, PCC-CS403, PCC-CS404, BSC-401, MC-401, PCC-CS492, PCC-CS494, EET, ABP
- Marks: ESE (70) + Best 2 of 4 CTs scaled to /25 + Attendance marks (0–5) = 100
- Grades: O/E/A/B/C/D/F with exact percentage bands
- SGPA = Σ(Credit × GradePoint) / TotalCredits
- CGPA = average of all SGPAs
- Percentage = (CGPA − 0.75) × 10
- 75% minimum attendance rule
- Regular roll: 24CSE001 | Lateral roll: L204
- Training subjects (EET, ABP) tracked separately

## 1.4 Full Tech Stack

### ⚠️ Backend Constraint
**Java + pure JDBC is mandatory (instructor requirement).** No Spring Data JPA, no Hibernate, no any ORM. The backend uses raw `Connection` / `PreparedStatement` / `ResultSet` throughout. JWT is implemented manually with `javax.crypto.Mac` and `java.util.Base64` — no external JWT library.

### Frontend
| Concern | Choice | Version |
|---------|--------|---------|
| Framework         | React (strict mode)            | 19.x   |
| Language          | TypeScript                     | 5.7.x  |
| Build tool        | Vite                           | 6.x    |
| Routing           | React Router                   | 7.x    |
| Styling           | Tailwind CSS + shadcn/ui       | 3.4.x  |
| Animations        | Framer Motion                  | 11.x   |
| Charts            | Recharts                       | 2.x    |
| Icons             | lucide-react                   | latest |
| Server state      | TanStack Query                 | 5.x    |
| Tables            | TanStack Table                 | 8.x    |
| Forms             | React Hook Form + Zod          | 7 + 3  |
| Auth state        | Zustand                        | 5.x    |
| HTTP client       | Axios (`withCredentials: true`)| 1.7.x  |
| Toast             | Sonner                         | 1.7.x  |
| Font              | Inter (Google Fonts)           | —      |

### Backend (no Spring, no ORM)
| Concern | Choice | Version |
|---------|--------|---------|
| Language          | Java                           | 17     |
| Web layer         | Jakarta Servlets (`@WebServlet`) | 6.0  |
| App server        | Apache Tomcat                  | 10.1   |
| Database          | MySQL                          | 8.0    |
| Database access   | **Pure JDBC** — `PreparedStatement`, `ResultSet` | — |
| JSON              | Gson                           | 2.10.1 |
| Password hashing  | BCrypt (jbcrypt)               | 0.4    |
| CSV export        | Apache Commons CSV             | 1.10.0 |
| JWT               | **Manual** — `javax.crypto.Mac` + `java.util.Base64` (no library) | — |
| Build             | Maven                          | 3.9+   |

---

# SECTION 2 — REPO SETUP

```bash
# ── Project root ──
mkdir AOT-SMS && cd AOT-SMS

# ── Backend (Maven webapp) ──
mvn archetype:generate \
  -DgroupId=com.aot.sms \
  -DartifactId=AOT-SMS \
  -DarchetypeArtifactId=maven-archetype-webapp \
  -DinteractiveMode=false

# ── Frontend (Vite + React + TypeScript) ──
npm create vite@latest frontend-app -- --template react-ts
cd frontend-app
npm install \
  react-router-dom@7 @tanstack/react-query@5 @tanstack/react-table@8 \
  zustand@5 framer-motion@11 recharts@2 \
  react-hook-form@7 zod@3 @hookform/resolvers@3 \
  axios@1.7 sonner@1.7 lucide-react clsx tailwind-merge \
  class-variance-authority \
  @radix-ui/react-avatar @radix-ui/react-dialog @radix-ui/react-dropdown-menu \
  @radix-ui/react-label @radix-ui/react-progress @radix-ui/react-select \
  @radix-ui/react-separator @radix-ui/react-slot @radix-ui/react-tabs

npm install -D tailwindcss@3 postcss autoprefixer tailwindcss-animate \
              @types/node @vitejs/plugin-react

# ── Tailwind init (creates tailwind.config.js + postcss.config.js) ──
npx tailwindcss init -p

# ── shadcn/ui init (interactive — answers: TypeScript yes, Tailwind v3 yes,
#    src/components alias, etc.) ──
npx shadcn@latest init

# ── shadcn components used by the app ──
npx shadcn@latest add button input label card dialog sheet select \
                       table tabs avatar progress badge separator \
                       dropdown-menu textarea
```

---

# SECTION 3 — FULL PROJECT FOLDER STRUCTURE

```
AOT-SMS/
│
├── pom.xml                                  ← Maven (Servlets + JDBC + Gson + jbcrypt + Commons CSV)
│
├── frontend-app/                            ← React + Vite (UI)
│   ├── package.json
│   ├── vite.config.ts                       ← /api proxy → http://localhost:8080/AOT-SMS/api
│   ├── tailwind.config.ts                   ← design tokens (orange #F97316, bg #F5F0EB)
│   ├── tsconfig.app.json   tsconfig.node.json
│   ├── index.html
│   └── src/
│       ├── main.tsx                         ← QueryClientProvider + RouterProvider + Toaster
│       ├── router.tsx                       ← role-aware routes
│       ├── index.css                        ← Tailwind base imports + design tokens
│       │
│       ├── components/
│       │   ├── ui/                          ← shadcn primitives
│       │   │   button.tsx  card.tsx  dialog.tsx  input.tsx  label.tsx
│       │   │   select.tsx  table.tsx  tabs.tsx  avatar.tsx  progress.tsx
│       │   │   badge.tsx   sheet.tsx  separator.tsx  textarea.tsx
│       │   │   dropdown-menu.tsx
│       │   └── shared/                      ← app components
│       │       Sidebar.tsx  Header.tsx  AppShell.tsx
│       │       StatCard.tsx  RouteGuard.tsx  BootstrapAuthGate.tsx
│       │
│       ├── hooks/
│       │   useAuth.ts        useStudents.ts   useTeachers.ts
│       │   useDepartments.ts useAttendance.ts useMarks.ts
│       │   useGrades.ts      useFees.ts       useNotices.ts
│       │
│       ├── lib/
│       │   axios.ts          ← withCredentials: true, /api baseURL, 401 redirect
│       │   utils.ts          ← cn(), initials(), formatINR()
│       │   makaut.ts         ← TS port of MAKAUTCalculator.java
│       │
│       ├── store/
│       │   authStore.ts      ← Zustand: { me, isReady, setMe, clear }
│       │
│       ├── types/
│       │   api.ts            ← Student, Teacher, Subject, Marks, Grade, Fee, Notice, ApiResponse<T>
│       │
│       └── pages/
│           Login.tsx
│           admin/  Dashboard  Students  Teachers  AttendanceView  Marks
│                   Results    Fees      Notices    Settings
│           teacher/ Dashboard MarkAttendance EnterMarks MyStudents MyNotices
│           student/ Dashboard MyAttendance   MyMarks    MyFees     Notices
│
└── src/                                     ← BACKEND (pure JDBC)
    └── main/
        ├── java/com/aot/sms/
        │   ├── servlet/                     ← @WebServlet — all use HttpUtil + ApiResponse
        │   │   AuthServlet.java             /api/auth/login | /logout | /me  (sets/clears JWT cookie)
        │   │   HealthServlet.java           /api/health
        │   │   DepartmentServlet.java       /api/departments
        │   │   SubjectServlet.java          /api/subjects
        │   │   StudentServlet.java          /api/students     (CRUD)
        │   │   TeacherServlet.java          /api/teachers     (CRUD + mappings)
        │   │   AttendanceServlet.java       /api/attendance   (bulk upsert + summary + roster)
        │   │   MarksServlet.java            /api/marks        (auto best2 + grade + SGPA)
        │   │   GradeServlet.java            /api/grades       (full result bundle)
        │   │   FeeServlet.java              /api/fees         (CRUD + payment)
        │   │   NoticeServlet.java           /api/notices      (CRUD + pin)
        │   │   ReportServlet.java           /api/reports      (CSV exports)
        │   │
        │   ├── filter/
        │   │   JWTFilter.java               ← @WebFilter("/api/*") — validates JWT cookie
        │   │
        │   ├── dao/                         ← PURE JDBC
        │   │   DBConnection.java
        │   │   AdminDAO.java     StudentDAO.java   TeacherDAO.java
        │   │   SubjectDAO.java   AttendanceDAO.java MarksDAO.java
        │   │   GradeDAO.java     FeeDAO.java        NoticeDAO.java
        │   │
        │   ├── model/                       ← POJOs (no annotations, no ORM)
        │   │   Student.java  Teacher.java  Subject.java
        │   │   Attendance.java Marks.java  Grade.java
        │   │   Fee.java       Notice.java
        │   │
        │   └── util/
        │       JWTUtil.java                 ← manual HMAC-SHA256, no external library
        │       HttpUtil.java                ← CORS + JSON helpers + cookie utils
        │       ApiResponse.java             ← {success, data, message} envelope
        │       AuthUtil.java                ← BCrypt + login attempts/sessions
        │       JSONUtil.java                ← Gson wrapper
        │       MAKAUTCalculator.java        ← Best2, SGPA, CGPA, grade bands
        │       CSVExporter.java             ← Apache Commons CSV writer
        │       GenerateBCrypt.java          ← CLI helper to seed admin password
        │
        └── webapp/
            ├── index.html (optional landing)
            └── WEB-INF/
                web.xml                      ← session config + 404 → SPA index
```


---

# SECTION 4 — DATABASE DESIGN (MySQL) — *unchanged*

The MySQL schema from v1.0 is preserved unchanged. All 14 tables, both views, and all seed data remain identical. See `database/schema.sql` for the full DDL.

**Tables:** `departments`, `subjects`, `students`, `teachers`, `teacher_subject_mapping`, `attendance`, `marks`, `grades`, `sgpa_cgpa`, `fees`, `notices`, `admin_users`, `login_sessions`, `login_attempts`.

**Views:** `v_attendance_summary` (per-subject summary), `v_below_75` (defaulters list).

**Default admin:** user_id `admin`, password `Admin@AOT2026` (BCrypt-hashed via `GenerateBCrypt.java`).

---

# SECTION 5 — BACKEND: JAVA ARCHITECTURE

## 5.1 pom.xml Dependencies (no Spring, no ORM, no JWT lib)

```xml
<dependencies>
  <!-- Servlet API (provided by Tomcat 10.1) -->
  <dependency>
    <groupId>jakarta.servlet</groupId>
    <artifactId>jakarta.servlet-api</artifactId>
    <version>6.0.0</version>
    <scope>provided</scope>
  </dependency>

  <!-- MySQL JDBC -->
  <dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <version>8.0.33</version>
  </dependency>

  <!-- Gson (JSON) -->
  <dependency>
    <groupId>com.google.code.gson</groupId>
    <artifactId>gson</artifactId>
    <version>2.10.1</version>
  </dependency>

  <!-- BCrypt (jbcrypt) -->
  <dependency>
    <groupId>org.mindrot</groupId>
    <artifactId>jbcrypt</artifactId>
    <version>0.4</version>
  </dependency>

  <!-- Apache Commons CSV -->
  <dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-csv</artifactId>
    <version>1.10.0</version>
  </dependency>
</dependencies>
```

JWT signing uses only `javax.crypto.Mac` and `java.util.Base64` from the JDK — no library.

## 5.2 DBConnection.java (pure JDBC)

```java
package com.aot.sms.dao;
import java.sql.*;

public class DBConnection {
    private static final String URL  = "jdbc:mysql://localhost:3306/aot_sms" +
                                       "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Kolkata";
    private static final String USER = "root";
    private static final String PWD  = "@ritu2006";   // override via env in prod

    static {
        try { Class.forName("com.mysql.cj.jdbc.Driver"); }
        catch (ClassNotFoundException e) { throw new RuntimeException("MySQL driver missing", e); }
    }
    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PWD);
    }
}
```

## 5.3 Standard servlet pattern (JWT-protected, envelope responses)

Every protected servlet:
1. Calls `HttpUtil.applyCors(req, resp)` (or `handlePreflight` for OPTIONS).
2. Reads role/userId/uid from request attributes set by `JWTFilter`.
3. Returns `{ success, data, message }` via `HttpUtil.writeOk` / `writeError`.

```java
@WebServlet("/api/students")
public class StudentServlet extends HttpServlet {
    @Override protected void doOptions(HttpServletRequest req, HttpServletResponse resp) {
        HttpUtil.handlePreflight(req, resp);
    }
    @Override protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        // ... DAO call ...
        HttpUtil.writeOk(resp, list);
    }
    @Override protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpUtil.applyCors(req, resp);
        if (!"admin".equals(req.getAttribute("auth.role"))) {
            HttpUtil.writeError(resp, 403, "Admin role required."); return;
        }
        // ... DAO insert ...
    }
}
```

## 5.4 JWTFilter — request-level auth

```java
@WebFilter(filterName = "JWTFilter", urlPatterns = {"/api/*"})
public class JWTFilter implements Filter {
    private static final Set<String> PUBLIC = Set.of(
        "/api/auth/login", "/api/auth/logout", "/api/health");

    @Override public void doFilter(ServletRequest req, ServletResponse resp, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest  http = (HttpServletRequest) req;
        HttpServletResponse out  = (HttpServletResponse) resp;
        if ("OPTIONS".equalsIgnoreCase(http.getMethod())) {
            HttpUtil.applyCors(http, out); out.setStatus(200); return;
        }
        if (PUBLIC.contains(http.getServletPath())) { chain.doFilter(req, resp); return; }

        String token = HttpUtil.readCookie(http, JWTUtil.COOKIE_NAME);
        Map<String, String> claims = JWTUtil.validate(token);
        if (claims == null) {
            HttpUtil.applyCors(http, out);
            HttpUtil.writeError(out, 401, "Authentication required.");
            return;
        }
        http.setAttribute("auth.userId", claims.get("sub"));
        http.setAttribute("auth.role",   claims.get("role"));
        http.setAttribute("auth.name",   claims.get("name"));
        http.setAttribute("auth.uid",    Integer.parseInt(claims.getOrDefault("uid", "-1")));
        chain.doFilter(req, resp);
    }
}
```

## 5.5 JWTUtil — manual HMAC-SHA256 (no library)

The token format is the standard `header.payload.signature` (HS256). Header and payload are JSON, base64url-encoded; signature is `HMAC_SHA256(secret, header + "." + payload)` base64url-encoded. The full implementation lives in `util/JWTUtil.java` and uses only:

- `javax.crypto.Mac` for HMAC
- `javax.crypto.spec.SecretKeySpec` for the key
- `java.util.Base64.getUrlEncoder()` / `getUrlDecoder()`

Constant-time comparison guards against timing attacks. Default TTL is 4 hours; the secret is read from `APP_JWT_SECRET` env var in production.


---

# SECTION 6 — BACKEND: ALL SERVLET APIs

All endpoints under `/api/`. Every response uses `{ success: bool, data: T, message: string }`. Every protected route requires the `aot_sms_token` httpOnly cookie set by `AuthServlet`.

## 6.1 Endpoint Table

| Method | URL | Role | Description |
|--------|-----|------|-------------|
| POST | `/api/auth/login`  | public | Body `{userId, password, role}` — sets JWT cookie + returns `{userId, role, name, entityId}` |
| POST | `/api/auth/logout` | public | Clears JWT cookie |
| GET  | `/api/auth/me`     | any auth | Returns current user from JWT |
| GET  | `/api/health`      | public | Service health |
| GET  | `/api/departments` | any auth | List of departments (for dropdowns) |
| GET  | `/api/subjects?deptId=&sem=` | any auth | Subjects for dept+semester |
| GET  | `/api/subjects?teacherId=` | any auth | Subjects assigned to teacher |
| GET  | `/api/students[?deptId=&sem=&section=&type=&search=]` | any auth | Filtered list |
| GET  | `/api/students?rollNo=24CSE001` | any auth | Single by roll |
| POST | `/api/students` | admin | Create (default password Student@123) |
| PUT  | `/api/students` | admin | Update (body has studentId) |
| DELETE | `/api/students?id=42` | admin | Soft delete |
| GET  | `/api/teachers[?deptId=]` | any auth | List |
| GET  | `/api/teachers?id=5&mappings=true` | any auth | Subject mappings |
| POST/PUT/DELETE | `/api/teachers` | admin | CRUD (Teacher@123 default) |
| POST | `/api/attendance` | teacher (today only) / admin (any date) | Bulk upsert |
| GET  | `/api/attendance?studentId=X` | any auth | Per-subject summary for student |
| GET  | `/api/attendance?subjectId=X&date=Y` | teacher / admin | Class roster + status |
| POST | `/api/marks` | teacher / admin | Upsert CT/ESE — auto best2 + grade + SGPA |
| GET  | `/api/marks?studentId=&sem=` | any auth | Marks for a student in semester |
| GET  | `/api/marks?subjectId=&sem=` | teacher / admin | All students for subject |
| GET  | `/api/grades?studentId=X` | any auth | Bundle: grades + sgpaBySemester + cgpa + percentage + backlogCount |
| GET  | `/api/grades?studentId=X&sem=4` | any auth | Semester slice |
| GET  | `/api/grades?studentId=X&backlogs=1` | any auth | Backlog list |
| GET  | `/api/fees?studentId=X` | any auth | Fee history |
| GET  | `/api/fees?pending=1[&deptId=&sem=]` | admin | Defaulters |
| POST | `/api/fees` | admin | Create fee record |
| PUT  | `/api/fees` | admin | Record payment (`{feeId, amount, mode, receiptNo}`) |
| GET  | `/api/notices[?deptId=&all=1]` | any auth | Visible notices |
| POST | `/api/notices` | admin / teacher | Post notice |
| PUT  | `/api/notices` | admin | Toggle pin |
| DELETE | `/api/notices?id=X` | admin | Delete notice |
| GET  | `/api/reports?type=attendance|marks|fees[&deptId=&sem=]` | admin / teacher | CSV download |

## 6.2 Auth flow — login

```
Browser ──POST /api/auth/login {userId, password, role}──▶ AuthServlet
        ◀─Set-Cookie: aot_sms_token=<JWT>; HttpOnly; Path=/; Max-Age=14400
          { success: true, data: {userId, role, name, entityId}, message: "Login successful" }

Browser ──GET /api/students  Cookie: aot_sms_token=<JWT>──▶ JWTFilter validates
        ──────────────────────────────────────────────────▶ StudentServlet (auth.role read from claims)
        ◀── { success: true, data: [...] }
```

## 6.3 AttendanceServlet — same-day enforcement

```java
String role = (String) req.getAttribute("auth.role");
if ("teacher".equals(role)) {
    String today = LocalDate.now().toString();
    if (!today.equals(date)) {
        HttpUtil.writeError(resp, 403,
            "Teachers can only mark attendance for today (" + today + ").");
        return;
    }
}
// Bulk upsert via AttendanceDAO.markBulk(records);
```

## 6.4 MarksServlet — auto-calc pipeline

When marks are saved, the servlet runs (in order, all in raw JDBC):

1. `MarksDAO.upsertCT(...)` — insert/update CT1–CT4
2. `MarksDAO.updateESE(...)` — if `eseMarks` provided
3. `MarksDAO.calculateBestTwo(...)` — top-2 average scaled to /25
4. `attendance_marks` set (if provided) and `total_marks = best_two_marks + ese_marks + attendance_marks`
5. Compute letter grade via `MAKAUTCalculator.calcGrade(total)` and upsert `grades` row
6. `MAKAUTCalculator.recalculateSGPA(conn, studentId, semester)` — updates `sgpa_cgpa.semN_sgpa`, `cgpa`, `percentage`


---

# SECTION 7 — DAO LAYER (PURE JDBC)

100% raw JDBC — no ORM, no Hibernate, no Spring Data. Each DAO opens a Connection via `DBConnection.getConnection()` and uses `PreparedStatement` with `?` placeholders for all parameters. Try-with-resources closes connections automatically.

## 7.1 StudentDAO — sample method

```java
public List<Student> getAllStudents(Integer deptId, Integer semester, String section,
                                    String studentType, String search) throws SQLException {
    StringBuilder sql = new StringBuilder(
        "SELECT s.*, d.dept_code FROM students s " +
        "JOIN departments d ON s.dept_id = d.dept_id WHERE s.is_active = TRUE");
    List<Object> params = new ArrayList<>();
    if (deptId != null)      { sql.append(" AND s.dept_id = ?");          params.add(deptId); }
    if (semester != null)    { sql.append(" AND s.current_semester = ?"); params.add(semester); }
    if (section != null)     { sql.append(" AND s.section = ?");          params.add(section); }
    if (studentType != null) { sql.append(" AND s.student_type = ?");     params.add(studentType); }
    if (search != null) {
        sql.append(" AND (s.roll_no LIKE ? OR s.student_name LIKE ?)");
        String like = "%" + search + "%"; params.add(like); params.add(like);
    }
    sql.append(" ORDER BY s.roll_no");

    List<Student> list = new ArrayList<>();
    try (Connection conn = DBConnection.getConnection();
         PreparedStatement ps = conn.prepareStatement(sql.toString())) {
        for (int i = 0; i < params.size(); i++) ps.setObject(i + 1, params.get(i));
        try (ResultSet rs = ps.executeQuery()) {
            while (rs.next()) list.add(mapRow(rs));
        }
    }
    return list;
}
```

## 7.2 AttendanceDAO — bulk upsert

```java
public int[] markBulk(List<Attendance> records) throws SQLException {
    String sql = "INSERT INTO attendance (student_id, subject_id, attendance_date, status, marked_by) " +
                 "VALUES (?,?,?,?,?) " +
                 "ON DUPLICATE KEY UPDATE status=VALUES(status), marked_by=VALUES(marked_by)";
    try (Connection conn = DBConnection.getConnection();
         PreparedStatement ps = conn.prepareStatement(sql)) {
        conn.setAutoCommit(false);
        for (Attendance a : records) {
            ps.setInt(1, a.getStudentId());  ps.setInt(2, a.getSubjectId());
            ps.setString(3, a.getAttendanceDate());
            ps.setString(4, a.getStatus());  ps.setInt(5, a.getMarkedBy());
            ps.addBatch();
        }
        int[] r = ps.executeBatch();
        conn.commit();
        return r;
    }
}
```

## 7.3 MarksDAO — best-two-of-four + scale to /25

```java
public boolean calculateBestTwo(int studentId, int subjectId, int semester) throws SQLException {
    String sel = "SELECT ct1, ct2, ct3, ct4 FROM marks WHERE student_id=? AND subject_id=? AND semester=?";
    String upd = "UPDATE marks SET best_two_marks=? WHERE student_id=? AND subject_id=? AND semester=?";

    try (Connection c = DBConnection.getConnection();
         PreparedStatement ps = c.prepareStatement(sel)) {
        ps.setInt(1, studentId); ps.setInt(2, subjectId); ps.setInt(3, semester);
        try (ResultSet rs = ps.executeQuery()) {
            if (!rs.next()) return false;
            List<Double> scores = new ArrayList<>();
            for (String col : new String[]{"ct1","ct2","ct3","ct4"}) {
                double v = rs.getDouble(col);
                if (!rs.wasNull()) scores.add(v);
            }
            if (scores.size() < 2) return false;
            scores.sort((a, b) -> Double.compare(b, a));
            double bestTwo = ((scores.get(0) + scores.get(1)) / 40.0) * 25.0;  // raw 0..20 → /25

            try (PreparedStatement ps2 = c.prepareStatement(upd)) {
                ps2.setDouble(1, bestTwo); ps2.setInt(2, studentId);
                ps2.setInt(3, subjectId);  ps2.setInt(4, semester);
                return ps2.executeUpdate() > 0;
            }
        }
    }
}
```

(See `src/main/java/com/aot/sms/dao/*.java` for full source — every method is similarly hand-written JDBC. **No ORM anywhere.**)

---

# SECTION 8 — MAKAUT BUSINESS LOGIC — *unchanged*

All formulas from v1.0 are preserved without modification. The Java implementation lives in `util/MAKAUTCalculator.java`; an exact-mirror TypeScript port lives in `frontend-app/src/lib/makaut.ts` (Section 14).

| Calculation | Formula |
|-------------|---------|
| Best 2 of 4 CTs | Sort descending, average top 2, scale (0..20 → /25): `(top1 + top2)/40 × 25` |
| Attendance marks | ≥90→5, ≥80→4, ≥75→3, ≥65→2, ≥50→1, else 0 |
| Total | `best_two_marks + ese_marks + attendance_marks` |
| Grade | O ≥90, E ≥80, A ≥70, B ≥60, C ≥50, D ≥40, F <40 |
| Grade points | O=10 E=9 A=8 B=7 C=6 D=5 F=0 |
| SGPA | Σ(credit × point) / Σ(credit) |
| CGPA | Average of all non-zero SGPAs |
| Percentage | (CGPA − 0.75) × 10 |
| Classes needed for 75% | ⌈(0.75·held − present) / 0.25⌉ |


---

# SECTION 9 — FRONTEND DESIGN SYSTEM (Tailwind v3 + shadcn/ui)

The legacy `variables.css` design tokens are preserved verbatim, now declared as Tailwind theme extensions and CSS variables for shadcn/ui.

## 9.1 `tailwind.config.ts`

```ts
const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base':    '#F5F0EB',
        'bg-surface': '#FFFFFF',
        'bg-muted':   '#F3F4F6',
        orange: { 300: '#FED7AA', 400: '#FB923C', 500: '#F97316', 600: '#EA580C' },
        // shadcn tokens
        background: 'hsl(var(--background))', foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        // ... (full set in repo)
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius)-2px)', sm: 'calc(var(--radius)-4px)' },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #FF6B00 0%, #FFB800 100%)',
        'gradient-hero':  'linear-gradient(160deg, #FDF4EE 0%, #F5F0EB 60%, #EEF2FF 100%)',
      },
      boxShadow: { 'orange': '0 4px 20px rgba(249,115,22,0.30)' },
      keyframes: { shake: { /* ... */ } },
      animation:  { shake: 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both' },
    },
  },
  plugins: [animate],
};
```

## 9.2 `src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 33 25% 94%;     /* #F5F0EB */
    --foreground: 0 0% 10%;        /* #1A1A1A */
    --primary:    24 95% 53%;      /* #F97316 */
    --primary-foreground: 0 0% 100%;
    --accent:     28 100% 84%;     /* #FED7AA */
    --radius:     0.75rem;
    /* ... full token set ... */
  }
  body { @apply bg-background text-foreground; font-family: 'Inter', system-ui, sans-serif; }
}
```

## 9.3 shadcn/ui components used

`Button` `Card` `Input` `Label` `Dialog` `Sheet` `Select` `Table` `Tabs` `Avatar` `Badge` `Progress` `Separator` `Textarea` `DropdownMenu`. All are styled with the Tailwind tokens above, so design changes happen in one place (`tailwind.config.ts` + `index.css`).

---

# SECTION 10 — FRONTEND ANIMATION SYSTEM (Framer Motion)

## 10.1 Patterns and equivalents

| Old (Motion.js)     | New (Framer Motion) |
|---------------------|---------------------|
| `pageEnter`         | `<motion.div initial={{opacity:0, y:30}} animate={{opacity:1, y:0}} />` on the root |
| `initFadeUp`        | `whileInView={{opacity:1, y:0}} initial={{opacity:0, y:30}} viewport={{margin:'-50px'}}` |
| `initStagger`       | parent `transition={{ staggerChildren: 0.08 }}`, children variants |
| `initCounters`      | `useMotionValue` + `useTransform` + `motionAnimate(val, target)` |
| `initProgressBars`  | `<motion.div animate={{width: pct + '%'}}>` |
| `shake` (login error)| `useAnimationControls` + `controls.start({ x: [0,-10,10,...], transition: {duration:0.5} })` |
| `openModal/closeModal` | shadcn `<Dialog open onOpenChange>` — Framer Motion built-in |

## 10.2 StatCard counter animation

```tsx
const motionVal = useMotionValue(0);
const rounded   = useTransform(motionVal, (v) => Math.round(v));
useEffect(() => motionAnimate(motionVal, value, { duration: 0.9 }).stop, [value]);

return <motion.div>{rounded}</motion.div>;
```

## 10.3 Stagger row animation in Students table

```tsx
{rows.map((row, i) => (
  <motion.tr
    key={row.id}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.02, duration: 0.25 }}
    className="border-b hover:bg-muted/40"
  >
    {/* cells */}
  </motion.tr>
))}
```

## 10.4 Login shake on error

```tsx
const cardCtl = useAnimationControls();
async function onSubmit(values) {
  try { await login.mutateAsync({...values, role}); }
  catch (err) {
    cardCtl.start({ x: [0,-10,10,-10,10,-5,5,0], transition: { duration: 0.5 } });
  }
}
return <motion.div animate={cardCtl}>{/* card */}</motion.div>;
```


---

# SECTION 11 — FRONTEND PAGES (React + TSX)

Every page is a `.tsx` component under `src/pages/`. Each page below lists its key dependencies.

## 11.1 `Login.tsx`
- **shadcn:** `Button`, custom `<input>` (floating label)
- **Hook:** `useLogin()` mutation in `hooks/useAuth.ts`
- **Schema:**
  ```ts
  const loginSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    password: z.string().min(1, 'Password is required'),
  });
  ```
- **Animation:** `motion.div` page entry, `useAnimationControls` shake on error
- **Flow:** on submit → `api.post('/auth/login', {userId, password, role})` → backend sets httpOnly JWT cookie → store user in Zustand → `navigate(/${role}/dashboard)`

## 11.2 Admin pages

### `admin/Dashboard.tsx`
- **shadcn:** `Card`, `StatCard` (custom), Recharts `BarChart` + `PieChart`
- **Hooks:** `useStudents`, `useTeachers`
- **Charts:** weekly attendance bar (orange bars), department distribution donut
- **Animation:** stagger stat cards, `whileInView` fade-up on charts

### `admin/Students.tsx`
- **shadcn:** `Card`, `Dialog`, `Select`, `Input`, `Table`, `Badge`, `Avatar`, `Button`
- **Table:** `useReactTable` with `getCoreRowModel`, `getSortedRowModel`, `getFilteredRowModel`, `getPaginationRowModel`. 8 columns: roll, student (avatar+name+email), type (badge), dept, sem, sec, phone, actions
- **Hooks:** `useStudents(filters)`, `useCreateStudent`, `useUpdateStudent`, `useDeleteStudent`
- **Schema:** `studentSchema` with all PRD fields (Identity, Academic, Personal, Parent, Photo)
- **Modals:** Add/Edit `<StudentFormDialog>`, View `<StudentViewDialog>` (hydrates attendance+grades+fees), Delete confirm
- **Animation:** stagger row appear (i × 0.02s delay), counter on stat cards

### `admin/Teachers.tsx`
Same pattern as Students. View dialog hydrates `useTeacherMappings` to show subject assignments per row.

### `admin/AttendanceView.tsx`
- Filters: dept, sem, section, subject, date range
- TanStack Table; below-75% rows highlighted via `<tr className="bg-red-50">`
- Export CSV → `window.open('/api/reports?type=attendance&deptId=X&sem=Y')`

### `admin/Marks.tsx`
- Filters: dept, sem, subject
- Editable table: admin can override CT/ESE; "Declare Results" button locks via `is_result_declared`
- Grade badge re-renders live from `makaut.calcGrade`

### `admin/Results.tsx`
- Per-student summary: SGPA card per semester, CGPA donut, percentage display
- Backlog table with "Clear Backlog" action

### `admin/Fees.tsx`
- Table: total / paid / balance / status badge
- Record-payment Dialog: amount, mode (Cash/Online/DD/Cheque), receipt no, date

### `admin/Notices.tsx`
- Top form: title, body (Textarea), target dropdown, pin checkbox, expiry date
- Notice cards below; pinned first

### `admin/Settings.tsx`
- Change admin password form
- Academic year config
- Semester promotion controls

## 11.3 Teacher pages

### `teacher/Dashboard.tsx`
- 3 stat cards (My Students / Today Marked? / Pending Marks)
- Today's schedule list

### `teacher/MarkAttendance.tsx`
- Selectors: subject, section, date (locked to today), [Load Students]
- `<AttendanceToggle />` per student — P/A/L/ML pill group, orange fill on selection (`motion.button` whileTap scale)
- Bulk actions: All Present / All Absent
- Submit → `api.post('/attendance', { subjectId, date, entries: [...] })`

### `teacher/EnterMarks.tsx`
- Selectors: subject, semester, academic year, [Load Students]
- Editable rows; on every input change, `makaut.calcBestTwo` + `calcGrade` run client-side and the `<GradeBadge>` re-renders
- Att% read-only (fetched from backend), Att Marks auto via `makaut.calcAttMarks`
- [Save All] → batched POST to `/api/marks` per row

### `teacher/MyStudents.tsx`
Read-only roster of students in teacher's assigned sections.

### `teacher/MyNotices.tsx`
Post + manage notices for teacher's dept/section only.

## 11.4 Student pages (view-only)

### `student/Dashboard.tsx`
- 🟠 Orange alert banner if any subject below 75% — lists "need X more classes"
- 🔴 Red alert banner if backlog count > 0
- 4 stat cards: Overall Att% / Current SGPA / CGPA / Backlogs
- Top-3 subject attendance progress bars

### `student/MyAttendance.tsx`
Per-subject table with Held / Present / Absent / % / Status / Classes Needed; date-wise history accordion.

### `student/MyMarks.tsx`
Tab bar of semesters; per-semester table with CT1–4 / Best2 / ESE / Att / Total / Grade / Points / Credits. SGPA result box. Backlog (F-graded) red card.

### `student/MyFees.tsx`
Per-semester fee history with status badges. Payment timeline.

### `student/Notices.tsx`
Pinned-first notice list filtered by dept/section.

---

# SECTION 12 — REUSABLE COMPONENTS

| Component | Path | Purpose |
|-----------|------|---------|
| `<Sidebar />`         | `components/shared/Sidebar.tsx`       | Role-aware nav, fixed left, orange active rail (Framer Motion `layoutId`) |
| `<Header />`          | `components/shared/Header.tsx`        | Sticky top, search pill, notification bell |
| `<AppShell />`        | `components/shared/AppShell.tsx`      | Sidebar + Header + `<Outlet />` |
| `<RouteGuard roles>`  | `components/shared/RouteGuard.tsx`    | Reads Zustand auth; redirects to `/login` or correct dashboard |
| `<BootstrapAuthGate />`| `components/shared/BootstrapAuthGate.tsx` | Calls `/auth/me` once on mount |
| `<StatCard />`        | `components/shared/StatCard.tsx`      | Animated counter, 5 tone variants |
| `<GradeBadge />`      | inline (`makaut.GRADE_COLORS`)        | Color-coded letter grade chip |
| `<AttendanceToggle />`| inline in MarkAttendance              | P/A/L/ML pill group with motion.spring |
| `<DataTable<T>>`      | composed via TanStack Table per page  | Sortable + filterable + paginated |


---

# SECTION 13 — API INTEGRATION (Axios + TanStack Query)

## 13.1 `lib/axios.ts` — interceptor + cookie auth

```ts
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,    // ⚠️ required so the JWT cookie is sent on every call
  timeout: 15_000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    if (status === 401 && !location.pathname.endsWith('/login')) {
      import('@/store/authStore').then(({ useAuthStore }) => {
        useAuthStore.getState().clear();
        toast.error('Session expired. Please log in again.');
        setTimeout(() => { location.href = '/login'; }, 600);
      });
    } else if (status === 403) toast.error('Access denied.');
    else if (status >= 500)    toast.error(err.response?.data?.message || 'Server error');
    return Promise.reject(err);
  },
);
```

## 13.2 `vite.config.ts` proxy

```ts
proxy: {
  '/api': {
    target: 'http://localhost:8080',
    changeOrigin: true,
    rewrite: (p) => p.replace(/^\/api/, '/AOT-SMS/api'),
  },
},
```

## 13.3 Example hook — `hooks/useStudents.ts`

```ts
export function useStudents(filters: StudentFilters = {}) {
  return useQuery({
    queryKey: ['students', filters],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Student[]>>('/students', { params: filters });
      return res.data.data ?? [];
    },
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: StudentPayload) =>
      (await api.post<ApiResponse<Student>>('/students', payload)).data,
    onSuccess: (resp) => {
      toast.success(resp.message || 'Student created');
      qc.invalidateQueries({ queryKey: ['students'] });
    },
  });
}
```

## 13.4 Auth bootstrap

```ts
// hooks/useAuth.ts
export function useBootstrapAuth() {
  const setMe = useAuthStore((s) => s.setMe);
  const setReady = useAuthStore((s) => s.setReady);
  useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const r = await api.get<ApiResponse<AuthMe>>('/auth/me');
        return r.data.success ? r.data.data : null;
      } catch { return null; }
    },
    onSuccess: (me) => { setMe(me); setReady(true); },
  });
}
```

---

# SECTION 14 — MAKAUT LOGIC IN TYPESCRIPT — *unchanged*

`frontend-app/src/lib/makaut.ts` mirrors `MAKAUTCalculator.java` exactly — same algorithms, same rounding rules. This lets pages like `EnterMarks.tsx` show grade badges live as the teacher types, while the server still recomputes authoritative values on save.

```ts
export function calcBestTwo(ct1?, ct2?, ct3?, ct4?): number {
  const arr = [n(ct1), n(ct2), n(ct3), n(ct4)].sort((a,b) => b-a);
  return Math.round(((arr[0] + arr[1]) / 2) * 100) / 100;
}
export function scaleBestTwoTo25(raw: number) { return Math.round(raw * 1.25 * 100) / 100; }

export function calcAttMarks(pct: number) {
  if (pct >= 90) return 5; if (pct >= 80) return 4; if (pct >= 75) return 3;
  if (pct >= 65) return 2; if (pct >= 50) return 1; return 0;
}

export function calcGrade(total: number): Grade {
  if (total >= 90) return 'O'; if (total >= 80) return 'E';
  if (total >= 70) return 'A'; if (total >= 60) return 'B';
  if (total >= 50) return 'C'; if (total >= 40) return 'D'; return 'F';
}

export function gradePoint(g: Grade) {
  return ({ O:10, E:9, A:8, B:7, C:6, D:5, F:0 } as const)[g];
}

export function calcSGPA(subjects: { credits: number; gradePoint: number }[]) {
  let credit = 0, weighted = 0;
  for (const s of subjects) { credit += s.credits; weighted += s.credits * s.gradePoint; }
  return credit === 0 ? 0 : Math.round((weighted / credit) * 100) / 100;
}

export function calcCGPA(sgpas: number[]) {
  const v = sgpas.filter(x => x > 0);
  return v.length === 0 ? 0 : Math.round((v.reduce((a,b)=>a+b,0)/v.length)*100)/100;
}

export function cgpaToPercentage(cgpa: number) {
  return Math.round((cgpa - 0.75) * 10 * 100) / 100;
}

export function classesNeededFor75(held: number, present: number) {
  if (held <= 0) return 0;
  if ((present * 100 / held) >= 75) return 0;
  return Math.ceil((0.75 * held - present) / 0.25);
}
```


---

# SECTION 15 — AI-ASSISTED DEVELOPMENT WITH KIRO

This project was built with [Kiro](https://kiro.ai), an AI-assisted IDE that drives the build end-to-end. Instead of manual day-by-day pacing, Kiro executes phases continuously without checkpoints between them, only pausing on actual build errors.

**Build phases** (executed straight-through):
1. **Scaffold** — Vite + React + TypeScript + Tailwind + shadcn/ui in `frontend-app/`; Maven webapp project in `src/`
2. **Auth** — `JWTUtil` + `JWTFilter` + `AuthServlet`; `authStore` + `useLogin` + `useBootstrapAuth` + `RouteGuard`
3. **Layout** — `Sidebar`, `Header`, `AppShell`; role-aware nav
4. **Features** — Admin Students/Teachers, Teacher MarkAttendance/EnterMarks, Student Dashboard, all in one continuous run
5. **Polish** — Framer Motion animations, mobile breakpoints, empty states, loading states
6. **Verify** — `mvn package` clean, `npm run build` clean, end-to-end smoke test

**Why this approach works:**
- Kiro's tool calls run in batch with full type-safety; build feedback is immediate
- TypeScript strict + Maven `validate` ddl mode catches integration errors before runtime
- shadcn/ui components are copied (not installed), so no version drift
- Every API endpoint has a matching React Query hook + Zod schema, type-safe end-to-end

---

# SECTION 16 — DEPLOYMENT & RUNNING LOCALLY

## 16.1 Database setup (one-time)

```bash
mysql -u root -p
CREATE DATABASE aot_sms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aot_sms;
SOURCE C:/coding/AOT-SMS/database/schema.sql;
SOURCE C:/coding/AOT-SMS/database/seed_data.sql;
```

## 16.2 Backend — build & deploy WAR

```bash
cd C:\coding\AOT-SMS
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
& "C:\maven\bin\mvn.cmd" clean package
# → target/AOT-SMS.war
copy target\AOT-SMS.war C:\path\to\tomcat\webapps\
& "C:\path\to\tomcat\bin\startup.bat"
# Backend now live at http://localhost:8080/AOT-SMS/api/...
```

## 16.3 Frontend — dev server (Vite)

```bash
cd frontend-app
npm install         # first time only
npm run dev         # → http://localhost:5173
                    # /api/* is proxied to http://localhost:8080/AOT-SMS/api/*
```

## 16.4 Frontend — production build

```bash
npm run build       # → frontend-app/dist/  (static HTML/CSS/JS)
npm run preview     # serve dist/ at http://localhost:4173 for testing

# To deploy together with the WAR:
# Option A — copy dist/ contents into src/main/webapp/  (served by Tomcat as /AOT-SMS/)
# Option B — host dist/ on Nginx, point /api/* to the Tomcat backend
```

## 16.5 First login

- URL: `http://localhost:5173/login`
- Default admin: `admin / Admin@AOT2026`
- The backend sets `aot_sms_token` httpOnly cookie on success
- React routes redirect by role (admin/teacher/student) automatically

---

# SECTION 17 — AI AGENT BUILD ORDER

Continuous execution order followed by Kiro:

1. Scaffold backend Maven webapp + frontend Vite project
2. `pom.xml` deps (Servlet, MySQL, Gson, jbcrypt, Commons CSV) + Tailwind/shadcn init
3. `DBConnection.java` + all 8 model POJOs + all 10 DAO classes (pure JDBC)
4. `JWTUtil.java` + `JWTFilter.java` + `HttpUtil.java` + `ApiResponse.java` + `MAKAUTCalculator.java`
5. `AuthServlet` + `HealthServlet` + `DepartmentServlet` + `SubjectServlet`
6. `StudentServlet` + `TeacherServlet` (full CRUD)
7. `AttendanceServlet` (bulk upsert, same-day rule for teachers)
8. `MarksServlet` (auto best2 + grade + SGPA pipeline)
9. `GradeServlet` + `FeeServlet` + `NoticeServlet`
10. `ReportServlet` (CSV via Commons CSV)
11. `mvn package` → BUILD SUCCESS, WAR generated
12. Frontend: `lib/axios.ts` + `lib/utils.ts` + `lib/makaut.ts` + `types/api.ts`
13. `store/authStore.ts` (Zustand) + `hooks/useAuth.ts`
14. shadcn primitives (Button, Card, Input, Label, Dialog, Sheet, Select, Table, Tabs, Avatar, Badge, Progress, Separator, Textarea, DropdownMenu)
15. `RouteGuard` + `BootstrapAuthGate` + `AppShell` + `Sidebar` + `Header` + `StatCard`
16. `router.tsx` with role-aware nested routes
17. `Login.tsx` (Framer Motion entry, shake on error)
18. `admin/Students.tsx` + `_StudentFormDialog` + `_StudentViewDialog` (TanStack Table)
19. `admin/Teachers.tsx` + `_TeacherFormDialog` + `_TeacherViewDialog`
20. `admin/Dashboard.tsx` (Recharts BarChart + PieChart with brand orange)
21. `student/Dashboard.tsx` (alert banners, attendance progress)
22. Remaining stubs for `teacher/*`, `student/*`, `admin/*` pages
23. `npm run typecheck` → 0 errors
24. `npm run build` → 0 errors


---

# SECTION 18 — FULL QUALITY CHECKLIST

## 18.1 MAKAUT logic (unchanged)

- [ ] Best 2 of 4 CTs averages and scales to /25 correctly: e.g. CT1=18, CT2=15, CT3=12, CT4=10 → top 2 (18, 15) → avg 16.5/20 → ((16.5)/20)·25 = **20.625**
- [ ] Att marks step function: 91→5, 82→4, 76→3, 67→2, 55→1, 40→0
- [ ] Grade bands: 91→O, 82→E, 71→A, 62→B, 52→C, 42→D, 38→F
- [ ] Grade points: O=10, E=9, A=8, B=7, C=6, D=5, F=0
- [ ] SGPA = Σ(credit × point) / Σ(credit) verified against known values
- [ ] CGPA = average of non-zero SGPAs; Percentage = (CGPA − 0.75) × 10
- [ ] `classesNeededFor75(50, 35)` = 15

## 18.2 Backend — pure JDBC + JWT

- [ ] **No Spring Boot, no Spring Data JPA, no Hibernate, no jjwt** — all DAOs use raw JDBC `PreparedStatement`
- [ ] `mvn package` → BUILD SUCCESS with 0 errors
- [ ] All servlets respond with `{ success, data, message }` envelope
- [ ] `JWTFilter` blocks unauthenticated requests with 401 (verify by hitting `/api/students` with no cookie)
- [ ] `AuthServlet` sets `aot_sms_token` httpOnly cookie on successful login
- [ ] `AuthServlet /logout` clears the cookie
- [ ] CORS headers `Access-Control-Allow-Origin: http://localhost:5173` + `Access-Control-Allow-Credentials: true` present on all servlet responses
- [ ] `OPTIONS` preflight returns 200 from `JWTFilter`
- [ ] All DAO `PreparedStatement` queries use `?` placeholders (no string concatenation of user input)
- [ ] BCrypt verifies the seeded `admin / Admin@AOT2026` account
- [ ] 3 failed login attempts in 30 min → 403 lockout
- [ ] Teacher attempts to mark attendance for yesterday → 403
- [ ] Marks save → auto best2 + grade + SGPA recompute (verify in `marks` and `sgpa_cgpa` tables)
- [ ] CSV exports return correct headers `Content-Disposition: attachment; filename=...csv`

## 18.3 Frontend — React + shadcn + Framer + Recharts

- [ ] `npm run typecheck` → 0 TypeScript errors
- [ ] `npm run build` → clean Vite bundle (warnings about chunk size are acceptable)
- [ ] Axios `withCredentials: true` set globally; cookie sent on every request
- [ ] All TanStack Tables have working search, sort, and pagination (10/25/50)
- [ ] Zod validation shows inline errors on every form
- [ ] React Query cache invalidates after every mutation (`qc.invalidateQueries`)
- [ ] Sonner toasts fire on success/error of every mutation
- [ ] Framer Motion: page entry, stagger row mount, counter on stat cards, shake on login error
- [ ] Recharts: BarChart for weekly attendance, PieChart for departments
- [ ] Sidebar `motion.span layoutId="active-rail"` slides between active routes
- [ ] Login redirects by role: admin → `/admin/dashboard`, teacher → `/teacher/dashboard`, student → `/student/dashboard`
- [ ] Hitting an admin URL as a student redirects to `/student/dashboard` (RouteGuard)
- [ ] After logout, `aot_sms_token` cookie is cleared and SPA bounces to `/login`

## 18.4 Cross-stack integration

- [ ] Login from React → backend Java sets cookie → next API call includes cookie → backend reads claims via `JWTFilter` → servlet uses `req.getAttribute("auth.role")`
- [ ] CORS allows credentialed POST/PUT/DELETE; preflight (`OPTIONS`) succeeds
- [ ] Mobile breakpoint: sidebar hidden, hamburger menu via shadcn `<Sheet>`
- [ ] `mvn package` clean WAR + `npm run build` clean dist/ — both deployable independently

---

## END OF PRD v3.0

**Document version:** 3.0 (Hybrid Stack)
**Last updated:** May 2026
**Stack:** React 19 + TypeScript + Vite (Frontend) · Java Servlets + pure JDBC (Backend) · MySQL
