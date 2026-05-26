import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, BookOpen, GraduationCap, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/shared/StatCard';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import type { ApiResponse, AttendanceSummary, ResultBundle } from '@/types/api';

export default function StudentDashboard() {
  const me = useAuthStore((s) => s.me);
  const id = me?.entityId;

  const att = useQuery({
    queryKey: ['attendance', 'student', id],
    enabled: !!id,
    queryFn: async () => {
      const r = await api.get<ApiResponse<AttendanceSummary[]>>('/attendance', { params: { studentId: id } });
      return r.data.data ?? [];
    },
  });

  const result = useQuery({
    queryKey: ['result', id],
    enabled: !!id,
    queryFn: async () => {
      const r = await api.get<ApiResponse<ResultBundle>>('/grades', { params: { studentId: id } });
      return r.data.data;
    },
  });

  const totals = (att.data ?? []).reduce(
    (a, r) => ({ held: a.held + r.held, present: a.present + r.present }),
    { held: 0, present: 0 },
  );
  const overall = totals.held ? (totals.present * 100) / totals.held : 0;

  const atRisk = (att.data ?? []).filter((r) => r.percent < 75);
  const backlogs = result.data?.backlogCount ?? 0;
  const cgpa = result.data?.cgpa ?? 0;
  const sgpas = result.data?.sgpaBySemester ?? {};
  const currentSgpa = Object.values(sgpas).at(-1) ?? 0;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-extrabold">Hi, {me?.name?.split(' ')[0] || 'Student'}</h1>
        <p className="text-sm text-muted-foreground">Here's your academic snapshot.</p>
      </motion.div>

      {atRisk.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-orange-300 bg-orange-50 p-4 flex items-start gap-3"
        >
          <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-orange-700">Attendance below 75%</div>
            <ul className="text-sm text-orange-700/90 list-disc list-inside mt-1">
              {atRisk.map((r) => (
                <li key={r.subjectId}>
                  {r.subjectCode}: <strong>{r.percent.toFixed(1)}%</strong>{' '}
                  — need <strong>{r.classesNeededFor75}</strong> more classes.
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}

      {backlogs > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-red-300 bg-red-50 p-4 flex items-start gap-3"
        >
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-red-700">{backlogs} backlog subject{backlogs > 1 ? 's' : ''}</div>
            <div className="text-sm text-red-700/90 mt-0.5">Visit My Marks for the full list.</div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Overall Att%" value={Math.round(overall)} icon={<BookOpen className="h-6 w-6" />} tone={overall < 75 ? 'danger' : 'success'} />
        <StatCard label="Current SGPA" value={Math.round(Number(currentSgpa) * 100) / 100} icon={<TrendingUp className="h-6 w-6" />} tone="info" />
        <StatCard label="CGPA"         value={Math.round(Number(cgpa) * 100) / 100}        icon={<GraduationCap className="h-6 w-6" />} tone="orange" />
        <StatCard label="Backlogs"     value={backlogs} icon={<AlertTriangle className="h-6 w-6" />} tone={backlogs > 0 ? 'danger' : 'success'} />
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="font-bold">Attendance — top subjects</div>
        </div>
        <div className="space-y-3">
          {(att.data ?? []).slice(0, 5).map((r) => (
            <div key={r.subjectId}>
              <div className="flex items-center justify-between text-sm mb-1">
                <div>
                  <span className="font-mono font-semibold">{r.subjectCode}</span>{' '}
                  <span className="text-muted-foreground text-xs">{r.subjectName}</span>
                </div>
                <Badge variant={r.percent < 75 ? 'destructive' : 'success'}>
                  {r.percent.toFixed(1)}%
                </Badge>
              </div>
              <Progress
                value={Math.min(100, r.percent)}
                indicatorClassName={r.percent < 75 ? 'bg-red-500' : ''}
              />
            </div>
          ))}
          {att.data && att.data.length === 0 && (
            <div className="text-sm text-muted-foreground">No attendance data yet.</div>
          )}
        </div>
      </Card>
    </div>
  );
}
