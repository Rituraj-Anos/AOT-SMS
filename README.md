<p align="center">
  <img src="https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white" />
  <img src="https://img.shields.io/badge/Tomcat-10.1-F8DC75?style=for-the-badge&logo=apachetomcat&logoColor=black" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
</p>

<h1 align="center">🎓 AOT Student Management System</h1>

<p align="center">
  <strong>A full-stack college ERP built for Academy of Technology (MAKAUT affiliated)</strong><br/>
  Attendance tracking · Marks management · Classroom materials · Schedule · Fee records · Notices
</p>

<p align="center">
  <a href="#-features">Features</a> ·
  <a href="#-quick-start">Quick Start</a> ·
  <a href="#-tech-stack">Tech Stack</a> ·
  <a href="#-api-endpoints">API Docs</a> ·
  <a href="#-makaut-business-logic">MAKAUT Logic</a> ·
  <a href="#-contributing">Contributing</a>
</p>

---

## 🧩 The Problem

Indian engineering colleges under MAKAUT need to track attendance (75% minimum rule), compute internal marks (Best-2-of-4 CAs scaled to 25), manage fee records, and generate official attendance sheets — all while juggling 60+ students across 8 subjects per semester. Most colleges still use Excel sheets passed around on WhatsApp.

**AOT-SMS** digitizes the entire workflow with role-based access for Admin, Teachers, and Students.

---

## ✨ Features

| Role | Feature | Description |
|------|---------|-------------|
| 👨‍💼 Admin | Dashboard | Real-time stats, charts, below-75% alerts |
| 👨‍💼 Admin | Student/Teacher CRUD | Full roster management with filters |
| 👨‍💼 Admin | Marks Override | Enter/edit CA & ESE marks, declare results |
| 👨‍💼 Admin | Fee Management | Track payments, balances, receipts |
| 👨‍💼 Admin | Schedule Builder | Drag-and-drop timetable with conflict detection |
| 👩‍🏫 Teacher | Mark Attendance | Bulk P/A/L/ML marking with past-date editing |
| 👩‍🏫 Teacher | Attendance Hub | Phase records, full sheet view, CSV exports |
| 👩‍🏫 Teacher | Enter Marks | CA1-4 entry with auto Best-2, grade calculation |
| 👩‍🏫 Teacher | Classroom | Post notes/assignments, grade submissions |
| 👩‍🏫 Teacher | Dispute Resolution | Review student attendance disputes |
| 👨‍🎓 Student | My Attendance | Official % per subject with "classes needed" counter |
| 👨‍🎓 Student | Schedule Tracker | Personal attendance log with dispute raising |
| 👨‍🎓 Student | My Marks & SGPA | View grades, SGPA/CGPA, backlog status |
| 👨‍🎓 Student | Classroom | Download materials, submit assignments |
| 👨‍🎓 Student | Notices | Targeted announcements with pin support |
| 🔐 All | JWT Auth | Secure httpOnly cookie-based sessions |
| 📤 All | CSV Exports | Official AOT attendance sheet format |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 · TypeScript · Vite · Tailwind CSS v3 · shadcn/ui · Framer Motion · TanStack Query · Recharts |
| **Backend** | Java 17 · Jakarta Servlet 6.0 · Pure JDBC (no ORM) · Gson · Apache Commons CSV |
| **Database** | MySQL 8.0 · BCrypt password hashing |
| **Auth** | Manual JWT (HMAC-SHA256) via `javax.crypto.Mac` + `java.util.Base64` |
| **Server** | Apache Tomcat 10.1 |
| **Build** | Maven (backend) · npm/Vite (frontend) |

---

## 🚀 Quick Start

### Prerequisites

- JDK 17+
- Maven 3.8+
- MySQL 8.0+
- Node.js 18+
- Apache Tomcat 10.1+

