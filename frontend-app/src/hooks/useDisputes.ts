import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api';

export interface Dispute {
  disputeId: number;
  studentId: number;
  subjectId: number;
  classDate: string;
  studentNote: string;
  status: 'pending' | 'resolved' | 'rejected';
  teacherNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: number | null;
  subjectCode?: string;
  subjectName?: string;
  rollNo?: string;
  studentName?: string;
}

export function useDisputes() {
  return useQuery({
    queryKey: ['disputes'],
    queryFn: async () => {
      const r = await api.get<ApiResponse<Dispute[]>>('/disputes');
      return r.data.data ?? [];
    },
  });
}

export function useRaiseDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { subjectId: number; classDate: string; note: string }) => {
      const r = await api.post<ApiResponse<{ disputeId: number }>>('/disputes', payload);
      return r.data;
    },
    onSuccess: () => {
      toast.success('Dispute raised successfully');
      qc.invalidateQueries({ queryKey: ['disputes'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to raise dispute');
    },
  });
}

export function useResolveDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { disputeId: number; status: 'resolved' | 'rejected'; teacherNote?: string }) => {
      const r = await api.put<ApiResponse<{ disputeId: number }>>('/disputes', payload);
      return r.data;
    },
    onSuccess: (_, vars) => {
      toast.success(`Dispute ${vars.status}`);
      qc.invalidateQueries({ queryKey: ['disputes'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to resolve dispute');
    },
  });
}
