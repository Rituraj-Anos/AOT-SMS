import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import type { ApiResponse, StudyMaterial, Submission, MaterialType } from '@/types/api';

export function useMaterials(subjectId?: number, type?: MaterialType | 'all') {
  return useQuery({
    queryKey: ['materials', subjectId, type],
    enabled: !!subjectId,
    queryFn: async () => {
      const params: Record<string, any> = { subjectId };
      if (type && type !== 'all') params.type = type;
      const r = await api.get<ApiResponse<StudyMaterial[]>>('/materials', { params });
      return r.data.data ?? [];
    },
  });
}

export function useAllMaterials(deptId?: number, subjectId?: number, type?: string) {
  return useQuery({
    queryKey: ['materials', 'all', { deptId, subjectId, type }],
    queryFn: async () => {
      const params: Record<string, any> = { all: 1 };
      if (deptId) params.deptId = deptId;
      if (subjectId) params.subjectId = subjectId;
      if (type && type !== 'all') params.type = type;
      const r = await api.get<ApiResponse<StudyMaterial[]>>('/materials', { params });
      return r.data.data ?? [];
    },
  });
}

export function usePostMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const r = await api.post<ApiResponse<{ materialId: number }>>('/materials', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return r.data;
    },
    onSuccess: (resp) => {
      toast.success(resp.message || 'Material posted');
      qc.invalidateQueries({ queryKey: ['materials'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to post material');
    },
  });
}

export function useDeleteMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (materialId: number) => {
      const r = await api.delete<ApiResponse<unknown>>('/materials', { params: { id: materialId } });
      return r.data;
    },
    onSuccess: () => {
      toast.success('Material deleted');
      qc.invalidateQueries({ queryKey: ['materials'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete');
    },
  });
}

export function useSubmissions(materialId?: number) {
  return useQuery({
    queryKey: ['submissions', materialId],
    enabled: !!materialId,
    queryFn: async () => {
      const r = await api.get<ApiResponse<Submission[]>>('/submissions', { params: { materialId } });
      return r.data.data ?? [];
    },
  });
}

export function useMySubmission(materialId?: number, studentId?: number) {
  return useQuery({
    queryKey: ['submissions', 'mine', materialId, studentId],
    enabled: !!materialId && !!studentId,
    queryFn: async () => {
      const r = await api.get<ApiResponse<Submission | null>>('/submissions', {
        params: { materialId, studentId },
      });
      return r.data.data;
    },
  });
}

export function useSubmitAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const r = await api.post<ApiResponse<{ submissionId: number }>>('/submissions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return r.data;
    },
    onSuccess: (resp) => {
      toast.success(resp.message || 'Assignment submitted');
      qc.invalidateQueries({ queryKey: ['submissions'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Submission failed');
    },
  });
}

export function useGradeSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { submissionId: number; grade: string; feedback?: string }) => {
      const r = await api.put<ApiResponse<unknown>>('/submissions', payload);
      return r.data;
    },
    onSuccess: () => {
      toast.success('Graded');
      qc.invalidateQueries({ queryKey: ['submissions'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Grading failed');
    },
  });
}
