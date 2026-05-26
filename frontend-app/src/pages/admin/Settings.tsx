import { motion } from 'framer-motion';
import {
  KeyRound, Loader2, Settings as SettingsIcon, ShieldAlert, User,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { useChangePassword } from '@/hooks/usePassword';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'required'),
  newPassword:     z.string().min(8, 'at least 8 characters'),
  confirmPassword: z.string().min(1, 'required'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match',
});
type PwdVals = z.infer<typeof passwordSchema>;

export default function AdminSettings() {
  const me = useAuthStore((s) => s.me);
  const change = useChangePassword();

  const {
    register, handleSubmit, reset, formState: { errors },
  } = useForm<PwdVals>({ resolver: zodResolver(passwordSchema) });

  async function onSubmit(v: PwdVals) {
    await change.mutateAsync({
      currentPassword: v.currentPassword,
      newPassword:     v.newPassword,
    });
    reset();
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-xs text-muted-foreground">
          Dashboard › <span className="text-foreground font-semibold">Settings</span>
        </div>
        <h1 className="text-2xl font-extrabold mt-1">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Account and security settings for your admin profile.
        </p>
      </motion.div>

      {/* Profile card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-md bg-orange-100 text-orange-700 grid place-items-center">
              <User className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Read-only — managed by the database.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="User ID" value={me?.userId ?? '—'} />
            <Field label="Name"    value={me?.name   ?? '—'} />
            <Field label="Role"    value={(me?.role  ?? '—').toUpperCase()} />
          </div>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-md bg-indigo-100 text-indigo-700 grid place-items-center">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Use 8+ characters. We don't enforce special-char rules but please be sensible.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
            <div>
              <Label className="block mb-1.5">Current Password</Label>
              <Input type="password" autoComplete="current-password" {...register('currentPassword')} />
              {errors.currentPassword && (
                <p className="text-[11px] mt-1 font-semibold text-destructive">{errors.currentPassword.message}</p>
              )}
            </div>
            <div>
              <Label className="block mb-1.5">New Password</Label>
              <Input type="password" autoComplete="new-password" {...register('newPassword')} />
              {errors.newPassword && (
                <p className="text-[11px] mt-1 font-semibold text-destructive">{errors.newPassword.message}</p>
              )}
            </div>
            <div>
              <Label className="block mb-1.5">Confirm New Password</Label>
              <Input type="password" autoComplete="new-password" {...register('confirmPassword')} />
              {errors.confirmPassword && (
                <p className="text-[11px] mt-1 font-semibold text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" disabled={change.isPending}>
              {change.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* System info card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-md bg-emerald-100 text-emerald-700 grid place-items-center">
              <SettingsIcon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>System Info</CardTitle>
              <CardDescription>Runtime details for support / bug reports.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Frontend" value="React 19 + Vite" />
            <Field label="Backend"  value="Java Servlets + JDBC" />
            <Field label="Database" value="MySQL 8.0" />
          </div>
        </CardContent>
      </Card>

      {/* Danger zone — visual only for now */}
      <Card className="border-red-200 bg-red-50/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-md bg-red-100 text-red-700 grid place-items-center">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>Reserved for destructive actions like data export, year-end rollover.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No destructive actions are wired yet. Add semester promotion / archive controls here when needed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className="text-base font-bold mt-1">{value}</div>
    </div>
  );
}
