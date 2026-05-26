import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogBody, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Pencil } from 'lucide-react';
import { useTeacherMappings } from '@/hooks/useTeachers';
import { initials } from '@/lib/utils';
import type { Teacher } from '@/types/api';

interface Props {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  teacher: Teacher | null;
  onEdit: () => void;
}

export function TeacherViewDialog({ open, onOpenChange, teacher, onEdit }: Props) {
  const mappings = useTeacherMappings(open ? teacher?.teacherId ?? null : null);

  if (!teacher) return null;
  const sections = new Set((mappings.data ?? []).map((m) => `${m.semester}-${m.section}`)).size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Teacher Profile</DialogTitle>
          <DialogDescription>{teacher.empId} · {teacher.deptCode} · {teacher.designation}</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
            <div className="bg-background rounded-lg p-5 text-center">
              <Avatar className="h-24 w-24 mx-auto bg-indigo-100">
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-3xl">{initials(teacher.teacherName)}</AvatarFallback>
              </Avatar>
              <div className="font-extrabold text-base mt-3">{teacher.teacherName}</div>
              <div className="text-xs text-muted-foreground">{teacher.empId}</div>
              <Badge variant="success" className="mt-3">Active</Badge>

              <div className="mt-5 text-left bg-card border border-border rounded-md p-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Workload</div>
                <Mini label="Subjects" value={mappings.data?.length ?? '—'} />
                <Mini label="Sections" value={sections || '—'} />
              </div>
            </div>

            <div>
              <SectionTitle>Position</SectionTitle>
              <Row k="Designation" v={teacher.designation} />
              <Row k="Department"  v={teacher.deptCode || '—'} />
              <Row k="Date Joined" v={teacher.dateJoined ? teacher.dateJoined.slice(0, 10) : '—'} />

              <SectionTitle className="mt-6">Contact</SectionTitle>
              <Row k="Phone" v={teacher.phone || '—'} />
              <Row k="Email" v={teacher.email || '—'} />

              <SectionTitle className="mt-6">Subject Assignments</SectionTitle>
              {mappings.isLoading ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : (mappings.data ?? []).length === 0 ? (
                <div className="text-sm text-muted-foreground">No assignments yet.</div>
              ) : (
                <div className="space-y-2">
                  {mappings.data!.map((m) => (
                    <div key={m.mappingId} className="flex items-center justify-between p-3 bg-background rounded-md text-sm">
                      <div>
                        <div className="font-mono font-bold">{m.subjectCode}</div>
                        <div className="text-xs text-muted-foreground">{m.subjectName}</div>
                      </div>
                      <div className="text-right">
                        <Badge variant="info">Sem {m.semester} · Sec {m.section || '—'}</Badge>
                        <div className="text-[11px] text-muted-foreground mt-1">{m.academicYear || '—'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
          <Button variant="outline" onClick={onEdit}><Pencil className="h-4 w-4" /> Edit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 py-2 border-b border-dashed border-border last:border-b-0 text-sm">
      <div className="text-muted-foreground font-semibold">{k}</div>
      <div>{v}</div>
    </div>
  );
}
function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 ${className ?? ''}`}>{children}</div>;
}
function Mini({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center text-sm py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
