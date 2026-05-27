import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Download, Loader2, Pin, Calendar, Paperclip, Upload, CheckCircle2, MessageCircle, Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogBody, DialogFooter,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/store/authStore';
import { useSubjects } from '@/hooks/useSubjects';
import { useMaterials, useMySubmission, useSubmitAssignment } from '@/hooks/useMaterials';
import { cn } from '@/lib/utils';
import { CommentThread, CommentCountBadge } from '@/components/shared/CommentThread';
import type { StudyMaterial, MaterialType } from '@/types/api';

const TYPE_FILTERS: { value: MaterialType | 'all'; label: string }[] = [
  { value: 'all',            label: 'All' },
  { value: 'notes',          label: 'Notes' },
  { value: 'assignment',     label: 'Assignments' },
  { value: 'question_paper', label: 'Question Papers' },
  { value: 'syllabus',       label: 'Syllabus' },
];

export default function StudentClassroom() {
  const me = useAuthStore((s) => s.me);
  const subjects = useSubjects(me?.deptId ?? undefined, 4); // current sem
  const [activeSubject, setActiveSubject] = useState<number | undefined>();
  const [typeFilter, setTypeFilter] = useState<MaterialType | 'all'>('all');
  const [submitTarget, setSubmitTarget] = useState<StudyMaterial | null>(null);
  const [commentTarget, setCommentTarget] = useState<StudyMaterial | null>(null);

  const firstSubject = subjects.data?.[0]?.subjectId;
  const currentSubject = activeSubject ?? firstSubject;

  const materials = useMaterials(currentSubject, typeFilter);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-xs text-muted-foreground">Dashboard › <span className="text-foreground font-semibold">Classroom</span></div>
        <h1 className="text-2xl font-extrabold mt-1">Classroom</h1>
        <p className="text-sm text-muted-foreground">Download notes, submit assignments, and access study materials.</p>
      </motion.div>

      {subjects.data && subjects.data.length > 0 && (
        <Tabs value={String(currentSubject ?? '')} onValueChange={(v) => setActiveSubject(Number(v))}>
          <TabsList className="flex-wrap h-auto p-1">
            {subjects.data.map((s) => (
              <TabsTrigger key={s.subjectId} value={String(s.subjectId)} className="px-4">
                <span className="font-mono mr-1">{s.subjectCode}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* Type filter pills */}
      <div className="flex gap-2 flex-wrap">
        {TYPE_FILTERS.map((f) => (
          <button key={f.value} onClick={() => setTypeFilter(f.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold transition-colors',
              typeFilter === f.value ? 'bg-orange-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted-foreground/10',
            )}>
            {f.label}
          </button>
        ))}
      </div>

      {materials.isLoading && (
        <Card className="p-12 text-center text-muted-foreground">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-orange-500 mb-3" /> Loading…
        </Card>
      )}

      {!materials.isLoading && (materials.data ?? []).length === 0 && (
        <Card className="p-12 text-center text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto text-orange-500 mb-3" />
          <div className="font-semibold text-foreground mb-1">No materials yet</div>
          <div className="text-sm">Your teacher hasn't posted anything for this subject yet.</div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(materials.data ?? []).map((m, i) => (
          <motion.div key={m.materialId}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.25 }}>
            <MaterialCard material={m} studentId={me?.entityId ?? 0} onSubmit={() => setSubmitTarget(m)} onComment={() => setCommentTarget(m)} />
          </motion.div>
        ))}
      </div>

      {submitTarget && (
        <SubmitDialog material={submitTarget} studentId={me?.entityId ?? 0}
          open={!!submitTarget} onOpenChange={(v) => { if (!v) setSubmitTarget(null); }} />
      )}

      {commentTarget && (
        <CommentThread
          materialId={commentTarget.materialId}
          materialTitle={commentTarget.title}
          open={!!commentTarget}
          onOpenChange={(v) => { if (!v) setCommentTarget(null); }}
        />
      )}
    </div>
  );
}

