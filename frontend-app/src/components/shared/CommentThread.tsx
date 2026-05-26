import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, MessageCircle, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { useAuthStore } from '@/store/authStore';
import { useComments, useAddComment, useDeleteComment, type Comment } from '@/hooks/useComments';
import { initials, cn } from '@/lib/utils';

interface Props {
  materialId: number;
  materialTitle: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function CommentThread({ materialId, materialTitle, open, onOpenChange }: Props) {
  const me = useAuthStore((s) => s.me);
  const comments = useComments(open ? materialId : undefined);
  const addComment = useAddComment();
  const delComment = useDeleteComment();
  const [text, setText] = useState('');

  async function handleSend() {
    if (!text.trim()) return;
    await addComment.mutateAsync({ materialId, text: text.trim() });
    setText('');
  }

  function canDelete(c: Comment): boolean {
    if (!me) return false;
    if (me.role === 'admin' || me.role === 'teacher') return true;
    return c.postedById === me.entityId && c.postedByRole === me.role;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-5 border-b border-border shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-orange-500" />
            Discussion
          </SheetTitle>
          <div className="text-xs text-muted-foreground truncate">{materialTitle}</div>
        </SheetHeader>

        {/* Comment list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {comments.isLoading && (
            <div className="text-center text-muted-foreground py-8">
              <Loader2 className="h-5 w-5 inline animate-spin" /> Loading…
            </div>
          )}

          {!comments.isLoading && (comments.data ?? []).length === 0 && (
            <div className="text-center text-muted-foreground py-8 text-sm">
              No comments yet. Start the discussion!
            </div>
          )}

          {(comments.data ?? []).map((c, i) => (
            <motion.div
              key={c.commentId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              className="flex gap-3"
            >
              <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                <AvatarFallback className={cn(
                  'text-xs',
                  c.postedByRole === 'teacher' ? 'bg-indigo-100 text-indigo-700' :
                  c.postedByRole === 'admin'   ? 'bg-orange-100 text-orange-700' :
                                                  'bg-emerald-100 text-emerald-700',
                )}>
                  {initials(c.postedByName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold">{c.postedByName}</span>
                  <Badge variant={
                    c.postedByRole === 'teacher' ? 'info' :
                    c.postedByRole === 'admin'   ? 'default' : 'success'
                  } className="text-[10px] px-1.5 py-0">
                    {c.postedByRole}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">{timeAgo(c.postedAt)}</span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap break-words">{c.commentText}</p>
              </div>
              {canDelete(c) && (
                <button
                  onClick={() => delComment.mutate(c.commentId)}
                  className="h-7 w-7 shrink-0 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors mt-0.5"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </motion.div>
          ))}
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-border p-4 flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment…"
            className="flex-1"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <Button size="icon" onClick={handleSend} disabled={addComment.isPending || !text.trim()}>
            {addComment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Comment count badge for material cards. */
export function CommentCountBadge({ materialId }: { materialId: number }) {
  const comments = useComments(materialId);
  const count = (comments.data ?? []).length;
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <MessageCircle className="h-3.5 w-3.5" /> {count}
    </span>
  );
}

function timeAgo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  } catch {
    return dateStr?.slice(0, 10) ?? '';
  }
}
