import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileEdit, Loader2, Save, Users, Calculator,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useAuthStore } from '@/store/authStore';
import { useSubjectsByTeacher } from '@/hooks/useSubjects';
import { useStudents } from '@/hooks/useStudents';
import { useSubjectMarks, useSaveMarks } from '@/hooks/useMarks';
import {
  calcBestTwo, scaleBestTwoTo25, calcAttMarks, calcGrade,
  GRADE_COLORS, type Grade,
} from '@/lib/makaut';
import { initials, cn } from '@/lib/utils';
import type { Marks, Student, Subject } from '@/types/api';

interface RowState {
  studentId:        number;
  ct1:              string;   // keep as strings for input flexibility
  ct2:              string;
  ct3:              string;
  ct4:              string;
  ese:              string;
  attendanceMarks:  string;
  isDirty:          boolean;
  saving?:          boolean;
}

export default function TeacherEnterMarks() {
  const me = useAuthStore((s) => s.me);

  const [subjectId,    setSubjectId]    = useState<number | undefined>();
  const [academicYear, setAcademicYear] = useState<string>(defaultAcademicYear());

  const subjects = useSubjectsByTeacher(me?.entityId ?? undefined);
  const subject  = useMemo<Subject | undefined>(
    () => subjects.data?.find((s) => s.subjectId === subjectId),
    [subjects.data, subjectId],
  );

  // Active students for this subject's (dept, sem)
  const students = useStudents(
    subject ? { deptId: subject.deptId, sem: subject.semester } : {},
  );

  // Existing marks rows for this subject in this semester
  const existing = useSubjectMarks(subjectId, subject?.semester);

  const save = useSaveMarks();

  // Build the row-state map keyed by studentId
  const [rowMap, setRowMap] = useState<Map<number, RowState>>(new Map());

  useEffect(() => {
    if (!students.data || !subject) { setRowMap(new Map()); return; }
    const byStudent = new Map<number, Marks>();
    for (const m of (existing.data ?? [])) byStudent.set(m.studentId, m);

    const next = new Map<number, RowState>();
    for (const s of students.data) {
      const m = byStudent.get(s.studentId);
      next.set(s.studentId, {
        studentId:        s.studentId,
        ct1:              m?.ct1 != null ? String(m.ct1) : '',
        ct2:              m?.ct2 != null ? String(m.ct2) : '',
        ct3:              m?.ct3 != null ? String(m.ct3) : '',
        ct4:              m?.ct4 != null ? String(m.ct4) : '',
        ese:              m?.eseMarks != null ? String(m.eseMarks) : '',
        attendanceMarks:  m?.attendanceMarks != null ? String(m.attendanceMarks) : '',
        isDirty:          false,
      });
    }
    setRowMap(next);
  }, [students.data, existing.data, subject]);

  function update(studentId: number, field: keyof RowState, value: string) {
    setRowMap((prev) => {
      const next = new Map(prev);
      const cur = next.get(studentId);
      if (!cur) return prev;
      next.set(studentId, { ...cur, [field]: value, isDirty: true });
      return next;
    });
  }

  async function saveOne(studentId: number) {
    const row = rowMap.get(studentId);
    if (!row || !subject) return;
    setRowMap((prev) => {
      const next = new Map(prev);
      const cur = next.get(studentId);
      if (cur) next.set(studentId, { ...cur, saving: true });
      return next;
    });
    try {
      await save.mutateAsync({
        studentId,
        subjectId:        subject.subjectId,
        semester:         subject.semester,
        academicYear,
        ct1:              parseOrNull(row.ct1),
        ct2:              parseOrNull(row.ct2),
        ct3:              parseOrNull(row.ct3),
        ct4:              parseOrNull(row.ct4),
        eseMarks:         parseOrNull(row.ese),
        attendanceMarks:  row.attendanceMarks ? parseInt(row.attendanceMarks, 10) : null,
      });
      setRowMap((prev) => {
        const next = new Map(prev);
        const cur = next.get(studentId);
        if (cur) next.set(studentId, { ...cur, isDirty: false, saving: false });
        return next;
      });
      toast.success('Marks saved');
    } catch (_) {
      setRowMap((prev) => {
        const next = new Map(prev);
        const cur = next.get(studentId);
        if (cur) next.set(studentId, { ...cur, saving: false });
        return next;
      });
    }
  }

  async function saveAll() {
    if (!subject) return;
    const dirty = [...rowMap.values()].filter((r) => r.isDirty);
    if (dirty.length === 0) { toast.info('Nothing to save.'); return; }
    let ok = 0, fail = 0;
    for (const row of dirty) {
      try {
        await save.mutateAsync({
          studentId:        row.studentId,
          subjectId:        subject.subjectId,
          semester:         subject.semester,
          academicYear,
          ct1: parseOrNull(row.ct1), ct2: parseOrNull(row.ct2),
          ct3: parseOrNull(row.ct3), ct4: parseOrNull(row.ct4),
          eseMarks: parseOrNull(row.ese),
          attendanceMarks: row.attendanceMarks ? parseInt(row.attendanceMarks, 10) : null,
        });
        ok++;
      } catch { fail++; }
    }
    setRowMap((prev) => {
      const next = new Map(prev);
      for (const [id, r] of next) next.set(id, { ...r, isDirty: false });
      return next;
    });
    if (fail === 0) toast.success(`Saved ${ok} record(s)`);
    else            toast.warning(`Saved ${ok}, ${fail} failed`);
  }

  const dirtyCount = [...rowMap.values()].filter((r) => r.isDirty).length;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <div className="text-xs text-muted-foreground">
            Dashboard › <span className="text-foreground font-semibold">Enter Marks</span>
          </div>
          <h1 className="text-2xl font-extrabold mt-1">Enter Marks</h1>
          <p className="text-sm text-muted-foreground">
            Best-2 of CAs and the grade update live as you type. Backend recomputes total + SGPA on save.
          </p>
        </div>
        <Button onClick={saveAll} disabled={save.isPending || dirtyCount === 0}>
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save All ({dirtyCount})
        </Button>
      </motion.div>

      {/* Filter bar */}
      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-3 items-end">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Subject
            </label>
            <Select
              value={subjectId?.toString() ?? ''}
              onValueChange={(v) => setSubjectId(Number(v))}
            >
              <SelectTrigger><SelectValue placeholder={subjects.isLoading ? 'Loading…' : 'Pick a subject'} /></SelectTrigger>
              <SelectContent>
                {(subjects.data ?? []).map((s) => (
                  <SelectItem key={s.subjectId} value={s.subjectId.toString()}>
                    <span className="font-mono mr-2">{s.subjectCode}</span> {s.subjectName} · Sem {s.semester}
                  </SelectItem>
                ))}
                {subjects.data && subjects.data.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    No subjects assigned to you yet.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Academic Year
            </label>
            <Input
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="2025-26"
            />
          </div>
          <div>
            <Button
              variant="secondary"
              onClick={() => { students.refetch(); existing.refetch(); }}
              disabled={!subjectId || students.isFetching || existing.isFetching}
            >
              {(students.isFetching || existing.isFetching)
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Users className="h-4 w-4" />}
              Reload
            </Button>
          </div>
        </div>
      </Card>

      {/* Empty / loading states */}
      {!subjectId && (
        <Card className="p-12 text-center text-muted-foreground">
          <FileEdit className="h-10 w-10 mx-auto text-orange-500 mb-3" />
          Pick a subject to start entering marks.
        </Card>
      )}

      {subjectId && students.isLoading && (
        <Card className="p-12 text-center text-muted-foreground">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-orange-500 mb-3" />
          Loading roster…
        </Card>
      )}

      {subjectId && students.data && students.data.length === 0 && !students.isLoading && (
        <Card className="p-12 text-center text-muted-foreground">
          <Users className="h-10 w-10 mx-auto text-orange-500 mb-3" />
          No active students for {subject?.subjectCode} · Sem {subject?.semester}.
        </Card>
      )}

      {/* Marks table */}
      {subject && students.data && students.data.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-5 py-3 bg-muted/40 border-b border-border flex items-center justify-between">
            <div>
              <div className="font-bold">
                <span className="font-mono mr-2">{subject.subjectCode}</span>
                {subject.subjectName}
              </div>
              <div className="text-xs text-muted-foreground">
                Sem {subject.semester} · {subject.credits} credits · {students.data.length} students
              </div>
            </div>
            <div className="text-xs text-muted-foreground inline-flex items-center gap-2">
              <Calculator className="h-3.5 w-3.5" />
              CA1–CA4 (out of 20) → Best 2 → /25 · ESE /70 · Att /5 · Total /100
            </div>
          </div>

          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ width: 220 }}>Student</TableHead>
                  <TableHead>CA1</TableHead>
                  <TableHead>CA2</TableHead>
                  <TableHead>CA3</TableHead>
                  <TableHead>CA4</TableHead>
                  <TableHead>Best 2 / 25</TableHead>
                  <TableHead>ESE / 70</TableHead>
                  <TableHead>Att / 5</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead style={{ width: 80 }}></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.data.map((s, i) => {
                  const row = rowMap.get(s.studentId);
                  if (!row) return null;
                  return (
                    <MarksRow
                      key={s.studentId}
                      index={i}
                      student={s}
                      row={row}
                      onChange={(field, val) => update(s.studentId, field, val)}
                      onSave={() => saveOne(s.studentId)}
                    />
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

function MarksRow({
  index, student, row, onChange, onSave,
}: {
  index: number;
  student: Student;
  row: RowState;
  onChange: (field: keyof RowState, val: string) => void;
  onSave: () => void;
}) {
  // Live MAKAUT calculations
  const rawBest2 = calcBestTwo(parseOrNull(row.ct1), parseOrNull(row.ct2),
                                parseOrNull(row.ct3), parseOrNull(row.ct4));
  const best25   = scaleBestTwoTo25(rawBest2);
  const ese      = parseOrNull(row.ese)   ?? 0;
  const att      = parseOrNull(row.attendanceMarks) ?? 0;
  const total    = Math.round((best25 + ese + att) * 100) / 100;
  const grade    = total > 0 ? calcGrade(total) : null;

  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 25) * 0.015, duration: 0.2 }}
      className={cn('border-b transition-colors', row.isDirty ? 'bg-orange-50/40' : 'hover:bg-muted/30')}
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8"><AvatarFallback>{initials(student.studentName)}</AvatarFallback></Avatar>
          <div className="min-w-0">
            <div className="font-mono text-[11px] text-muted-foreground">{student.rollNo}</div>
            <div className="text-sm font-semibold truncate">{student.studentName}</div>
          </div>
        </div>
      </TableCell>
      <CtCell  value={row.ct1} onChange={(v) => onChange('ct1', v)} />
      <CtCell  value={row.ct2} onChange={(v) => onChange('ct2', v)} />
      <CtCell  value={row.ct3} onChange={(v) => onChange('ct3', v)} />
      <CtCell  value={row.ct4} onChange={(v) => onChange('ct4', v)} />
      <TableCell>
        <span className="text-sm font-bold text-orange-600">
          {Number.isFinite(best25) ? best25.toFixed(2) : '—'}
        </span>
      </TableCell>
      <TableCell>
        <Input
          type="number" step="0.5" min={0} max={70}
          className="h-8 w-20 text-sm"
          value={row.ese}
          onChange={(e) => onChange('ese', e.target.value)}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number" step="1" min={0} max={5}
          className="h-8 w-16 text-sm"
          value={row.attendanceMarks}
          onChange={(e) => onChange('attendanceMarks', e.target.value)}
        />
      </TableCell>
      <TableCell><span className="text-sm font-bold">{total > 0 ? total.toFixed(2) : '—'}</span></TableCell>
      <TableCell>
        {grade ? <GradeBadge grade={grade} /> : <span className="text-xs text-muted-foreground">—</span>}
      </TableCell>
      <TableCell>
        <Button
          size="sm"
          variant={row.isDirty ? 'default' : 'ghost'}
          disabled={row.saving || !row.isDirty}
          onClick={onSave}
        >
          {row.saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
        </Button>
      </TableCell>
    </motion.tr>
  );
}

function CtCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <TableCell>
      <Input
        type="number" step="0.5" min={0} max={20}
        className="h-8 w-16 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </TableCell>
  );
}

function GradeBadge({ grade }: { grade: Grade }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-8 h-8 rounded-md text-sm font-extrabold',
        GRADE_COLORS[grade],
      )}
    >
      {grade}
    </span>
  );
}

// ── helpers ──────────────────────────────────────────────────────
function parseOrNull(v: string): number | null {
  if (v === '' || v == null) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function defaultAcademicYear(): string {
  const now = new Date();
  const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${String((year + 1) % 100).padStart(2, '0')}`;
}
