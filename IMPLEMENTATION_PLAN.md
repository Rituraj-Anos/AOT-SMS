# AOT Student Management System — Implementation Plan

**Academy of Technology | MAKAUT Affiliated | Adisaptagram, West Bengal**

**Stack:** React 19 + TypeScript + Vite (Frontend) · Java Servlets + pure JDBC (Backend) · MySQL
**Build Deadline:** 4th June 2026
**Duration:** 10 Days

---

## Table of Contents

1. [Overview](#overview)
2. [Open Questions](#open-questions)
3. [Phase 0: Environment & Repo Setup](#phase-0--environment--repo-setup)
4. [Phase 1: Backend Foundation (Pure JDBC)](#phase-1--backend-foundation-pure-jdbc)
5. [Phase 2: Servlet APIs](#phase-2--servlet-apis)
6. [Phase 3: Frontend Design System (Tailwind v3 + shadcn/ui)](#phase-3--frontend-design-system)
7. [Phase 4: Frontend Foundations (Axios + React Query + Zustand)](#phase-4--frontend-foundations)
8. [Phase 5: Frontend Pages (React)](#phase-5--frontend-pages)
9. [Phase 6: Integration & Polish](#phase-6--integration--polish)
10. [Verification Plan](#verification-plan)
11. [Build & Deploy Commands](#build--deploy-commands)
12. [Day-by-Day Build Schedule](#day-by-day-build-schedule)
13. [Risk Mitigation](#risk-mitigation)
14. [Success Criteria](#success-criteria)
15. [Post-Launch Tasks](#post-launch-tasks)

---

## Overview

A complete college ERP system for Academy of Technology with three roles (Admin, Teacher, Student), full MAKAUT-specific academic logic (SGPA/CGPA, grade tables, 75% attendance rule), and a modern React frontend backed by a pure-JDBC Java Servlet API.

The frontend uses **shadcn/ui components + Framer Motion animations + Recharts charts + TanStack Table for data tables + React Hook Form + Zod for validation**, all on top of Tailwind v3 with the original AOT design tokens (orange `#F97316`, warm off-white `#F5F0EB`, Inter font).

The backend stays on **pure JDBC** (instructor requirement — no Spring Boot, no Hibernate, no JPA). Authentication is JWT in an httpOnly cookie, signed with HMAC-SHA256 via the JDK's `javax.crypto.Mac` — no external JWT library.

**Key Features:**
- Role-based access control via JWT cookie + `JWTFilter`
- MAKAUT-compliant grading (Best 2 of 4 CTs scaled to /25, SGPA, CGPA, percentage)
- Attendance with same-day-only rule for teachers and 75% defaulter alerts
- Auto-cascade on marks save: Best2 → total → grade → SGPA → CGPA → percentage
- Fee management with payment recording
- Notice board with pinned + dept/section targeting
- CSV exports for attendance, marks, fee defaulters
- Animated, responsive, accessible UI

---

## Open Questions

> [!IMPORTANT]
> **MySQL credentials** — `DBConnection.java` has them hardcoded. For class submission this is fine; for any deployment, override via environment variables.

> [!IMPORTANT]
> **JWT secret** — `JWTUtil` reads `APP_JWT_SECRET` env var; falls back to a 64-char default. **Change before any non-local deploy.**

> [!NOTE]
> **Multi-department subjects** — Currently only 4th-sem CSE seeded. Other dept/sem subjects can be added to `seed_data.sql` as needed.

> [!NOTE]
> **Photo upload** — Currently a path/URL field in the student form. File upload is deferred.

---

## Phase 0 — Environment & Repo Setup

### Backend
- [x] Maven webapp scaffold (`mvn archetype:generate`)
- [x] `pom.xml` with: `jakarta.servlet-api` 6.0 (provided), `mysql-connector-j` 8.0.33, `gson` 2.10.1, `jbcrypt` 0.4, `commons-csv` 1.10.0
- [x] **No Spring**, **no JPA**, **no jjwt** — verify with `mvn dependency:tree`
- [x] MySQL 8.0 running, `aot_sms` database created via `database/schema.sql`
- [x] Default admin seeded: `admin / Admin@AOT2026` (BCrypt-hashed via `GenerateBCrypt.java`)

### Frontend
- [x] Vite + React + TypeScript scaffold in `frontend-app/`
- [x] Dependencies installed:
  ```
  react-router-dom@7  @tanstack/react-query@5  @tanstack/react-table@8
  zustand@5  framer-motion@11  recharts@2
  react-hook-form@7  zod@3  @hookform/resolvers@3
  axios@1.7  sonner@1.7  lucide-react
  clsx  tailwind-merge  class-variance-authority
  @radix-ui/react-{avatar, dialog, dropdown-menu, label, progress,
                   select, separator, slot, tabs, tooltip, switch, popover, checkbox}
  ```
  Dev: `tailwindcss@3.4` `postcss` `autoprefixer` `tailwindcss-animate`
- [x] `tailwind.config.ts` — orange `#F97316`, bg-base `#F5F0EB`, gradient-brand, gradient-hero, shadow-orange, Inter font, shake keyframe
- [x] `index.css` — Tailwind base + CSS variables for shadcn (light + dark)
- [x] shadcn init: components copied to `src/components/ui/` (Button, Card, Input, Label, Dialog, Sheet, Select, Table, Tabs, Avatar, Badge, Progress, Separator, Textarea, DropdownMenu)

---

## Phase 1 — Backend Foundation (Pure JDBC)

### Required files
- [x] `dao/DBConnection.java` — `DriverManager.getConnection`, no pool, no ORM
- [x] `model/*.java` — POJOs for Student, Teacher, Subject, Attendance, Marks, Grade, Fee, Notice (no annotations)
- [x] `dao/AdminDAO.java` `dao/StudentDAO.java` `dao/TeacherDAO.java` `dao/SubjectDAO.java`
       `dao/AttendanceDAO.java` `dao/MarksDAO.java` `dao/GradeDAO.java`
       `dao/FeeDAO.java` `dao/NoticeDAO.java` — every method uses `Connection` + `PreparedStatement` + `ResultSet`

### New utilities (added in Day 1 / 2)
- [x] `util/JWTUtil.java` — manual HS256 sign + verify using `javax.crypto.Mac`, `SecretKeySpec`, `java.util.Base64.getUrlEncoder/Decoder`. **No external JWT library.** Constant-time signature compare.
- [x] `util/HttpUtil.java` — `applyCors`, `handlePreflight`, `writeJson`, `writeOk`, `writeError`, `readCookie`, `buildAuthCookie`, `clearAuthCookie`. Origin allow-list pinned to `http://localhost:5173` (dev) and `http://localhost:4173` (preview).
- [x] `util/ApiResponse.java` — `{ success, data, message }` envelope, with `ok(data)`, `ok(data, message)`, `error(message)` factories
- [x] `util/AuthUtil.java` — already had `hashPassword`, `checkPassword`, `getFailedAttempts`, `logAttempt`, session helpers — keep as-is
- [x] `util/MAKAUTCalculator.java` — `calcBestTwo`, `calcAttMarks`, `calcGrade`, `calcSGPA`, `calcCGPA`, `cgpaToPercentage`, `classesNeededFor75`, `recalculateSGPA(conn, studentId, sem)`
- [x] `util/JSONUtil.java` — Gson wrapper
- [x] `util/CSVExporter.java` — Apache Commons CSV streaming writer

### New filter
- [x] `filter/JWTFilter.java` — `@WebFilter("/api/*")`. Reads `aot_sms_token` cookie, validates via `JWTUtil`, stashes `auth.userId / auth.role / auth.name / auth.uid` as request attributes. Public paths: `/api/auth/login`, `/api/auth/logout`, `/api/health`. Always allows `OPTIONS` preflight.

### Verification
- [x] `mvn -DskipTests compile` → BUILD SUCCESS, 0 errors
- [x] All DAO files use only `java.sql.*` for database access (no `org.hibernate`, no `org.springframework.data`)

---

## Phase 2 — Servlet APIs

All servlets:
- Use `@WebServlet("/api/...")` annotations
- Apply CORS via `HttpUtil.applyCors(req, resp)` and handle preflight via `HttpUtil.handlePreflight`
- Return `{ success, data, message }` via `HttpUtil.writeOk` / `writeError`
- Read `auth.role`, `auth.uid` from request attributes set by `JWTFilter`

### Servlets

| File | Endpoints | Notes |
|------|-----------|-------|
| `AuthServlet.java`        | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` | Sets / clears httpOnly JWT cookie |
| `HealthServlet.java`      | `GET /api/health`                                                   | Public, no auth |
| `DepartmentServlet.java`  | `GET /api/departments`                                              | List for frontend dropdowns |
| `SubjectServlet.java`     | `GET /api/subjects[?deptId=&sem=][&teacherId=][&id=][&code=]`       | Read-only |
| `StudentServlet.java`     | `GET / POST / PUT / DELETE /api/students`                            | Admin-only writes; default password `Student@123` |
| `TeacherServlet.java`     | Same shape as StudentServlet + `?id=X&mappings=true` for assignments | Default password `Teacher@123` |
| `AttendanceServlet.java`  | `POST /api/attendance` (bulk upsert), `GET ?studentId=X` (summary), `GET ?subjectId=X&date=Y` (roster) | Teacher: today only; admin: any date |
| `MarksServlet.java`       | `POST /api/marks` (auto best2 + grade + SGPA), `GET ?studentId=&sem=`, `GET ?subjectId=&sem=` | Cascades through 6 steps on save |
| `GradeServlet.java`       | `GET /api/grades?studentId=X` (full bundle), `?sem=N`, `?backlogs=1` | Reads `sgpa_cgpa` |
| `FeeServlet.java`         | `GET ?studentId=X`, `GET ?pending=1`, `POST` (create), `PUT` (record payment) | Admin-only writes |
| `NoticeServlet.java`      | `GET / POST / PUT / DELETE /api/notices`                             | Teacher can post; admin can pin/delete |
| `ReportServlet.java`      | `GET /api/reports?type=attendance|marks|fees`                        | CSV download with `Content-Disposition` |

### `web.xml` — minimal

```xml
<web-app version="6.0" metadata-complete="false">
  <display-name>AOT SMS</display-name>
  <session-config>
    <session-timeout>240</session-timeout>
    <cookie-config>
      <http-only>true</http-only>
      <same-site>Lax</same-site>
    </cookie-config>
  </session-config>
  <error-page><error-code>404</error-code><location>/index.html</location></error-page>
</web-app>
```

All servlet/filter discovery happens via annotations — `metadata-complete="false"` lets Tomcat scan.


---

## Phase 3 — Frontend Design System

No bespoke CSS files. Everything flows through Tailwind tokens + shadcn/ui primitives.

### Files
- `frontend-app/tailwind.config.ts` — design tokens
- `frontend-app/src/index.css` — Tailwind base imports + CSS variables for shadcn
- `frontend-app/src/lib/utils.ts` — `cn()` helper, `initials()`, `formatINR()`
- `frontend-app/src/components/ui/*.tsx` — shadcn primitives

### Tokens (mirroring legacy `variables.css`)

| Token | Value |
|-------|-------|
| `bg-base`        | `#F5F0EB` |
| `bg-surface`     | `#FFFFFF` |
| `orange-500`     | `#F97316` (primary) |
| `orange-300`     | `#FED7AA` (accent) |
| `gradient-brand` | `linear-gradient(135deg, #FF6B00 0%, #FFB800 100%)` |
| `gradient-hero`  | `linear-gradient(160deg, #FDF4EE 0%, #F5F0EB 60%, #EEF2FF 100%)` |
| `shadow-orange`  | `0 4px 20px rgba(249,115,22,0.30)` |
| Font             | Inter (Google Fonts) |
| `--radius`       | `0.75rem` |

### shadcn primitives in repo

`button.tsx` `card.tsx` `input.tsx` `label.tsx` `dialog.tsx` `sheet.tsx` `select.tsx` `table.tsx` `tabs.tsx` `avatar.tsx` `progress.tsx` `badge.tsx` `separator.tsx` `textarea.tsx` `dropdown-menu.tsx`

### Visual identity preserved

- Warm off-white background
- Orange accent throughout (focus rings, primary buttons, sidebar active rail)
- White cards with soft shadow
- Fixed left sidebar (240px), collapsible to mobile sheet
- Inter font with the same 8-step type scale

---

## Phase 4 — Frontend Foundations (Axios + React Query + Zustand)

### Files
- `frontend-app/src/lib/axios.ts` — `withCredentials: true`, baseURL `/api`, 401 → store.clear() + redirect
- `frontend-app/src/lib/makaut.ts` — TS port of `MAKAUTCalculator.java`
- `frontend-app/src/store/authStore.ts` — Zustand: `me`, `isReady`, `setMe`, `clear`
- `frontend-app/src/types/api.ts` — `ApiResponse<T>`, `Student`, `Teacher`, `Subject`, `Marks`, `Grade`, `Fee`, `Notice`, `AuthMe`, `AttendanceSummary`, `ResultBundle`, `TeacherMapping`, etc.
- `frontend-app/src/hooks/useAuth.ts` — `useLogin`, `useLogout`, `useBootstrapAuth`
- `frontend-app/src/hooks/useStudents.ts` — list / create / update / delete
- `frontend-app/src/hooks/useTeachers.ts` — list / create / update / delete + mappings
- `frontend-app/src/hooks/useDepartments.ts`

### Animation library — Framer Motion variants

| Variant         | Use |
|-----------------|-----|
| `pageEnter`     | `motion.div initial={{opacity:0, y:30}} animate={{opacity:1, y:0}}` on layout root |
| `staggerContainer` | parent `transition={{staggerChildren: 0.08}}`, children with `y` variant |
| `counterVariant`   | `useMotionValue` + `useTransform` + `motionAnimate` (StatCard) |
| `shakeVariant`     | `useAnimationControls` + `controls.start({ x: [0,-10,10,...] })` (Login error) |
| Row stagger        | `transition={{ delay: i * 0.02 }}` per `<motion.tr>` |

### Reusable components

`AppShell`, `Sidebar` (role-aware nav, Framer Motion `layoutId="active-rail"` for orange rail), `Header`, `RouteGuard`, `BootstrapAuthGate`, `StatCard` (animated counter, 5 tone variants).

---

## Phase 5 — Frontend Pages

For each page below, the table notes the shadcn components used, the React Query hook, the Zod schema (if any), and the Framer Motion variants applied.

### Login

| Aspect | Detail |
|--------|--------|
| File | `pages/Login.tsx` |
| shadcn | `Button`, custom floating-label inputs |
| Hook | `useLogin()` |
| Zod | `loginSchema = z.object({ userId: z.string().min(1), password: z.string().min(1) })` |
| Animation | page entry, role tab spring, shake card on error |
| API | `POST /api/auth/login` → cookie set + `authStore.setMe(...)` → `navigate(/${role}/dashboard)` |

### Admin pages

| Page | shadcn | Hook | Zod | Animation |
|------|--------|------|-----|-----------|
| `Dashboard`   | `Card`, Recharts `BarChart` + `PieChart`, `StatCard` | `useStudents`, `useTeachers` | — | counter, stagger fade-up |
| `Students`    | `Card`, `Dialog`, `Table`, `Select`, `Input`, `Badge`, `Avatar` | `useStudents`, `useCreateStudent`, `useUpdateStudent`, `useDeleteStudent` | `studentSchema` (full PRD field set) | row stagger, shake on validation error |
| `Teachers`    | same as Students | `useTeachers...`, `useTeacherMappings` | `teacherSchema` | row stagger |
| `Attendance`  | `Card`, `Table`, filters, CSV button | `useAttendance` | — | row stagger |
| `Marks`       | `Card`, `Table`, inline editable cells | `useMarks` | row schema | live grade badge updates |
| `Results`     | `Card`, `Tabs` per semester, `Progress` rings | `useGrades` | — | counter rings |
| `Fees`        | `Card`, `Table`, `Dialog` for payment | `useFees`, `useRecordPayment` | `feePaymentSchema` | toast on save |
| `Notices`     | `Card`, `Textarea`, `Switch` for pin | `useNotices`, `useCreateNotice` | `noticeSchema` | card fade-up |
| `Settings`    | `Card`, `Input` | password change | `passwordSchema` | — |

### Teacher pages

| Page | shadcn | Hook | Zod | Animation |
|------|--------|------|-----|-----------|
| `Dashboard`        | `Card`, `StatCard`              | — | — | stagger |
| `MarkAttendance`   | `Select`, custom `<AttendanceToggle>` | `useMarkAttendance` | — | spring on P/A/L/ML pop |
| `EnterMarks`       | `Table`, inline `Input`          | `useMarks` | row-level | live `<GradeBadge>` |
| `MyStudents`       | `Table`                          | `useStudents` (filtered) | — | row stagger |
| `MyNotices`        | `Card`, `Dialog`                 | `useNotices` | `noticeSchema` | — |

### Student pages (read-only)

| Page | shadcn | Hook | Animation |
|------|--------|------|-----------|
| `Dashboard`     | `Card`, `Progress`, alert banner | `useAttendance`, `useGrades` | banner slide-in, progress fill, counter |
| `MyAttendance`  | `Table`, `Accordion`             | `useAttendance` | progress bar fill |
| `MyMarks`       | `Tabs` per sem, `Table`           | `useMarks`, `useGrades` | tab transition |
| `MyFees`        | `Card`, `Table`                   | `useFees` | — |
| `Notices`       | `Card`                            | `useNotices` | card fade-up |


---

## Phase 6 — Integration & Polish

### Integration checklist
- [ ] All Axios calls hit correct servlet paths (`/api/students`, `/api/teachers`, etc.)
- [ ] `withCredentials: true` set on Axios instance — verify cookie sent on every request
- [ ] JWT cookie set at login and present on subsequent requests (DevTools → Application → Cookies)
- [ ] Role-based redirect: hitting `/admin/...` as a student bounces to `/student/dashboard`
- [ ] CORS: backend allows `http://localhost:5173` with credentials; preflight succeeds
- [ ] Logout clears the cookie on backend AND on frontend Zustand store
- [ ] Default admin login works: `admin / Admin@AOT2026`
- [ ] 3 failed logins lock the account for 30 min (`login_attempts` table fills up; UI shows "X attempts remaining")

### Polish tasks
- [ ] Sidebar collapses to shadcn `<Sheet>` at `md:` breakpoint (768px)
- [ ] Lucide icons render at correct stroke weight
- [ ] Recharts re-renders automatically on data change (no manual destroy needed — that was Chart.js)
- [ ] Sonner toasts auto-dismiss (`expand={false}`, 4s default)
- [ ] Framer Motion `whileInView` triggers fade-up on cards as user scrolls
- [ ] Empty states: stat cards show 0, tables show "No data" centered
- [ ] Loading states: shadcn `Skeleton` component or spinner during initial fetch
- [ ] Accessibility: every interactive element has visible focus ring; modals use `aria-modal`

### Build verification
- [ ] `mvn -DskipTests package` → `target/AOT-SMS.war` built clean
- [ ] `cd frontend-app && npm run typecheck` → 0 errors
- [ ] `cd frontend-app && npm run build` → `dist/` produced clean

---

## Verification Plan

### MAKAUT calculation tests (unchanged from v1)

| Test | Input | Expected |
|------|-------|----------|
| Best-2 of 4 + scale | CT1=18 CT2=15 CT3=12 CT4=10 | 16.5 raw → 20.625 /25 |
| Att marks step | 91, 82, 76, 67, 55, 40 | 5, 4, 3, 2, 1, 0 |
| Grade bands | 91, 82, 71, 62, 52, 42, 38 | O, E, A, B, C, D, F |
| SGPA | known credit/point combo | matches Σ(c·p)/Σc |
| CGPA → percentage | CGPA 8.5 | 77.5% |
| Classes needed | held=50 present=35 | 15 |

### Authentication tests

| Test | Expected |
|------|----------|
| 3 wrong attempts | 4th attempt → 403 lockout |
| Valid login | `aot_sms_token` httpOnly cookie set, response body has `{ userId, role, name, entityId }` |
| Hit `/api/students` no cookie | 401 |
| Hit `/api/students` with student JWT | 200 (read OK) |
| `POST /api/students` with student JWT | 403 (admin only) |
| `POST /api/attendance` for yesterday as teacher | 403 (same-day rule) |

### Database tests
- All 14 tables created cleanly
- All FK constraints valid
- `v_attendance_summary` and `v_below_75` views returning expected rows

### UI / Animation tests (React + Framer Motion + Recharts)

| Test | Method | Expected |
|------|--------|----------|
| Page enter animation | Visit any page | `motion.div` fades + slides in |
| Stat card counter | Visit dashboard | Numbers count up via `useMotionValue` |
| Row stagger | Open Students page | Rows animate in sequentially |
| Login error shake | Submit wrong password | Card shakes via `useAnimationControls` |
| Recharts BarChart | Admin Dashboard | Weekly attendance bar chart renders |
| Recharts PieChart | Admin Dashboard | Department distribution donut renders |
| Sidebar active rail | Click nav items | Orange rail slides between active items via `layoutId` |
| Modal focus trap | Open student form | Tab cycles inside modal |
| Toast | Save student | Sonner top-right success toast |

### Cross-stack tests

| Test | Expected |
|------|----------|
| TanStack Table search | Type in search box → rows filter live |
| TanStack Table sort | Click column header → ascending/descending |
| TanStack Table pagination | 20 rows/page; ‹ and › buttons work |
| Zod validation | Submit form with missing required field → inline `text-destructive` error shown |
| React Query cache invalidation | Add student → list refetches automatically |
| Vite dev proxy | `localhost:5173/api/*` reaches `localhost:8080/AOT-SMS/api/*` |

---

## Build & Deploy Commands

### MySQL setup (one-time)

```cmd
mysql -u root -p
mysql> CREATE DATABASE aot_sms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
mysql> USE aot_sms;
mysql> SOURCE C:/coding/AOT-SMS/database/schema.sql;
mysql> SOURCE C:/coding/AOT-SMS/database/seed_data.sql;
```

### Backend build & run (Tomcat)

```powershell
cd C:\coding\AOT-SMS
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
& "C:\maven\bin\mvn.cmd" clean package
# → target/AOT-SMS.war (~ 2 MB)

copy target\AOT-SMS.war C:\path\to\tomcat\webapps\
& "C:\path\to\tomcat\bin\startup.bat"
# Backend live at: http://localhost:8080/AOT-SMS/api/...
```

### Frontend dev / build

```powershell
cd C:\coding\AOT-SMS\frontend-app
npm install            # first time only
npm run dev            # Vite dev server: http://localhost:5173
npm run typecheck      # tsc -b --noEmit
npm run build          # Production output: dist/
npm run preview        # Serve dist/ at http://localhost:4173
```


---

## Day-by-Day Build Schedule

### Day 1 — May 26 (Monday) — Environment + Database
**Backend**
- [x] Maven webapp scaffold with `pom.xml` (no Spring, no JPA, no jjwt)
- [x] `database/schema.sql` (14 tables + 2 views + seed data)
- [x] Database created in MySQL 8.0; default admin row inserted via BCrypt hash

**Frontend**
- [x] `npm create vite@latest frontend-app -- --template react-ts`
- [x] Tailwind v3 + `tailwindcss-animate` installed
- [x] shadcn/ui init; design tokens copied into `tailwind.config.ts` and `index.css`
- [x] Folder structure scaffolded (`src/components/ui`, `src/components/shared`, `src/pages/{admin,teacher,student}`, `src/hooks`, `src/lib`, `src/store`, `src/types`)

**Deliverable:** Backend `mvn compile` clean. Frontend `npm run dev` shows a placeholder page.

### Day 2 — May 27 (Tuesday) — Backend foundation + frontend layout shells
**Backend**
- [x] All 8 model POJOs
- [x] `DBConnection.java` + all 10 DAO classes (pure JDBC)
- [x] `JWTUtil.java` (manual HS256), `HttpUtil.java`, `ApiResponse.java`, `JSONUtil.java`, `MAKAUTCalculator.java`, `CSVExporter.java`
- [x] `JWTFilter.java` (`@WebFilter("/api/*")`)
- [x] `mvn -DskipTests compile` BUILD SUCCESS

**Frontend**
- [x] `lib/axios.ts` with interceptor + `withCredentials`
- [x] `lib/utils.ts` (cn, initials, formatINR), `lib/makaut.ts` (TS port)
- [x] `store/authStore.ts` (Zustand)
- [x] `types/api.ts` — full type contract
- [x] shadcn primitives: Button, Card, Input, Label, Dialog, Sheet, Select, Table, Tabs, Avatar, Badge, Progress, Separator, Textarea, DropdownMenu
- [x] Shared components: `RouteGuard`, `BootstrapAuthGate`, `AppShell`, `Sidebar` (role-aware), `Header`, `StatCard`

**Deliverable:** Both projects compile clean. Sidebar + header layout renders with mock auth.

### Day 3 — May 28 (Wednesday) — Authentication end-to-end
**Backend**
- [x] `AuthServlet.java` — `POST /login` sets httpOnly cookie, `POST /logout` clears, `GET /me` returns claims
- [x] `HealthServlet.java`
- [x] `JWTFilter` validates cookie, stashes role/uid as request attributes
- [x] `DepartmentServlet.java`, `SubjectServlet.java` (read-only)

**Frontend**
- [x] `Login.tsx` — Framer Motion entry, role pill switcher, eye toggle, shake on error
- [x] `hooks/useAuth.ts` — `useLogin`, `useLogout`, `useBootstrapAuth`
- [x] `RouteGuard` redirects based on JWT cookie; role-mismatch redirects to user's correct dashboard
- [x] `router.tsx` with role-aware nested routes

**Deliverable:** Real login flow: type creds → cookie set → dashboard renders → logout clears cookie.

### Day 4 — May 29 (Thursday) — Admin Students + Teachers
**Backend**
- [x] `StudentServlet.java` (full CRUD with `getAllStudents` filter method on DAO)
- [x] `TeacherServlet.java` (full CRUD + `getSubjectMappings` join)

**Frontend**
- [x] `admin/Students.tsx` — TanStack Table, 4 filter dropdowns, search, pagination, animated stat cards
- [x] `admin/_StudentFormDialog.tsx` — React Hook Form + Zod, all 18 PRD fields in 5 sections
- [x] `admin/_StudentViewDialog.tsx` — hydrates attendance + grades + fees via parallel React Query
- [x] `admin/Teachers.tsx` + form/view dialogs (with mappings panel)

**Deliverable:** Both pages full feature parity with original spec. Add/edit/view/delete cycles work end-to-end.

### Day 5 — May 30 (Friday) — Attendance
**Backend**
- [x] `AttendanceServlet.java` — bulk upsert, summary, class roster
- [x] Same-day-only rule enforced for teachers

**Frontend**
- [ ] `teacher/MarkAttendance.tsx` — `<AttendanceToggle>` per student, bulk actions, Framer Motion pop on selection
- [ ] `admin/AttendanceView.tsx` — defaulter rows highlighted red, CSV export button

**Deliverable:** Teacher can mark today's attendance for a class; admin sees the report.

### Day 6 — May 31 (Saturday) — Marks
**Backend**
- [x] `MarksServlet.java` — full pipeline (Best2 → total → grade → SGPA → CGPA)

**Frontend**
- [ ] `teacher/EnterMarks.tsx` — editable table, live `<GradeBadge>`, makaut.ts auto-calc on input change
- [ ] `admin/Marks.tsx` — admin override view

**Deliverable:** Teacher enters CT/ESE marks; grade badge updates live; backend recomputes SGPA/CGPA.

### Day 7 — June 1 (Sunday) — Grades & Student Dashboard
**Backend**
- [x] `GradeServlet.java` — full result bundle endpoint

**Frontend**
- [x] `student/Dashboard.tsx` — alert banners (orange < 75%, red backlog), stat cards, attendance progress bars
- [ ] `student/MyMarks.tsx` — semester tabs, SGPA/CGPA result box, backlog card

**Deliverable:** Students see live performance + attendance.

### Day 8 — June 2 (Monday) — Fees + Notices
**Backend**
- [x] `FeeServlet.java` — list, create, record payment
- [x] `NoticeServlet.java` — CRUD + pin

**Frontend**
- [ ] `admin/Fees.tsx` + payment dialog
- [ ] `admin/Notices.tsx` — post form, pinned cards
- [ ] `teacher/MyNotices.tsx`
- [ ] `student/MyFees.tsx`, `student/Notices.tsx`

**Deliverable:** Both subsystems usable across all 3 roles.

### Day 9 — June 3 (Tuesday) — Reports + Admin Dashboard
**Backend**
- [x] `ReportServlet.java` — CSV exports

**Frontend**
- [x] `admin/Dashboard.tsx` — Recharts BarChart + PieChart, real data from `/students` + `/teachers`
- [ ] `admin/Results.tsx` — semester results summary
- [ ] CSV export buttons wired to `window.open('/api/reports?type=...')`

**Deliverable:** Full admin overview + downloadable reports.

### Day 10 — June 4 (Wednesday) — Polish + Demo prep
- [ ] Mobile responsive: sidebar → `<Sheet>` at `md:` breakpoint
- [ ] Empty states across all tables
- [ ] Loading skeletons during initial fetch
- [ ] Final `npm run build` clean check
- [ ] Final `mvn package` clean check
- [ ] Demo data: 5 students per dept, sample attendance, marks, fees, notices
- [ ] Run through every user flow end-to-end

**Deliverable:** Production-ready app.


---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| MySQL connection issues | Test `DBConnection.getConnection()` early; use connection per-request (no pool needed for class scope) |
| BCrypt hash mismatch | `GenerateBCrypt.java` is a CLI helper — run it once, paste hash into `seed_data.sql` |
| MAKAUT calculation errors | Backend (`MAKAUTCalculator.java`) and frontend (`lib/makaut.ts`) implement same algorithms — one source of truth, two languages. Test with the verification table values. |
| CORS issues | All servlets use `HttpUtil.applyCors` which sets `Access-Control-Allow-Origin` to the exact origin (not `*`) plus `Access-Control-Allow-Credentials: true`. JWTFilter handles `OPTIONS` preflight. |
| JWT secret leaked | `JWTUtil` reads `APP_JWT_SECRET` env var; default is for dev only. Document this in deployment guide. |
| Tailwind v4 + shadcn/ui compatibility | **Use Tailwind v3.4** instead of v4 beta. shadcn/ui official docs target v3, and v4 has breaking changes. Pinned in `package.json`. |
| JWT httpOnly cookie blocked by browser CORS | Always set `withCredentials: true` on Axios; backend sets `Access-Control-Allow-Credentials: true` plus exact origin (not `*`). Tested via DevTools Network tab. |
| TanStack Table slow on large lists | Pagination (20/page default) keeps render under control; switch to virtualization if > 5000 rows |
| Vite proxy mismatched path | Proxy rewrites `/api` → `/AOT-SMS/api` to match Tomcat context. Verify `vite.config.ts` after any deploy path change. |

---

## Success Criteria

### Functional
- ✅ All 3 roles can log in with role-specific dashboards
- ✅ JWT cookie auth enforced on all `/api/*` except auth/health
- ✅ Admin: full CRUD on students, teachers, subjects, fees, notices
- ✅ Teacher: same-day attendance marking + marks entry with live MAKAUT calc
- ✅ Student: read-only view of own attendance, marks, grades, fees, notices
- ✅ MAKAUT pipeline runs server-side on every marks save
- ✅ 75% attendance rule alerts on student dashboard
- ✅ CSV exports work for attendance / marks / fees
- ✅ Notice board with pinning and dept/section targeting

### Non-Functional
- ✅ `mvn package` clean → WAR built
- ✅ `npm run build` clean → static dist/ built
- ✅ TypeScript strict mode passes
- ✅ Mobile responsive (sidebar collapses below 768px)
- ✅ Animations smooth and purposeful (no gratuitous movement)
- ✅ Pure JDBC throughout backend — verified by `dependency:tree` showing no Spring/Hibernate

---

## Post-Launch Tasks

### Immediate (Week 1)
- Add seed data for Sem 1–8 across all 5 departments
- Run with real demo accounts; gather feedback
- Document instructor-handoff (how to add new students, change passwords)

### Short-term (Month 1)
- Photo upload to a `/uploads/` directory served by Tomcat
- Email notifications when results are declared
- Backup script for `aot_sms` database

### Long-term (Quarter 1)
- Mobile-friendly PWA build
- Advanced analytics dashboard with trends
- Multi-language support (English/Bengali)

---

**End of Implementation Plan v3.0**
