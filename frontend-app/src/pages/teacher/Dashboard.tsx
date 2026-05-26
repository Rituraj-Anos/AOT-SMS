import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  ClipboardCheck, FileEdit, Loader2, Users, BookOpen, Calendar,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/shared/StatCard';
import { useTeacherMappings } from '@/hooks/useTeachers';
import { api } from '@/lib/axios';
import type { ApiResponse, Student } from '@/types/api';

export default function TeacherDashboard() {
  const me = useAuthStore((s) => s.me);
  const teacherId = me?.entityId ?? null;

  const mappings = useTeacherMappings(teacherId);

  // Unique slices to count students
  const slices = useMemo(() => {
    const seen = new Set<string>();
    const out: { deptId: number; sem: number; section: string }[] = [];
    for (const m of mappings.data ?? []) {
      const k = `${m.deptId}-${m.semester}-${m.section ?? ''}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ deptId: m.deptId, sem: m.semester, section: m.section ?? '' });
    }
    return out;
  }, [mappings.data]);

  const sliceQuery = useQuery({
    queryKey: ['my-students-count', slices],
    enabled: slices.length > 0,
    queryFn: async () => {
      const set = new Set<number>();
      for (const s of slices) {
        if (!s.deptId || !s.sem) continue;
        try {
          const params: Record<string, any> = { deptId: s.deptId, sem: s.sem };
          if (s.section) params.section = s.section;
          const r = await api.get<ApiResponse<Student[]>>('/students', { params });
          for (const st of (r.data.data ?? [])) set.add(st.studentId);
        } catch { /* ignore */ }
      }
      return set.size;
    },
    staleTime: 60_000,
  });

  const totalStudents = sliceQuery.data ?? 0;

  const subjectCount = mappings.data?.length ?? 0;
  const sectionCount = slices.length;

  const isLoading = mappings.isLoading || sliceQuery.isLoading;

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-extrabold">{greeting}, {me?.name?.split(' ')[0] || 'Teacher'}</h1>
        <p className="text-sm text-muted-foreground">
          Here's a quick view of your assignments. Use the sidebar to mark attendance or enter marks.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="My Students"      value={totalStudents} icon={<Users className="h-6 w-6" />}        tone="orange" />
        <StatCard label="Subject Mappings" value={subjectCount}  icon={<BookOpen className="h-6 w-6" />}     tone="info" />
        <StatCard label="Sections"         value={sectionCount}  icon={<Calendar className="h-6 w-6" />}     tone="success" />
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-border">
          <div className="font-bold">My Subjects</div>
          <div className="text-xs text-muted-foreground">
            {isLoading
              ? 'Loading…'
              : subjectCount === 0
                ? 'No subjects assigned yet — contact admin.'
                : `${subjectCount} assignment(s) across ${sectionCount} section(s)`}
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-orange-500 mb-3" />
            Loading…
          </div>
        ) : subjectCount === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto text-orange-500 mb-3" />
            Once admin maps you to subjects, they will appear here with quick links.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-5">
            {(mappings.data ?? []).map((m, i) => (
              <motion.div
                key={m.mappingId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
              >
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="font-mono text-sm font-bold">{m.subjectCode}</div>
                      <div className="text-sm text-muted-foreground truncate">{m.subjectName}</div>
                    </div>
                    <Badge variant="info">Sem {m.semester} · Sec {m.section || '—'}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
                    <div>{m.academicYear || 'Current year'}</div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <ClipboardCheck className="h-3.5 w-3.5" /> Attendance
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <FileEdit className="h-3.5 w-3.5" /> Marks
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
