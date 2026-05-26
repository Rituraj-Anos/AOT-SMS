import { useQuery } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogBody, DialogFooter,
} from '@/components/ui/dialog';
import { Button }   from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge }    from '@/components/ui/badge';
import { Pencil }   from 'lucide-react';
import { api }      from '@/lib/axios';
import { initials, formatINR } from '@/lib/utils';
import type {
  ApiResponse, AttendanceSummary, Fee, ResultBundle, Student,
} from '@/types/api';

interface Props {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  student: Student | null;
  onEdit: () => void;
}

export function StudentViewDialog({ open, onOpenChange, student, onEdit }: Props) {
  const id = student?.studentId;
  const enabled = open && !!id;

  const att = useQuery({
    queryKey: ['attendance', 'student', id],
    enabled,
    queryFn: async () => {
      const res = await api.get<ApiResponse<AttendanceSummary[]>>('/attendance', { params: { studentId: id } });
      return res.data.data ?? [];
    },
  });

  const result = useQuery({
    queryKey: ['result', id],
    enabled,
    queryFn: async () => {
      const res = await api.get<ApiResponse<ResultBundle>>('/grades', { params: { studentId: id } });
      return res.data.data;
    },
  });

  const fees = useQuery({
    queryKey: ['fees', id],
    enabled,
    queryFn: async () => {
      const res = await api.get<ApiResponse<Fee[]>>('/fees', { params: { studentId: id } });
      return res.data.data ?? [];
    },
  });

  if (!student) return null;

  const totalAtt = (att.data ?? []).reduce(
    (a, r) => ({ held: a.held + r.held, present: a.present + r.present }),
    { held: 0, present: 0 },
  );
  const overallPct = totalAtt.held ? (totalAtt.present * 100) / totalAtt.held : 0;
  const balance = (fees.data ?? []).reduce((a, f) => a + (Number(f.balanceDue) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Student Profile</DialogTitle>
          <DialogDescription>{student.rollNo} · {student.deptCode} · Sem {student.currentSemester}</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
            {/* Summary card */}
            <div className="bg-background rounded-lg p-5 text-center">
              <Avatar className="h-24 w-24 mx-auto"><AvatarFallback className="text-3xl">{initials(student.studentName)}</AvatarFallback></Avatar>
              <div className="font-extrabold text-base mt-3">{student.studentName}</div>
              <div className="text-xs text-muted-foreground">{student.rollNo}</div>
              <Badge variant="success" className="mt-3">Active</Badge>

              <div className="mt-5 text-left bg-card border border-border rounded-md p-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Attendance</div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Overall</span>
                  <span className="font-semibold">{overallPct.toFixed(1)}%</span>
                </div>
                <Progress
                  value={Math.min(100, overallPct)}
                  indicatorClassName={overallPct < 75 ? 'bg-red-500' : ''}
                  className="mt-2"
                />
              </div>

              <div className="mt-3 text-left bg-card border border-border rounded-md p-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Performance</div>
                <Mini label="CGPA"  value={result.data?.cgpa ?? '—'} />
                <Mini label="Backlogs" value={result.data?.backlogCount ?? '—'} />
              </div>

              <div className="mt-3 text-left bg-card border border-border rounded-md p-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Fees</div>
                <Mini label="Status"  value={balance > 0 ? 'Pending' : 'Paid'} />
                <Mini label="Balance" value={formatINR(balance)} />
              </div>
            </div>

            {/* Details */}
            <div>
              <SectionTitle>Academic Info</SectionTitle>
              <Row k="Type"           v={student.studentType} />
              <Row k="Department"     v={student.deptCode || '—'} />
              <Row k="Current Sem"    v={student.currentSemester} />
              <Row k="Section"        v={student.section} />
              <Row k="Admission Year" v={student.admissionYear || '—'} />

              <SectionTitle className="mt-6">Personal</SectionTitle>
              <Row k="DOB"          v={student.dob || '—'} />
              <Row k="Gender"       v={student.gender || '—'} />
              <Row k="Blood Group"  v={student.bloodGroup || '—'} />
              <Row k="Aadhar"       v={student.aadharNo || '—'} />

              <SectionTitle className="mt-6">Contact</SectionTitle>
              <Row k="Phone"        v={student.phone || '—'} />
              <Row k="Email"        v={student.email || '—'} />
              <Row k="Parent"       v={student.parentName || '—'} />
              <Row k="Parent Phone" v={student.parentPhone || '—'} />
              <Row k="Address"      v={student.address || '—'} />
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
