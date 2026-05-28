import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, Search, Megaphone, FileText, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SidebarContents } from './Sidebar';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/axios';
import { cn } from '@/lib/utils';
import type { ApiResponse, Notice, StudyMaterial } from '@/types/api';

export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const me = useAuthStore((s) => s.me);
  const navigate = useNavigate();

  // Fetch recent notices
  const notices = useQuery({
    queryKey: ['notifications-notices'],
    queryFn: async () => {
      const r = await api.get<ApiResponse<Notice[]>>('/notices', {
        params: me?.role === 'student' ? { deptId: me.deptId } : undefined,
      });
      return (r.data.data ?? []).slice(0, 5);
    },
    staleTime: 60_000,
  });

  // Fetch recent materials (for students/teachers)
  const materials = useQuery({
    queryKey: ['notifications-materials'],
    enabled: me?.role !== 'admin',
    queryFn: async () => {
      if (!me?.entityId) return [];
      if (me.role === 'teacher') {
        const r = await api.get<ApiResponse<StudyMaterial[]>>('/materials', {
          params: { all: 1 },
        });
        return (r.data.data ?? []).slice(0, 3);
      }
      // Student: get from first subject
      return [];
    },
    staleTime: 60_000,
  });

  const noticeCount = notices.data?.length ?? 0;
  const materialCount = materials.data?.length ?? 0;
  const totalCount = noticeCount + materialCount;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/95 backdrop-blur px-4 md:px-6 gap-3">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <SidebarContents onItemClick={() => setDrawerOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-9 rounded-full bg-muted border-transparent focus-visible:bg-card"
            placeholder="Quick search…"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 relative">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative rounded-full h-9 w-9 inline-flex items-center justify-center text-muted-foreground hover:bg-muted"
        >
          <Bell className="h-4 w-4" />
          {totalCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-orange-500 text-[10px] font-bold text-white grid place-items-center border-2 border-card">
              {totalCount > 9 ? '9+' : totalCount}
            </span>
          )}
        </button>

        {/* Notification dropdown */}
        {notifOpen && (
          <div className="absolute top-12 right-0 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
              <span className="font-bold text-sm">Notifications</span>
              <button onClick={() => setNotifOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {(notices.data ?? []).map((n) => (
                <button
                  key={`notice-${n.noticeId}`}
                  onClick={() => {
                    setNotifOpen(false);
                    const path = me?.role === 'admin' ? '/admin/notices' : me?.role === 'teacher' ? '/teacher/my-notices' : '/student/notices';
                    navigate(path);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <Megaphone className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{n.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{n.body.slice(0, 60)}…</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {n.postDate?.slice(0, 10)} · Notice
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {(materials.data ?? []).map((m) => (
                <button
                  key={`material-${m.materialId}`}
                  onClick={() => {
                    setNotifOpen(false);
                    const path = me?.role === 'teacher' ? '/teacher/classroom' : '/student/classroom';
                    navigate(path);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{m.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {m.materialType} · by {m.teacherName}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {m.postedAt?.slice(0, 10)} · Classroom
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {totalCount === 0 && (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No new notifications
                </div>
              )}
            </div>
            <div className="px-4 py-2 border-t border-border bg-muted/40">
              <button
                onClick={() => {
                  setNotifOpen(false);
                  const path = me?.role === 'admin' ? '/admin/notices' : me?.role === 'teacher' ? '/teacher/my-notices' : '/student/notices';
                  navigate(path);
                }}
                className="text-xs text-orange-600 font-semibold hover:underline"
              >
                View all notices →
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
