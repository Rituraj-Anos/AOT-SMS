/** Standard envelope returned by the Spring Boot backend. */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string | null;
}

export type Role = 'admin' | 'teacher' | 'student';

export interface AuthMe {
  userId: string;
  role: Role;
  name: string;
  entityId: number | null;
  deptId: number | null;
  section: string | null;
}

export interface Department {
  deptId: number;
  deptCode: string;
  deptName: string;
  totalSemesters: number;
}

export type StudentType = 'regular' | 'lateral' | 'transfer';
export type Gender = 'Male' | 'Female' | 'Other';

export interface Student {
  studentId: number;
  rollNo: string;
  studentName: string;
  studentType: StudentType;
  deptId: number;
  deptCode: string | null;
  currentSemester: number;
  section: string;
  dob: string | null;
  gender: Gender | null;
  bloodGroup: string | null;
  aadharNo: string | null;
  phone: string | null;
  email: string | null;
  parentName: string | null;
  parentPhone: string | null;
  address: string | null;
  photoPath: string | null;
  admissionYear: number | null;
  isActive: boolean;
}

export type Designation =
  | 'Professor'
  | 'Associate Professor'
  | 'Assistant Professor'
  | 'HOD'
  | 'Lab Instructor';

export interface Teacher {
  teacherId: number;
  empId: string;
  teacherName: string;
  deptId: number;
  deptCode: string | null;
  designation: Designation | string;
  phone: string | null;
  email: string | null;
  photoPath: string | null;
  dateJoined: string | null;
  isActive: boolean;
}

export interface TeacherMapping {
  mappingId: number;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  deptId: number;
  semester: number;
  section: string | null;
  academicYear: string | null;
}

export interface Subject {
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  deptId: number;
  semester: number;
  credits: number;
  subjectType: 'theory' | 'lab' | 'training';
  lHours: number;
  tHours: number;
  pHours: number;
}

export type AttendanceStatus = 'P' | 'A' | 'L' | 'ML';

export interface AttendanceSummary {
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  held: number;
  present: number;
  absent: number;
  percent: number;
  classesNeededFor75: number;
}

export interface ClassRosterRow {
  studentId: number;
  rollNo: string;
  studentName: string;
  section: string;
  status: AttendanceStatus | null;
  overallPct?: number;
}

export interface Marks {
  marksId: number;
  studentId: number;
  subjectId: number;
  semester: number;
  academicYear: string | null;
  ct1: number | null;
  ct2: number | null;
  ct3: number | null;
  ct4: number | null;
  bestTwoMarks: number | null;
  eseMarks: number | null;
  attendanceMarks: number;
  totalMarks: number | null;
  isResultDeclared: boolean;
}

export interface Grade {
  gradeId: number;
  studentId: number;
  subjectId: number;
  semester: number;
  academicYear: string | null;
  grade: 'O' | 'E' | 'A' | 'B' | 'C' | 'D' | 'F';
  gradePoint: number;
  credits: number;
  isBacklog: boolean;
  backlogCleared: boolean;
  // Joined fields populated by GradeDAO via JOIN to subjects:
  subjectCode?: string;
  subjectName?: string;
}

export interface ResultBundle {
  studentId: number;
  sgpaBySemester: Record<string, number>;
  cgpa: number;
  percentage: number;
  backlogCount: number;
  grades: Grade[];
}

export interface Fee {
  feeId: number;
  studentId: number;
  academicYear: string | null;
  semester: number | null;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  dueDate: string | null;
  paymentDate: string | null;
  paymentMode: 'Cash' | 'Online' | 'DD' | 'Cheque' | null;
  receiptNo: string | null;
  remarks: string | null;
  // Joined fields populated by FeeDAO via JOIN to students:
  rollNo?: string;
  studentName?: string;
}

export interface Notice {
  noticeId: number;
  title: string;
  body: string;
  postedByRole: 'admin' | 'teacher';
  postedById: number;
  targetType: 'all' | 'dept' | 'section' | 'student';
  targetDeptId: number | null;
  targetSection: string | null;
  isPinned: boolean;
  postDate: string;
  expiryDate: string | null;
}


// ── Classroom / Study Materials ──────────────────────────────────────

export type MaterialType = 'notes' | 'assignment' | 'question_paper' | 'syllabus' | 'other';

export interface StudyMaterial {
  materialId: number;
  teacherId: number;
  subjectId: number;
  deptId: number;
  semester: number;
  section: string | null;
  title: string;
  description: string | null;
  materialType: MaterialType;
  fileName: string | null;
  filePath: string | null;
  fileSize: number;
  dueDate: string | null;
  isPinned: boolean;
  postedAt: string;
  teacherName: string;
  empId?: string;
  subjectCode?: string;
  subjectName?: string;
}

export type SubmissionStatus = 'submitted' | 'late' | 'graded';

export interface Submission {
  submissionId: number;
  materialId: number;
  studentId: number;
  fileName: string | null;
  filePath: string | null;
  submittedAt: string;
  status: SubmissionStatus;
  grade: string | null;
  feedback: string | null;
  rollNo: string;
  studentName: string;
}


// ── Class Schedule ───────────────────────────────────────────────────

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
export type ClassType = 'theory' | 'lab' | 'tutorial';
export type ScheduleAttendanceStatus = 'attended' | 'missed' | 'off' | 'substituted';

export interface ScheduleSlot {
  scheduleId: number;
  teacherId: number;
  subjectId: number;
  deptId: number;
  semester: number;
  section: string;
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  startTime: string;
  endTime: string;
  classType: ClassType;
  roomNo: string | null;
  academicYear: string;
  isActive: boolean;
  subjectCode?: string;
  subjectName?: string;
  teacherName?: string;
  empId?: string;
  deptCode?: string;
}

export interface ScheduleAttendanceRecord {
  id: number;
  scheduleId: number;
  studentId: number;
  classDate: string;
  status: ScheduleAttendanceStatus;
  substituteTeacher: string | null;
  substituteSubject: string | null;
  notes: string | null;
  markedAt: string;
}
