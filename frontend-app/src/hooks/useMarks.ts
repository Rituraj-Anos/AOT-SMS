import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import type { ApiResponse, Marks } from '@/types/api';

/** Marks for a single student in a semester. */
export function useStudentMarks(studentId?: number, sem?: number) {
  return useQuery({
    queryKey: ['marks', 'student', studentId, sem],
    enabled: !!studentId && !!sem,
    queryFn: async () => {
      const r = await api.get<ApiResponse<Marks[]>>('/marks', {
        params: { studentId, sem },
      });
      return r.data.data ?? [];
    },
  });
}

/** Marks for every student in a subject (teacher entry view). */
export function useSubjectMarks(subjectId?: number, sem?: number) {
  return useQuery({
    queryKey: ['marks', 'subject', subjectId, sem],
    enabled: !!subjectId && !!sem,
    queryFn: async () => {
      const r = await api.get<ApiResponse<Marks[]>>('/marks', {
        params: { subjectId, sem },
      });
      return r.data.data ?? [];
    },
  });
}

export interface MarksSavePayload {
  studentId:        number;
  subjectId:        number;
  semester:         number;
  academicYear?:    string | null;
  ct1?:             number | null;
  ct2?:             number | null;
  ct3?:             number | null;
  ct4?:             number | null;
  eseMarks?:        number | null;
  attendanceMarks?: number | null;
  isResultDeclared?: boolean;
}

export function useSaveMarks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: MarksSavePayload) => {
      const r = await api.post<ApiResponse<Marks>>('/marks', payload);
      return r.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marks'] });
      qc.invalidateQueries({ queryKey: ['result'] });   // SGPA cascade
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to save marks');
    },
  });
}
