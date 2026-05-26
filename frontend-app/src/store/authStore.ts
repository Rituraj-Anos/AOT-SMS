import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthMe } from '@/types/api';

/**
 * Auth state. The actual JWT lives in an httpOnly cookie set by the backend.
 * We only persist the user identity for UI rendering.
 */
interface AuthState {
  me: AuthMe | null;
  isReady: boolean;          // true once /auth/me has been resolved at least once
  setMe: (me: AuthMe | null) => void;
  setReady: (b: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      me: null,
      isReady: false,
      setMe:    (me)    => set({ me }),
      setReady: (b)     => set({ isReady: b }),
      clear:    ()      => set({ me: null, isReady: true }),
    }),
    { name: 'aot-sms-auth' },
  ),
);
