import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays, Loader2, CheckCircle2, XCircle, Ban, Pencil, Plus, History, Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { useAuthStore } from '@/store/authStore';
import {
  useStudentSchedule, useMarkScheduleAttendance,
  useAllScheduleAttendance, useScheduleAttendanceHistory,
} from '@/hooks/useSchedule';
import { cn } from '@/lib/utils';
import type { DayOfWeek, ScheduleSlot, ScheduleAttendanceStatus, ScheduleAttendanceRecord } from '@/types/api';

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const TODAY_DAY = new Date().toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;
const TODAY_ISO = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();

export default function StudentSchedule() {
  const me = useAuthStore((s) => s.me);
  const studentId = me?.entityId ?? undefined;
  const schedule = useStudentSchedule(me?.deptId ?? undefined, 4, me?.section ?? 'A');
  const markAtt = useMarkScheduleAttendance();

  // Issue 1 fix: fetch ALL existing attendance records to pre-populate statuses
  const allAtt = useAllScheduleAttendance(studentId);
  const [statuses, setStatuses] = useState<Record<number, ScheduleAttendanceStatus>>({});

  // Pre-populate statuses from DB on load
  useEffect(() => {
    if (!allAtt.data) return;
    const todayRecords: Record<number, ScheduleAttendanceStatus> = {};
    for (const r of allAtt.data) {
      if (r.classDate === TODAY_ISO) {
        todayRecords[r.scheduleId] = r.status;
      }
    }
    setStatuses(todayRecords);
  }, [allAtt.data]);

  // Issue 2: detail drawer state
  const [detailSlot, setDetailSlot] = useState<ScheduleSlot | null>(null);

  const grid = useMemo(() => {
    const map: Record<string, ScheduleSlot> = {};
    for (const s of schedule.data ?? []) map[`${s.dayOfWeek}-${s.periodNumber}`] = s;
    return map;
  }, [schedule.data]);

  const todaySlots = useMemo(() =>
    (schedule.data ?? []).filter((s) => s.dayOfWeek === TODAY_DAY).sort((a, b) => a.periodNumber - b.periodNumber),
  [schedule.data]);

  async function markStatus(slot: ScheduleSlot, status: ScheduleAttendanceStatus) {
    setStatuses((prev) => ({ ...prev, [slot.scheduleId]: status }));
    await markAtt.mutateAsync({ scheduleId: slot.scheduleId, classDate: TODAY_ISO, status });
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-xs text-muted-foreground">Dashboard › <span className="text-foreground font-semibold">Schedule</span></div>
        <h1 className="text-2xl font-extrabold mt-1">My Schedule</h1>
        <p className="text-sm text-muted-foreground">Mark attendance, note substitutions, and view class history.</p>
      </motion.div>

      {/* Today's classes summary */}
      {todaySlots.length > 0 && (
        <Card className="p-5 border-orange-300 bg-orange-50/30">
          <div className="font-bold mb-3 text-orange-700">📅 Today — {TODAY_DAY}</div>
          <div className="space-y-2">
            {todaySlots.map((s) => {
              const st = statuses[s.scheduleId];
              return (
                <div key={s.scheduleId}
                  className="flex items-center justify-between gap-3 p-3 bg-card rounded-md border border-border cursor-pointer hover:border-orange-300 transition-colors"
                  onClick={() => setDetailSlot(s)}
                >
                  <div>
                    <div className="font-bold text-sm">{s.subjectCode} — {s.subjectName}</div>
                    <div className="text-xs text-muted-foreground">
                      P{s.periodNumber} · {s.startTime?.slice(0, 5)}–{s.endTime?.slice(0, 5)} · {s.teacherName} · 🏫 {s.roomNo || '—'}
                    </div>
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <StatusBtn active={st === 'attended'} tone="success" onClick={() => markStatus(s, 'attended')}>
                      <CheckCircle2 className="h-4 w-4" />
                    </StatusBtn>
                    <StatusBtn active={st === 'missed'} tone="danger" onClick={() => markStatus(s, 'missed')}>
                      <XCircle className="h-4 w-4" />
                    </StatusBtn>
                    <StatusBtn active={st === 'off'} tone="warning" onClick={() => markStatus(s, 'off')}>
                      <Ban className="h-4 w-4" />
                    </StatusBtn>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {schedule.isLoading ? (
        <Card className="p-12 text-center text-muted-foreground">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-orange-500 mb-3" /> Loading…
        </Card>
      ) : (schedule.data ?? []).length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <CalendarDays className="h-10 w-10 mx-auto text-orange-500 mb-3" />
          <div className="font-semibold text-foreground mb-1">No schedule set</div>
          <div className="text-sm">Your teacher hasn't added the timetable yet.</div>
        </Card>
      ) : (
        <Card className="overflow-auto">
          <table className="w-full text-xs border-collapse min-w-[700px]">
            <thead>
              <tr>
                <th className="p-2 border-b border-border bg-muted text-muted-foreground w-16">Period</th>
                {DAYS.map((d) => (
                  <th key={d} className={cn('p-2 border-b border-border text-center', d === TODAY_DAY && 'bg-orange-100 text-orange-700 font-bold')}>
                    {d.slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((p) => (
                <tr key={p}>
                  <td className="p-2 border-b border-border text-center font-bold text-muted-foreground bg-muted">{p}</td>
                  {DAYS.map((d) => {
                    const slot = grid[`${d}-${p}`];
                    const isToday = d === TODAY_DAY;
                    const st = slot ? statuses[slot.scheduleId] : undefined;
                    return (
                      <td key={d} className={cn('p-1 border-b border-border text-center', isToday && 'bg-orange-50/50')}>
                        {slot ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="rounded-md bg-card border border-border p-2 text-left relative group hover:border-orange-300 transition-colors cursor-pointer"
                            onClick={() => setDetailSlot(slot)}
                          >
                            <div className="font-bold text-[11px]">{slot.subjectCode}</div>
                            <div className="text-[10px] text-muted-foreground">{slot.teacherName}</div>
                            <div className="text-[10px] text-muted-foreground">🏫 {slot.roomNo || '—'}</div>
                            <Badge variant="secondary" className="text-[9px] mt-1 px-1 py-0">{slot.classType}</Badge>

                            {/* Status indicator */}
                            {st && (
                              <div className="absolute top-1 right-1">
                                {st === 'attended' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                                {st === 'missed' && <XCircle className="h-3.5 w-3.5 text-red-500" />}
                                {st === 'off' && <Ban className="h-3.5 w-3.5 text-amber-500" />}
                              </div>
                            )}

                            {/* Status buttons on today's cells */}
                            {isToday && (
                              <div className="flex gap-0.5 mt-1.5" onClick={(e) => e.stopPropagation()}>
                                <StatusBtn active={st === 'attended'} tone="success" onClick={() => markStatus(slot, 'attended')} small>
                                  <CheckCircle2 className="h-3 w-3" />
                                </StatusBtn>
                                <StatusBtn active={st === 'missed'} tone="danger" onClick={() => markStatus(slot, 'missed')} small>
                                  <XCircle className="h-3 w-3" />
                                </StatusBtn>
                                <StatusBtn active={st === 'off'} tone="warning" onClick={() => markStatus(slot, 'off')} small>
                                  <Ban className="h-3 w-3" />
                                </StatusBtn>
                              </div>
                            )}
                          </motion.div>
                        ) : (
                          <div className="h-20" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Detail Drawer */}
      {detailSlot && studentId && (
        <SlotDetailDrawer
          slot={detailSlot}
          studentId={studentId}
          currentStatus={statuses[detailSlot.scheduleId]}
          open={!!detailSlot}
          onOpenChange={(v) => { if (!v) setDetailSlot(null); }}
          onStatusChange={(status) => markStatus(detailSlot, status)}
        />
      )}
    </div>
  );
}

function StatusBtn({ active, tone, onClick, children, small }:
  { active: boolean; tone: 'success' | 'danger' | 'warning'; onClick: () => void; children: React.ReactNode; small?: boolean }) {
  const colors = {
    success: active ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground hover:bg-emerald-100',
    danger:  active ? 'bg-red-500 text-white'     : 'bg-muted text-muted-foreground hover:bg-red-100',
    warning: active ? 'bg-amber-500 text-white'   : 'bg-muted text-muted-foreground hover:bg-amber-100',
  };
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      animate={active ? { scale: [0.9, 1.1, 1] } : { scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
      className={cn(
        'rounded-full font-bold transition-colors inline-flex items-center justify-center',
        small ? 'h-6 w-6' : 'h-8 px-2',
        colors[tone],
      )}
    >
      {children}
    </motion.button>
  );
}

// ── Slot Detail Drawer ──────────────────────────────────────────────

function SlotDetailDrawer({ slot, studentId, currentStatus, open, onOpenChange, onStatusChange }:
  { slot: ScheduleSlot; studentId: number; currentStatus?: ScheduleAttendanceStatus;
    open: boolean; onOpenChange: (v: boolean) => void;
    onStatusChange: (s: ScheduleAttendanceStatus) => void }) {

  const history = useScheduleAttendanceHistory(studentId, slot.scheduleId);
  const markAtt = useMarkScheduleAttendance();
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ status: '', subTeacher: '', subSubject: '', notes: '' });

  // Generate past + upcoming dates for this slot's day
  const dates = useMemo(() => {
    const dayIndex = DAYS.indexOf(slot.dayOfWeek);
    const past: string[] = [];
    const upcoming: string[] = [];
    const today = new Date();

    // Past 8 weeks
    for (let w = 0; w < 8; w++) {
      const d = new Date(today);
      d.setDate(d.getDate() - ((today.getDay() - 1 - dayIndex + 7) % 7) - (w * 7));
      if (d <= today) {
        const iso = d.toISOString().slice(0, 10);
        if (iso <= TODAY_ISO) past.push(iso);
      }
    }

    // Next 4 weeks
    for (let w = 0; w < 4; w++) {
      const d = new Date(today);
      const daysUntil = (dayIndex + 1 - today.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + daysUntil + (w * 7));
      if (d > today) upcoming.push(d.toISOString().slice(0, 10));
    }

    return { past: past.sort().reverse(), upcoming: upcoming.sort() };
  }, [slot.dayOfWeek]);

  // Map history by date for quick lookup
  const historyByDate = useMemo(() => {
    const map: Record<string, ScheduleAttendanceRecord> = {};
    for (const r of history.data ?? []) map[r.classDate] = r;
    return map;
  }, [history.data]);

  async function saveEdit() {
    if (!editingDate) return;
    await markAtt.mutateAsync({
      scheduleId: slot.scheduleId,
      classDate: editingDate,
      status: editForm.status || 'attended',
      substituteTeacher: editForm.subTeacher || undefined,
      substituteSubject: editForm.subSubject || undefined,
      notes: editForm.notes || undefined,
    });
    toast.success('Saved');
    setEditingDate(null);
  }

  function startEdit(date: string) {
    const existing = historyByDate[date];
    setEditForm({
      status: existing?.status || '',
      subTeacher: existing?.substituteTeacher || '',
      subSubject: existing?.substituteSubject || '',
      notes: existing?.notes || '',
    });
    setEditingDate(date);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col overflow-hidden">
        <SheetHeader className="p-5 border-b border-border shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-orange-500" /> Class Details
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Slot info */}
          <Card className="p-4 bg-muted/50">
            <div className="font-bold">{slot.subjectCode} — {slot.subjectName}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {slot.teacherName} · {slot.dayOfWeek} P{slot.periodNumber}
            </div>
            <div className="text-sm text-muted-foreground">
              {slot.startTime?.slice(0, 5)}–{slot.endTime?.slice(0, 5)} · 🏫 {slot.roomNo || '—'}
            </div>
            <Badge variant="secondary" className="mt-2">{slot.classType}</Badge>
          </Card>

          {/* Today's status */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Today's Status</div>
            <div className="flex gap-2">
              <StatusBtn active={currentStatus === 'attended'} tone="success" onClick={() => onStatusChange('attended')}>
                <CheckCircle2 className="h-4 w-4" />
              </StatusBtn>
              <StatusBtn active={currentStatus === 'missed'} tone="danger" onClick={() => onStatusChange('missed')}>
                <XCircle className="h-4 w-4" />
              </StatusBtn>
              <StatusBtn active={currentStatus === 'off'} tone="warning" onClick={() => onStatusChange('off')}>
                <Ban className="h-4 w-4" />
              </StatusBtn>
            </div>
          </div>

          {/* Edit form (when editing a specific date) */}
          {editingDate && (
            <Card className="p-4 border-orange-300 bg-orange-50/30">
              <div className="font-bold text-sm mb-3">📝 Edit — {editingDate}</div>
              <div className="space-y-3">
                <div>
                  <Label>Status</Label>
                  <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full h-9 rounded-md border border-input bg-card px-3 text-sm">
                    <option value="attended">Attended</option>
                    <option value="missed">Missed</option>
                    <option value="off">Class Off</option>
                    <option value="substituted">Substituted</option>
                  </select>
                </div>
                <div><Label>Substitute Teacher</Label><Input value={editForm.subTeacher} onChange={(e) => setEditForm((f) => ({ ...f, subTeacher: e.target.value }))} placeholder="If different teacher" /></div>
                <div><Label>Substitute Subject</Label><Input value={editForm.subSubject} onChange={(e) => setEditForm((f) => ({ ...f, subSubject: e.target.value }))} placeholder="If different subject" /></div>
                <div><Label>Notes</Label><Textarea value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Any notes…" /></div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditingDate(null)}>Cancel</Button>
                  <Button size="sm" onClick={saveEdit} disabled={markAtt.isPending}>
                    {markAtt.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Past dates */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Past Classes</div>
            {history.isLoading ? (
              <div className="text-sm text-muted-foreground"><Loader2 className="h-4 w-4 inline animate-spin" /> Loading…</div>
            ) : (
              <div className="space-y-1">
                {dates.past.slice(0, 8).map((date) => {
                  const rec = historyByDate[date];
                  return (
                    <motion.div key={date}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => startEdit(date)}
                    >
                      <div className="text-sm">
                        <span className="font-mono">{date}</span>
                        <span className="text-muted-foreground ml-2">{new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {rec ? (
                          <>
                            <StatusBadge status={rec.status} />
                            {rec.substituteTeacher && <span className="text-[10px] text-muted-foreground">({rec.substituteTeacher})</span>}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </motion.div>
                  );
                })}
                {dates.past.length === 0 && <div className="text-sm text-muted-foreground">No past dates yet.</div>}
              </div>
            )}
          </div>

          {/* Upcoming dates */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Upcoming</div>
            <div className="space-y-1">
              {dates.upcoming.map((date) => {
                const rec = historyByDate[date];
                return (
                  <div key={date}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => startEdit(date)}
                  >
                    <div className="text-sm">
                      <span className="font-mono">{date}</span>
                      <span className="text-muted-foreground ml-2">{new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {rec ? <StatusBadge status={rec.status} /> : <span className="text-xs text-muted-foreground">Not marked</span>}
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StatusBadge({ status }: { status: ScheduleAttendanceStatus }) {
  const map: Record<ScheduleAttendanceStatus, { label: string; variant: string }> = {
    attended:    { label: '✓ Attended',    variant: 'bg-emerald-100 text-emerald-700' },
    missed:      { label: '✗ Missed',      variant: 'bg-red-100 text-red-700' },
    off:         { label: '— Off',         variant: 'bg-amber-100 text-amber-700' },
    substituted: { label: '↔ Substituted', variant: 'bg-indigo-100 text-indigo-700' },
  };
  const m = map[status] || map.attended;
  return <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', m.variant)}>{m.label}</span>;
}
