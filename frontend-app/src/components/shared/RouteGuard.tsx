import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { Role } from '@/types/api';

interface Props {
  children: React.ReactNode;
  roles?: Role[];
}

/** Wrap a route subtree with this to require authentication & specific roles. */
export function RouteGuard({ children, roles }: Props) {
  const me      = useAuthStore((s) => s.me);
  const isReady = useAuthStore((s) => s.isReady);
  const loc     = useLocation();

  if (!isReady) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-orange-200 border-t-orange-500" />
      </div>
    );
  }

  if (!me) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  if (roles && !roles.includes(me.role)) {
    return <Navigate to={`/${me.role}/dashboard`} replace />;
  }

  return <>{children}</>;
}
