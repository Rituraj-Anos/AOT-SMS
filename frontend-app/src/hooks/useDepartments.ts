import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { ApiResponse, Department } from '@/types/api';

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Department[]>>('/departments');
      return res.data.data ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });
}
