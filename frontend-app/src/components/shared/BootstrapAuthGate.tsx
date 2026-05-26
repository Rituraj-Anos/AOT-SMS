import { Outlet } from 'react-router-dom';
import { useBootstrapAuth } from '@/hooks/useAuth';

/**
 * Wraps the app once. Calls /auth/me on mount so the auth store is hydrated
 * before any guarded route renders. Children render either way; RouteGuard
 * will gate on the result.
 */
export function BootstrapAuthGate() {
  useBootstrapAuth();
  return <Outlet />;
}
