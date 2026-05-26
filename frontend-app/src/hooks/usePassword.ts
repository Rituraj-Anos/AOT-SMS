import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api';

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword:     string;
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (payload: ChangePasswordPayload) => {
      const r = await api.post<ApiResponse<unknown>>('/auth/password', payload);
      return r.data;
    },
    onSuccess: (resp) => {
      toast.success(resp.message || 'Password updated');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update password');
    },
  });
}
