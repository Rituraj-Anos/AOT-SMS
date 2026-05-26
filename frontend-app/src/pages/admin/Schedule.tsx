import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useDepartments } from '@/hooks/useDepartments';
import { useAllSchedules, useDeleteSchedule } from '@/hooks/useSchedule';
import { cn } from '@/lib/utils';

export default function AdminSchedule() {
  const [deptFilter, setDeptFilter] = useState<number | undefined>();
  const [semFilter, setSemFilter] = useState<number | undefined>();
  const [secFilter, setSecFilter] = useState<string | undefined>();

  const depts = useDepartments();
  const schedule = useAllSchedules(deptFilter, semFilter, secFilter);
  const del = useDeleteSchedule();

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-xs text-muted-foreground">Dashboard › <span className="text-foreground font-semibold">Schedule</span></div>
        <h1 className="text-2xl font-extrabold mt-1">Class Schedule</h1>
        <p className="text-sm text-muted-foreground">View and manage the full routine across departments.</p>
      </motion.div>

      <Card className="p-5">
        <div className="flex gap-3 flex-wrap">
          <Select value={deptFilter?.toString() ?? 'all'} onValueChange={(v) => setDeptFilter(v === 'all' ? undefined : Number(v))}>
            <SelectTrigger className="h-9 w-32 rounded-full"><SelectValue placeholder="Dept" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Depts</SelectItem>
              {depts.data?.map((d) => <SelectItem key={d.deptId} value={String(d.deptId)}>{d.deptCode}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={semFilter?.toString() ?? 'all'} onValueChange={(v) => setSemFilter(v === 'all' ? undefined : Number(v))}>
            <SelectTrigger className="h-9 w-28 rounded-full"><SelectValue placeholder="Sem" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sems</SelectItem>
              {[1,2,3,4,5,6,7,8].map((n) => <SelectItem key={n} value={String(n)}>Sem {n}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={secFilter ?? 'all'} onValueChange={(v) => setSecFilter(v === 'all' ? undefined : v)}>
            <SelectTrigger className="h-9 w-28 rounded-full"><SelectValue placeholder="Section" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sec</SelectItem>
              {['A','B','C'].map((s) => <SelectItem key={s} value={s}>Sec {s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <div className="px-5 py-4 border-b border-border">
          <div className="font-bold">All Schedule Slots</div>
          <div className="text-xs text-muted-foreground">
            {schedule.isLoading ? 'Loading…' : `${(schedule.data ?? []).length} slot(s)`}
          </div>
        </div>
        <div className="max-h-[60vh] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead>P#</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Dept</TableHead>
                <TableHead>Sem</TableHead>
                <TableHead>Sec</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Room</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule.isLoading ? (
                <TableRow><TableCell colSpan={11} className="text-center py-12 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : (schedule.data ?? []).length === 0 ? (
                <TableRow><TableCell colSpan={11} className="text-center py-12 text-muted-foreground">
                  <CalendarDays className="h-8 w-8 mx-auto text-orange-500 mb-2" />
                  No schedule slots found.
                </TableCell></TableRow>
              ) : (
                (schedule.data ?? []).map((s, i) => (
                  <motion.tr key={s.scheduleId}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 20) * 0.02, duration: 0.2 }}
                    className="border-b hover:bg-muted/30">
                    <TableCell className="font-semibold">{s.dayOfWeek?.slice(0, 3)}</TableCell>
                    <TableCell>{s.periodNumber}</TableCell>
                    <TableCell className="text-xs">{s.startTime?.slice(0, 5)}–{s.endTime?.slice(0, 5)}</TableCell>
                    <TableCell><span className="font-mono">{s.subjectCode}</span></TableCell>
                    <TableCell className="text-sm">{s.teacherName}</TableCell>
                    <TableCell>{s.deptCode}</TableCell>
                    <TableCell>{s.semester}</TableCell>
                    <TableCell>{s.section}</TableCell>
                    <TableCell><Badge variant="secondary">{s.classType}</Badge></TableCell>
                    <TableCell>{s.roomNo || '—'}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="text-destructive"
                        onClick={() => { if (confirm('Delete this slot?')) del.mutate(s.scheduleId); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
