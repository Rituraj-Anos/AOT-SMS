import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, CalendarCheck, CalendarRange, CheckCheck, ClipboardList,
  Download, FileSpreadsheet, History, Loader2, Save, Table2, UserX, Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/authStore';
import { useSubjectsByTeacher } from '@/hooks/useSubjects';
import {
  useClassRoster, useMarkAttendance,
} from '@/hooks/useAttendance';
import { usePhaseAttendance, useFullSheet } from '@/hooks/useAttendanceHub';
import { initials, cn } from '@/lib/utils';
import type { AttendanceStatus, ClassRosterRow } from '@/types/api';

type Status = AttendanceStatus;

const STATUS_LIST: { code: Status; label: string; tone: string }[] = [
  { code: 'P',  label: 'Present',        tone: 'bg-emerald-500 text-white' },
  { code: 'A',  label: 'Absent',         tone: 'bg-red-500     text-white' },
  { code: 'L',  label: 'Late',           tone: 'bg-amber-500   text-white' },
  { code: 'ML', label: 'Medical Leave',  tone: 'bg-indigo-500  text-white' },
];

// Hard-coded phase ranges (later editable from admin settings)
const PHASES = {
  'Phase 1': { start: '2026-01-01', end: '2026-03-15' },
  'Phase 2': { start: '2026-03-16', end: '2026-05-08' },
  'Overall': { start: '2026-01-01', end: '2026-06-30' },
} as const;
type PhaseKey = keyof typeof PHASES;

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ─────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────
export default function TeacherMarkAttendance() {
  const me = useAuthStore((s) => s.me);
  const subjects = useSubjectsByTeacher(me?.entityId ?? undefined);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <div className="text-xs text-muted-foreground">
            Dashboard › <span className="text-foreground font-semibold">Attendance Hub</span>
          </div>
          <h1 className="text-2xl font-extrabold mt-1">Attendance Hub</h1>
          <p className="text-sm text-muted-foreground">Mark, review, and export attendance — all in one place.</p>
        </div>
      </motion.div>

      <Tabs defaultValue="mark" className="w-full">
        <TabsList className="h-11 w-full md:w-auto rounded-full">
          <TabsTrigger value="mark" className="px-5">
            <CalendarCheck className="h-4 w-4 mr-2" /> Mark Attendance
          </TabsTrigger>
          <TabsTrigger value="records" className="px-5">
            <ClipboardList className="h-4 w-4 mr-2" /> Records
          </TabsTrigger>
          <TabsTrigger value="export" className="px-5">
            <Download className="h-4 w-4 mr-2" /> Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mark" forceMount>
          <TabPane keyId="mark">
            <MarkAttendanceTab subjects={subjects.data ?? []} subjectsLoading={subjects.isLoading} />
          </TabPane>
        </TabsContent>

        <TabsContent value="records" forceMount>
          <TabPane keyId="records">
            <RecordsTab subjects={subjects.data ?? []} subjectsLoading={subjects.isLoading} />
          </TabPane>
        </TabsContent>

        <TabsContent value="export" forceMount>
          <TabPane keyId="export">
            <ExportTab subjects={subjects.data ?? []} />
          </TabPane>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TabPane({ children, keyId }: { children: React.ReactNode; keyId: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={keyId}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.18 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────
// TAB 1 — Mark Attendance
// ─────────────────────────────────────────────────────────────────────
type SubjectMini = { subjectId: number; subjectCode: string; subjectName: string };

function MarkAttendanceTab({ subjects, subjectsLoading }: { subjects: SubjectMini[]; subjectsLoading: boolean }) {
  const me = useAuthStore((s) => s.me);
  const today = todayIso();
  const [subjectId, setSubjectId] = useState<number | undefined>(undefined);
  const [date,      setDate]      = useState<string>(today);
  const [statusMap, setStatusMap] = useState<Record<number, Status>>({});

  const roster   = useClassRoster(subjectId, date);
  const save     = useMarkAttendance();

  useEffect(() => {
    if (!roster.data) return;
    const next: Record<number, Status> = {};
    for (const r of roster.data) if (r.status) next[r.studentId] = r.status as Status;
    setStatusMap(next);
  }, [roster.data]);

  const isToday = date === today;

  // Sort: below-75 first, then by roll
  const sortedRoster = useMemo(() => {
    if (!roster.data) return [];
    return [...roster.data].sort((a, b) => {
      const aLow = (a.overallPct ?? 100) < 75 ? 0 : 1;
      const bLow = (b.overallPct ?? 100) < 75 ? 0 : 1;
      if (aLow !== bLow) return aLow - bLow;
      return a.rollNo.localeCompare(b.rollNo);
    });
  }, [roster.data]);

  const tally = useMemo(() => {
    const t: Record<Status, number> & { total: number; unmarked: number } = {
      P: 0, A: 0, L: 0, ML: 0, total: 0, unmarked: 0,
    };
    for (const r of roster.data ?? []) {
      t.total++;
      const s = statusMap[r.studentId];
      if (!s) t.unmarked++; else t[s]++;
    }
    return t;
  }, [roster.data, statusMap]);

  function setStatus(studentId: number, status: Status) {
    setStatusMap((prev) => ({ ...prev, [studentId]: status }));
  }
  function bulkAll(status: Status) {
    if (!roster.data) return;
    const next: Record<number, Status> = {};
    for (const r of roster.data) next[r.studentId] = status;
    setStatusMap(next);
  }

  async function handleSubmit() {
    if (!subjectId) { toast.warning('Pick a subject first.'); return; }
    if (!roster.data || roster.data.length === 0) { toast.warning('No students loaded.'); return; }
    if (!isToday && me?.role === 'teacher') {
      // Past date editing is allowed — backend now supports it via duplicate-key update.
      // (Backend enforces today-only via servlet. Loosen client check for past edits here.)
    }
    const entries = Object.entries(statusMap)
      .map(([sid, status]) => ({ studentId: Number(sid), status }));
    if (entries.length === 0) { toast.warning('Mark at least one student.'); return; }
    await save.mutateAsync({ subjectId, date, entries });
  }

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-3 items-end">
          <div>
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Subject
            </Label>
            <Select value={subjectId?.toString() ?? ''} onValueChange={(v) => setSubjectId(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder={subjectsLoading ? 'Loading…' : 'Pick a subject'} />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.subjectId} value={s.subjectId.toString()}>
                    <span className="font-mono mr-2">{s.subjectCode}</span> {s.subjectName}
                  </SelectItem>
                ))}
                {subjects.length === 0 && !subjectsLoading && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">No subjects assigned.</div>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Date
            </Label>
            <Input
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => roster.refetch()} disabled={!subjectId || roster.isFetching}>
              {roster.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
              Load
            </Button>
          </div>
        </div>
      </Card>

      {/* Past-date warning banner */}
      {!isToday && (
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 flex items-center gap-3"
        >
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="text-sm">
            <span className="font-bold text-amber-700 dark:text-amber-400">📅 Editing past attendance for {date}</span>
            <span className="text-amber-700/80 dark:text-amber-300/80 ml-2">
              Existing records are pre-filled. Save will overwrite.
            </span>
          </div>
        </motion.div>
      )}

      {/* Live tally + bulk actions */}
      {roster.data && roster.data.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex flex-wrap gap-2">
            <Pill label="P"  count={tally.P}  variant="bg-emerald-100 text-emerald-700" />
            <Pill label="A"  count={tally.A}  variant="bg-red-100      text-red-700" />
            <Pill label="L"  count={tally.L}  variant="bg-amber-100    text-amber-700" />
            <Pill label="ML" count={tally.ML} variant="bg-indigo-100   text-indigo-700" />
            <Pill label="·"  count={tally.unmarked}
                 variant="bg-muted text-muted-foreground" suffix="unmarked" />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => bulkAll('P')}>
              <CheckCheck className="h-4 w-4" /> All Present
            </Button>
            <Button variant="secondary" onClick={() => bulkAll('A')}>
              <UserX className="h-4 w-4" /> All Absent
            </Button>
            <Button onClick={handleSubmit} disabled={save.isPending}>
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Attendance
            </Button>
          </div>
        </motion.div>
      )}

      {/* Empty / loading states */}
      {!subjectId && (
        <Card className="p-12 text-center text-muted-foreground">
          <CalendarCheck className="h-10 w-10 mx-auto text-orange-500 mb-3" />
          Pick a subject to load students.
        </Card>
      )}
      {subjectId && roster.isLoading && (
        <Card className="p-12 text-center text-muted-foreground">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-orange-500 mb-3" />
          Loading roster…
        </Card>
      )}
      {subjectId && roster.data && roster.data.length === 0 && !roster.isLoading && (
        <Card className="p-12 text-center text-muted-foreground">
          <Users className="h-10 w-10 mx-auto text-orange-500 mb-3" />
          No active students found.
        </Card>
      )}

      {/* Roster */}
      {subjectId && sortedRoster.length > 0 && (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[60px_1fr_90px_auto] gap-3 px-5 py-3 border-b border-border bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <div>#</div>
            <div>Student</div>
            <div className="text-right">Overall %</div>
            <div className="text-right">Status</div>
          </div>
          <div className="divide-y divide-border">
            {sortedRoster.map((r, i) => (
              <RosterRow
                key={r.studentId}
                index={i}
                row={r}
                status={statusMap[r.studentId]}
                onSet={(s) => setStatus(r.studentId, s)}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Pill({ label, count, variant, suffix }:
  { label: string; count: number; variant: string; suffix?: string }) {
  return (
    <div className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold', variant)}>
      <span className="font-mono font-bold">{label}</span>
      <span>{count}{suffix && <span className="ml-1 opacity-70">{suffix}</span>}</span>
    </div>
  );
}

function RosterRow({
  index, row, status, onSet,
}: {
  index: number;
  row: ClassRosterRow;
  status: AttendanceStatus | undefined;
  onSet: (s: AttendanceStatus) => void;
}) {
  const pct = row.overallPct ?? 0;
  const isLow = pct < 75;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 30) * 0.012, duration: 0.18 }}
      className={cn(
        'grid grid-cols-[60px_1fr_90px_auto] gap-3 px-5 py-3 items-center transition-colors',
        isLow ? 'bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40'
              : 'hover:bg-muted/30',
      )}
    >
      <div className="text-sm font-mono text-muted-foreground">{index + 1}</div>
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-9 w-9"><AvatarFallback>{initials(row.studentName)}</AvatarFallback></Avatar>
        <div className="min-w-0">
          <div className="font-mono font-semibold text-xs text-muted-foreground">{row.rollNo}</div>
          <div className="font-semibold truncate">{row.studentName}</div>
        </div>
      </div>
      <div className="text-right">
        <Badge
          className={cn(
            'font-mono font-bold',
            isLow ? 'bg-red-500 hover:bg-red-500' : 'bg-emerald-500 hover:bg-emerald-500',
            'text-white',
          )}
        >
          {pct.toFixed(1)}%
        </Badge>
      </div>
      <div className="flex gap-1.5 justify-end">
        {STATUS_LIST.map((opt) => {
          const active = status === opt.code;
          return (
            <motion.button
              key={opt.code}
              type="button"
              onClick={() => onSet(opt.code)}
              whileTap={{ scale: 0.92 }}
              animate={active ? { scale: [0.9, 1.08, 1] } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className={cn(
                'h-9 min-w-[44px] px-3 rounded-full text-xs font-bold transition-colors',
                active ? opt.tone : 'bg-muted text-muted-foreground hover:bg-muted-foreground/10',
              )}
              title={opt.label}
            >
              {opt.code}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// TAB 2 — Records
// ─────────────────────────────────────────────────────────────────────
function RecordsTab({ subjects, subjectsLoading }: { subjects: SubjectMini[]; subjectsLoading: boolean }) {
  const me = useAuthStore((s) => s.me);
  const [phase, setPhase] = useState<PhaseKey>('Phase 1');
  const [subjectId, setSubjectId] = useState<number | undefined>(undefined);
  const [view, setView] = useState<'subject' | 'fullsheet'>('subject');

  // Auto-select first subject when loaded
  useEffect(() => {
    if (!subjectId && subjects.length > 0) setSubjectId(subjects[0].subjectId);
  }, [subjects, subjectId]);

  const range = PHASES[phase];
  const phaseQ = usePhaseAttendance(
    subjectId,
    me?.deptId ?? undefined,
    4, // current semester (hardcoded for now)
    range.start, range.end,
  );
  const fullSheet = useFullSheet(me?.deptId ?? undefined, 4);

  const summary = useMemo(() => {
    const rows = phaseQ.data ?? [];
    const total = rows.length;
    // Only count students who have at least 1 class held
    const withData = rows.filter((r) => (r.held ?? 0) > 0);
    const below75 = withData.filter((r) => r.percent < 75).length;
    const detained = withData.filter((r) => r.percent < 65).length;
    const sumPct = withData.reduce((s, r) => s + (r.percent ?? 0), 0);
    const avg = withData.length > 0 ? sumPct / withData.length : 0;
    return { total, below75, detained, avg, marked: withData.length };
  }, [phaseQ.data]);

  return (
    <div className="space-y-5">
      {/* Phase pills */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full bg-muted p-1 gap-1">
          {(Object.keys(PHASES) as PhaseKey[]).map((p) => (
            <button
              key={p}
              onClick={() => setPhase(p)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-semibold transition-colors',
                phase === p ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {p}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">{range.start} → {range.end}</span>

        <div className="ml-auto flex gap-2">
          <Button
            variant={view === 'subject' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setView('subject')}
          >
            <ClipboardList className="h-4 w-4 mr-1" /> Per-Subject
          </Button>
          <Button
            variant={view === 'fullsheet' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setView('fullsheet')}
          >
            <Table2 className="h-4 w-4 mr-1" /> Full Sheet
          </Button>
        </div>
      </div>

      {view === 'subject' ? (
        <>
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-[2fr_auto] gap-3 items-end">
              <div>
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                  Subject
                </Label>
                <Select
                  value={subjectId?.toString() ?? ''}
                  onValueChange={(v) => setSubjectId(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={subjectsLoading ? 'Loading…' : 'Pick a subject'} />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.subjectId} value={s.subjectId.toString()}>
                        <span className="font-mono mr-2">{s.subjectCode}</span> {s.subjectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Summary bar */}
          {phaseQ.data && phaseQ.data.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SummaryStat label="Total Students" value={summary.total.toString()} tone="bg-blue-100 text-blue-700" />
              <SummaryStat
                label="Avg Attendance"
                value={summary.marked > 0 ? `${summary.avg.toFixed(1)}%` : '—'}
                tone="bg-emerald-100 text-emerald-700"
              />
              <SummaryStat label="Below 75%" value={summary.below75.toString()} tone="bg-amber-100 text-amber-700" />
              <SummaryStat label="Detained (<65%)" value={summary.detained.toString()} tone="bg-red-100 text-red-700" />
            </div>
          )}

          <PhaseTable loading={phaseQ.isLoading} rows={phaseQ.data ?? []} />
        </>
      ) : (
        <FullSheetView loading={fullSheet.isLoading} data={fullSheet.data} />
      )}
    </div>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <Card className="p-4">
      <div className={cn('inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider', tone)}>
        {label}
      </div>
      <div className="text-2xl font-extrabold mt-2">{value}</div>
    </Card>
  );
}

function PhaseTable({ loading, rows }: { loading: boolean; rows: any[] }) {
  if (loading) {
    return (
      <Card className="p-12 text-center text-muted-foreground">
        <Loader2 className="h-8 w-8 mx-auto animate-spin text-orange-500 mb-3" />
        Loading records…
      </Card>
    );
  }
  if (!rows || rows.length === 0) {
    return (
      <Card className="p-12 text-center text-muted-foreground">
        <ClipboardList className="h-10 w-10 mx-auto text-orange-500 mb-3" />
        No data for this phase.
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">Roll</th>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-center px-3 py-3">Held</th>
              <th className="text-center px-3 py-3">P</th>
              <th className="text-center px-3 py-3">A</th>
              <th className="text-center px-3 py-3">L</th>
              <th className="text-center px-3 py-3">ML</th>
              <th className="text-center px-3 py-3">%</th>
              <th className="text-center px-3 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => {
              const held = r.held ?? 0;
              const pct = r.percent ?? 0;
              const noData = held === 0;
              const isLow = !noData && pct < 75;
              const detained = !noData && pct < 65;
              const pctClass = noData
                ? 'text-muted-foreground'
                : pct >= 75 ? 'text-emerald-600'
                : pct >= 65 ? 'text-amber-600'
                : 'text-red-600';
              return (
                <tr
                  key={r.studentId}
                  className={cn(isLow ? 'bg-red-50 dark:bg-red-950/20' : '')}
                >
                  <td className="px-4 py-2.5 font-mono text-xs">{r.rollNo}</td>
                  <td className="px-4 py-2.5 font-semibold">{r.studentName}</td>
                  <td className="px-3 py-2.5 text-center font-mono">{r.held}</td>
                  <td className="px-3 py-2.5 text-center font-mono text-emerald-600">{r.present}</td>
                  <td className="px-3 py-2.5 text-center font-mono text-red-600">{r.absent}</td>
                  <td className="px-3 py-2.5 text-center font-mono text-amber-600">{r.leave}</td>
                  <td className="px-3 py-2.5 text-center font-mono text-indigo-600">{r.ml}</td>
                  <td className={cn('px-3 py-2.5 text-center font-bold font-mono', pctClass)}>
                    {noData ? '—' : `${pct.toFixed(1)}%`}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {noData ? (
                      <Badge className="bg-muted text-muted-foreground hover:bg-muted">
                        No Data
                      </Badge>
                    ) : (
                      <Badge className={cn(
                        'text-white',
                        detained ? 'bg-red-500 hover:bg-red-500'
                                : isLow ? 'bg-amber-500 hover:bg-amber-500'
                                        : 'bg-emerald-500 hover:bg-emerald-500',
                      )}>
                        {detained ? '🚫 Detained' : isLow ? '⚠ At Risk' : '✅ Safe'}
                      </Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function FullSheetView({ loading, data }: { loading: boolean; data: any }) {
  if (loading) {
    return (
      <Card className="p-12 text-center text-muted-foreground">
        <Loader2 className="h-8 w-8 mx-auto animate-spin text-orange-500 mb-3" />
        Building full sheet…
      </Card>
    );
  }
  if (!data || !data.subjects || data.subjects.length === 0) {
    return (
      <Card className="p-12 text-center text-muted-foreground">
        <Table2 className="h-10 w-10 mx-auto text-orange-500 mb-3" />
        No subjects mapped for this dept+semester.
      </Card>
    );
  }
  const allSubjects: { subjectId: number; subjectCode: string; subjectType: string }[] = data.subjects;
  const rows: any[] = data.rows ?? [];

  // Filter out training subjects and split into theory/lab with official order
  const EXCLUDE = new Set(['AAT', 'ABP', 'EET', 'SST-JAVA']);
  const OFFICIAL_ORDER = ['PCC-CS401','PCC-CS402','PCC-CS403','PCC-CS404','BSC-401','MC-401','PCC-CS492','PCC-CS494'];
  const byCode = new Map(allSubjects.map((s) => [s.subjectCode, s]));

  const theorySubjects: typeof allSubjects = [];
  const labSubjects: typeof allSubjects = [];
  for (const code of OFFICIAL_ORDER) {
    const s = byCode.get(code);
    if (!s || EXCLUDE.has(code)) continue;
    if (s.subjectType === 'lab') labSubjects.push(s);
    else theorySubjects.push(s);
  }
  const displaySubjects = [...theorySubjects, ...labSubjects];

  // Group by student type: regular → transfer → lateral (official order)
  const groups: { label: string; rows: any[] }[] = [];
  const regular = rows.filter((r) => r.studentType === 'regular');
  const transfer = rows.filter((r) => r.studentType === 'transfer');
  const lateral = rows.filter((r) => r.studentType === 'lateral');
  if (regular.length)  groups.push({ label: 'Regular Students',  rows: regular });
  if (transfer.length) groups.push({ label: 'Transfer Students', rows: transfer });
  if (lateral.length)  groups.push({ label: 'Lateral Entry',     rows: lateral });

  // Totals row: max held per subject across all students
  const totals: Record<string, number> = {};
  for (const s of displaySubjects) {
    totals[s.subjectCode] = rows.reduce((mx, r) => Math.max(mx, r[`${s.subjectCode}_held`] ?? 0), 0);
  }

  const cellPct = (pct: number, held: number) => {
    if (held === 0) return 'bg-muted/40 text-muted-foreground';
    return pct >= 75 ? 'bg-emerald-50 text-emerald-700'
              : pct >= 65 ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700';
  };

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/40">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Official Full Sheet — All Subjects × All Students
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5">
          Sticky Roll + Name. Scroll horizontally to view all subjects. Matches official AOT format.
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="text-xs">
          <thead className="bg-muted/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="sticky left-0 bg-muted/40 z-10 text-left px-3 py-3 border-r border-border">Roll</th>
              <th className="sticky left-[60px] bg-muted/40 z-10 text-left px-3 py-3 border-r border-border min-w-[160px]">Name</th>
              {theorySubjects.map((s) => (
                <th key={s.subjectId} className="text-center px-2 py-3 border-r border-border" colSpan={3}>
                  {s.subjectCode}
                </th>
              ))}
              <th className="text-center px-2 py-3 border-r border-border bg-blue-50 dark:bg-blue-950/30" colSpan={3}>Theory Total</th>
              {labSubjects.map((s) => (
                <th key={s.subjectId} className="text-center px-2 py-3 border-r border-border" colSpan={3}>
                  {s.subjectCode}
                </th>
              ))}
              <th className="text-center px-2 py-3 border-r border-border bg-purple-50 dark:bg-purple-950/30" colSpan={3}>Practical Total</th>
              <th className="text-center px-2 py-3 bg-orange-50 dark:bg-orange-950/30" colSpan={3}>Overall</th>
            </tr>
            <tr>
              <th className="sticky left-0 bg-muted/40 z-10 px-3 py-1 border-r border-border"></th>
              <th className="sticky left-[60px] bg-muted/40 z-10 px-3 py-1 border-r border-border"></th>
              {theorySubjects.map((s) => (
                <SubHeaderTriple key={s.subjectId} />
              ))}
              <SubHeaderTriple />
              {labSubjects.map((s) => (
                <SubHeaderTriple key={s.subjectId} />
              ))}
              <SubHeaderTriple />
              <SubHeaderTriple last />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {groups.map((g) => (
              <FullSheetGroup key={g.label} label={g.label} rows={g.rows}
                theorySubjects={theorySubjects} labSubjects={labSubjects} cellPct={cellPct} />
            ))}
            <tr className="bg-muted/60 font-bold">
              <td className="sticky left-0 bg-muted/60 z-10 px-3 py-2 border-r border-border" colSpan={2}>
                TOTAL CLASSES HELD
              </td>
              {theorySubjects.map((s) => (
                <td key={s.subjectId} className="text-center px-2 py-2 border-r border-border" colSpan={3}>
                  {totals[s.subjectCode] ?? 0}
                </td>
              ))}
              <td className="text-center px-2 py-2 border-r border-border" colSpan={3}>
                {theorySubjects.reduce((sum, s) => sum + (totals[s.subjectCode] ?? 0), 0)}
              </td>
              {labSubjects.map((s) => (
                <td key={s.subjectId} className="text-center px-2 py-2 border-r border-border" colSpan={3}>
                  {totals[s.subjectCode] ?? 0}
                </td>
              ))}
              <td className="text-center px-2 py-2 border-r border-border" colSpan={3}>
                {labSubjects.reduce((sum, s) => sum + (totals[s.subjectCode] ?? 0), 0)}
              </td>
              <td className="text-center px-2 py-2" colSpan={3}>
                {displaySubjects.reduce((sum, s) => sum + (totals[s.subjectCode] ?? 0), 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SubHeaderTriple({ last }: { last?: boolean }) {
  return (
    <>
      <th className="text-center px-2 py-1 font-mono">H</th>
      <th className="text-center px-2 py-1 font-mono">P</th>
      <th className={cn('text-center px-2 py-1 font-mono', last ? '' : 'border-r border-border')}>%</th>
    </>
  );
}

function FullSheetGroup({
  label, rows, theorySubjects, labSubjects, cellPct,
}: {
  label: string;
  rows: any[];
  theorySubjects: { subjectId: number; subjectCode: string }[];
  labSubjects: { subjectId: number; subjectCode: string }[];
  cellPct: (pct: number, held: number) => string;
}) {
  const allSubjects = [...theorySubjects, ...labSubjects];
  return (
    <>
      <tr className="bg-orange-50 dark:bg-orange-950/30">
        <td colSpan={2 + theorySubjects.length * 3 + 3 + labSubjects.length * 3 + 3 + 3} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300">
          {label}
        </td>
      </tr>
      {rows.map((r) => {
        const overallHeld = r.overallHeld ?? 0;
        const isLow = overallHeld > 0 && (r.overallPct ?? 0) < 75;
        return (
          <tr key={r.studentId} className={cn(isLow ? 'bg-red-50/50 dark:bg-red-950/10' : '')}>
            <td className="sticky left-0 bg-card z-10 px-3 py-1.5 font-mono border-r border-border">{r.rollNo}</td>
            <td className="sticky left-[60px] bg-card z-10 px-3 py-1.5 font-semibold border-r border-border min-w-[160px] truncate">
              {r.studentName}
            </td>
            {theorySubjects.map((s) => {
              const held = r[`${s.subjectCode}_held`] ?? 0;
              const present = r[`${s.subjectCode}_present`] ?? 0;
              const pct = r[`${s.subjectCode}_pct`] ?? 0;
              return (
                <SubjectCells key={s.subjectId} held={held} present={present} pct={pct} cellPct={cellPct} />
              );
            })}
            <SubjectCells held={r.theoryHeld} present={r.theoryPresent} pct={r.theoryPct} cellPct={cellPct} />
            {labSubjects.map((s) => {
              const held = r[`${s.subjectCode}_held`] ?? 0;
              const present = r[`${s.subjectCode}_present`] ?? 0;
              const pct = r[`${s.subjectCode}_pct`] ?? 0;
              return (
                <SubjectCells key={s.subjectId} held={held} present={present} pct={pct} cellPct={cellPct} />
              );
            })}
            <SubjectCells held={r.practicalHeld} present={r.practicalPresent} pct={r.practicalPct} cellPct={cellPct} />
            <SubjectCells held={r.overallHeld} present={r.overallPresent} pct={r.overallPct} cellPct={cellPct} last bold />
          </tr>
        );
      })}
    </>
  );
}

function SubjectCells({ held, present, pct, cellPct, last, bold }: {
  held: number; present: number; pct: number;
  cellPct: (pct: number, held: number) => string;
  last?: boolean; bold?: boolean;
}) {
  const noData = (held ?? 0) === 0;
  return (
    <>
      <td className="text-center px-2 py-1 font-mono">{held}</td>
      <td className="text-center px-2 py-1 font-mono">{present}</td>
      <td className={cn(
        'text-center px-2 py-1 font-mono',
        cellPct(pct, held),
        bold ? 'font-bold' : '',
        last ? '' : 'border-r border-border',
      )}>
        {noData ? '—' : `${pct}%`}
      </td>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// TAB 3 — Export
// ─────────────────────────────────────────────────────────────────────
function ExportTab({ subjects }: { subjects: SubjectMini[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <DateRangeExportCard subjects={subjects} />
      <PhaseExportCard subjects={subjects} />
      <FullSheetExportCard />
    </div>
  );
}

function DateRangeExportCard({ subjects }: { subjects: SubjectMini[] }) {
  const me = useAuthStore((s) => s.me);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [subjectId, setSubjectId] = useState<number | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  async function download() {
    if (!subjectId || !start || !end || !me?.deptId) {
      toast.warning('Pick subject and date range.');
      return;
    }
    setBusy(true);
    try {
      const url = `/api/reports?type=daterange&subjectId=${subjectId}&deptId=${me.deptId}&semester=4&start=${start}&end=${end}`;
      await streamDownload(url, `attendance_daterange_${start}_to_${end}.csv`);
      toast.success('Date-range CSV downloaded');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to export');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
          <CalendarRange className="h-5 w-5" />
        </div>
        <div>
          <div className="font-bold">Date Range Export</div>
          <div className="text-xs text-muted-foreground">Day-by-day status grid</div>
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Subject</Label>
        <Select value={subjectId?.toString() ?? ''} onValueChange={(v) => setSubjectId(Number(v))}>
          <SelectTrigger><SelectValue placeholder="Pick a subject" /></SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s.subjectId} value={s.subjectId.toString()}>
                <span className="font-mono mr-2">{s.subjectCode}</span> {s.subjectName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">From</Label>
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">To</Label>
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>
      <Button className="mt-auto" onClick={download} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Download CSV
      </Button>
    </Card>
  );
}

function PhaseExportCard({ subjects }: { subjects: SubjectMini[] }) {
  const me = useAuthStore((s) => s.me);
  const [phase, setPhase] = useState<PhaseKey>('Phase 1');
  const [subjectId, setSubjectId] = useState<number | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  async function download() {
    if (!subjectId || !me?.deptId) {
      toast.warning('Pick a subject.');
      return;
    }
    const range = PHASES[phase];
    setBusy(true);
    try {
      const url = `/api/reports?type=phase&subjectId=${subjectId}&deptId=${me.deptId}&semester=4&start=${range.start}&end=${range.end}&phase=${encodeURIComponent(phase)}`;
      await streamDownload(url, `attendance_${phase.replace(/\s+/g, '_')}.csv`);
      toast.success(`${phase} CSV downloaded`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to export');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
          <History className="h-5 w-5" />
        </div>
        <div>
          <div className="font-bold">Phase Export</div>
          <div className="text-xs text-muted-foreground">Phase 1 / Phase 2 / Overall summary</div>
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Phase</Label>
        <Select value={phase} onValueChange={(v) => setPhase(v as PhaseKey)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(PHASES) as PhaseKey[]).map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Subject</Label>
        <Select value={subjectId?.toString() ?? ''} onValueChange={(v) => setSubjectId(Number(v))}>
          <SelectTrigger><SelectValue placeholder="Pick a subject" /></SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s.subjectId} value={s.subjectId.toString()}>
                <span className="font-mono mr-2">{s.subjectCode}</span> {s.subjectName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button className="mt-auto" onClick={download} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Download CSV
      </Button>
    </Card>
  );
}

function FullSheetExportCard() {
  const me = useAuthStore((s) => s.me);
  const [busy, setBusy] = useState(false);

  async function download() {
    if (!me?.deptId) { toast.warning('Department not detected.'); return; }
    setBusy(true);
    try {
      const url = `/api/reports?type=fullsheet&deptId=${me.deptId}&semester=4`;
      await streamDownload(url, `attendance_official_fullsheet.csv`);
      toast.success('Official full sheet downloaded');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to export');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
          <FileSpreadsheet className="h-5 w-5" />
        </div>
        <div>
          <div className="font-bold">Official Full Sheet</div>
          <div className="text-xs text-muted-foreground">AOT format — all subjects × all students</div>
        </div>
      </div>
      <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
        One-click export. Matches the official CSE-1 attendance PDF layout: subject-wise H/P/%, theory + practical + overall totals, regular/lateral/transfer groups.
      </div>
      <Button className="mt-auto" onClick={download} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Download Official CSV
      </Button>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────────────
async function streamDownload(url: string, fileName: string) {
  const base = import.meta.env.VITE_API_BASE_URL || '';
  const fullUrl = url.startsWith('/api') ? `${base}${url}` : url;
  const res = await fetch(fullUrl, { credentials: 'include' });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); msg = j.message || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}
