import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Plus, RefreshCw, Search, Eye, Pencil, Trash2,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import {
  flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
  type ColumnDef, type SortingState,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Card }   from '@/components/ui/card';
import { Input }  from '@/components/ui/input';
import { Badge }  from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogBody, DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatCard } from '@/components/shared/StatCard';
import { useDepartments } from '@/hooks/useDepartments';
import {
  useTeachers, useCreateTeacher, useUpdateTeacher, useDeleteTeacher,
} from '@/hooks/useTeachers';
import { initials, cn } from '@/lib/utils';
import type { Teacher } from '@/types/api';
import { TeacherFormDialog } from './_TeacherFormDialog';
import { TeacherViewDialog } from './_TeacherViewDialog';

export default function AdminTeachers() {
  const [deptFilter, setDeptFilter] = useState<number | undefined>(undefined);
  const [designFilter, setDesignFilter] = useState<string | undefined>(undefined);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [openForm, setOpenForm] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selected, setSelected] = useState<Teacher | null>(null);

  const depts = useDepartments();
  const { data: rawTeachers = [], isLoading, refetch, isFetching } = useTeachers(deptFilter);
  const create = useCreateTeacher();
  const update = useUpdateTeacher();
  const del    = useDeleteTeacher();

  const teachers = useMemo(
    () => designFilter ? rawTeachers.filter((t) => t.designation === designFilter) : rawTeachers,
    [rawTeachers, designFilter],
  );

  const stats = useMemo(() => ({
    total: teachers.length,
    prof:  teachers.filter((t) => t.designation === 'Professor').length,
    asst:  teachers.filter((t) => t.designation === 'Assistant Professor').length,
    lab:   teachers.filter((t) => t.designation === 'Lab Instructor').length,
  }), [teachers]);

  const columns: ColumnDef<Teacher>[] = useMemo(() => [
    {
      accessorKey: 'empId',
      header: 'Emp ID',
      cell: ({ row }) => <span className="font-mono font-semibold text-muted-foreground">{row.original.empId}</span>,
    },
    {
      accessorKey: 'teacherName',
      header: 'Teacher',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 bg-indigo-100"><AvatarFallback className="bg-indigo-100 text-indigo-700">{initials(row.original.teacherName)}</AvatarFallback></Avatar>
          <div className="min-w-0">
            <div className="font-semibold truncate">{row.original.teacherName}</div>
            <div className="text-xs text-muted-foreground truncate">{row.original.email || '—'}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'designation',
      header: 'Designation',
      cell: ({ row }) => {
        const d = row.original.designation;
        const variant: any = d === 'Professor' ? 'success'
          : d === 'Associate Professor' ? 'info'
          : d === 'HOD' ? 'default'
          : d === 'Lab Instructor' ? 'secondary'
          : 'warning';
        return <Badge variant={variant}>{d}</Badge>;
      },
    },
    { accessorKey: 'deptCode', header: 'Dept' },
    { accessorKey: 'phone',    header: 'Phone', cell: ({ getValue }) => (getValue() as string) || '—' },
    {
      accessorKey: 'dateJoined',
      header: 'Joined',
      cell: ({ getValue }) => {
        const d = getValue() as string | null;
        return d ? d.slice(0, 10) : '—';
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={() => { setSelected(row.original); setOpenView(true); }}
            className="h-8 w-8 rounded-md inline-flex items-center justify-center text-indigo-700 hover:bg-indigo-50 transition" aria-label="View">
            <Eye className="h-4 w-4" />
          </button>
          <button onClick={() => { setSelected(row.original); setOpenForm(true); }}
            className="h-8 w-8 rounded-md inline-flex items-center justify-center text-orange-700 hover:bg-orange-50 transition" aria-label="Edit">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => { setSelected(row.original); setOpenDelete(true); }}
            className="h-8 w-8 rounded-md inline-flex items-center justify-center text-destructive hover:bg-destructive/10 transition" aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ], []);

  const table = useReactTable({
    data: teachers, columns,
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
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs text-muted-foreground">Dashboard › <span className="text-foreground font-semibold">Teachers</span></div>
          <h1 className="text-2xl font-extrabold mt-1">Faculty Roster</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} /> Refresh
          </Button>
          <Button onClick={() => { setSelected(null); setOpenForm(true); }}>
            <Plus className="h-4 w-4" /> Add Teacher
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Teachers" value={stats.total} icon={<Users className="h-6 w-6" />} tone="orange" />
        <StatCard label="Professors"     value={stats.prof}  icon={<span>🎯</span>} tone="success" />
        <StatCard label="Assistant Prof" value={stats.asst}  icon={<span>📚</span>} tone="warning" />
        <StatCard label="Lab Instructor" value={stats.lab}   icon={<span>🔬</span>} tone="info" />
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-bold">All Teachers</div>
            <div className="text-xs text-muted-foreground">Showing {table.getRowModel().rows.length} of {teachers.length}</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Search emp ID or name…" className="pl-9 h-9 w-60 rounded-full" />
            </div>
            <Select value={deptFilter?.toString() ?? 'all'} onValueChange={(v) => setDeptFilter(v === 'all' ? undefined : Number(v))}>
              <SelectTrigger className="h-9 w-32 rounded-full"><SelectValue placeholder="Dept" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Depts</SelectItem>
                {depts.data?.map((d) => <SelectItem key={d.deptId} value={d.deptId.toString()}>{d.deptCode}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={designFilter ?? 'all'} onValueChange={(v) => setDesignFilter(v === 'all' ? undefined : v)}>
              <SelectTrigger className="h-9 w-44 rounded-full"><SelectValue placeholder="Designation" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Designations</SelectItem>
                <SelectItem value="Professor">Professor</SelectItem>
                <SelectItem value="Associate Professor">Associate Prof.</SelectItem>
                <SelectItem value="Assistant Professor">Assistant Prof.</SelectItem>
                <SelectItem value="HOD">HOD</SelectItem>
                <SelectItem value="Lab Instructor">Lab Instructor</SelectItem>
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
                    <TableHead key={h.id} onClick={h.column.getToggleSortingHandler()}
                      className={cn(h.column.getCanSort() && 'cursor-pointer select-none')}>
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
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Loading teachers…</TableCell></TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No teachers found.
                </TableCell></TableRow>
              ) : (
                table.getRowModel().rows.map((row, i) => (
                  <motion.tr key={row.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02, duration: 0.25 }}
                    className="border-b transition-colors hover:bg-muted/40">
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
            <Button variant="ghost" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><ChevronLeft className="h-4 w-4" /> Prev</Button>
            <Button variant="ghost" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </Card>

      <TeacherFormDialog
        open={openForm}
        onOpenChange={setOpenForm}
        existing={selected}
        saving={create.isPending || update.isPending}
        onSubmit={async (payload) => {
          if (selected?.teacherId) await update.mutateAsync({ ...payload, teacherId: selected.teacherId });
          else                     await create.mutateAsync(payload);
          setOpenForm(false); setSelected(null);
        }}
      />

      <TeacherViewDialog
        open={openView}
        onOpenChange={setOpenView}
        teacher={selected}
        onEdit={() => { setOpenView(false); setOpenForm(true); }}
      />

      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Deactivate Teacher?</DialogTitle>
            <DialogDescription>This soft-deletes the record.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-muted-foreground">
              You are about to deactivate <strong className="text-foreground">{selected?.empId}</strong>{' '}
              ({selected?.teacherName}).
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenDelete(false)}>Cancel</Button>
            <Button variant="destructive" disabled={del.isPending}
              onClick={async () => {
                if (selected) {
                  await del.mutateAsync(selected.teacherId);
                  setOpenDelete(false); setSelected(null);
                }
              }}>
              {del.isPending ? 'Deleting…' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
