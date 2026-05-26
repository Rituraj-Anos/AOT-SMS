import { NoticeBoard } from '@/components/shared/NoticeBoard';
import { useAuthStore } from '@/store/authStore';

export default function StudentNotices() {
  const me = useAuthStore((s) => s.me);
  return (
    <NoticeBoard
      mode="read"
      deptId={me?.deptId ?? undefined}
      title="Notice Board"
      subtitle="Latest announcements from the college and your department."
    />
  );
}
