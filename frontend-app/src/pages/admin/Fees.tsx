import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, AlertTriangle, CheckCircle2, Loader2, Plus, Receipt, Search,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogBody, DialogFooter,
} from '@/components/ui/dialog';
import { StatCard } from '@/components/shared/StatCard';
import { useDepartments } from '@/hooks/useDepartments';
import { useStudents } from '@/hooks/useStudents';
import {
  useStudentFees, usePendingFees, useCreateFee, useRecordPayment,
} from '@/hooks/useFees';
import { initials, formatINR, cn } from '@/lib/utils';
import type { Fee, Student } from '@/types/api';

export default function AdminFees() {
  const [tab, setTab] = useState<'pending' | 'student'>('pending');
  const [deptFilter, setDeptFilter] = useState<number | undefined>();
  const [semFilter,  setSemFilter]  = useState<number | undefined>();
  const [search,     setSearch]     = useState('');
  const [pickedStudent, setPickedStudent] = useState<Student | null>(null);
  const [openAdd,     setOpenAdd]     = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<Fee | null>(null);

  const depts    = useDepartments();
  const pending  = usePendingFees(deptFilter, semFilter);
  const studentList = useStudents({ deptId: deptFilter, sem: semFilter, search });
  const studentFees = useStudentFees(pickedStudent?.studentId);

  const stats = useMemo(() => {
    const rows = pending.data ?? [];
    const totalDue   = rows.reduce((a, f) => a + Number(f.balanceDue || 0), 0);
    const totalPaid  = rows.reduce((a, f) => a + Number(f.amountPaid || 0), 0);
    const overdue    = rows.filter((f) =>
      f.dueDate && new Date(f.dueDate) < new Date() && Number(f.balanceDue) > 0
    ).length;
    return { count: rows.length, totalDue, totalPaid, overdue };
  }, [pending.data]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <div className="text-xs text-muted-foreground">
            Dashboard › <span className="text-foreground font-semibold">Fees</span>
          </div>
          <h1 className="text-2xl font-extrabold mt-1">Fees</h1>
          <p className="text-sm text-muted-foreground">
            Track payments, balances, and outstanding dues across the cohort.
          </p>
        </div>
        <Button onClick={() => setOpenAdd(true)}>
          <Plus className="h-4 w-4" /> New Fee Record
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pending Records" value={stats.count}    icon={<Wallet className="h-6 w-6" />}        tone="orange" />
        <StatCard label="Total Due"       value={Math.round(stats.totalDue)}  icon={<AlertTriangle className="h-6 w-6" />} tone="danger"  />
        <StatCard label="Collected"       value={Math.round(stats.totalPaid)} icon={<CheckCircle2 className="h-6 w-6" />}  tone="success" />
        <StatCard label="Overdue"         value={stats.overdue}  icon={<AlertTriangle className="h-6 w-6" />} tone="warning" />
      </div>

      {/* Tab switch */}
      <div className="flex items-center gap-2">
        <Button
          variant={tab === 'pending' ? 'default' : 'secondary'}
          size="sm"
          onClick={() => setTab('pending')}
        >
          Pending / Defaulters
        </Button>
        <Button
          variant={tab === 'student' ? 'default' : 'secondary'}
          size="sm"
          onClick={() => setTab('student')}
        >
          Per-Student History
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <Label className="block mb-1.5">Department</Label>
            <Select
              value={deptFilter?.toString() ?? 'all'}
              onValueChange={(v) => setDeptFilter(v === 'all' ? undefined : Number(v))}
            >
              <SelectTrigger><SelectValue placeholder="All Depts" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Depts</SelectItem>
                {depts.data?.map((d) => (
                  <SelectItem key={d.deptId} value={String(d.deptId)}>{d.deptCode}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="block mb-1.5">Semester</Label>
            <Select
              value={semFilter?.toString() ?? 'all'}
              onValueChange={(v) => setSemFilter(v === 'all' ? undefined : Number(v))}
            >
              <SelectTrigger><SelectValue placeholder="All Sems" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sems</SelectItem>
                {[1,2,3,4,5,6,7,8].map((n) => (
                  <SelectItem key={n} value={String(n)}>Sem {n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {tab === 'student' && (
            <div>
              <Label className="block mb-1.5">Search Student</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Roll or name…"
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {tab === 'pending' ? (
        <PendingTable
          rows={pending.data ?? []}
          loading={pending.isLoading}
          onPay={(fee) => { setPaymentTarget(fee); setOpenPayment(true); }}
        />
      ) : (
        <StudentHistoryView
          students={studentList.data ?? []}
          loadingStudents={studentList.isLoading}
          picked={pickedStudent}
          onPick={setPickedStudent}
          fees={studentFees.data ?? []}
          loadingFees={studentFees.isLoading}
          onPay={(fee) => { setPaymentTarget(fee); setOpenPayment(true); }}
        />
      )}

      <NewFeeDialog open={openAdd} onOpenChange={setOpenAdd} />
      <RecordPaymentDialog
        open={openPayment}
        onOpenChange={setOpenPayment}
        target={paymentTarget}
      />
    </div>
  );
}

function PendingTable({
  rows, loading, onPay,
}: {
  rows: Fee[]; loading: boolean; onPay: (f: Fee) => void;
}) {
  return (
    <Card>
      <div className="px-5 py-4 border-b border-border">
        <div className="font-bold">Pending / Defaulters</div>
        <div className="text-xs text-muted-foreground">
          {loading ? 'Loading…' : `${rows.length} record(s) with outstanding balance`}
        </div>
      </div>
      <div className="max-h-[60vh] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Roll / Student</TableHead>
              <TableHead>Sem</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Loading…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                All clear — no outstanding fees in this filter.
              </TableCell></TableRow>
            ) : (
              rows.map((f, i) => <FeeRow key={f.feeId} index={i} fee={f} onPay={onPay} />)
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function StudentHistoryView({
  students, loadingStudents, picked, onPick, fees, loadingFees, onPay,
}: {
  students: Student[];
  loadingStudents: boolean;
  picked: Student | null;
  onPick: (s: Student) => void;
  fees: Fee[];
  loadingFees: boolean;
  onPay: (f: Fee) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Pick a student
        </div>
        <div className="max-h-[60vh] overflow-auto">
          {loadingStudents ? (
            <div className="p-6 text-center text-muted-foreground"><Loader2 className="h-4 w-4 inline animate-spin" /> Loading…</div>
          ) : students.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">No students match the filters.</div>
          ) : (
            students.map((s) => (
              <button
                key={s.studentId}
                onClick={() => onPick(s)}
                className={cn(
                  'w-full text-left flex items-center gap-3 px-4 py-2.5 border-b border-border transition-colors',
                  picked?.studentId === s.studentId ? 'bg-orange-50' : 'hover:bg-muted/40',
                )}
              >
                <Avatar className="h-8 w-8"><AvatarFallback>{initials(s.studentName)}</AvatarFallback></Avatar>
                <div className="min-w-0">
                  <div className="font-mono text-[11px] text-muted-foreground">{s.rollNo}</div>
                  <div className="text-sm font-semibold truncate">{s.studentName}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div className="font-bold">
            {picked ? `${picked.rollNo} · ${picked.studentName}` : 'Fee History'}
          </div>
          <div className="text-xs text-muted-foreground">
            {!picked ? 'Pick a student from the list to view their fee history.' :
             loadingFees ? 'Loading…' : `${fees.length} record(s)`}
          </div>
        </div>
        {picked && (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead>Sem</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingFees ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Loading…</TableCell></TableRow>
                ) : fees.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No fee records yet.</TableCell></TableRow>
                ) : (
                  fees.map((f, i) => (
                    <FeeRow key={f.feeId} index={i} fee={f} onPay={onPay} compact />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}

function FeeRow({
  index, fee, onPay, compact,
}: {
  index: number;
  fee: Fee;
  onPay: (f: Fee) => void;
  compact?: boolean;
}) {
  const balance = Number(fee.balanceDue ?? 0);
  const total   = Number(fee.totalAmount ?? 0);
  const paid    = Number(fee.amountPaid ?? 0);
  const status: { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' } =
    balance <= 0 ? { label: 'Paid',    variant: 'success' }
    : paid > 0   ? { label: 'Partial', variant: 'warning' }
                 : { label: 'Unpaid',  variant: 'destructive' };
  const overdue = fee.dueDate && new Date(fee.dueDate) < new Date() && balance > 0;

  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 20) * 0.02, duration: 0.2 }}
      className={cn('border-b transition-colors', overdue ? 'bg-red-50/60' : 'hover:bg-muted/30')}
    >
      {!compact && (
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8"><AvatarFallback>{initials(fee.studentName)}</AvatarFallback></Avatar>
            <div className="min-w-0">
              <div className="font-mono text-[11px] text-muted-foreground">{fee.rollNo}</div>
              <div className="text-sm font-semibold truncate">{fee.studentName}</div>
            </div>
          </div>
        </TableCell>
      )}
      {compact && <TableCell className="text-sm">{fee.academicYear ?? '—'}</TableCell>}
      <TableCell>{fee.semester ?? '—'}</TableCell>
      <TableCell>{formatINR(total)}</TableCell>
      <TableCell>{formatINR(paid)}</TableCell>
      <TableCell>
        <span className={cn(balance > 0 && 'font-bold text-red-700')}>{formatINR(balance)}</span>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {fee.dueDate ? fee.dueDate.slice(0, 10) : '—'}
        {overdue && <Badge variant="destructive" className="ml-2">Overdue</Badge>}
      </TableCell>
      <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
      <TableCell>
        {balance > 0 ? (
          <Button size="sm" onClick={() => onPay(fee)}>
            <Receipt className="h-3.5 w-3.5" /> Record Payment
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
    </motion.tr>
  );
}

/* ───────── Dialogs ───────── */

const newFeeSchema = z.object({
  rollNo:        z.string().min(1, 'required'),
  academicYear:  z.string().optional().or(z.literal('')),
  semester:      z.coerce.number().min(1).max(8),
  totalAmount:   z.coerce.number().positive('must be > 0'),
  dueDate:       z.string().optional().or(z.literal('')),
  remarks:       z.string().optional().or(z.literal('')),
});
type NewFeeVals = z.infer<typeof newFeeSchema>;

function NewFeeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const create = useCreateFee();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<NewFeeVals>({
    resolver: zodResolver(newFeeSchema),
  });

  // We need studentId, not roll — fetch by roll on submit.
  async function onSubmit(v: NewFeeVals) {
    try {
      // Inline lookup: GET /students?rollNo=X
      const lookup = await fetch(`/api/students?rollNo=${encodeURIComponent(v.rollNo)}`, {
        credentials: 'include',
      }).then((r) => r.json());
      const student = lookup?.data;
      if (!student?.studentId) throw new Error('Student not found for that roll number');

      await create.mutateAsync({
        studentId:    student.studentId,
        academicYear: v.academicYear || null,
        semester:     v.semester,
        totalAmount:  v.totalAmount,
        dueDate:      v.dueDate || null,
        remarks:      v.remarks || null,
      });
      reset();
      onOpenChange(false);
    } catch (err: any) {
      // Toast already shown by hook on backend errors
      if (err?.message?.includes('Student not found')) {
        // surface via inline form behaviour
        alert(err.message);
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Fee Record</DialogTitle>
          <DialogDescription>Create an outstanding fee for a student.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogBody className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Roll Number" required error={errors.rollNo?.message}>
              <Input {...register('rollNo')} placeholder="24CSE001" />
            </Field>
            <Field label="Academic Year">
              <Input {...register('academicYear')} placeholder="2025-26" />
            </Field>
            <Field label="Semester" required error={errors.semester?.message as string}>
              <Input type="number" min={1} max={8} {...register('semester')} />
            </Field>
            <Field label="Total Amount (₹)" required error={errors.totalAmount?.message as string}>
              <Input type="number" step="0.01" {...register('totalAmount')} />
            </Field>
            <Field label="Due Date">
              <Input type="date" {...register('dueDate')} />
            </Field>
            <Field label="Remarks" wide>
              <Input {...register('remarks')} placeholder="Tuition, exam fee, etc." />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Fee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const paymentSchema = z.object({
  amount:    z.coerce.number().positive('must be > 0'),
  mode:      z.enum(['Cash', 'Online', 'DD', 'Cheque']),
  receiptNo: z.string().optional().or(z.literal('')),
});
type PaymentVals = z.infer<typeof paymentSchema>;

function RecordPaymentDialog({
  open, onOpenChange, target,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; target: Fee | null;
}) {
  const record = useRecordPayment();
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<PaymentVals>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { mode: 'Cash' },
  });

  if (!target) return null;
  const balance = Number(target.balanceDue ?? 0);

  async function onSubmit(v: PaymentVals) {
    if (!target) return;
    if (v.amount > balance) {
      alert(`Amount exceeds outstanding balance (${formatINR(balance)})`);
      return;
    }
    await record.mutateAsync({
      feeId:     target.feeId,
      amount:    v.amount,
      mode:      v.mode,
      receiptNo: v.receiptNo || undefined,
    });
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            {target.rollNo} · {target.studentName} · Sem {target.semester}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogBody className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <SummaryStat label="Total"   value={formatINR(target.totalAmount)} />
              <SummaryStat label="Paid"    value={formatINR(target.amountPaid)} />
              <SummaryStat label="Balance" value={formatINR(balance)} tone="danger" />
            </div>

            <Field label="Amount (₹)" required error={errors.amount?.message as string}>
              <Input type="number" step="0.01" {...register('amount')} />
            </Field>

            <Field label="Payment Mode" required>
              <Select value={watch('mode')} onValueChange={(v) => setValue('mode', v as any, { shouldValidate: true })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="DD">DD</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Receipt Number">
              <Input {...register('receiptNo')} placeholder="Auto / manual" />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={record.isPending}>
              {record.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label, required, error, children, wide,
}: { label: string; required?: boolean; error?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <Label className="block mb-1.5">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
      {children}
      {error && <p className="text-[11px] mt-1 font-semibold text-destructive">{error}</p>}
    </div>
  );
}

function SummaryStat({
  label, value, tone = 'orange',
}: {
  label: string; value: string;
  tone?: 'orange' | 'danger';
}) {
  const tint = tone === 'danger'
    ? 'bg-red-50 text-red-700 border-red-200'
    : 'bg-orange-50 text-orange-700 border-orange-200';
  return (
    <div className={cn('rounded-md border p-3 text-center', tint)}>
      <div className="text-[11px] uppercase tracking-wider opacity-80">{label}</div>
      <div className="text-lg font-extrabold">{value}</div>
    </div>
  );
}
