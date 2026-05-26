import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy, GraduationCap, AlertTriangle, Users, Search,
  Eye, Download,
} from 'lucide-react';
import {
  flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
  type ColumnDef, type SortingState,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogBody, DialogFooter,
} from '@/components/ui/dialog';
import { StatCard } from '@/components/shared/StatCard';
import { useDepartments } from '@/hooks/useDepartments';
import { useStudents } from '@/hooks/useStudents';
import { api } from '@/lib/axios';
import { initials, cn } from '@/lib/utils';
import { GRADE_COLORS, type Grade as GradeLetter } from '@/lib/makaut';
import type { ApiResponse, ResultBundle, Student } from '@/types/api';

interface ResultsRow {
  student: Student;
  cgpa: number | null;
  percentage: number | null;
  backlogCount: number;
  sgpaBySemester: Record<string, number>;
}

export default function AdminResults() {
  const [deptFilter, setDeptFilter] = useState<number | undefined>();
  const [semFilter,  setSemFilter]  = useState<number | undefined>();
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [openView, setOpenView] = useState(false);
  const [selected, setSelected] = useState<ResultsRow | null>(null);

  const depts    = useDepartments();
  const students = useStudents({ deptId: deptFilter, sem: semFilter });

  // Single batched query — sequentially fetches result for visible students.
  // Hard-cap at 30 to keep things responsive.
  const studentIds = (students.data ?? []).slice(0, 30).map((s) => s.studentId);
  const resultsQuery = useQuery({
    queryKey: ['results-batch', studentIds],
    enabled: studentIds.length > 0,
    queryFn: async () => {
      const out: Record<number, ResultBundle | null> = {};
      for (const id of studentIds) {
        try {
          const r = await api.get<ApiResponse<ResultBundle>>('/grades', { params: { studentId: id } });
          out[id] = r.data.data;
        } catch {
          out[id] = null;
        }
      }
      return out;
    },
    staleTime: 60_000,
  });

  const rows: ResultsRow[] = useMemo(() => {
    const list = (students.data ?? []).slice(0, 30);
    const map  = resultsQuery.data ?? {};
    return list.map((s) => {
      const r = map[s.studentId];
      const cgpa       = r?.cgpa != null ? Number(r.cgpa) : null;
      const percentage = r?.percentage != null ? Number(r.percentage) : null;
      return {
        student: s,
        cgpa, percentage,
        backlogCount: r?.backlogCount ?? 0,
        sgpaBySemester: r?.sgpaBySemester ?? {},
      };
    });
  }, [students.data, resultsQuery.data]);

  const stats = useMemo(() => {
    const total = rows.length;
    const withCgpa = rows.filter((r) => r.cgpa != null && r.cgpa > 0);
    const avgCgpa = withCgpa.length > 0
      ? withCgpa.reduce((a, r) => a + (r.cgpa ?? 0), 0) / withCgpa.length
      : 0;
    const withBacklogs = rows.filter((r) => r.backlogCount > 0).length;
    const distinction  = rows.filter((r) => (r.cgpa ?? 0) >= 8.5).length;
    return {
      total,
      avgCgpa: Math.round(avgCgpa * 100) / 100,
      withBacklogs,
      distinction,
    };
  }, [rows]);

  const columns: ColumnDef<ResultsRow>[] = useMemo(() => [
    {
      accessorFn: (r) => r.student.rollNo,
      id: 'rollNo',
      header: 'Roll No',
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-muted-foreground">{row.original.student.rollNo}</span>
      ),
    },
    {
      accessorFn: (r) => r.student.studentName,
      id: 'studentName',
      header: 'Student',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9"><AvatarFallback>{initials(row.original.student.studentName)}</AvatarFallback></Avatar>
          <div className="min-w-0">
            <div className="font-semibold truncate">{row.original.student.studentName}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.student.deptCode} · Sem {row.original.student.currentSemester}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'cgpa',
      header: 'CGPA',
      cell: ({ row }) => {
        const c = row.original.cgpa;
        if (c == null || c === 0) return <span className="text-muted-foreground">—</span>;
        const tone = c >= 8.5 ? 'success' : c >= 6 ? 'info' : 'warning';
        return <Badge variant={tone as any}>{c.toFixed(2)}</Badge>;
      },
    },
    {
      accessorKey: 'percentage',
      header: '%',
      cell: ({ row }) => {
        const p = row.original.percentage;
        return p == null || p === 0
          ? <span className="text-muted-foreground">—</span>
          : <span className="font-semibold">{p.toFixed(2)}%</span>;
      },
    },
    {
      accessorKey: 'backlogCount',
      header: 'Backlogs',
      cell: ({ getValue }) => {
        const n = getValue() as number;
        return n > 0
          ? <Badge variant="destructive">{n}</Badge>
          : <span className="text-xs text-muted-foreground">—</span>;
      },
    },
    {
      id: 'semesters',
      header: 'Semesters Done',
      cell: ({ row }) => {
        const sems = Object.keys(row.original.sgpaBySemester);
        return sems.length > 0
          ? <span className="text-sm">{sems.length}</span>
          : <span className="text-xs text-muted-foreground">—</span>;
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setSelected(row.original); setOpenView(true); }}
        >
          <Eye className="h-4 w-4" /> View
        </Button>
      ),
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
    const base = import.meta.env.VITE_API_BASE_URL || '';
    const url = `${base}/api/reports?type=marks${semFilter ? `&sem=${semFilter}` : ''}`;
    fetch(url, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'marks_report.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => { /* error handled silently */ });
  }

  const isAnyLoading = students.isLoading || resultsQuery.isLoading;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <div className="text-xs text-muted-foreground">
            Dashboard › <span className="text-foreground font-semibold">Results</span>
          </div>
          <h1 className="text-2xl font-extrabold mt-1">Semester Results</h1>
          <p className="text-sm text-muted-foreground">SGPA, CGPA, percentage and backlog rollups across the cohort.</p>
        </div>
        <Button onClick={exportCsv}>
          <Download className="h-4 w-4" /> Export Marks CSV
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={stats.total} icon={<Users className="h-6 w-6" />} tone="orange" />
        <StatCard label="Avg CGPA" value={stats.avgCgpa} icon={<GraduationCap className="h-6 w-6" />} tone="info" />
        <StatCard label="Distinction (≥8.5)" value={stats.distinction} icon={<Trophy className="h-6 w-6" />} tone="success" />
        <StatCard label="With Backlogs" value={stats.withBacklogs} icon={<AlertTriangle className="h-6 w-6" />} tone="danger" />
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-bold">Per-Student Results</div>
            <div className="text-xs text-muted-foreground">
              {isAnyLoading ? 'Loading…' : `Showing ${table.getRowModel().rows.length} of ${rows.length}`}
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
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Loading results…</TableCell></TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No students match the filters.</TableCell></TableRow>
              ) : (
                table.getRowModel().rows.map((row, i) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 20) * 0.02, duration: 0.25 }}
                    className="border-b transition-colors hover:bg-muted/40"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-3 align-middle whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </motion.tr>
                ))
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

      {/* View Dialog — student transcript */}
      <ViewResultDialog open={openView} onOpenChange={setOpenView} row={selected} />
    </div>
  );
}

