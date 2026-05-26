import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, BookOpen, CalendarCheck, CheckCircle2, ChevronDown,
  Loader2, MessageSquare, TrendingDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { StatCard } from '@/components/shared/StatCard';
import { useAuthStore } from '@/store/authStore';
import { useStudentAttendance, useStudentSelfRecord } from '@/hooks/useAttendance';
import { useDisputes, useRaiseDispute } from '@/hooks/useDisputes';
import { cn } from '@/lib/utils';

export default function StudentMyAttendance() {
  const me = useAuthStore((s) => s.me);
  const studentId = me?.entityId ?? undefined;
  const summary = useStudentAttendance(studentId);
  const selfRecord = useStudentSelfRecord(studentId);
  const disputes = useDisputes();
  const [selfRecordOpen, setSelfRecordOpen] = useState(false);

  const overall = useMemo(() => {
    const rows = summary.data ?? [];
    const held    = rows.reduce((a, r) => a + r.held, 0);
    const present = rows.reduce((a, r) => a + r.present, 0);
    const pct     = held > 0 ? (present * 100) / held : 0;
    const below75 = rows.filter((r) => r.percent < 75).length;
    return {
      subjects: rows.length,
      held, present,
      pct: Math.round(pct * 10) / 10,
      below75,
    };
  }, [summary.data]);

  const sorted = useMemo(() => {
    return [...(summary.data ?? [])].sort((a, b) => a.percent - b.percent);
  }, [summary.data]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-xs text-muted-foreground">
          Dashboard › <span className="text-foreground font-semibold">My Attendance</span>
        </div>
        <h1 className="text-2xl font-extrabold mt-1">My Attendance</h1>
        <p className="text-sm text-muted-foreground">
          Official teacher-marked attendance. Per-subject breakdown with classes-needed counter.
        </p>
      </motion.div>

      {/* Below-75 warning banner */}
      {overall.below75 > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-orange-300 bg-orange-50 dark:bg-orange-950/30 p-4 flex items-start gap-3"
        >
          <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-orange-700 dark:text-orange-400">
              {overall.below75} subject{overall.below75 > 1 ? 's' : ''} below 75%
            </div>
            <div className="text-sm text-orange-700/90 dark:text-orange-300/80">
              Look at the "Classes Needed" column for each at-risk subject.
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Subjects"       value={overall.subjects}       icon={<BookOpen className="h-6 w-6" />}      tone="orange" />
        <StatCard label="Overall %"      value={Math.round(overall.pct)} icon={<CalendarCheck className="h-6 w-6" />} tone={overall.pct < 75 ? 'danger' : 'success'} />
        <StatCard label="Total Classes"  value={overall.held}           icon={<CheckCircle2 className="h-6 w-6" />}  tone="info" />
        <StatCard label="Below 75%"      value={overall.below75}        icon={<TrendingDown className="h-6 w-6" />}  tone={overall.below75 > 0 ? 'danger' : 'success'} />
      </div>

      {/* Official Attendance Table */}
      <Card>
        <div className="px-5 py-4 border-b border-border">
          <div className="font-bold">📊 Official Attendance (Teacher-Marked)</div>
          <div className="text-xs text-muted-foreground">
            {summary.isLoading ? 'Loading…' : `${sorted.length} subject(s) — sorted by lowest %`}
          </div>
        </div>

        {summary.isLoading ? (
          <div className="p-12 text-center text-muted-foreground">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-orange-500 mb-3" />
            Loading attendance…
          </div>
        ) : sorted.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <CalendarCheck className="h-10 w-10 mx-auto text-orange-500 mb-3" />
            <div className="font-semibold text-foreground mb-1">No attendance recorded yet</div>
            <div className="text-sm">Your teachers will start marking attendance soon.</div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sorted.map((r, i) => (
              <SubjectRow key={r.subjectId} index={i} row={r} />
            ))}
          </div>
        )}
      </Card>

      {/* Self Record Section (Collapsible) */}
      <Card>
        <button
          onClick={() => setSelfRecordOpen(!selfRecordOpen)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
        >
          <div className="text-left">
            <div className="font-bold">📋 My Personal Record (Self-Reported)</div>
            <div className="text-xs text-muted-foreground">
              Your own tracking from the Schedule page. Does not affect official attendance.
            </div>
          </div>
          <ChevronDown className={cn('h-5 w-5 text-muted-foreground transition-transform', selfRecordOpen && 'rotate-180')} />
        </button>

        <AnimatePresence>
          {selfRecordOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-4 border-t border-border pt-4">
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 mb-4">
                  <div className="text-xs text-amber-700 dark:text-amber-300">
                    ⚠️ This is your personal record only. It does not affect your official attendance.
                    Use it to track discrepancies and raise disputes if needed.
                  </div>
                </div>

                {/* Self-record comparison table */}
                <SelfRecordComparison
                  officialData={summary.data ?? []}
                  selfData={selfRecord.data ?? []}
                  selfLoading={selfRecord.isLoading}
                />

                {/* Disputes list */}
                <div className="mt-4">
                  <DisputesList disputes={disputes.data ?? []} loading={disputes.isLoading} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}

function SubjectRow({
  index, row,
}: {
  index: number;
  row: {
    subjectId: number;
    subjectCode: string;
    subjectName: string;
    held: number;
    present: number;
    absent: number;
    percent: number;
    classesNeededFor75: number;
  };
}) {
  const danger = row.percent < 75;
  const noData = row.held === 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 12) * 0.04, duration: 0.25 }}
      className={cn('p-5 transition-colors', danger && !noData ? 'bg-red-50/40 dark:bg-red-950/20' : 'hover:bg-muted/30')}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-mono text-sm font-bold">{row.subjectCode}</span>
            {danger && !noData && <Badge variant="destructive" className="text-[10px]">Below 75%</Badge>}
            {noData && <Badge className="bg-muted text-muted-foreground text-[10px]">No Data</Badge>}
          </div>
          <div className="text-sm text-muted-foreground truncate max-w-[600px]">{row.subjectName}</div>
        </div>
        <div className="text-right">
          <div className={cn('text-2xl font-extrabold', noData ? 'text-muted-foreground' : danger ? 'text-red-700' : 'text-foreground')}>
            {noData ? '—' : `${row.percent.toFixed(1)}%`}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {noData ? 'No classes recorded yet' : `${row.present} of ${row.held} classes`}
          </div>
        </div>
      </div>

      {!noData && (
        <>
          <Progress
            value={Math.min(100, row.percent)}
            indicatorClassName={danger ? 'bg-red-500' : ''}
          />

          <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
            <Stat label="Present" value={String(row.present)} tone="success" />
            <Stat label="Absent"  value={String(row.absent)}  tone="danger"  />
            <Stat
              label={danger ? 'Need to attend' : 'Status'}
              value={danger ? `${row.classesNeededFor75} class${row.classesNeededFor75 === 1 ? '' : 'es'}` : '✓ Safe'}
              tone={danger ? 'warning' : 'success'}
            />
          </div>
        </>
      )}
    </motion.div>
  );
}

