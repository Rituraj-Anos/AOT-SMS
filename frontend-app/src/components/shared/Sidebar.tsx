import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, GraduationCap, Users, CalendarCheck, FileEdit,
  Trophy, Wallet, Megaphone, Settings, LogOut, BookOpen, ClipboardCheck, FolderOpen, CalendarDays
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { initials, cn } from '@/lib/utils';
import type { Role } from '@/types/api';

interface NavLinkItem { to: string; label: string; icon: React.ReactNode }

const NAV: Record<Role, NavLinkItem[]> = {
  admin: [
    { to: '/admin/dashboard',   label: 'Dashboard',  icon: <LayoutDashboard className="h-4 w-4" /> },
    { to: '/admin/students',    label: 'Students',   icon: <GraduationCap className="h-4 w-4" /> },
    { to: '/admin/teachers',    label: 'Teachers',   icon: <Users className="h-4 w-4" /> },
    { to: '/admin/attendance',  label: 'Attendance', icon: <CalendarCheck className="h-4 w-4" /> },
    { to: '/admin/marks',       label: 'Marks',      icon: <FileEdit className="h-4 w-4" /> },
    { to: '/admin/results',     label: 'Results',    icon: <Trophy className="h-4 w-4" /> },
    { to: '/admin/fees',        label: 'Fees',       icon: <Wallet className="h-4 w-4" /> },
    { to: '/admin/notices',     label: 'Notices',    icon: <Megaphone className="h-4 w-4" /> },
    { to: '/admin/classroom',   label: 'Classroom',  icon: <FolderOpen className="h-4 w-4" /> },
    { to: '/admin/schedule',    label: 'Schedule',   icon: <CalendarDays className="h-4 w-4" /> },
    { to: '/admin/settings',    label: 'Settings',   icon: <Settings className="h-4 w-4" /> },
  ],
  teacher: [
    { to: '/teacher/dashboard',         label: 'Dashboard',       icon: <LayoutDashboard className="h-4 w-4" /> },
    { to: '/teacher/schedule',          label: 'Schedule',        icon: <CalendarDays className="h-4 w-4" /> },
    { to: '/teacher/mark-attendance',   label: 'Mark Attendance', icon: <ClipboardCheck className="h-4 w-4" /> },
    { to: '/teacher/enter-marks',       label: 'Enter Marks',     icon: <FileEdit className="h-4 w-4" /> },
    { to: '/teacher/my-students',       label: 'My Students',     icon: <Users className="h-4 w-4" /> },
    { to: '/teacher/my-notices',        label: 'My Notices',      icon: <Megaphone className="h-4 w-4" /> },
    { to: '/teacher/classroom',         label: 'Classroom',       icon: <FolderOpen className="h-4 w-4" /> },
  ],
  student: [
    { to: '/student/dashboard',     label: 'Dashboard',     icon: <LayoutDashboard className="h-4 w-4" /> },
    { to: '/student/schedule',      label: 'Schedule',      icon: <CalendarDays className="h-4 w-4" /> },
    { to: '/student/my-attendance', label: 'My Attendance', icon: <CalendarCheck className="h-4 w-4" /> },
    { to: '/student/my-marks',      label: 'My Marks',      icon: <BookOpen className="h-4 w-4" /> },
    { to: '/student/my-fees',       label: 'My Fees',       icon: <Wallet className="h-4 w-4" /> },
    { to: '/student/notices',       label: 'Notices',       icon: <Megaphone className="h-4 w-4" /> },
    { to: '/student/classroom',     label: 'Classroom',     icon: <FolderOpen className="h-4 w-4" /> },
  ],
};

/**
 * Reusable inner contents — used by the desktop fixed sidebar AND
 * the mobile <Sheet> drawer in the header.
 */
export function SidebarContents({ onItemClick }: { onItemClick?: () => void }) {
  const me = useAuthStore((s) => s.me);
  const logout = useLogout();
  const location = useLocation();

  if (!me) return null;
  const items = NAV[me.role];

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 border-b border-border flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-gradient-brand text-white grid place-items-center font-extrabold shadow-orange">
          AOT
        </div>
        <div>
          <div className="font-extrabold leading-tight">AOT SMS</div>
          <div className="text-[11px] text-muted-foreground capitalize">{me.role} console</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const active = location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onItemClick}
              className={cn(
                'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-colors',
                active
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {active && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-orange-500" />
              )}
              <span className={cn('inline-flex', active ? 'text-orange-300' : '')}>
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / user */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="flex items-center gap-3 px-1">
          <Avatar><AvatarFallback>{initials(me.name)}</AvatarFallback></Avatar>
          <div className="min-w-0">
            <div className="text-sm font-bold truncate">{me.name}</div>
            <div className="text-[11px] text-muted-foreground capitalize">{me.role}</div>
          </div>
        </div>
        <button
          onClick={() => { logout.mutate(); onItemClick?.(); }}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );
}

/** Desktop fixed sidebar (md and up). */
export function Sidebar() {
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-card">
      <SidebarContents />
    </aside>
  );
}