function ViewResultDialog({
  open, onOpenChange, row,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  row: ResultsRow | null;
}) {
  if (!row) return null;
  const sgpaList = Object.entries(row.sgpaBySemester)
    .map(([k, v]) => ({ sem: Number(k), sgpa: Number(v) }))
    .sort((a, b) => a.sem - b.sem);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Result Transcript</DialogTitle>
          <DialogDescription>
            {row.student.rollNo} · {row.student.studentName} · {row.student.deptCode} · Sem {row.student.currentSemester}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <SummaryStat label="CGPA"       value={row.cgpa != null ? row.cgpa.toFixed(2) : '—'} />
            <SummaryStat label="Percentage" value={row.percentage != null ? `${row.percentage.toFixed(2)}%` : '—'} />
            <SummaryStat label="Backlogs"   value={String(row.backlogCount)} tone={row.backlogCount > 0 ? 'danger' : 'success'} />
          </div>

          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            SGPA per semester
          </div>
          {sgpaList.length === 0 ? (
            <div className="text-sm text-muted-foreground">No semester results recorded.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {sgpaList.map((s) => (
                <div key={s.sem} className="rounded-md border border-border bg-background p-3 text-center">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Sem {s.sem}</div>
                  <div className="text-lg font-extrabold">{s.sgpa.toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Inline grade preview hint */}
          <div className="text-[11px] text-muted-foreground mt-4">
            Grade legend:
            {(['O','E','A','B','C','D','F'] as GradeLetter[]).map((g) => (
              <span key={g} className={cn('inline-flex items-center justify-center w-6 h-6 rounded text-xs font-extrabold ml-2', GRADE_COLORS[g])}>{g}</span>
            ))}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryStat({
  label, value, tone = 'orange',
}: {
  label: string; value: string;
  tone?: 'orange' | 'success' | 'danger';
}) {
  const tint = {
    orange:  'bg-orange-50 text-orange-700  border-orange-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    danger:  'bg-red-50    text-red-700    border-red-200',
  }[tone];
  return (
    <div className={cn('rounded-md border p-3 text-center', tint)}>
      <div className="text-[11px] uppercase tracking-wider opacity-80">{label}</div>
      <div className="text-xl font-extrabold">{value}</div>
    </div>
  );
}
