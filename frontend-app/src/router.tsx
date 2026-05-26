import { createBrowserRouter, Navigate } from 'react-router-dom';
import { BootstrapAuthGate } from '@/components/shared/BootstrapAuthGate';
import { RouteGuard }        from '@/components/shared/RouteGuard';
import { AppShell }          from '@/components/shared/AppShell';

import LoginPage from '@/pages/Login';

import AdminDashboard from '@/pages/admin/Dashboard';
import AdminStudents  from '@/pages/admin/Students';
import AdminTeachers  from '@/pages/admin/Teachers';
import AdminAttendance from '@/pages/admin/AttendanceView';
import AdminMarks     from '@/pages/admin/Marks';
import AdminResults   from '@/pages/admin/Results';
import AdminFees      from '@/pages/admin/Fees';
import AdminNotices   from '@/pages/admin/Notices';
import AdminSettings  from '@/pages/admin/Settings';
import AdminClassroom from '@/pages/admin/Classroom';
import AdminSchedule from '@/pages/admin/Schedule';

import TeacherDashboard from '@/pages/teacher/Dashboard';
import TeacherMarkAttendance from '@/pages/teacher/MarkAttendance';
import TeacherEnterMarks from '@/pages/teacher/EnterMarks';
import TeacherMyStudents from '@/pages/teacher/MyStudents';
import TeacherMyNotices from '@/pages/teacher/MyNotices';
import TeacherClassroom from '@/pages/teacher/Classroom';
import TeacherSchedule from '@/pages/teacher/Schedule';

import StudentDashboard from '@/pages/student/Dashboard';
import StudentMyAttendance from '@/pages/student/MyAttendance';
import StudentMyMarks from '@/pages/student/MyMarks';
import StudentMyFees  from '@/pages/student/MyFees';
import StudentNotices from '@/pages/student/Notices';
import StudentClassroom from '@/pages/student/Classroom';
import StudentSchedule from '@/pages/student/Schedule';

export const router = createBrowserRouter([
  {
    element: <BootstrapAuthGate />,
    children: [
      { path: '/',      element: <Navigate to="/login" replace /> },
      { path: '/login', element: <LoginPage /> },

      // Admin
      {
        path: '/admin',
        element: <RouteGuard roles={['admin']}><AppShell /></RouteGuard>,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard',   element: <AdminDashboard /> },
          { path: 'students',    element: <AdminStudents /> },
          { path: 'teachers',    element: <AdminTeachers /> },
          { path: 'attendance',  element: <AdminAttendance /> },
          { path: 'marks',       element: <AdminMarks /> },
          { path: 'results',     element: <AdminResults /> },
          { path: 'fees',        element: <AdminFees /> },
          { path: 'notices',     element: <AdminNotices /> },
          { path: 'classroom',   element: <AdminClassroom /> },
          { path: 'schedule',    element: <AdminSchedule /> },
          { path: 'settings',    element: <AdminSettings /> },
        ],
      },

      // Teacher
      {
        path: '/teacher',
        element: <RouteGuard roles={['teacher']}><AppShell /></RouteGuard>,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard',        element: <TeacherDashboard /> },
          { path: 'mark-attendance',  element: <TeacherMarkAttendance /> },
          { path: 'enter-marks',      element: <TeacherEnterMarks /> },
          { path: 'my-students',      element: <TeacherMyStudents /> },
          { path: 'my-notices',       element: <TeacherMyNotices /> },
          { path: 'classroom',        element: <TeacherClassroom /> },
          { path: 'schedule',         element: <TeacherSchedule /> },
        ],
      },

      // Student
      {
        path: '/student',
        element: <RouteGuard roles={['student']}><AppShell /></RouteGuard>,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard',     element: <StudentDashboard /> },
          { path: 'my-attendance', element: <StudentMyAttendance /> },
          { path: 'my-marks',      element: <StudentMyMarks /> },
          { path: 'my-fees',       element: <StudentMyFees /> },
          { path: 'notices',       element: <StudentNotices /> },
          { path: 'classroom',     element: <StudentClassroom /> },
          { path: 'schedule',      element: <StudentSchedule /> },
        ],
      },

      { path: '*', element: <Navigate to="/login" replace /> },
    ],
  },
]);
