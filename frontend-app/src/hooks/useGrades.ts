import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { ApiResponse, Grade, ResultBundle } from '@/types/api';

/** Full result bundle for one student: grades + sgpaBySemester + cgpa + percentage + backlogCount. */
export function useStudentResult(studentId?: number) {
  return useQuery({
    queryKey: ['result', studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const r = await api.get<ApiResponse<ResultBundle>>('/grades', { params: { studentId } });
      return r.data.data;
    },
  });
}

/** Semester slice — useful when a tab loads its specific grades. */
export function useStudentSemesterGrades(studentId?: number, sem?: number) {
  return useQuery({
    queryKey: ['result', studentId, 'sem', sem],
    enabled: !!studentId && !!sem,
    queryFn: async () => {
      const r = await api.get<ApiResponse<Grade[]>>('/grades', { params: { studentId, sem } });
      return r.data.data ?? [];
    },
  });
}

/** Backlog (F-grade) subjects for a student. */
export function useStudentBacklogs(studentId?: number) {
  return useQuery({
    queryKey: ['result', studentId, 'backlogs'],
    enabled: !!studentId,
    queryFn: async () => {
      const r = await api.get<ApiResponse<Grade[]>>('/grades', { params: { studentId, backlogs: 1 } });
      return r.data.data ?? [];
    },
  });
}
