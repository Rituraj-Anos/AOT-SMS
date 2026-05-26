import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download, RefreshCw, Search, AlertTriangle, Users, CalendarCheck,
} from 'lucide-react';
import {
  flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
  type ColumnDef, type SortingState,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { StatCard } from '@/components/shared/StatCard';
import { useStudents } from '@/hooks/useStudents';
import { useDepartments } from '@/hooks/useDepartments';
import { api } from '@/lib/axios';
import { initials, cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import type { ApiResponse, AttendanceSummary, Student } from '@/types/api';

interface AttendanceRow {
  student: Student;
  totalHeld: number;
  totalPresent: number;
  totalAbsent: number;
  overallPct: number;
  subjectsBelow75: number;
}

export default function AdminAttendanceView() {
  const [deptFilter, setDeptFilter] = useState<number | undefined>();
  const [semFilter,  setSemFilter]  = useState<number | undefined>();
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  const depts    = useDepartments();
  const students = useStudents({ deptId: deptFilter, sem: semFilter });

  // Single query that internally loops attendance summaries for visible students.
  // Hard-capped at 30 students so we don't hammer the backend.
  const studentIds = (students.data ?? []).slice(0, 30).map((s) => s.studentId);
  const summariesQuery = useQuery({
    queryKey: ['attendance-batch', studentIds],
    enabled: studentIds.length > 0,
    queryFn: async () => {
      const out: Record<number, AttendanceSummary[]> = {};
      // Sequential, bounded — no fan-out.
      for (const id of studentIds) {
        try {
          const r = await api.get<ApiResponse<AttendanceSummary[]>>('/attendance', {
            params: { studentId: id },
          });
          out[id] = r.data.data ?? [];
        } catch {
          out[id] = [];
        }
      }
      return out;
    },
    staleTime: 60_000,
  });

  const rows: AttendanceRow[] = useMemo(() => {
    const list = (students.data ?? []).slice(0, 30);
    const map  = summariesQuery.data ?? {};
    return list.map((s) => {
      const summary = map[s.studentId] ?? [];
      const totalHeld    = summary.reduce((a, x) => a + x.held, 0);
      const totalPresent = summary.reduce((a, x) => a + x.present, 0);
      const overallPct   = totalHeld > 0 ? (totalPresent * 100) / totalHeld : 0;
      const subjectsBelow75 = summary.filter((x) => x.percent < 75).length;
      return {
        student: s,
        totalHeld,
        totalPresent,
        totalAbsent: totalHeld - totalPresent,
        overallPct: Math.round(overallPct * 10) / 10,
        subjectsBelow75,
      };
    });
  }, [students.data, summariesQuery.data]);

  const stats = useMemo(() => {
    const total       = rows.length;
    const above75     = rows.filter((r) => r.overallPct >= 75).length;
    const below75     = rows.filter((r) => r.overallPct < 75 && r.totalHeld > 0).length;
    const noData      = rows.filter((r) => r.totalHeld === 0).length;
    return { total, above75, below75, noData };
  }, [rows]);

  const columns: ColumnDef<AttendanceRow>[] = useMemo(() => [
    {
      accessorFn: (r) => r.student.rollNo,
      id: 'rollNo',
      header: 'Roll No',
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-muted-foreground">
          {row.original.student.rollNo}
        </span>
      ),
    },
    {
      accessorFn: (r) => r.student.studentName,
      id: 'studentName',
      header: 'Student',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{initials(row.original.student.studentName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="font-semibold truncate">{row.original.student.studentName}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.student.deptCode} · Sem {row.original.student.currentSemester}
            </div>
          </div>
        </div>
      ),
    },
    { accessorKey: 'totalHeld',    header: 'Held',    cell: ({ getValue }) => getValue() as number },
    { accessorKey: 'totalPresent', header: 'Present', cell: ({ getValue }) => getValue() as number },
    { accessorKey: 'totalAbsent',  header: 'Absent',  cell: ({ getValue }) => getValue() as number },
    {
      accessorKey: 'overallPct',
      header: '%',
      cell: ({ row }) => {
        const pct = row.original.overallPct;
        const empty = row.original.totalHeld === 0;
        if (empty) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="flex items-center gap-2 min-w-[120px]">
            <Progress
              value={Math.min(100, pct)}
              className="w-20"
              indicatorClassName={pct < 75 ? 'bg-red-500' : ''}
            />
            <span className={cn('text-sm font-semibold', pct < 75 ? 'text-red-700' : 'text-foreground')}>
              {pct}%
            </span>
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const r = row.original;
        if (r.totalHeld === 0) return <Badge variant="secondary">No data</Badge>;
        if (r.overallPct < 75)  return <Badge variant="destructive">Below 75%</Badge>;
        return <Badge variant="success">OK</Badge>;
      },
    },
    {
      accessorKey: 'subjectsBelow75',
      header: 'Subjects < 75%',
      cell: ({ getValue }) => {
        const n = getValue() as number;
        return n > 0
          ? <Badge variant="warning">{n} subj.</Badge>
          : <span className="text-xs text-muted-foreground">—</span>;
      },
    },
  ], []);

  const table = useReactTable({
    data: rows, columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel:       getCoreRowModel(),
    getSortedRowModel:     getSortedRowModel(),
    getFilteredRowModel:   getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  function exportCsv() {
    const params = new URLSearchParams({ type: 'attendance' });
    if (deptFilter) params.set('deptId', String(deptFilter));
    if (semFilter)  params.set('sem',    String(semFilter));
    const base = import.meta.env.VITE_API_BASE_URL || '';
    window.open(`${base}/api/reports?${params.toString()}`, '_blank');
  }

  const isAnyLoading = students.isLoading || summariesQuery.isLoading;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <div className="text-xs text-muted-foreground">
            Dashboard › <span className="text-foreground font-semibold">Attendance</span>
          </div>
          <h1 className="text-2xl font-extrabold mt-1">Attendance Reports</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => students.refetch()} disabled={students.isFetching}>
            <RefreshCw className={cn('h-4 w-4', students.isFetching && 'animate-spin')} /> Refresh
          </Button>
          <Button onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students"  value={stats.total}    icon={<Users className="h-6 w-6" />}            tone="orange" />
        <StatCard label="Above 75%"       value={stats.above75}  icon={<CalendarCheck className="h-6 w-6" />}    tone="success" />
        <StatCard label="Below 75%"       value={stats.below75}  icon={<AlertTriangle className="h-6 w-6" />}    tone="danger"  />
        <StatCard label="No Data"         value={stats.noData}   icon={<span>·</span>}                            tone="info"    />
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-bold">Per-Student Summary</div>
            <div className="text-xs text-muted-foreground">
              {isAnyLoading
                ? 'Loading…'
                : `Showing ${table.getRowModel().rows.length} of ${rows.length}`}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Search roll or name…"
                className="pl-9 h-9 w-60 rounded-full"
              />
            </div>
            <Select
              value={deptFilter?.toString() ?? 'all'}
              onValueChange={(v) => setDeptFilter(v === 'all' ? undefined : Number(v))}
            >
              <SelectTrigger className="h-9 w-32 rounded-full"><SelectValue placeholder="Dept" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Depts</SelectItem>
                {depts.data?.map((d) => (
                  <SelectItem key={d.deptId} value={String(d.deptId)}>{d.deptCode}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={semFilter?.toString() ?? 'all'}
              onValueChange={(v) => setSemFilter(v === 'all' ? undefined : Number(v))}
            >
              <SelectTrigger className="h-9 w-28 rounded-full"><SelectValue placeholder="Sem" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sems</SelectItem>
                {[1,2,3,4,5,6,7,8].map((n) => (
                  <SelectItem key={n} value={String(n)}>Sem {n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead
                      key={h.id}
                      onClick={h.column.getToggleSortingHandler()}
                      className={cn(h.column.getCanSort() && 'cursor-pointer select-none')}
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {h.column.getIsSorted() === 'asc'  && ' ▲'}
                      {h.column.getIsSorted() === 'desc' && ' ▼'}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isAnyLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Loading attendance summaries…</TableCell></TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No students match the filters.</TableCell></TableRow>
              ) : (
                table.getRowModel().rows.map((row, i) => {
                  const r = row.original;
                  const danger = r.totalHeld > 0 && r.overallPct < 75;
                  return (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i, 20) * 0.02, duration: 0.25 }}
                      className={cn(
                        'border-b transition-colors',
                        danger ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-muted/40',
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-3 py-3 align-middle whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </motion.tr>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-background/50">
          <div className="text-xs text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>‹ Prev</Button>
            <Button variant="ghost" size="sm" onClick={() => table.nextPage()}     disabled={!table.getCanNextPage()}>Next ›</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
