import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { ApiResponse, Student, StudentType } from '@/types/api';
import { toast } from 'sonner';

export interface StudentFilters {
  deptId?: number;
  sem?: number;
  section?: string;
  type?: StudentType;
  search?: string;
}

export function useStudents(filters: StudentFilters = {}) {
  return useQuery({
    queryKey: ['students', filters],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Student[]>>('/students', { params: filters });
      return res.data.data ?? [];
    },
  });
}

export type StudentPayload = Omit<Student, 'studentId' | 'deptCode' | 'isActive'> & {
  studentId?: number;
};

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: StudentPayload) => {
      const res = await api.post<ApiResponse<Student>>('/students', payload);
      return res.data;
    },
    onSuccess: (resp) => {
      toast.success(resp.message || 'Student created');
      qc.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create student');
    },
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: StudentPayload & { studentId: number }) => {
      // Servlet PUT expects studentId in the JSON body (single-endpoint design).
      const res = await api.put<ApiResponse<Student>>('/students', payload);
      return res.data;
    },
    onSuccess: (resp) => {
      toast.success(resp.message || 'Student updated');
      qc.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update student');
    },
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (studentId: number) => {
      const res = await api.delete<ApiResponse<unknown>>('/students', { params: { id: studentId } });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Student deactivated');
      qc.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete student');
    },
  });
}
