import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap, Plus, RefreshCw, Search, Eye, Pencil, Trash2,
  ChevronLeft, ChevronRight,
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogBody, DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { StatCard } from '@/components/shared/StatCard';
import { useDepartments } from '@/hooks/useDepartments';
import {
  useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent,
  type StudentFilters, type StudentPayload,
} from '@/hooks/useStudents';
import { initials, cn } from '@/lib/utils';
import type { Student, StudentType } from '@/types/api';

export default function AdminStudents() {
  // ── Filters/state
  const [filters, setFilters] = useState<StudentFilters>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [openForm, setOpenForm] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selected, setSelected] = useState<Student | null>(null);

  // ── Data
  const depts = useDepartments();
  const { data: students = [], isLoading, refetch, isFetching } = useStudents(filters);
  const create = useCreateStudent();
  const update = useUpdateStudent();
  const del    = useDeleteStudent();

  const stats = useMemo(() => ({
    total:    students.length,
    regular:  students.filter((s) => s.studentType === 'regular').length,
    lateral:  students.filter((s) => s.studentType === 'lateral').length,
    transfer: students.filter((s) => s.studentType === 'transfer').length,
  }), [students]);

  // ── Columns
  const columns: ColumnDef<Student>[] = useMemo(() => [
    {
      accessorKey: 'rollNo',
      header: 'Roll No',
      cell: ({ row }) => <span className="font-mono font-semibold text-muted-foreground">{row.original.rollNo}</span>,
    },
    {
      accessorKey: 'studentName',
      header: 'Student',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9"><AvatarFallback>{initials(row.original.studentName)}</AvatarFallback></Avatar>
          <div className="min-w-0">
            <div className="font-semibold truncate">{row.original.studentName}</div>
            <div className="text-xs text-muted-foreground truncate">{row.original.email || '—'}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'studentType',
      header: 'Type',
      cell: ({ row }) => {
        const v = row.original.studentType;
        const variant = v === 'regular' ? 'info' : v === 'lateral' ? 'warning' : 'success';
        return <Badge variant={variant as any}>{v}</Badge>;
      },
    },
    { accessorKey: 'deptCode',         header: 'Dept' },
    { accessorKey: 'currentSemester',  header: 'Sem' },
    { accessorKey: 'section',          header: 'Sec' },
    { accessorKey: 'phone',            header: 'Phone', cell: ({ getValue }) => (getValue() as string) || '—' },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={() => { setSelected(row.original); setOpenView(true); }}
            className="h-8 w-8 rounded-md inline-flex items-center justify-center text-indigo-700 hover:bg-indigo-50 transition"
            aria-label="View"
          ><Eye className="h-4 w-4" /></button>
          <button
            onClick={() => { setSelected(row.original); setOpenForm(true); }}
            className="h-8 w-8 rounded-md inline-flex items-center justify-center text-orange-700 hover:bg-orange-50 transition"
            aria-label="Edit"
          ><Pencil className="h-4 w-4" /></button>
          <button
            onClick={() => { setSelected(row.original); setOpenDelete(true); }}
            className="h-8 w-8 rounded-md inline-flex items-center justify-center text-destructive hover:bg-destructive/10 transition"
            aria-label="Delete"
          ><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ], []);

  const table = useReactTable({
    data: students,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel:       getCoreRowModel(),
    getSortedRowModel:     getSortedRowModel(),
    getFilteredRowModel:   getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <div className="text-xs text-muted-foreground">Dashboard › <span className="text-foreground font-semibold">Students</span></div>
          <h1 className="text-2xl font-extrabold mt-1">Student Roster</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} /> Refresh
          </Button>
          <Button onClick={() => { setSelected(null); setOpenForm(true); }}>
            <Plus className="h-4 w-4" /> Add Student
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={stats.total}    icon={<GraduationCap className="h-6 w-6" />}    tone="orange" />
        <StatCard label="Regular"        value={stats.regular}  icon={<span>📋</span>} tone="info" />
        <StatCard label="Lateral"        value={stats.lateral}  icon={<span>↗</span>}  tone="warning" />
        <StatCard label="Transfer"       value={stats.transfer} icon={<span>⇆</span>}  tone="success" />
      </div>

      {/* Table card */}
      <Card>
        <div className="px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-bold">All Students</div>
            <div className="text-xs text-muted-foreground">
              Showing {table.getRowModel().rows.length} of {students.length}
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

            <Select value={filters.deptId?.toString() ?? 'all'} onValueChange={(v) => setFilters((f) => ({ ...f, deptId: v === 'all' ? undefined : Number(v) }))}>
              <SelectTrigger className="h-9 w-32 rounded-full"><SelectValue placeholder="Dept" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Depts</SelectItem>
                {depts.data?.map((d) => (
                  <SelectItem key={d.deptId} value={d.deptId.toString()}>{d.deptCode}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.sem?.toString() ?? 'all'} onValueChange={(v) => setFilters((f) => ({ ...f, sem: v === 'all' ? undefined : Number(v) }))}>
              <SelectTrigger className="h-9 w-28 rounded-full"><SelectValue placeholder="Sem" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sems</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <SelectItem key={n} value={n.toString()}>Sem {n}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filters.section ?? 'all'} onValueChange={(v) => setFilters((f) => ({ ...f, section: v === 'all' ? undefined : v }))}>
              <SelectTrigger className="h-9 w-28 rounded-full"><SelectValue placeholder="Section" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sec</SelectItem>
                {['A', 'B', 'C'].map((s) => <SelectItem key={s} value={s}>Sec {s}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filters.type ?? 'all'} onValueChange={(v) => setFilters((f) => ({ ...f, type: v === 'all' ? undefined : (v as StudentType) }))}>
              <SelectTrigger className="h-9 w-32 rounded-full"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="lateral">Lateral</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
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
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Loading students…</TableCell></TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  No students found. Try adjusting filters or click <strong>Add Student</strong>.
                </TableCell></TableRow>
              ) : (
                table.getRowModel().rows.map((row, i) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02, duration: 0.25 }}
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

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-background/50">
          <div className="text-xs text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button variant="ghost" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Modals ── */}
      <StudentFormDialog
        open={openForm}
        onOpenChange={setOpenForm}
        existing={selected}
        onSubmit={async (payload) => {
          if (selected?.studentId) {
            await update.mutateAsync({ ...payload, studentId: selected.studentId });
          } else {
            await create.mutateAsync(payload);
          }
          setOpenForm(false);
          setSelected(null);
        }}
        saving={create.isPending || update.isPending}
      />

      <StudentViewDialog
        open={openView}
        onOpenChange={setOpenView}
        student={selected}
        onEdit={() => { setOpenView(false); setOpenForm(true); }}
      />

      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Deactivate Student?</DialogTitle>
            <DialogDescription>This soft-deletes the record. It can be restored later.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-muted-foreground">
              You are about to deactivate <strong className="text-foreground">{selected?.rollNo}</strong>
              {' '}({selected?.studentName}). They will no longer appear in active lists.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenDelete(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={del.isPending}
              onClick={async () => {
                if (selected) {
                  await del.mutateAsync(selected.studentId);
                  setOpenDelete(false);
                  setSelected(null);
                }
              }}
            >
              {del.isPending ? 'Deleting…' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ───────── helper sub-components ───────── */
import { StudentFormDialog } from './_StudentFormDialog';
import { StudentViewDialog } from './_StudentViewDialog';
