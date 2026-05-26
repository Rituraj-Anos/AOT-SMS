import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useAnimationControls } from 'framer-motion';
import { Eye, EyeOff, KeyRound, Loader2, Shield, GraduationCap, UserCog } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useLogin } from '@/hooks/useAuth';
import type { Role } from '@/types/api';
import { cn } from '@/lib/utils';

const schema = z.object({
  userId:   z.string().min(1, 'User ID is required'),
  password: z.string().min(1, 'Password is required'),
});
type FormVals = z.infer<typeof schema>;

const roles: { id: Role; label: string; icon: React.ReactNode; placeholder: string; idLabel: string }[] = [
  { id: 'admin',   label: 'Admin',   icon: <Shield className="h-4 w-4" />,        placeholder: 'e.g. admin',     idLabel: 'User ID' },
  { id: 'teacher', label: 'Teacher', icon: <UserCog className="h-4 w-4" />,       placeholder: 'e.g. TCH2021045', idLabel: 'Employee ID' },
  { id: 'student', label: 'Student', icon: <GraduationCap className="h-4 w-4" />, placeholder: 'e.g. 24CSE001',   idLabel: 'Roll Number' },
];

export default function LoginPage() {
  const [role, setRole] = useState<Role>('admin');
  const [showPwd, setShowPwd] = useState(false);
  const cardCtl = useAnimationControls();
  const navigate = useNavigate();
  const login = useLogin();
  const cfg = roles.find((r) => r.id === role)!;

  const { register, handleSubmit, formState: { errors }, setError } = useForm<FormVals>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormVals) {
    try {
      const me = await login.mutateAsync({ ...values, role });
      toast.success(`Welcome, ${me.name}!`);
      navigate(`/${me.role}/dashboard`, { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed';
      cardCtl.start({ x: [0, -10, 10, -10, 10, -5, 5, 0], transition: { duration: 0.5 } });
      setError('userId', { type: 'manual', message: '' });
      setError('password', { type: 'manual', message: msg });
      toast.error(msg);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-hero flex items-center justify-center p-6 relative overflow-hidden">
      {/* Soft floating orbs */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-[420px] w-[420px] rounded-full bg-orange-300/35 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-20 -left-24 h-[340px] w-[340px] rounded-full bg-indigo-200/40 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 14 }}
            className="mx-auto h-16 w-16 rounded-xl bg-card border-2 border-border shadow-md grid place-items-center"
          >
            <span className="font-extrabold text-2xl bg-gradient-brand bg-clip-text text-transparent">AOT</span>
          </motion.div>
          <h1 className="mt-3 text-xl font-extrabold tracking-tight">Academy of Technology</h1>
          <p className="text-xs text-muted-foreground">MAKAUT Affiliated · Adisaptagram, West Bengal</p>
        </div>

        <motion.div
          animate={cardCtl}
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 220, damping: 18 }}
          className="bg-card border border-border rounded-2xl shadow-xl px-8 py-8"
        >
          <div className="text-center mb-6">
            <div className="text-3xl mb-1">🎓</div>
            <h2 className="text-2xl font-extrabold">Welcome Back</h2>
            <p className="text-sm text-muted-foreground">Sign in to your portal</p>
          </div>

          {/* Role pill switcher */}
          <div className="flex gap-1 mb-6 bg-muted rounded-full p-1 border border-border">
            {roles.map((r) => (
              <button
                type="button"
                key={r.id}
                onClick={() => setRole(r.id)}
                className={cn(
                  'flex-1 px-3 py-2 rounded-full text-sm font-semibold transition inline-flex items-center justify-center gap-1.5',
                  role === r.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {r.icon}
                <span className="hidden sm:inline">{r.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" autoComplete="off">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{cfg.idLabel}</label>
              <input
                {...register('userId')}
                placeholder={cfg.placeholder}
                autoFocus
                className={cn(
                  'mt-1 w-full h-11 px-3 rounded-md border border-input bg-card text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500',
                  errors.userId && 'border-destructive focus:ring-destructive/20',
                )}
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Password</label>
              <div className="relative mt-1">
                <input
                  {...register('password')}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className={cn(
                    'w-full h-11 pl-3 pr-10 rounded-md border border-input bg-card text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500',
                    errors.password && 'border-destructive focus:ring-destructive/20',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((b) => !b)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  aria-label="Toggle password visibility"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password?.message ? (
                <p className="mt-2 text-xs font-semibold text-destructive">{errors.password.message}</p>
              ) : null}
            </div>

            <Button type="submit" disabled={login.isPending} className="w-full h-11">
              {login.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <KeyRound className="h-4 w-4" /> Sign In
                  <span className="ml-1">→</span>
                </>
              )}
            </Button>
          </form>
        </motion.div>

        <p className="text-center text-[11px] text-muted-foreground mt-6">
          © 2026 Academy of Technology · Powered by AOT SMS
        </p>
      </motion.div>
    </div>
  );
}
