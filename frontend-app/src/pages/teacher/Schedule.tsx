import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Plus, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogBody, DialogFooter,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/store/authStore';
import { useTeacherSchedule, useAddSchedule, useUpdateSchedule, useDeleteSchedule } from '@/hooks/useSchedule';
import { useSubjectsByTeacher } from '@/hooks/useSubjects';
import { cn } from '@/lib/utils';
import type { DayOfWeek, ScheduleSlot } from '@/types/api';

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const TODAY_DAY = new Date().toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;

export default function TeacherSchedule() {
  const me = useAuthStore((s) => s.me);
  const schedule = useTeacherSchedule(me?.entityId ?? undefined);
  const subjects = useSubjectsByTeacher(me?.entityId ?? undefined);
  const addSlot = useAddSchedule();
  const updateSlot = useUpdateSchedule();
  const deleteSlot = useDeleteSchedule();
  const [editing, setEditing] = useState<ScheduleSlot | null>(null);
  const [adding, setAdding] = useState<{ day: DayOfWeek; period: number } | null>(null);

  const grid = useMemo(() => {
    const map: Record<string, ScheduleSlot> = {};
    for (const s of schedule.data ?? []) {
      map[`${s.dayOfWeek}-${s.periodNumber}`] = s;
    }
    return map;
  }, [schedule.data]);

  const todaySlots = useMemo(() =>
    (schedule.data ?? []).filter((s) => s.dayOfWeek === TODAY_DAY).sort((a, b) => a.periodNumber - b.periodNumber),
  [schedule.data]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-xs text-muted-foreground">Dashboard › <span className="text-foreground font-semibold">Schedule</span></div>
        <h1 className="text-2xl font-extrabold mt-1">My Schedule</h1>
        <p className="text-sm text-muted-foreground">Weekly timetable. Click + to add, click a slot to edit.</p>
      </motion.div>

      {/* Today's classes card */}
      {todaySlots.length > 0 && (
        <Card className="p-5 border-orange-300 bg-orange-50/30">
          <div className="font-bold mb-2 text-orange-700">📅 Today — {TODAY_DAY}</div>
          <div className="flex flex-wrap gap-2">
            {todaySlots.map((s) => (
              <Badge key={s.scheduleId} variant="default" className="text-xs px-3 py-1">
                P{s.periodNumber} · {s.subjectCode} · {s.startTime?.slice(0, 5)}–{s.endTime?.slice(0, 5)} · {s.roomNo || '—'}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {schedule.isLoading ? (
        <Card className="p-12 text-center text-muted-foreground">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-orange-500 mb-3" /> Loading…
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
                    return (
                      <td key={d} className={cn('p-1 border-b border-border text-center', d === TODAY_DAY && 'bg-orange-50/50')}>
                        {slot ? (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setEditing(slot)}
                            className="w-full rounded-md bg-card border border-border p-2 hover:border-orange-400 hover:shadow-sm transition-all text-left"
                          >
                            <div className="font-bold text-[11px]">{slot.subjectCode}</div>
                            <div className="text-[10px] text-muted-foreground">Sem {slot.semester} · Sec {slot.section}</div>
                            <Badge variant="secondary" className="text-[9px] mt-1 px-1 py-0">{slot.classType}</Badge>
                            {slot.roomNo && <div className="text-[10px] text-muted-foreground mt-0.5">🏫 {slot.roomNo}</div>}
                          </motion.button>
                        ) : (
                          <button
                            onClick={() => setAdding({ day: d, period: p })}
                            className="w-full h-16 rounded-md border border-dashed border-border hover:border-orange-400 hover:bg-orange-50/30 transition-colors flex items-center justify-center"
                          >
                            <Plus className="h-4 w-4 text-muted-foreground" />
                          </button>
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

      {/* Add/Edit Dialog */}
      <SlotDialog
        open={!!editing || !!adding}
        onOpenChange={(v) => { if (!v) { setEditing(null); setAdding(null); } }}
        slot={editing}
        defaultDay={adding?.day}
        defaultPeriod={adding?.period}
        subjects={subjects.data ?? []}
        teacherId={me?.entityId ?? 0}
        deptId={me?.deptId ?? 1}
        onSave={async (data) => {
          if (editing) {
            await updateSlot.mutateAsync({ ...data, scheduleId: editing.scheduleId });
          } else {
            await addSlot.mutateAsync(data);
          }
          setEditing(null); setAdding(null);
        }}
        onDelete={editing ? async () => { await deleteSlot.mutateAsync(editing.scheduleId); setEditing(null); } : undefined}
        saving={addSlot.isPending || updateSlot.isPending}
      />
    </div>
  );
}

function SlotDialog({ open, onOpenChange, slot, defaultDay, defaultPeriod, subjects, teacherId, deptId, onSave, onDelete, saving }:
  { open: boolean; onOpenChange: (v: boolean) => void; slot: ScheduleSlot | null;
    defaultDay?: DayOfWeek; defaultPeriod?: number;
    subjects: { subjectId: number; subjectCode: string; subjectName: string; semester: number }[];
    teacherId: number; deptId: number;
    onSave: (data: Record<string, any>) => Promise<void>;
    onDelete?: () => Promise<void>;
    saving: boolean;
  }) {
  const isEdit = !!slot;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const get = (n: string) => (form.elements.namedItem(n) as HTMLInputElement)?.value ?? '';
    const subjectId = Number(get('subjectId'));
    const sub = subjects.find((s) => s.subjectId === subjectId);
    await onSave({
      teacherId, subjectId, deptId,
      semester: sub?.semester ?? Number(get('semester')),
      section: get('section'),
      dayOfWeek: get('dayOfWeek'),
      periodNumber: Number(get('periodNumber')),
      startTime: get('startTime'),
      endTime: get('endTime'),
      classType: get('classType'),
      roomNo: get('roomNo'),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? 'Edit Slot' : 'Add Slot'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-3">
            <div><Label>Subject</Label>
              <select name="subjectId" required defaultValue={slot?.subjectId ?? ''} className="w-full h-10 rounded-md border border-input bg-card px-3 text-sm">
                <option value="" disabled>Select</option>
                {subjects.map((s) => <option key={s.subjectId} value={s.subjectId}>{s.subjectCode} — {s.subjectName}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Day</Label>
                <select name="dayOfWeek" required defaultValue={slot?.dayOfWeek ?? defaultDay ?? ''} className="w-full h-10 rounded-md border border-input bg-card px-3 text-sm">
                  {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div><Label>Period</Label><Input name="periodNumber" type="number" min={1} max={8} required defaultValue={slot?.periodNumber ?? defaultPeriod ?? ''} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Time</Label><Input name="startTime" type="time" required defaultValue={slot?.startTime?.slice(0, 5) ?? ''} /></div>
              <div><Label>End Time</Label><Input name="endTime" type="time" required defaultValue={slot?.endTime?.slice(0, 5) ?? ''} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label>
                <select name="classType" defaultValue={slot?.classType ?? 'theory'} className="w-full h-10 rounded-md border border-input bg-card px-3 text-sm">
                  <option value="theory">Theory</option><option value="lab">Lab</option><option value="tutorial">Tutorial</option>
                </select>
              </div>
              <div><Label>Room</Label><Input name="roomNo" defaultValue={slot?.roomNo ?? ''} placeholder="301" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Semester</Label><Input name="semester" type="number" min={1} max={8} defaultValue={slot?.semester ?? 4} /></div>
              <div><Label>Section</Label><Input name="section" defaultValue={slot?.section ?? 'A'} maxLength={5} /></div>
            </div>
          </DialogBody>
          <DialogFooter>
            {onDelete && <Button type="button" variant="destructive" onClick={onDelete}><Trash2 className="h-4 w-4" /> Delete</Button>}
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
