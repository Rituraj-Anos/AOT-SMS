import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, CheckCircle2, Loader2, Receipt, Wallet,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { StatCard } from '@/components/shared/StatCard';
import { useAuthStore } from '@/store/authStore';
import { useStudentFees } from '@/hooks/useFees';
import { formatINR, cn } from '@/lib/utils';

export default function StudentMyFees() {
  const me = useAuthStore((s) => s.me);
  const studentId = me?.entityId ?? undefined;
  const fees = useStudentFees(studentId);

  const totals = useMemo(() => {
    const rows = fees.data ?? [];
    const total   = rows.reduce((a, f) => a + Number(f.totalAmount || 0), 0);
    const paid    = rows.reduce((a, f) => a + Number(f.amountPaid || 0), 0);
    const balance = rows.reduce((a, f) => a + Number(f.balanceDue || 0), 0);
    const overdue = rows.filter((f) =>
      f.dueDate && new Date(f.dueDate) < new Date() && Number(f.balanceDue) > 0
    ).length;
    return { total, paid, balance, overdue };
  }, [fees.data]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-xs text-muted-foreground">
          Dashboard › <span className="text-foreground font-semibold">My Fees</span>
        </div>
        <h1 className="text-2xl font-extrabold mt-1">My Fees</h1>
        <p className="text-sm text-muted-foreground">Payment history and outstanding balances.</p>
      </motion.div>

      {totals.balance > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-orange-300 bg-orange-50 p-4 flex items-start gap-3"
        >
          <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-orange-700">Outstanding balance: {formatINR(totals.balance)}</div>
            <div className="text-sm text-orange-700/90">
              Visit the accounts office to clear pending dues.
              {totals.overdue > 0 && ` ${totals.overdue} record(s) are overdue.`}
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Billed" value={Math.round(totals.total)} icon={<Wallet className="h-6 w-6" />}     tone="orange" />
        <StatCard label="Paid"         value={Math.round(totals.paid)}  icon={<CheckCircle2 className="h-6 w-6" />} tone="success" />
        <StatCard label="Balance"      value={Math.round(totals.balance)} icon={<AlertTriangle className="h-6 w-6" />} tone={totals.balance > 0 ? 'danger' : 'success'} />
        <StatCard label="Records"      value={(fees.data ?? []).length} icon={<Receipt className="h-6 w-6" />}    tone="info" />
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-border">
          <div className="font-bold">Payment History</div>
          <div className="text-xs text-muted-foreground">
            {fees.isLoading ? 'Loading…' : `${(fees.data ?? []).length} record(s)`}
          </div>
        </div>

        {fees.isLoading ? (
          <div className="p-12 text-center text-muted-foreground">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-orange-500 mb-3" />
            Loading fees…
          </div>
        ) : (
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
                  <TableHead>Mode</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(fees.data ?? []).length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    No fee records yet.
                  </TableCell></TableRow>
                ) : (
                  (fees.data ?? []).map((f, i) => {
                    const balance = Number(f.balanceDue ?? 0);
                    const paid    = Number(f.amountPaid ?? 0);
                    const overdue = f.dueDate && new Date(f.dueDate) < new Date() && balance > 0;
                    const status: { label: string; variant: 'success' | 'warning' | 'destructive' } =
                      balance <= 0 ? { label: 'Paid',    variant: 'success' }
                      : paid > 0   ? { label: 'Partial', variant: 'warning' }
                                   : { label: 'Unpaid',  variant: 'destructive' };
                    return (
                      <motion.tr
                        key={f.feeId}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i, 20) * 0.02, duration: 0.2 }}
                        className={cn('border-b transition-colors', overdue ? 'bg-red-50/60' : 'hover:bg-muted/30')}
                      >
                        <TableCell className="text-sm">{f.academicYear ?? '—'}</TableCell>
                        <TableCell>{f.semester ?? '—'}</TableCell>
                        <TableCell>{formatINR(f.totalAmount)}</TableCell>
                        <TableCell>{formatINR(f.amountPaid)}</TableCell>
                        <TableCell>
                          <span className={cn(balance > 0 && 'font-bold text-red-700')}>{formatINR(balance)}</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {f.dueDate ? f.dueDate.slice(0, 10) : '—'}
                          {overdue && <Badge variant="destructive" className="ml-2">Overdue</Badge>}
                        </TableCell>
                        <TableCell className="text-sm">{f.paymentMode ?? '—'}</TableCell>
                        <TableCell className="font-mono text-xs">{f.receiptNo ?? '—'}</TableCell>
                        <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                      </motion.tr>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
