import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import type { ApiResponse, Notice } from '@/types/api';

/** Visible notices for the current user (auto-targeted by role/dept). */
export function useNotices(deptId?: number) {
  return useQuery({
    queryKey: ['notices', { deptId }],
    queryFn: async () => {
      const r = await api.get<ApiResponse<Notice[]>>('/notices', { params: { deptId } });
      return r.data.data ?? [];
    },
  });
}

/** All notices (admin view, ignores expiry). */
export function useAllNotices() {
  return useQuery({
    queryKey: ['notices', 'all'],
    queryFn: async () => {
      const r = await api.get<ApiResponse<Notice[]>>('/notices', { params: { all: 1 } });
      return r.data.data ?? [];
    },
  });
}

export interface NoticeCreatePayload {
  title:          string;
  body:           string;
  targetType:     'all' | 'dept' | 'section' | 'student';
  targetDeptId?:  number | null;
  targetSection?: string | null;
  isPinned?:      boolean;
  expiryDate?:    string | null;
}

export function useCreateNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: NoticeCreatePayload) => {
      const r = await api.post<ApiResponse<{ noticeId: number }>>('/notices', payload);
      return r.data;
    },
    onSuccess: (resp) => {
      toast.success(resp.message || 'Notice posted');
      qc.invalidateQueries({ queryKey: ['notices'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to post notice');
    },
  });
}

export function useTogglePin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (noticeId: number) => {
      const r = await api.put<ApiResponse<unknown>>('/notices', { noticeId });
      return r.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notices'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to toggle pin');
    },
  });
}

export function useDeleteNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (noticeId: number) => {
      const r = await api.delete<ApiResponse<unknown>>('/notices', { params: { id: noticeId } });
      return r.data;
    },
    onSuccess: () => {
      toast.success('Notice deleted');
      qc.invalidateQueries({ queryKey: ['notices'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete');
    },
  });
}
