import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogBody, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input }  from '@/components/ui/input';
import { Label }  from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useDepartments } from '@/hooks/useDepartments';
import type { Teacher } from '@/types/api';
import type { TeacherPayload } from '@/hooks/useTeachers';

const schema = z.object({
  empId:        z.string().min(1, 'required'),
  teacherName:  z.string().min(1, 'required'),
  deptId:       z.coerce.number().min(1, 'required'),
  designation:  z.string().min(1, 'required'),
  phone:        z.string().optional().or(z.literal('')),
  email:        z.string().email().optional().or(z.literal('')),
  photoPath:    z.string().optional().or(z.literal('')),
  dateJoined:   z.string().optional().or(z.literal('')),
});
type FormVals = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  existing: Teacher | null;
  saving: boolean;
  onSubmit: (payload: TeacherPayload) => void | Promise<void>;
}

export function TeacherFormDialog({ open, onOpenChange, existing, onSubmit, saving }: Props) {
  const depts = useDepartments();
  const isEdit = !!existing?.teacherId;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormVals>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (open) {
      if (existing) reset({
        empId:       existing.empId,
        teacherName: existing.teacherName,
        deptId:      existing.deptId,
        designation: existing.designation as string,
        phone:       existing.phone ?? '',
        email:       existing.email ?? '',
        photoPath:   existing.photoPath ?? '',
        dateJoined:  existing.dateJoined ?? '',
      });
      else reset({
        empId: '', teacherName: '', deptId: 0 as any,
        designation: '', phone: '', email: '', photoPath: '', dateJoined: '',
      });
    }
  }, [open, existing, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit((v) => onSubmit({
          empId:       v.empId,
          teacherName: v.teacherName,
          deptId:      Number(v.deptId),
          designation: v.designation,
          phone:       v.phone || null,
          email:       v.email || null,
          photoPath:   v.photoPath || null,
          dateJoined:  v.dateJoined || null,
        }))} className="contents">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Teacher' : 'Add New Teacher'}</DialogTitle>
            <DialogDescription>Default password: <strong>Teacher@123</strong></DialogDescription>
          </DialogHeader>

          <DialogBody>
            <Section title="Identity">
              <Field label="Employee ID" required error={errors.empId?.message}>
                <Input {...register('empId')} disabled={isEdit} placeholder="TCH2021045" />
              </Field>
              <Field label="Full Name" required error={errors.teacherName?.message}>
                <Input {...register('teacherName')} placeholder="Dr. A. Sharma" />
              </Field>
            </Section>

            <Section title="Position">
              <Field label="Department" required error={errors.deptId?.message as string}>
                <Select value={String(watch('deptId') ?? '')} onValueChange={(v) => setValue('deptId', Number(v) as any, { shouldValidate: true })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {depts.data?.map((d) => (
                      <SelectItem key={d.deptId} value={String(d.deptId)}>{d.deptCode} — {d.deptName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Designation" required error={errors.designation?.message}>
                <Select value={watch('designation') ?? ''} onValueChange={(v) => setValue('designation', v, { shouldValidate: true })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Professor">Professor</SelectItem>
                    <SelectItem value="Associate Professor">Associate Professor</SelectItem>
                    <SelectItem value="Assistant Professor">Assistant Professor</SelectItem>
                    <SelectItem value="HOD">HOD</SelectItem>
                    <SelectItem value="Lab Instructor">Lab Instructor</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Date Joined" wide>
                <Input type="date" {...register('dateJoined')} />
              </Field>
            </Section>

            <Section title="Contact">
              <Field label="Phone"><Input {...register('phone')} /></Field>
              <Field label="Email" error={errors.email?.message}><Input type="email" {...register('email')} /></Field>
            </Section>

            <Section title="Photo">
              <Field label="Photo Path / URL" wide>
                <Input {...register('photoPath')} placeholder="/uploads/tch.jpg" />
              </Field>
            </Section>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Teacher'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 last:mb-0 first:mt-0 first:pt-0 first:border-t-0 mt-5 pt-4 border-t border-dashed border-border">
      <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">{title}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({ label, required, error, children, wide }:
  { label: string; required?: boolean; error?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'md:col-span-2' : ''}>
      <Label className="block mb-1.5">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
      {children}
      {error && <p className="text-[11px] mt-1 font-semibold text-destructive">{error}</p>}
    </div>
  );
}
