import { NoticeBoard } from '@/components/shared/NoticeBoard';
import { useAuthStore } from '@/store/authStore';

export default function TeacherMyNotices() {
  const me = useAuthStore((s) => s.me);
  // Teachers see all-targeted + their own dept notices, and can post.
  return (
    <NoticeBoard
      mode="post"
      deptId={me?.deptId ?? undefined}
      title="My Notices"
      subtitle="Post notices for your department or section. You'll also see college-wide notices here."
    />
  );
}
