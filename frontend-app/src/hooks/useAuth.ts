import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import type { ApiResponse, AuthMe, Role } from '@/types/api';

interface LoginPayload { userId: string; password: string; role: Role }

export function useLogin() {
  const setMe = useAuthStore((s) => s.setMe);
  const setReady = useAuthStore((s) => s.setReady);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: LoginPayload): Promise<AuthMe> => {
      const res = await api.post<ApiResponse<AuthMe>>('/auth/login', payload);
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.message || 'Login failed');
      }
      return res.data.data;
    },
    onSuccess: (me) => {
      setMe(me);
      setReady(true);
      qc.clear();
    },
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try { await api.post('/auth/logout'); } catch {/* ignore */}
    },
    onSettled: () => { clear(); qc.clear(); },
  });
}

/**
 * Resolve /auth/me ONCE on mount.
 *
 * We deliberately do NOT refetch on window focus or interval — re-running this
 * during navigation flips `isReady` and unmounts in-flight route content, which
 * makes sidebar clicks appear to "do nothing" until you refresh.
 *
 * If the JWT cookie expires, axios interceptor (lib/axios.ts) catches the 401
 * and bounces the user to /login.
 */
export function useBootstrapAuth() {
  const setMe    = useAuthStore((s) => s.setMe);
  const setReady = useAuthStore((s) => s.setReady);
  const me       = useAuthStore((s) => s.me);
  const ranOnce  = useRef(false);

  const q = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async (): Promise<AuthMe | null> => {
      try {
        const res = await api.get<ApiResponse<AuthMe>>('/auth/me');
        return res.data.success ? res.data.data : null;
      } catch {
        return null;
      }
    },
    // Single fetch on mount. No focus / interval / network refetches.
    refetchOnWindowFocus: false,
    refetchOnReconnect:   false,
    refetchOnMount:       false,
    staleTime:            Infinity,
    gcTime:               Infinity,
    retry:                false,
  });

  useEffect(() => {
    if (ranOnce.current) return;
    if (q.isSuccess) {
      setMe(q.data ?? null);
      setReady(true);
      ranOnce.current = true;
    } else if (q.isError) {
      setMe(null);
      setReady(true);
      ranOnce.current = true;
    }
  }, [q.isSuccess, q.isError, q.data, setMe, setReady]);

  return { me, ready: useAuthStore((s) => s.isReady) };
}
