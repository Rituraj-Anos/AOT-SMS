# AOT Student Management System

**Academy of Technology · MAKAUT Affiliated · Adisaptagram, West Bengal**

A complete college ERP for AOT — students, teachers, attendance, MAKAUT-compliant marks/grades/SGPA/CGPA, fees, notices.

## Stack

- **Frontend** — React 19 + TypeScript + Vite 6, Tailwind v3 + shadcn/ui, Framer Motion, Recharts, TanStack Query/Table, React Hook Form + Zod, Zustand
- **Backend** — Java 17 + Jakarta Servlets + **pure JDBC** (no ORM, no Spring), BCrypt, Apache Commons CSV, manual HMAC-SHA256 JWT (no library)
- **Database** — MySQL 8.0
- **Build** — Maven 3.9+, Node.js 18.18+

## Repo layout

```
AOT-SMS/
├── pom.xml                       # Maven (Servlets + JDBC)
├── src/main/java/com/aot/sms/    # Backend — 13 servlets, 10 DAOs, JWT util/filter
│   ├── dao/      models pure JDBC (Connection / PreparedStatement / ResultSet)
│   ├── filter/   JWTFilter @WebFilter("/api/*")
│   ├── model/    POJOs (no annotations)
│   ├── servlet/  AuthServlet, StudentServlet, TeacherServlet, ...
│   └── util/     JWTUtil, HttpUtil, ApiResponse, MAKAUTCalculator, CSVExporter, ...
├── src/main/webapp/WEB-INF/web.xml
├── frontend-app/                 # React + Vite app
│   └── src/{components,hooks,lib,pages,store,types}
├── database/
│   ├── schema.sql                # 14 tables + 2 views
│   └── seed_data.sql             # Default admin + 6 teachers + 21 students + 4th-sem CSE subjects
├── target/AOT-SMS.war            # Built artifact for Tomcat
└── frontend-app/dist/            # Built static assets
```

## Prerequisites

| Tool | Version | Used for |
|------|---------|----------|
| **JDK** | 17+ | `javac`, runtime |
| **Maven** | 3.9+ | building the WAR |
| **Tomcat** | 10.1 | hosting the WAR |
| **MySQL** | 8.0 | database |
| **Node.js** | 18.18+ | frontend tooling |
| **npm** | 10+ | dependency installs |

Set `JAVA_HOME` if it isn't already (Windows PowerShell example):
```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
```

## One-time setup

### 1. Database

```sql
mysql -u root -p
mysql> CREATE DATABASE aot_sms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
mysql> USE aot_sms;
mysql> SOURCE C:/coding/AOT-SMS/database/schema.sql;
mysql> SOURCE C:/coding/AOT-SMS/database/seed_data.sql;
```

The schema doesn't depend on any seed except the default admin row in `seed_data.sql`.

### 2. Update DB credentials (if different from defaults)

`src/main/java/com/aot/sms/dao/DBConnection.java` — change `URL`, `USER`, `PWD` to match your MySQL.

### 3. Frontend dependencies

```powershell
cd frontend-app
npm install
```

## Running locally

### Option A — dev mode (recommended while building)

Two terminals:

**Terminal 1** — backend on Tomcat:

```powershell
cd C:\coding\AOT-SMS
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
& "C:\maven\bin\mvn.cmd" -DskipTests package
copy target\AOT-SMS.war C:\path\to\tomcat\webapps\ -Force
& "C:\path\to\tomcat\bin\startup.bat"
```

Backend lives at `http://localhost:8080/AOT-SMS/api/...`.

Quick health check:
```powershell
curl http://localhost:8080/AOT-SMS/api/health
# → {"success":true,"data":{"status":"UP", "service":"aot-sms-backend", ...}}
```

**Terminal 2** — frontend dev server:

```powershell
cd frontend-app
npm run dev
```

Frontend lives at `http://localhost:5173`. Vite proxies `/api/*` → `http://localhost:8080/AOT-SMS/api/*` so the SPA can talk to the backend with credentials.

### Option B — production build

```powershell
cd frontend-app
npm run build      # produces dist/

cd ..
& "C:\maven\bin\mvn.cmd" -DskipTests package   # produces target/AOT-SMS.war
```

Deploy options:
- **Combined**: copy `frontend-app/dist/*` into `src/main/webapp/` then rebuild the WAR. Tomcat serves both API and SPA from one place.
- **Split**: deploy `target/AOT-SMS.war` to Tomcat and host `frontend-app/dist/` on Nginx with `/api/*` proxied to Tomcat.

## Default accounts

| Role | User ID | Password |
|------|---------|----------|
| Admin   | `admin`     | `Admin@AOT2026` |
| Teacher | `DKM`       | `Teacher@123` |
| Teacher | `RP`        | `Teacher@123` |
| Teacher | `ARD`       | `Teacher@123` |
| Teacher | `JC`        | `Teacher@123` |
| Teacher | `ND`        | `Teacher@123` |
| Teacher | `AAT`       | `Teacher@123` |
| Teacher | `SRJS`      | `Teacher@123` |
| Teacher | `SBR`       | `Teacher@123` |
| Teacher | `BBH`       | `Teacher@123` |
| Teacher | `DG`        | `Teacher@123` |
| Teacher | `SD`        | `Teacher@123` |
| Teacher | `ABP`       | `Teacher@123` |
| Student | `24CSE001`–`24CSE021` | `Student@123` |
| Student | `24CSE041` (Rituraj) | `Student@123` |