### 1. Database Setup

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p aot_sms < database/seed_data.sql
mysql -u root -p aot_sms < database/demo_data.sql
mysql -u root -p aot_sms < database/seed_attendance.sql
```

### 2. Configure DB Connection

Edit `src/main/java/com/aot/sms/dao/DBConnection.java`:
```java
private static final String URL  = "jdbc:mysql://localhost:3306/aot_sms";
private static final String USER = "root";
private static final String PASS = "your_password";
```

### 3. Build & Deploy Backend

```bash
mvn clean package -DskipTests
cp target/AOT-SMS.war $TOMCAT_HOME/webapps/
# Start Tomcat
```

### 4. Run Frontend

```bash
cd frontend-app
npm install
npm run dev
```

Open **http://localhost:5173** — the Vite dev server proxies `/api` to Tomcat at `localhost:8080`.

---

## 🔑 Default Credentials

| Role | User ID | Password | Name |
|------|---------|----------|------|
| Admin | `admin` | `Admin@AOT2026` | AOT Admin |
| Teacher | `DKM` | `Teacher@123` | Prof. DKM |
| Teacher | `RP` | `Teacher@123` | Prof. RP |
| Teacher | `ARD` | `Teacher@123` | Prof. ARD |
| Teacher | `JC` | `Teacher@123` | Prof. JC |
| Teacher | `SRJS` | `Teacher@123` | Prof. SRJS |
| Teacher | `SBR` | `Teacher@123` | Prof. SBR |
| Teacher | `BBH` | `Teacher@123` | Prof. BBH |
| Teacher | `DG` | `Teacher@123` | Prof. DG |
| Student | `24CSE001` | `Student@123` | Amit Kumar |
| Student | `24CSE041` | `Student@123` | Rituraj Mukhopadhyay |

---

## 📁 Project Structure

```
AOT-SMS/
├── database/                    # SQL schema + seed data
│   ├── schema.sql
│   ├── seed_data.sql
│   ├── demo_data.sql
│   └── seed_attendance.sql
├── frontend-app/                # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/          # Shared UI components (shadcn/ui)
│   │   ├── hooks/               # TanStack Query hooks
│   │   ├── pages/               # Role-based page components
│   │   │   ├── admin/
│   │   │   ├── teacher/
│   │   │   └── student/
│   │   ├── store/               # Zustand auth store
│   │   ├── lib/                 # Axios, MAKAUT calculator, utils
│   │   └── types/               # TypeScript interfaces
│   └── vite.config.ts
├── src/main/java/com/aot/sms/  # Java backend
│   ├── dao/                     # Pure JDBC data access
│   ├── model/                   # POJOs
│   ├── servlet/                 # Jakarta Servlet endpoints
│   ├── filter/                  # JWT authentication filter
│   └── util/                    # JWT, BCrypt, CSV, MAKAUT calc
├── src/main/webapp/WEB-INF/
│   └── web.xml
├── pom.xml                      # Maven build config
└── start.bat / stop.bat         # Windows Tomcat helpers
```

---

## 🧮 MAKAUT Business Logic

### Best-2-of-4 CA Marks (scaled to 25)
```
best2_raw = sum of top 2 scores from [CA1, CA2, CA3, CA4]
best2_scaled = (best2_raw / 40) × 25
```

### Attendance Marks (out of 5)
| Attendance % | Marks |
|-------------|-------|
| ≥ 90% | 5 |
| ≥ 80% | 4 |
| ≥ 75% | 3 |
| ≥ 65% | 2 |
| ≥ 55% | 1 |
| < 55% | 0 |

### Total Marks & Grade
```
Total = Best2/25 + ESE/70 + AttMarks/5
```

| Total | Grade | Grade Point |
|-------|-------|-------------|
| ≥ 90 | O | 10 |
| ≥ 80 | E | 9 |
| ≥ 70 | A | 8 |
| ≥ 60 | B | 7 |
| ≥ 50 | C | 6 |
| ≥ 40 | D | 5 |
| < 40 | F | 0 |

### SGPA Formula
```
SGPA = Σ(Credit × GradePoint) / ΣCredits
```

### 75% Attendance Rule
```
Classes needed = ⌈(0.75 × held - present) / 0.25⌉
```
Students below 75% are flagged as "At Risk" (65-74%) or "Detained" (<65%).

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login (returns JWT cookie) |
| GET | `/api/auth/me` | Current user info |
| GET | `/api/students` | List students (filterable) |
| PUT | `/api/students` | Update student |
| GET | `/api/teachers` | List teachers |
| GET | `/api/attendance?studentId=X` | Student attendance summary |
| POST | `/api/attendance` | Bulk mark attendance |
| GET | `/api/attendance?type=fullsheet` | Full sheet data |
| GET | `/api/attendance?type=phase` | Phase summary |
| POST | `/api/marks` | Upsert marks (auto-calculates) |
| GET | `/api/marks?subjectId=X&sem=Y` | Subject marks sheet |
| GET | `/api/reports?type=fullsheet` | Official CSV export |
| GET | `/api/reports?type=phase` | Phase CSV export |
| POST | `/api/materials` | Upload study material |
| GET | `/api/materials/download?id=X` | Download file |
| POST | `/api/disputes` | Raise attendance dispute |
| GET | `/api/schedule` | Class schedule |
| POST | `/api/notices` | Post notice |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

<p align="center">
  Built with ☕ and 🧡 for Academy of Technology, Adisaptagram
</p>