function Stat({
  label, value, tone,
}: { label: string; value: string; tone: 'success' | 'warning' | 'danger' }) {
  const tint = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger:  'bg-red-50 text-red-700 border-red-200',
  }[tone];
  return (
    <div className={cn('rounded-md border px-3 py-2', tint)}>
      <div className="text-[10px] uppercase tracking-wider opacity-80">{label}</div>
      <div className="text-sm font-bold">{value}</div>
    </div>
  );
}

function SelfRecordComparison({
  officialData, selfData, selfLoading,
}: {
  officialData: { subjectId: number; subjectCode: string; subjectName: string; percent: number }[];
  selfData: { subjectId: number; subjectCode: string; subjectName: string; selfTotal: number; selfPresent: number; selfAbsent: number; selfPercent: number }[];
  selfLoading: boolean;
}) {
  if (selfLoading) {
    return <div className="text-sm text-muted-foreground"><Loader2 className="h-4 w-4 inline animate-spin" /> Loading self-record…</div>;
  }
  if (selfData.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        No self-record data yet. Mark your attendance on the Schedule page to start tracking.
      </div>
    );
  }

  // Build official % lookup
  const officialPct: Record<number, number> = {};
  for (const o of officialData) officialPct[o.subjectId] = o.percent;

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold mb-2">Comparison: Official vs Your Record</div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-3 py-2">Subject</th>
              <th className="text-center px-3 py-2">Official %</th>
              <th className="text-center px-3 py-2">Your Record %</th>
              <th className="text-center px-3 py-2">Self P/Total</th>
              <th className="text-center px-3 py-2">Match</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {selfData.map((s) => {
              const official = officialPct[s.subjectId] ?? 0;
              const diff = Math.abs(official - s.selfPercent);
              const mismatch = diff > 5; // >5% difference = mismatch
              return (
                <tr key={s.subjectId} className={cn(mismatch ? 'bg-amber-50 dark:bg-amber-950/20' : '')}>
                  <td className="px-3 py-2 font-mono font-semibold">{s.subjectCode}</td>
                  <td className="px-3 py-2 text-center font-bold">
                    {official > 0 ? `${official.toFixed(1)}%` : '—'}
                  </td>
                  <td className="px-3 py-2 text-center font-bold">
                    {s.selfPercent > 0 ? `${s.selfPercent.toFixed(1)}%` : '—'}
                  </td>
                  <td className="px-3 py-2 text-center text-muted-foreground">
                    {s.selfPresent}/{s.selfTotal}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {mismatch ? (
                      <Badge className="bg-amber-100 text-amber-700 text-[10px]">⚠️ Mismatch</Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">✓ OK</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DisputesList({ disputes, loading }: { disputes: any[]; loading: boolean }) {
  const [showForm, setShowForm] = useState(false);
  const [formSubjectId, setFormSubjectId] = useState<number | null>(null);
  const [formDate, setFormDate] = useState('');
  const [formNote, setFormNote] = useState('');
  const raiseDispute = useRaiseDispute();

  async function handleSubmit() {
    if (!formSubjectId || !formDate || !formNote.trim()) {
      toast.warning('Fill all fields');
      return;
    }
    await raiseDispute.mutateAsync({ subjectId: formSubjectId, classDate: formDate, note: formNote });
    setShowForm(false);
    setFormNote('');
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground"><Loader2 className="h-4 w-4 inline animate-spin" /> Loading disputes…</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Your Disputes ({disputes.length})</div>
        <Button size="sm" variant="secondary" onClick={() => setShowForm(!showForm)}>
          <MessageSquare className="h-3.5 w-3.5 mr-1" /> Raise Dispute
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 border-orange-300 bg-orange-50/30 dark:bg-orange-950/20 space-y-3">
          <div className="text-sm font-bold">Raise a New Dispute</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Subject ID</label>
              <input
                type="number"
                className="w-full h-9 rounded-md border border-input bg-card px-3 text-sm"
                placeholder="e.g. 1"
                value={formSubjectId ?? ''}
                onChange={(e) => setFormSubjectId(Number(e.target.value) || null)}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Date</label>
              <input
                type="date"
                className="w-full h-9 rounded-md border border-input bg-card px-3 text-sm"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Your Note</label>
            <Textarea
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              rows={2}
              placeholder="Explain why you believe the attendance is incorrect…"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={raiseDispute.isPending}>
              {raiseDispute.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
              Submit
            </Button>
          </div>
        </Card>
      )}

      {disputes.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4 text-center">
          No disputes raised yet. If you notice a discrepancy, click "Raise Dispute" above.
        </div>
      ) : (
        <div className="space-y-2">
          {disputes.map((d) => (
            <div key={d.disputeId} className="p-3 rounded-md border border-border bg-card">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-bold">
                  {d.subjectCode} — {d.classDate}
                </div>
                <Badge className={cn(
                  'text-[10px]',
                  d.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  d.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-red-100 text-red-700',
                )}>
                  {d.status}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">{d.studentNote}</div>
              {d.teacherNote && (
                <div className="text-xs mt-1 text-blue-700 dark:text-blue-300">
                  Teacher: {d.teacherNote}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
