import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Upload, Trash2, Loader2, Pin, Eye, Calendar, Paperclip, MessageCircle, Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogBody, DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { useAuthStore } from '@/store/authStore';
import { useSubjectsByTeacher } from '@/hooks/useSubjects';
import {
  useMaterials, usePostMaterial, useDeleteMaterial,
  useSubmissions, useGradeSubmission,
} from '@/hooks/useMaterials';
import { cn } from '@/lib/utils';
import { CommentThread, CommentCountBadge } from '@/components/shared/CommentThread';
import type { StudyMaterial, MaterialType, Submission } from '@/types/api';

export default function TeacherClassroom() {
  const me = useAuthStore((s) => s.me);
  const subjects = useSubjectsByTeacher(me?.entityId ?? undefined);
  const [activeSubject, setActiveSubject] = useState<number | undefined>();
  const [openPost, setOpenPost] = useState(false);
  const [viewSubs, setViewSubs] = useState<StudyMaterial | null>(null);
  const [commentTarget, setCommentTarget] = useState<StudyMaterial | null>(null);

  const firstSubject = subjects.data?.[0]?.subjectId;
  const currentSubject = activeSubject ?? firstSubject;

  const materials = useMaterials(currentSubject);
  const postMat   = usePostMaterial();
  const delMat    = useDeleteMaterial();

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs text-muted-foreground">Dashboard › <span className="text-foreground font-semibold">Classroom</span></div>
          <h1 className="text-2xl font-extrabold mt-1">Classroom</h1>
          <p className="text-sm text-muted-foreground">Post notes, assignments, question papers for your students.</p>
        </div>
        <Button onClick={() => setOpenPost(true)} disabled={!currentSubject}>
          <Upload className="h-4 w-4" /> Post Material
        </Button>
      </motion.div>

      {subjects.data && subjects.data.length > 0 && (
        <Tabs value={String(currentSubject ?? '')} onValueChange={(v) => setActiveSubject(Number(v))}>
          <TabsList className="flex-wrap h-auto p-1">
            {subjects.data.map((s) => (
              <TabsTrigger key={s.subjectId} value={String(s.subjectId)} className="px-4">
                <span className="font-mono mr-1">{s.subjectCode}</span> {s.subjectName}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {materials.isLoading && (
        <Card className="p-12 text-center text-muted-foreground">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-orange-500 mb-3" /> Loading…
        </Card>
      )}

      {!materials.isLoading && (materials.data ?? []).length === 0 && (
        <Card className="p-12 text-center text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto text-orange-500 mb-3" />
          <div className="font-semibold text-foreground mb-1">No materials yet</div>
          <div className="text-sm">Click "Post Material" to upload notes or assignments.</div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(materials.data ?? []).map((m, i) => (
          <motion.div key={m.materialId}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.25 }}>
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
                    <div className="text-xs text-muted-foreground">{m.materialType.replace('_', ' ')} · {formatDate(m.postedAt)}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {m.materialType === 'assignment' && (
                    <Button size="sm" variant="ghost" onClick={() => setViewSubs(m)}>
                      <Eye className="h-3.5 w-3.5" /> Submissions
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => {
                    if (confirm(`Delete "${m.title}"?`)) delMat.mutate(m.materialId);
                  }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {m.description && <p className="text-sm text-muted-foreground mb-2">{m.description}</p>}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {m.fileName && <span className="inline-flex items-center gap-1"><Paperclip className="h-3 w-3" />{m.fileName}</span>}
                {m.dueDate && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />Due: {m.dueDate.slice(0, 10)}</span>}
                <button onClick={() => setCommentTarget(m)} className="inline-flex items-center gap-1 hover:text-orange-600 transition-colors">
                  <MessageCircle className="h-3 w-3" /> <CommentCountBadge materialId={m.materialId} />
                  Discussion
                </button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Post Material Dialog */}
      <PostMaterialDialog
        open={openPost}
        onOpenChange={setOpenPost}
        subjectId={currentSubject}
        teacherId={me?.entityId ?? 0}
        deptId={me?.deptId ?? 1}
      />

      {/* View Submissions Sheet */}
      {viewSubs && (
        <SubmissionsSheet material={viewSubs} open={!!viewSubs} onOpenChange={(v) => { if (!v) setViewSubs(null); }} />
      )}

      {/* Comment Thread */}
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

function PostMaterialDialog({ open, onOpenChange, subjectId, teacherId, deptId }:
  { open: boolean; onOpenChange: (v: boolean) => void; subjectId?: number; teacherId: number; deptId: number }) {
  const post = usePostMaterial();
  const [file, setFile] = useState<File | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!subjectId) return;
    const form = e.currentTarget;
    const fd = new FormData();
    fd.append('teacherId', String(teacherId));
    fd.append('subjectId', String(subjectId));
    fd.append('deptId', String(deptId));
    fd.append('semester', (form.elements.namedItem('semester') as HTMLInputElement).value || '4');
    fd.append('section', (form.elements.namedItem('section') as HTMLInputElement).value || '');
    fd.append('title', (form.elements.namedItem('title') as HTMLInputElement).value);
    fd.append('description', (form.elements.namedItem('description') as HTMLTextAreaElement).value);
    fd.append('materialType', (form.elements.namedItem('materialType') as HTMLSelectElement).value);
    fd.append('dueDate', (form.elements.namedItem('dueDate') as HTMLInputElement).value || '');
    fd.append('isPinned', (form.elements.namedItem('isPinned') as HTMLInputElement).checked ? 'true' : 'false');
    if (file) fd.append('file', file);

    await post.mutateAsync(fd);
    setFile(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Post Material</DialogTitle>
          <DialogDescription>Upload notes, assignments, or question papers.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            <div><Label>Title *</Label><Input name="title" required placeholder="Lecture 5 Notes" /></div>
            <div><Label>Description</Label><Textarea name="description" rows={3} placeholder="Optional description…" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type *</Label>
                <select name="materialType" required className="w-full h-10 rounded-md border border-input bg-card px-3 text-sm">
                  <option value="notes">Notes</option>
                  <option value="assignment">Assignment</option>
                  <option value="question_paper">Question Paper</option>
                  <option value="syllabus">Syllabus</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div><Label>Due Date (assignments)</Label><Input name="dueDate" type="datetime-local" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Semester</Label><Input name="semester" type="number" defaultValue={4} min={1} max={8} /></div>
              <div><Label>Section</Label><Input name="section" placeholder="A" maxLength={5} /></div>
            </div>
            <div>
              <Label>File</Label>
              <div className={cn(
                'mt-1 border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors',
                file ? 'border-orange-400 bg-orange-50' : 'border-border hover:border-orange-300',
              )} onClick={() => document.getElementById('mat-file')?.click()}>
                <input id="mat-file" type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                {file ? (
                  <div className="text-sm font-semibold text-orange-700">{file.name} ({(file.size / 1024).toFixed(0)} KB)</div>
                ) : (
                  <div className="text-sm text-muted-foreground">Click or drag to upload (max 50 MB)</div>
                )}
              </div>
            </div>
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" name="isPinned" className="h-4 w-4 accent-orange-500" />
              Pin this material to the top
            </label>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={post.isPending}>
              {post.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Post
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SubmissionsSheet({ material, open, onOpenChange }:
  { material: StudyMaterial; open: boolean; onOpenChange: (v: boolean) => void }) {
  const subs = useSubmissions(material.materialId);
  const grade = useGradeSubmission();
  const [grading, setGrading] = useState<{ submissionId: number; grade: string; feedback: string } | null>(null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 overflow-y-auto">
        <SheetHeader className="p-5 border-b border-border">
          <SheetTitle>Submissions — {material.title}</SheetTitle>
        </SheetHeader>
        <div className="p-5 space-y-3">
          {subs.isLoading && <div className="text-center text-muted-foreground"><Loader2 className="h-5 w-5 inline animate-spin" /> Loading…</div>}
          {!subs.isLoading && (subs.data ?? []).length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">No submissions yet.</div>
          )}
          {(subs.data ?? []).map((s) => (
            <Card key={s.submissionId} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-mono text-xs text-muted-foreground">{s.rollNo}</div>
                  <div className="font-semibold text-sm">{s.studentName}</div>
                </div>
                <Badge variant={s.status === 'graded' ? 'success' : s.status === 'late' ? 'destructive' : 'default'}>
                  {s.status}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                Submitted: {formatDate(s.submittedAt)}
                {s.fileName && <span className="ml-2">· 📎 {s.fileName}</span>}
              </div>
              {s.fileName && (
                <Button size="sm" variant="secondary" className="mb-2" onClick={async () => {
                  try {
                    const base = import.meta.env.VITE_API_BASE_URL || '';
                    const resp = await fetch(`${base}/api/submissions/download?id=${s.submissionId}`, { credentials: 'include' });
                    if (!resp.ok) throw new Error('Failed');
                    const json = await resp.json();
                    const signedUrl = json.data?.url;
                    if (!signedUrl) throw new Error('No URL');
                    const fileResp = await fetch(signedUrl);
                    if (!fileResp.ok) throw new Error('Download failed');
                    const blob = await fileResp.blob();
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = s.fileName || 'submission';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                  } catch { toast.error('Download failed'); }
                }}>
                  <Download className="h-3.5 w-3.5" /> Download File
                </Button>
              )}
              {s.status === 'graded' ? (
                <div className="text-sm"><strong>Grade:</strong> {s.grade} {s.feedback && <span className="text-muted-foreground">— {s.feedback}</span>}</div>
              ) : (
                <div className="flex gap-2 mt-2">
                  <Input placeholder="Grade" className="w-20 h-8" value={grading?.submissionId === s.submissionId ? grading.grade : ''}
                    onChange={(e) => setGrading({ submissionId: s.submissionId, grade: e.target.value, feedback: grading?.feedback ?? '' })} />
                  <Input placeholder="Feedback" className="flex-1 h-8" value={grading?.submissionId === s.submissionId ? grading.feedback : ''}
                    onChange={(e) => setGrading({ submissionId: s.submissionId, grade: grading?.grade ?? '', feedback: e.target.value })} />
                  <Button size="sm" disabled={grade.isPending || grading?.submissionId !== s.submissionId || !grading?.grade}
                    onClick={() => { if (grading) { grade.mutate(grading); setGrading(null); } }}>
                    Grade
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      </SheetContent>
    </Sheet>
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
