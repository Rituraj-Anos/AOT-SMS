import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
  type ColumnDef, type SortingState,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Search, Users } from 'lucide-react';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { useTeacherMappings } from '@/hooks/useTeachers';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { StatCard } from '@/components/shared/StatCard';
import { initials, cn } from '@/lib/utils';
import type { ApiResponse, Student } from '@/types/api';

export default function TeacherMyStudents() {
  const me = useAuthStore((s) => s.me);
  const mappings = useTeacherMappings(me?.entityId ?? null);

  const [sectionFilter, setSectionFilter] = useState<string | undefined>();
  const [globalFilter,  setGlobalFilter]  = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  // Unique (deptId, semester, section) combinations the teacher owns.
  const slices = useMemo(() => {
    const seen = new Set<string>();
    const out: { deptId: number; sem: number; section: string }[] = [];
    for (const m of mappings.data ?? []) {
      const k = `${m.deptId}-${m.semester}-${m.section ?? ''}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ deptId: m.deptId, sem: m.semester, section: m.section ?? '' });
    }
    return out;
  }, [mappings.data]);

  // Single batched query — fetches students sequentially across teacher's slices.
  const sliceQuery = useQuery({
    queryKey: ['my-students', slices],
    enabled: slices.length > 0,
    queryFn: async () => {
      const map = new Map<number, Student>();
      for (const s of slices) {
        if (!s.deptId || !s.sem) continue;
        try {
          const params: Record<string, any> = { deptId: s.deptId, sem: s.sem };
          if (s.section) params.section = s.section;
          const r = await api.get<ApiResponse<Student[]>>('/students', { params });
          for (const st of (r.data.data ?? [])) map.set(st.studentId, st);
        } catch { /* ignore */ }
      }
      return [...map.values()];
    },
    staleTime: 60_000,
  });

  // Merge & dedupe students across slices
  const allStudents = useMemo(() => sliceQuery.data ?? [], [sliceQuery.data]);

  const sectionsAvailable = useMemo(() => {
    return [...new Set(allStudents.map((s) => s.section).filter(Boolean))].sort();
  }, [allStudents]);

  const filtered = useMemo(() => {
    return sectionFilter
      ? allStudents.filter((s) => s.section === sectionFilter)
      : allStudents;
  }, [allStudents, sectionFilter]);

  const stats = useMemo(() => ({
    total:    allStudents.length,
    sections: sectionsAvailable.length,
    subjects: mappings.data?.length ?? 0,
  }), [allStudents, sectionsAvailable, mappings.data]);

  const columns: ColumnDef<Student>[] = useMemo(() => [
    {
      accessorKey: 'rollNo',
      header: 'Roll No',
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-muted-foreground">{row.original.rollNo}</span>
      ),
    },
    {
      accessorKey: 'studentName',
      header: 'Student',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{initials(row.original.studentName)}</AvatarFallback>
          </Avatar>
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
  ], []);

  const table = useReactTable({
    data: filtered, columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel:       getCoreRowModel(),
    getSortedRowModel:     getSortedRowModel(),
    getFilteredRowModel:   getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  const isLoading = mappings.isLoading || sliceQuery.isLoading;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-xs text-muted-foreground">
          Dashboard › <span className="text-foreground font-semibold">My Students</span>
        </div>
        <h1 className="text-2xl font-extrabold mt-1">My Students</h1>
        <p className="text-sm text-muted-foreground">
          Read-only roster of students across all your assigned sections.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Students"  value={stats.total}    icon={<Users className="h-6 w-6" />} tone="orange" />
        <StatCard label="Sections"  value={stats.sections} icon={<span>§</span>} tone="info" />
        <StatCard label="Subjects"  value={stats.subjects} icon={<span>📚</span>} tone="success" />
      </div>

      {/* Filters */}
      <Card>
        <div className="px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-bold">Roster</div>
            <div className="text-xs text-muted-foreground">
              {isLoading ? 'Loading…' : `Showing ${table.getRowModel().rows.length} of ${filtered.length}`}
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
            {sectionsAvailable.length > 1 && (
              <Select
                value={sectionFilter ?? 'all'}
                onValueChange={(v) => setSectionFilter(v === 'all' ? undefined : v)}
              >
                <SelectTrigger className="h-9 w-32 rounded-full"><SelectValue placeholder="Section" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sec</SelectItem>
                  {sectionsAvailable.map((s) => (
                    <SelectItem key={s} value={s}>Sec {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="p-12 text-center text-muted-foreground">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-orange-500 mb-3" />
            Loading your students…
          </div>
        )}

        {!isLoading && slices.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto text-orange-500 mb-3" />
            <div className="font-semibold text-foreground mb-1">No subjects assigned to you</div>
            <div className="text-sm">Contact admin to get subject mappings.</div>
          </div>
        )}

        {!isLoading && slices.length > 0 && (
          <>
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
                  {table.getRowModel().rows.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No students match the filters.
                    </TableCell></TableRow>
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
          </>
        )}
      </Card>
    </div>
  );
}
