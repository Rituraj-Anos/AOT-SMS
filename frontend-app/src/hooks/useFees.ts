import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import type { ApiResponse, Fee } from '@/types/api';

/** All fee records for one student. */
export function useStudentFees(studentId?: number) {
  return useQuery({
    queryKey: ['fees', 'student', studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const r = await api.get<ApiResponse<Fee[]>>('/fees', { params: { studentId } });
      return r.data.data ?? [];
    },
  });
}

/** Pending-fee defaulters — admin view. */
export function usePendingFees(deptId?: number, sem?: number) {
  return useQuery({
    queryKey: ['fees', 'pending', { deptId, sem }],
    queryFn: async () => {
      const r = await api.get<ApiResponse<Fee[]>>('/fees', {
        params: { pending: 1, deptId, sem },
      });
      return r.data.data ?? [];
    },
  });
}

export interface FeeCreatePayload {
  studentId:    number;
  academicYear?: string | null;
  semester?:    number | null;
  totalAmount:  number;
  amountPaid?:  number | null;
  dueDate?:     string | null;     // yyyy-MM-dd
  paymentDate?: string | null;
  paymentMode?: 'Cash' | 'Online' | 'DD' | 'Cheque' | null;
  receiptNo?:   string | null;
  remarks?:     string | null;
}

export function useCreateFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FeeCreatePayload) => {
      const r = await api.post<ApiResponse<{ feeId: number }>>('/fees', payload);
      return r.data;
    },
    onSuccess: (resp) => {
      toast.success(resp.message || 'Fee record created');
      qc.invalidateQueries({ queryKey: ['fees'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create fee');
    },
  });
}

export interface FeePaymentPayload {
  feeId:      number;
  amount:     number;
  mode:       'Cash' | 'Online' | 'DD' | 'Cheque';
  receiptNo?: string;
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FeePaymentPayload) => {
      const r = await api.put<ApiResponse<unknown>>('/fees', payload);
      return r.data;
    },
    onSuccess: (resp) => {
      toast.success(resp.message || 'Payment recorded');
      qc.invalidateQueries({ queryKey: ['fees'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to record payment');
    },
  });
}
