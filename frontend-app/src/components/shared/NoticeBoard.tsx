import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Megaphone, Loader2, Pin, PinOff, Trash2, CalendarClock, Plus,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogBody, DialogFooter,
} from '@/components/ui/dialog';
import {
  useNotices, useAllNotices, useCreateNotice,
  useTogglePin, useDeleteNotice,
} from '@/hooks/useNotices';
import { useDepartments } from '@/hooks/useDepartments';
import { cn } from '@/lib/utils';
import type { Notice } from '@/types/api';

interface Props {
  /** What the user can do on this board. */
  mode: 'read' | 'post' | 'admin';
  /** Filter notices to a specific dept (e.g. teacher's own dept). */
  deptId?: number;
  /** Page header title. */
  title?: string;
  /** Page header subtitle. */
  subtitle?: string;
}

export function NoticeBoard({
  mode, deptId, title = 'Notices', subtitle = 'Pinned notices appear first.',
}: Props) {
  const [openPost, setOpenPost] = useState(false);

  // Admins see all (including expired); others see visible-only
  const visible = useNotices(deptId);
  const all     = useAllNotices();
  const list    = mode === 'admin' ? (all.data ?? []) : (visible.data ?? []);
  const loading = mode === 'admin' ? all.isLoading : visible.isLoading;

  const togglePin = useTogglePin();
  const del       = useDeleteNotice();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <div className="text-xs text-muted-foreground">
            Dashboard › <span className="text-foreground font-semibold">{title}</span>
          </div>
          <h1 className="text-2xl font-extrabold mt-1">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {mode !== 'read' && (
          <Button onClick={() => setOpenPost(true)}>
            <Plus className="h-4 w-4" /> Post Notice
          </Button>
        )}
      </motion.div>

      {loading ? (
        <Card className="p-12 text-center text-muted-foreground">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-orange-500 mb-3" />
          Loading notices…
        </Card>
      ) : list.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <Megaphone className="h-10 w-10 mx-auto text-orange-500 mb-3" />
          <div className="font-semibold text-foreground mb-1">No notices yet</div>
          <div className="text-sm">
            {mode !== 'read' ? 'Click "Post Notice" to create one.' : 'Check back later.'}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((n, i) => (
            <NoticeCard
              key={n.noticeId}
              index={i}
              notice={n}
              canManage={mode === 'admin'}
              onPin={() => togglePin.mutate(n.noticeId)}
              onDelete={() => {
                if (confirm(`Delete "${n.title}"?`)) del.mutate(n.noticeId);
              }}
            />
          ))}
        </div>
      )}

      <PostNoticeDialog
        open={openPost}
        onOpenChange={setOpenPost}
        defaultDeptId={deptId}
      />
    </div>
  );
}

