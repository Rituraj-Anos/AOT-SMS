import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, BookOpen, GraduationCap, Loader2, TrendingUp,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useAuthStore } from '@/store/authStore';
import { useStudentResult } from '@/hooks/useGrades';
import { useStudentMarks } from '@/hooks/useMarks';
import { GRADE_COLORS, type Grade as GradeLetter } from '@/lib/makaut';
import { cn } from '@/lib/utils';
import type { Grade, Marks } from '@/types/api';

export default function StudentMyMarks() {
  const me = useAuthStore((s) => s.me);
  const studentId = me?.entityId ?? undefined;
  const result = useStudentResult(studentId);

  // Determine active tab — default to highest semester with grades, fall back to current semester or 1
  const semestersWithGrades = useMemo(() => {
    const set = new Set<number>();
    for (const g of (result.data?.grades ?? [])) set.add(g.semester);
    return [...set].sort((a, b) => a - b);
  }, [result.data]);

  const [activeSem, setActiveSem] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (activeSem === undefined && semestersWithGrades.length > 0) {
      setActiveSem(semestersWithGrades[semestersWithGrades.length - 1]);
    }
  }, [semestersWithGrades, activeSem]);

  if (!studentId) {
    return <div className="text-muted-foreground">Not signed in as a student.</div>;
  }

  const cgpa       = Number(result.data?.cgpa ?? 0);
  const percentage = Number(result.data?.percentage ?? 0);
  const sgpaBySem  = result.data?.sgpaBySemester ?? {};
  const backlogs   = result.data?.grades.filter((g) => g.isBacklog && !g.backlogCleared) ?? [];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-xs text-muted-foreground">
          Dashboard › <span className="text-foreground font-semibold">My Marks</span>
        </div>
        <h1 className="text-2xl font-extrabold mt-1">My Marks & Grades</h1>
        <p className="text-sm text-muted-foreground">
          Semester-wise breakdown with SGPA / CGPA / Percentage and backlog overview.
        </p>
      </motion.div>

      {/* Top result strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ResultStat label="CGPA"       value={cgpa.toFixed(2)}       icon={<GraduationCap className="h-5 w-5" />} tone="orange" />
        <ResultStat label="Percentage" value={`${percentage.toFixed(2)}%`} icon={<TrendingUp className="h-5 w-5" />}    tone="info" />
        <ResultStat label="Backlogs"   value={String(backlogs.length)} icon={<AlertTriangle className="h-5 w-5" />} tone={backlogs.length > 0 ? 'danger' : 'success'} />
      </div>

      {/* Backlog warning card */}
      {backlogs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-red-300 bg-red-50 p-4"
        >
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-red-700">
                {backlogs.length} backlog subject{backlogs.length > 1 ? 's' : ''}
              </div>
              <div className="text-sm text-red-700/90">
                You have F-grade subjects to clear. Contact your department for re-exam dates.
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {backlogs.map((b) => (
              <div key={b.gradeId} className="rounded-md bg-white border border-red-200 p-3 text-sm">
                <div className="font-mono font-bold text-red-700">{b.subjectCode ?? `Subject #${b.subjectId}`}</div>
                <div className="text-xs text-muted-foreground">{b.subjectName ?? '—'}</div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Sem {b.semester} · {b.credits} credits
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Loading */}
      {result.isLoading && (
        <Card className="p-12 text-center text-muted-foreground">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-orange-500 mb-3" />
          Loading your results…
        </Card>
      )}

      {/* No data */}
      {!result.isLoading && semestersWithGrades.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto text-orange-500 mb-3" />
          <div className="font-semibold text-foreground mb-1">No grades yet</div>
          <div className="text-sm">Your results will appear here once your teacher publishes them.</div>
        </Card>
      )}

      {/* Tabs */}
      {semestersWithGrades.length > 0 && activeSem !== undefined && (
        <Tabs
          value={String(activeSem)}
          onValueChange={(v) => setActiveSem(Number(v))}
          className="w-full"
        >
          <TabsList className="overflow-x-auto justify-start max-w-full flex-wrap h-auto p-1">
            {semestersWithGrades.map((sem) => (
              <TabsTrigger key={sem} value={String(sem)} className="px-4">
                Sem {sem}
                {sgpaBySem[sem] ? (
                  <span className="ml-2 text-[11px] opacity-70 font-mono">
                    SGPA {Number(sgpaBySem[sem]).toFixed(2)}
                  </span>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>

          {semestersWithGrades.map((sem) => (
            <TabsContent key={sem} value={String(sem)}>
              <SemesterPanel
                studentId={studentId}
                sem={sem}
                grades={(result.data?.grades ?? []).filter((g) => g.semester === sem)}
                sgpa={sgpaBySem[sem] ? Number(sgpaBySem[sem]) : null}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}

function ResultStat({
  label, value, icon, tone,
}: {
  label: string; value: string; icon: React.ReactNode;
  tone: 'orange' | 'info' | 'success' | 'danger';
}) {
  const toneClass = {
    orange:  'bg-orange-100 text-orange-700',
    info:    'bg-indigo-100 text-indigo-700',
    success: 'bg-emerald-100 text-emerald-700',
    danger:  'bg-red-100 text-red-700',
  }[tone];
  return (
    <Card className="p-5 flex items-center gap-4">
      <div className={cn('h-12 w-12 rounded-md grid place-items-center text-2xl', toneClass)}>
        {icon}
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-3xl font-extrabold leading-tight">{value}</div>
      </div>
    </Card>
  );
}

function SemesterPanel({
  studentId, sem, grades, sgpa,
}: {
  studentId: number;
  sem: number;
  grades: Grade[];
  sgpa: number | null;
}) {
  // Pull marks for this sem so the table can show CT/ESE/total alongside the grade
  const marks = useStudentMarks(studentId, sem);

  // Build a quick lookup: subjectId → marks row
  const marksBySubject = useMemo(() => {
    const m = new Map<number, Marks>();
    for (const r of (marks.data ?? [])) m.set(r.subjectId, r);
    return m;
  }, [marks.data]);

  const totalCredits  = grades.reduce((a, g) => a + g.credits, 0);
  const earnedCredits = grades.filter((g) => !g.isBacklog).reduce((a, g) => a + g.credits, 0);

  return (
    <Card className="overflow-hidden mt-2">
      <div className="px-5 py-3 bg-muted/40 border-b border-border flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="font-bold">Semester {sem}</div>
          <div className="text-xs text-muted-foreground">
            {grades.length} subjects · {earnedCredits}/{totalCredits} credits earned
          </div>
        </div>
        {sgpa !== null && (
          <Badge className="text-sm" variant="default">
            SGPA · {sgpa.toFixed(2)}
          </Badge>
        )}
      </div>

      {marks.isLoading && (
        <div className="p-12 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 mx-auto animate-spin text-orange-500 mb-2" />
          Loading marks…
        </div>
      )}

      {!marks.isLoading && (
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: 110 }}>Code</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>CA1</TableHead>
                <TableHead>CA2</TableHead>
                <TableHead>CA3</TableHead>
                <TableHead>CA4</TableHead>
                <TableHead>Best 2</TableHead>
                <TableHead>ESE</TableHead>
                <TableHead>Att</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Credits</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.length === 0 ? (
                <TableRow><TableCell colSpan={13} className="text-center py-12 text-muted-foreground">No grades yet for this semester.</TableCell></TableRow>
              ) : (
                grades.map((g, i) => {
                  const m = marksBySubject.get(g.subjectId);
                  return (
                    <motion.tr
                      key={g.gradeId}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02, duration: 0.2 }}
                      className={cn('border-b transition-colors', g.isBacklog && !g.backlogCleared ? 'bg-red-50' : 'hover:bg-muted/30')}
                    >
                      <TableCell className="font-mono font-semibold text-muted-foreground">{g.subjectCode ?? `#${g.subjectId}`}</TableCell>
                      <TableCell>
                        <div className="font-semibold">{g.subjectName ?? '—'}</div>
                        {g.isBacklog && !g.backlogCleared && (
                          <div className="text-[11px] font-bold uppercase tracking-wide text-red-700 mt-0.5 inline-flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Backlog
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{fmt(m?.ct1)}</TableCell>
                      <TableCell>{fmt(m?.ct2)}</TableCell>
                      <TableCell>{fmt(m?.ct3)}</TableCell>
                      <TableCell>{fmt(m?.ct4)}</TableCell>
                      <TableCell><span className="font-bold text-orange-600">{fmt(m?.bestTwoMarks)}</span></TableCell>
                      <TableCell>{fmt(m?.eseMarks)}</TableCell>
                      <TableCell>{m?.attendanceMarks ?? '—'}</TableCell>
                      <TableCell><span className="font-bold">{fmt(m?.totalMarks)}</span></TableCell>
                      <TableCell>
                        <span className={cn(
                          'inline-flex items-center justify-center w-8 h-8 rounded-md text-sm font-extrabold',
                          GRADE_COLORS[g.grade as GradeLetter],
                        )}>
                          {g.grade}
                        </span>
                      </TableCell>
                      <TableCell>{g.gradePoint}</TableCell>
                      <TableCell>{g.credits}</TableCell>
                    </motion.tr>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}

function fmt(v: number | null | undefined): string {
  if (v == null) return '—';
  if (typeof v === 'number') {
    return Number.isInteger(v) ? String(v) : v.toFixed(2);
  }
  return String(v);
}
