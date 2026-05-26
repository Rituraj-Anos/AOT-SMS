import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import type { ApiResponse, ScheduleSlot, ScheduleAttendanceRecord } from '@/types/api';

export function useTeacherSchedule(teacherId?: number) {
  return useQuery({
    queryKey: ['schedule', 'teacher', teacherId],
    enabled: !!teacherId,
    queryFn: async () => {
      const r = await api.get<ApiResponse<ScheduleSlot[]>>('/schedule', { params: { teacherId } });
      return r.data.data ?? [];
    },
  });
}

export function useStudentSchedule(deptId?: number, semester?: number, section?: string) {
  return useQuery({
    queryKey: ['schedule', 'student', { deptId, semester, section }],
    enabled: !!deptId && !!semester && !!section,
    queryFn: async () => {
      const r = await api.get<ApiResponse<ScheduleSlot[]>>('/schedule', { params: { deptId, semester, section } });
      return r.data.data ?? [];
    },
  });
}

export function useAllSchedules(deptId?: number, semester?: number, section?: string) {
  return useQuery({
    queryKey: ['schedule', 'all', { deptId, semester, section }],
    queryFn: async () => {
      const params: Record<string, any> = { all: 1 };
      if (deptId) params.deptId = deptId;
      if (semester) params.semester = semester;
      if (section) params.section = section;
      const r = await api.get<ApiResponse<ScheduleSlot[]>>('/schedule', { params });
      return r.data.data ?? [];
    },
  });
}

export function useAddSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const r = await api.post<ApiResponse<{ scheduleId: number }>>('/schedule', payload);
      return r.data;
    },
    onSuccess: (resp) => {
      toast.success(resp.message || 'Schedule slot added');
      qc.invalidateQueries({ queryKey: ['schedule'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });
}

export function useUpdateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const r = await api.put<ApiResponse<unknown>>('/schedule', payload);
      return r.data;
    },
    onSuccess: () => {
      toast.success('Schedule updated');
      qc.invalidateQueries({ queryKey: ['schedule'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (scheduleId: number) => {
      const r = await api.delete<ApiResponse<unknown>>('/schedule', { params: { id: scheduleId } });
      return r.data;
    },
    onSuccess: () => {
      toast.success('Slot deleted');
      qc.invalidateQueries({ queryKey: ['schedule'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });
}

export function useScheduleAttendanceHistory(studentId?: number, scheduleId?: number) {
  return useQuery({
    queryKey: ['schedule-attendance', studentId, scheduleId],
    enabled: !!studentId && !!scheduleId,
    queryFn: async () => {
      const r = await api.get<ApiResponse<ScheduleAttendanceRecord[]>>('/schedule-attendance', {
        params: { studentId, scheduleId },
      });
      return r.data.data ?? [];
    },
  });
}

/** Fetch ALL attendance records for a student (used to pre-populate status buttons). */
export function useAllScheduleAttendance(studentId?: number) {
  return useQuery({
    queryKey: ['schedule-attendance', 'all', studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const r = await api.get<ApiResponse<ScheduleAttendanceRecord[]>>('/schedule-attendance', {
        params: { studentId },
      });
      return r.data.data ?? [];
    },
  });
}

export function useMarkScheduleAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      scheduleId: number; classDate: string; status: string;
      substituteTeacher?: string; substituteSubject?: string; notes?: string;
    }) => {
      const r = await api.post<ApiResponse<{ id: number }>>('/schedule-attendance', payload);
      return r.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedule-attendance'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });
}