function NoticeCard({
  notice, index, canManage, onPin, onDelete,
}: {
  notice: Notice;
  index: number;
  canManage: boolean;
  onPin: () => void;
  onDelete: () => void;
}) {
  const expired = notice.expiryDate && new Date(notice.expiryDate) < new Date();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 12) * 0.04, duration: 0.3 }}
    >
      <Card className={cn(
        'p-5 relative transition-shadow hover:shadow-md',
        notice.isPinned && 'border-orange-400 bg-orange-50/40',
        expired && 'opacity-70',
      )}>
        {notice.isPinned && (
          <div className="absolute -top-2 left-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider">
            <Pin className="h-3 w-3" /> Pinned
          </div>
        )}

        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-bold text-base leading-tight pr-4">{notice.title}</h3>
          <div className="flex gap-1 shrink-0">
            <TargetBadge notice={notice} />
            {canManage && (
              <>
                <button
                  onClick={onPin}
                  className="h-7 w-7 rounded-md inline-flex items-center justify-center text-orange-600 hover:bg-orange-100 transition"
                  title={notice.isPinned ? 'Unpin' : 'Pin'}
                >
                  {notice.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={onDelete}
                  className="h-7 w-7 rounded-md inline-flex items-center justify-center text-destructive hover:bg-destructive/10 transition"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {notice.body}
        </p>

        <div className="flex items-center justify-between mt-4 text-[11px] text-muted-foreground">
          <div className="inline-flex items-center gap-1">
            <span className="font-semibold capitalize">{notice.postedByRole}</span>
            <span>· {formatDate(notice.postDate)}</span>
          </div>
          {notice.expiryDate && (
            <div className="inline-flex items-center gap-1">
              <CalendarClock className="h-3 w-3" />
              {expired ? 'Expired' : 'Expires'} {String(notice.expiryDate).slice(0, 10)}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function TargetBadge({ notice }: { notice: Notice }) {
  if (notice.targetType === 'all')     return <Badge variant="info">All</Badge>;
  if (notice.targetType === 'dept')    return <Badge variant="secondary">Dept</Badge>;
  if (notice.targetType === 'section') return <Badge variant="warning">Sec {notice.targetSection}</Badge>;
  return <Badge variant="secondary">{notice.targetType}</Badge>;
}

function formatDate(s: string | undefined): string {
  if (!s) return '';
  try {
    const d = new Date(s);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return String(s).slice(0, 10); }
}

/* ───────── Post dialog ───────── */

const noticeSchema = z.object({
  title:         z.string().min(1, 'required').max(200),
  body:          z.string().min(1, 'required'),
  targetType:    z.enum(['all', 'dept', 'section']),
  targetDeptId:  z.coerce.number().optional().or(z.literal('')),
  targetSection: z.string().optional().or(z.literal('')),
  expiryDate:    z.string().optional().or(z.literal('')),
  isPinned:      z.boolean().optional(),
});
type NoticeVals = z.infer<typeof noticeSchema>;

function PostNoticeDialog({
  open, onOpenChange, defaultDeptId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultDeptId?: number;
}) {
  const create = useCreateNotice();
  const depts  = useDepartments();
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<NoticeVals>({
    resolver: zodResolver(noticeSchema),
    defaultValues: {
      targetType:   'all',
      targetDeptId: defaultDeptId ?? ('' as any),
      isPinned:     false,
    },
  });
  const targetType = watch('targetType');

  async function onSubmit(v: NoticeVals) {
    await create.mutateAsync({
      title:         v.title,
      body:          v.body,
      targetType:    v.targetType,
      targetDeptId:  v.targetType !== 'all' && v.targetDeptId ? Number(v.targetDeptId) : null,
      targetSection: v.targetType === 'section' ? (v.targetSection || null) : null,
      expiryDate:    v.expiryDate || null,
      isPinned:      !!v.isPinned,
    });
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Post a Notice</DialogTitle>
          <DialogDescription>
            Choose a target audience. Pinned notices appear at the top of the board.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogBody className="space-y-4">
            <div>
              <Label className="block mb-1.5">Title <span className="text-destructive">*</span></Label>
              <Input {...register('title')} placeholder="Holiday on…" />
              {errors.title && <p className="text-[11px] mt-1 font-semibold text-destructive">{errors.title.message}</p>}
            </div>
            <div>
              <Label className="block mb-1.5">Body <span className="text-destructive">*</span></Label>
              <Textarea rows={5} {...register('body')} placeholder="Full message…" />
              {errors.body && <p className="text-[11px] mt-1 font-semibold text-destructive">{errors.body.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="block mb-1.5">Target</Label>
                <Select
                  value={targetType}
                  onValueChange={(v) => setValue('targetType', v as any, { shouldValidate: true })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="dept">A Department</SelectItem>
                    <SelectItem value="section">A Section</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {targetType !== 'all' && (
                <div>
                  <Label className="block mb-1.5">Department</Label>
                  <Select
                    value={String(watch('targetDeptId') ?? '')}
                    onValueChange={(v) => setValue('targetDeptId', Number(v) as any, { shouldValidate: true })}
                  >
                    <SelectTrigger><SelectValue placeholder="Pick dept" /></SelectTrigger>
                    <SelectContent>
                      {depts.data?.map((d) => (
                        <SelectItem key={d.deptId} value={String(d.deptId)}>{d.deptCode} — {d.deptName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {targetType === 'section' && (
                <div>
                  <Label className="block mb-1.5">Section</Label>
                  <Select
                    value={watch('targetSection') ?? ''}
                    onValueChange={(v) => setValue('targetSection', v, { shouldValidate: true })}
                  >
                    <SelectTrigger><SelectValue placeholder="Sec" /></SelectTrigger>
                    <SelectContent>
                      {['A','B','C'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="block mb-1.5">Expiry Date (optional)</Label>
                <Input type="date" {...register('expiryDate')} />
              </div>
              <label className="inline-flex items-center gap-2 mt-7 cursor-pointer text-sm select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-orange-500"
                  {...register('isPinned')}
                />
                Pin this notice to the top
              </label>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post Notice'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
