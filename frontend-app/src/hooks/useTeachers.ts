import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import type { ApiResponse, Teacher, TeacherMapping } from '@/types/api';

export function useTeachers(deptId?: number) {
  return useQuery({
    queryKey: ['teachers', { deptId }],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Teacher[]>>('/teachers', { params: { deptId } });
      return res.data.data ?? [];
    },
  });
}

export function useTeacherMappings(teacherId: number | null) {
  return useQuery({
    queryKey: ['teacher-mappings', teacherId],
    enabled: !!teacherId,
    queryFn: async () => {
      // Servlet uses query params: /api/teachers?id=X&mappings=true
      const res = await api.get<ApiResponse<TeacherMapping[]>>('/teachers', {
        params: { id: teacherId, mappings: true },
      });
      return res.data.data ?? [];
    },
  });
}

export type TeacherPayload = Omit<Teacher, 'teacherId' | 'deptCode' | 'isActive'> & {
  teacherId?: number;
};

export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TeacherPayload) => {
      const res = await api.post<ApiResponse<Teacher>>('/teachers', payload);
      return res.data;
    },
    onSuccess: (resp) => {
      toast.success(resp.message || 'Teacher created');
      qc.invalidateQueries({ queryKey: ['teachers'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create teacher');
    },
  });
}

export function useUpdateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TeacherPayload & { teacherId: number }) => {
      const res = await api.put<ApiResponse<Teacher>>('/teachers', payload);
      return res.data;
    },
    onSuccess: (resp) => {
      toast.success(resp.message || 'Teacher updated');
      qc.invalidateQueries({ queryKey: ['teachers'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update teacher');
    },
  });
}

export function useDeleteTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (teacherId: number) => {
      const res = await api.delete<ApiResponse<unknown>>('/teachers', { params: { id: teacherId } });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Teacher deactivated');
      qc.invalidateQueries({ queryKey: ['teachers'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete teacher');
    },
  });
}
