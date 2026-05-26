import { motion, useMotionValue, useTransform, animate as motionAnimate } from 'framer-motion';
import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: 'orange' | 'info' | 'success' | 'warning' | 'danger';
  className?: string;
}

const toneClass: Record<NonNullable<Props['tone']>, string> = {
  orange:  'bg-orange-100  text-orange-700',
  info:    'bg-indigo-100  text-indigo-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100   text-amber-700',
  danger:  'bg-red-100     text-red-700',
};

export function StatCard({ label, value, icon, tone = 'orange', className }: Props) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = motionAnimate(motionVal, value, {
      duration: 0.9, ease: [0.4, 0, 0.2, 1],
    });
    return () => controls.stop();
  }, [value, motionVal]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card className={cn('flex items-center gap-4 p-5', className)}>
        <div className={cn('h-12 w-12 rounded-md grid place-items-center text-2xl', toneClass[tone])}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
          <motion.div className="text-3xl font-extrabold leading-tight">{rounded}</motion.div>
        </div>
      </Card>
    </motion.div>
  );
}
