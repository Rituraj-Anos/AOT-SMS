import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import type {
  ApiResponse, AttendanceStatus, AttendanceSummary, ClassRosterRow,
} from '@/types/api';

/** Per-subject summary for one student. */
export function useStudentAttendance(studentId?: number) {
  return useQuery({
    queryKey: ['attendance', 'student', studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const r = await api.get<ApiResponse<AttendanceSummary[]>>('/attendance', {
        params: { studentId },
      });
      return r.data.data ?? [];
    },
  });
}

/** Student self-record summary from schedule_attendance (personal tracking). */
export function useStudentSelfRecord(studentId?: number) {
  return useQuery({
    queryKey: ['attendance', 'selfrecord', studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const r = await api.get<ApiResponse<SelfRecordSummary[]>>('/attendance', {
        params: { type: 'selfrecord', studentId },
      });
      return r.data.data ?? [];
    },
  });
}

export interface SelfRecordSummary {
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  selfTotal: number;
  selfPresent: number;
  selfAbsent: number;
  selfPercent: number;
}

/** Class roster for a subject + date (with each student's status, or null if not marked). */
export function useClassRoster(subjectId?: number, date?: string) {
  return useQuery({
    queryKey: ['attendance', 'class', { subjectId, date }],
    enabled: !!subjectId && !!date,
    queryFn: async () => {
      const r = await api.get<ApiResponse<ClassRosterRow[]>>('/attendance', {
        params: { subjectId, date },
      });
      return r.data.data ?? [];
    },
  });
}

export interface MarkAttendancePayload {
  subjectId: number;
  date: string;       // yyyy-MM-dd
  entries: { studentId: number; status: AttendanceStatus }[];
}

export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: MarkAttendancePayload) => {
      const r = await api.post<ApiResponse<{ saved: number }>>('/attendance', payload);
      return r.data;
    },
    onSuccess: (resp) => {
      toast.success(resp.message || 'Attendance saved');
      qc.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to save attendance');
    },
  });
}