(All from `database/seed_data.sql`.)

## Auth model

- Login at `POST /api/auth/login` returns `Set-Cookie: aot_sms_token=<JWT>; HttpOnly; Path=/; Max-Age=14400`
- `JWTFilter` validates the cookie on every `/api/*` request except the public ones (`/api/auth/login`, `/api/auth/logout`, `/api/health`)
- The cookie is **httpOnly** so the JS can't read it — only the browser sends it on requests with `withCredentials: true`
- Logout at `POST /api/auth/logout` clears the cookie

JWT details:
- HS256, signed with `APP_JWT_SECRET` env var (32-byte default in `JWTUtil.java`)
- Claims: `sub` (userId), `role`, `name`, `uid` (entity ID), `iat`, `exp`
- 4-hour TTL by default

## API endpoints

All under `/api/`. Every response: `{ success: bool, data: T, message: string }`.

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| POST | `/api/auth/login` | public | `{userId, password, role}` |
| POST | `/api/auth/logout` | public | clears cookie |
| GET  | `/api/auth/me` | any | current user |
| POST | `/api/auth/password` | any | `{currentPassword, newPassword}` |
| GET  | `/api/health` | public | service status |
| GET  | `/api/departments` | any | dropdown source |
| GET  | `/api/subjects?deptId=&sem=` / `?teacherId=` | any | subject lookups |
| GET / POST / PUT / DELETE | `/api/students` | admin (writes) | full CRUD |
| GET / POST / PUT / DELETE | `/api/teachers` | admin (writes) | full CRUD + `?id=X&mappings=true` |
| POST `/api/attendance` | teacher (today only) / admin | bulk upsert |
| GET `/api/attendance?studentId=X` | any | per-subject summary |
| GET `/api/attendance?subjectId=X&date=Y` | teacher / admin | class roster |
| POST `/api/marks` | teacher / admin | upsert + auto best2/grade/SGPA |
| GET `/api/marks?studentId=&sem=` / `?subjectId=&sem=` | any (own data) / teacher | marks fetch |
| GET `/api/grades?studentId=X` | any (own data) | full result bundle |
| GET / POST / PUT `/api/fees` | admin (writes) | fee CRUD + payment |
| GET / POST / PUT / DELETE `/api/notices` | admin / teacher (post) | notice board |
| GET `/api/reports?type=attendance|marks|fees` | admin / teacher | CSV download |

## MAKAUT business rules

| Calc | Formula |
|------|---------|
| Best 2 of 4 CTs (each /20) | `(top1 + top2) / 40 × 25` → /25 contribution |
| Attendance marks | `≥90→5, ≥80→4, ≥75→3, ≥65→2, ≥50→1, else 0` |
| Total | `best_two_marks + ese_marks + attendance_marks` (out of 100) |
| Grade | `O ≥90, E ≥80, A ≥70, B ≥60, C ≥50, D ≥40, F <40` |
| Grade points | `O=10 E=9 A=8 B=7 C=6 D=5 F=0` |
| SGPA | `Σ(credit × point) / Σ(credit)` |
| CGPA | average of non-zero SGPAs |
| Percentage | `(CGPA − 0.75) × 10` |
| Classes needed for 75% | `⌈(0.75·held − present) / 0.25⌉` |

The same algorithms run in:
- **Backend** — `src/main/java/com/aot/sms/util/MAKAUTCalculator.java` (authoritative)
- **Frontend** — `frontend-app/src/lib/makaut.ts` (live preview as teacher types)

## Verification

### Backend
```powershell
& "C:\maven\bin\mvn.cmd" -DskipTests package
# → BUILD SUCCESS, target/AOT-SMS.war (~4.1 MB)

# Smoke test (with Tomcat running)
curl -i http://localhost:8080/AOT-SMS/api/health
# 200 OK, JSON body { success: true, ... }

curl -i http://localhost:8080/AOT-SMS/api/students
# 401 Unauthorized — JWTFilter blocks
```

### Frontend
```powershell
cd frontend-app
npm run typecheck   # 0 errors
npm run build       # produces dist/, no warnings
```

## Project commands cheat sheet

```powershell
# Backend
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
& "C:\maven\bin\mvn.cmd" clean compile           # compile only
& "C:\maven\bin\mvn.cmd" -DskipTests package     # build WAR

# Frontend
cd frontend-app
npm install
npm run dev          # Vite dev: http://localhost:5173
npm run typecheck    # tsc -b --noEmit
npm run build        # Vite production build → dist/
npm run preview      # serve dist/ at http://localhost:4173
```

## Documentation

- `AOT_SMS_Complete_PRD (2).md` — Full PRD v3.0 (Hybrid Stack)
- `IMPLEMENTATION_PLAN.md` — Day-by-day execution plan v3.0

## License

Internal college project — Academy of Technology.
