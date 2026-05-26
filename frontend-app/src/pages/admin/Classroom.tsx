import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Trash2, Users, BookOpen, Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { StatCard } from '@/components/shared/StatCard';
import { useDepartments } from '@/hooks/useDepartments';
import { useAllMaterials, useDeleteMaterial } from '@/hooks/useMaterials';
import { cn } from '@/lib/utils';
import type { MaterialType } from '@/types/api';

export default function AdminClassroom() {
  const [deptFilter, setDeptFilter] = useState<number | undefined>();
  const [typeFilter, setTypeFilter] = useState<string | undefined>();

  const depts = useDepartments();
  const materials = useAllMaterials(deptFilter, undefined, typeFilter);
  const del = useDeleteMaterial();

  const stats = useMemo(() => {
    const list = materials.data ?? [];
    const teachers = new Set(list.map((m) => m.teacherId));
    return {
      total: list.length,
      assignments: list.filter((m) => m.materialType === 'assignment').length,
      teachers: teachers.size,
    };
  }, [materials.data]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-xs text-muted-foreground">Dashboard › <span className="text-foreground font-semibold">Classroom</span></div>
        <h1 className="text-2xl font-extrabold mt-1">Classroom Overview</h1>
        <p className="text-sm text-muted-foreground">All study materials posted across the institution.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Materials" value={stats.total}       icon={<FileText className="h-6 w-6" />} tone="orange" />
        <StatCard label="Assignments"     value={stats.assignments} icon={<Upload className="h-6 w-6" />}   tone="info" />
        <StatCard label="Active Teachers" value={stats.teachers}    icon={<Users className="h-6 w-6" />}    tone="success" />
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <div className="font-bold">All Materials</div>
          <div className="flex gap-2">
            <Select value={deptFilter?.toString() ?? 'all'} onValueChange={(v) => setDeptFilter(v === 'all' ? undefined : Number(v))}>
              <SelectTrigger className="h-9 w-32 rounded-full"><SelectValue placeholder="Dept" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Depts</SelectItem>
                {depts.data?.map((d) => <SelectItem key={d.deptId} value={String(d.deptId)}>{d.deptCode}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter ?? 'all'} onValueChange={(v) => setTypeFilter(v === 'all' ? undefined : v)}>
              <SelectTrigger className="h-9 w-40 rounded-full"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="notes">Notes</SelectItem>
                <SelectItem value="assignment">Assignment</SelectItem>
                <SelectItem value="question_paper">Question Paper</SelectItem>
                <SelectItem value="syllabus">Syllabus</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Posted</TableHead>
                <TableHead>File</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(materials.data ?? []).length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No materials found.</TableCell></TableRow>
              ) : (
                (materials.data ?? []).map((m, i) => (
                  <motion.tr key={m.materialId}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 20) * 0.02, duration: 0.2 }}
                    className="border-b hover:bg-muted/30">
                    <TableCell>
                      <div className="font-semibold">{m.title}</div>
                      {m.isPinned && <Badge variant="default" className="text-[10px] mt-0.5">Pinned</Badge>}
                    </TableCell>
                    <TableCell><Badge variant="secondary">{(m.materialType as string).replace('_', ' ')}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{m.subjectCode ?? '—'}</TableCell>
                    <TableCell className="text-sm">{m.teacherName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.postedAt?.slice(0, 10)}</TableCell>
                    <TableCell className="text-xs">{m.fileName ?? '—'}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="text-destructive"
                        onClick={() => { if (confirm(`Delete "${m.title}"?`)) del.mutate(m.materialId); }}>
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
