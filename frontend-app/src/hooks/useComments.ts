import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api';

export interface Comment {
  commentId: number;
  materialId: number;
  postedByRole: 'admin' | 'teacher' | 'student';
  postedById: number;
  postedByName: string;
  commentText: string;
  postedAt: string;
}

export function useComments(materialId?: number) {
  return useQuery({
    queryKey: ['comments', materialId],
    enabled: !!materialId,
    queryFn: async () => {
      const r = await api.get<ApiResponse<Comment[]>>('/comments', { params: { materialId } });
      return r.data.data ?? [];
    },
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { materialId: number; text: string }) => {
      const r = await api.post<ApiResponse<{ commentId: number }>>('/comments', payload);
      return r.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['comments', vars.materialId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to post comment');
    },
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: number) => {
      const r = await api.delete<ApiResponse<unknown>>('/comments', { params: { id: commentId } });
      return r.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete comment');
    },
  });
}
