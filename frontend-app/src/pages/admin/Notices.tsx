import { NoticeBoard } from '@/components/shared/NoticeBoard';

export default function AdminNotices() {
  return (
    <NoticeBoard
      mode="admin"
      title="Notice Board"
      subtitle="Post, pin, and manage notices across the institution."
    />
  );
}
