import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { ApiResponse, Subject } from '@/types/api';

export function useSubjects(deptId?: number, sem?: number) {
  return useQuery({
    queryKey: ['subjects', { deptId, sem }],
    enabled: !!deptId && !!sem,
    queryFn: async () => {
      const res = await api.get<ApiResponse<Subject[]>>('/subjects', { params: { deptId, sem } });
      return res.data.data ?? [];
    },
  });
}

export function useSubjectsByTeacher(teacherId?: number) {
  return useQuery({
    queryKey: ['subjects', 'teacher', teacherId],
    enabled: !!teacherId,
    queryFn: async () => {
      const res = await api.get<ApiResponse<Subject[]>>('/subjects', { params: { teacherId } });
      return res.data.data ?? [];
    },
  });
}