function MaterialCard({ material: m, studentId, onSubmit, onComment }:
  { material: StudyMaterial; studentId: number; onSubmit: () => void; onComment: () => void }) {
  const mySub = useMySubmission(
    m.materialType === 'assignment' ? m.materialId : undefined,
    m.materialType === 'assignment' ? studentId : undefined,
  );

  const dueInfo = useMemo(() => {
    if (!m.dueDate) return null;
    const due = new Date(m.dueDate);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (mySub.data) return { label: 'Submitted ✓', variant: 'success' as const };
    if (days < 0) return { label: 'Overdue', variant: 'destructive' as const };
    if (days <= 2) return { label: `${days} day${days === 1 ? '' : 's'} left`, variant: 'warning' as const };
    return { label: `${days} days left`, variant: 'secondary' as const };
  }, [m.dueDate, mySub.data]);

  return (
    <Card className={cn('p-5 relative', m.isPinned && 'border-orange-400 bg-orange-50/30')}>
      {m.isPinned && (
        <div className="absolute -top-2 left-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold uppercase">
          <Pin className="h-3 w-3" /> Pinned
        </div>
      )}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <MaterialIcon type={m.materialType} />
          <div>
            <div className="font-bold">{m.title}</div>
            <div className="text-xs text-muted-foreground">
              {m.materialType.replace('_', ' ')} · by {m.teacherName} · {formatDate(m.postedAt)}
            </div>
          </div>
        </div>
        {dueInfo && <Badge variant={dueInfo.variant as any}>{dueInfo.label}</Badge>}
      </div>
      {m.description && <p className="text-sm text-muted-foreground mb-3">{m.description}</p>}
      <div className="flex items-center gap-2 flex-wrap">
        {m.fileName && (
          <>
            <Button size="sm" variant="secondary" onClick={() => {
              // Open Cloudinary URL directly (filePath is the full URL)
              if (m.filePath && m.filePath.startsWith('http')) {
                window.open(m.filePath, '_blank');
              } else {
                toast.error('File not available');
              }
            }}>
              <Eye className="h-3.5 w-3.5" /> View
            </Button>
            <Button size="sm" variant="secondary" onClick={() => {
              if (m.filePath && m.filePath.startsWith('http')) {
                // For download, add fl_attachment to Cloudinary URL
                const url = m.filePath.includes('/raw/upload/')
                  ? m.filePath.replace('/raw/upload/', '/raw/upload/fl_attachment/')
                  : m.filePath;
                window.open(url, '_blank');
              } else {
                toast.error('File not available');
              }
            }}>
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
          </>
        )}
        {m.materialType === 'assignment' && !mySub.data && (
          <Button size="sm" onClick={onSubmit}>
            <Upload className="h-3.5 w-3.5" /> Submit
          </Button>
        )}
        {mySub.data && (
          <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" /> Submitted</Badge>
        )}
        <Button size="sm" variant="ghost" onClick={onComment}>
          <MessageCircle className="h-3.5 w-3.5" /> <CommentCountBadge materialId={m.materialId} /> Discussion
        </Button>
      </div>
      {m.dueDate && (
        <div className="text-[11px] text-muted-foreground mt-2 inline-flex items-center gap-1">
          <Calendar className="h-3 w-3" /> Due: {m.dueDate.slice(0, 16).replace('T', ' ')}
        </div>
      )}
    </Card>
  );
}

function SubmitDialog({ material, studentId, open, onOpenChange }:
  { material: StudyMaterial; studentId: number; open: boolean; onOpenChange: (v: boolean) => void }) {
  const submit = useSubmitAssignment();
  const [file, setFile] = useState<File | null>(null);

  async function handleSubmit() {
    if (!file) { toast.warning('Please select a file.'); return; }
    const fd = new FormData();
    fd.append('materialId', String(material.materialId));
    fd.append('file', file);
    await submit.mutateAsync(fd);
    setFile(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Assignment</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm text-muted-foreground mb-4">
            Submitting for: <strong>{material.title}</strong>
            {material.dueDate && <span className="ml-2">· Due: {material.dueDate.slice(0, 10)}</span>}
          </p>
          <div className={cn(
            'border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors',
            file ? 'border-orange-400 bg-orange-50' : 'border-border hover:border-orange-300',
          )} onClick={() => document.getElementById('sub-file')?.click()}>
            <input id="sub-file" type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {file ? (
              <div className="text-sm font-semibold text-orange-700">{file.name} ({(file.size / 1024).toFixed(0)} KB)</div>
            ) : (
              <div className="text-sm text-muted-foreground">Click to select your submission file</div>
            )}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submit.isPending || !file}>
            {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MaterialIcon({ type }: { type: MaterialType }) {
  const icons: Record<MaterialType, string> = {
    notes: '📄', assignment: '📝', question_paper: '📋', syllabus: '📚', other: '📦',
  };
  return <span className="text-2xl">{icons[type] || '📄'}</span>;
}

function formatDate(s: string | null): string {
  if (!s) return '';
  try { return new Date(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return s.slice(0, 10); }
}

// Need toast import for the submit dialog
import { toast } from 'sonner';
