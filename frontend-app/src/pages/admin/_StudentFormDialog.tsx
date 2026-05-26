import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogBody, DialogFooter,
} from '@/components/ui/dialog';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useDepartments } from '@/hooks/useDepartments';
import type { Student } from '@/types/api';
import type { StudentPayload } from '@/hooks/useStudents';

const schema = z.object({
  rollNo:          z.string().min(1, 'required'),
  studentName:     z.string().min(1, 'required'),
  studentType:     z.enum(['regular', 'lateral', 'transfer']),
  deptId:          z.coerce.number().min(1, 'required'),
  currentSemester: z.coerce.number().min(1).max(8),
  section:         z.string().min(1, 'required'),
  dob:             z.string().optional().or(z.literal('')),
  gender:          z.enum(['Male', 'Female', 'Other']).optional().or(z.literal('')),
  bloodGroup:      z.string().optional().or(z.literal('')),
  aadharNo:        z.string().optional().or(z.literal('')),
  phone:           z.string().optional().or(z.literal('')),
  email:           z.string().email().optional().or(z.literal('')),
  parentName:      z.string().optional().or(z.literal('')),
  parentPhone:     z.string().optional().or(z.literal('')),
  address:         z.string().optional().or(z.literal('')),
  photoPath:       z.string().optional().or(z.literal('')),
  admissionYear:   z.coerce.number().int().optional().or(z.literal('')),
});

type FormVals = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  existing: Student | null;
  saving: boolean;
  onSubmit: (payload: StudentPayload) => void | Promise<void>;
}

export function StudentFormDialog({ open, onOpenChange, existing, onSubmit, saving }: Props) {
  const depts = useDepartments();
  const isEdit = !!existing?.studentId;

  const {
    register, handleSubmit, reset, setValue, watch, formState: { errors },
  } = useForm<FormVals>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) {
      if (existing) {
        reset({
          rollNo:          existing.rollNo,
          studentName:     existing.studentName,
          studentType:     existing.studentType,
          deptId:          existing.deptId,
          currentSemester: existing.currentSemester,
          section:         existing.section,
          dob:             existing.dob ?? '',
          gender:          (existing.gender ?? '') as any,
          bloodGroup:      existing.bloodGroup ?? '',
          aadharNo:        existing.aadharNo ?? '',
          phone:           existing.phone ?? '',
          email:           existing.email ?? '',
          parentName:      existing.parentName ?? '',
          parentPhone:     existing.parentPhone ?? '',
          address:         existing.address ?? '',
          photoPath:       existing.photoPath ?? '',
          admissionYear:   existing.admissionYear ?? ('' as any),
        });
      } else {
        reset({
          rollNo: '', studentName: '', studentType: 'regular' as any,
          deptId: 0 as any, currentSemester: 1, section: 'A',
          dob: '', gender: '' as any, bloodGroup: '', aadharNo: '',
          phone: '', email: '', parentName: '', parentPhone: '',
          address: '', photoPath: '', admissionYear: '' as any,
        });
      }
    }
  }, [open, existing, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <form
          id="student-form"
          onSubmit={handleSubmit((v) => {
            const payload: StudentPayload = {
              rollNo:          v.rollNo,
              studentName:     v.studentName,
              studentType:     v.studentType,
              deptId:          Number(v.deptId),
              currentSemester: Number(v.currentSemester),
              section:         v.section,
              dob:             v.dob || null,
              gender:          (v.gender || null) as any,
              bloodGroup:      v.bloodGroup || null,
              aadharNo:        v.aadharNo || null,
              phone:           v.phone || null,
              email:           v.email || null,
              parentName:      v.parentName || null,
              parentPhone:     v.parentPhone || null,
              address:         v.address || null,
              photoPath:       v.photoPath || null,
              admissionYear:   v.admissionYear ? Number(v.admissionYear) : null,
            };
            return onSubmit(payload);
          })}
          className="contents"
        >
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Student' : 'Add New Student'}</DialogTitle>
          <DialogDescription>
            All starred fields are required. Default password: <strong>Student@123</strong>
          </DialogDescription>
        </DialogHeader>
          <DialogBody>
            <Section title="Identity">
              <Field label="Roll Number" required error={errors.rollNo?.message}>
                <Input {...register('rollNo')} disabled={isEdit} placeholder="24CSE001 / L204" />
              </Field>
              <Field label="Full Name" required error={errors.studentName?.message}>
                <Input {...register('studentName')} placeholder="Asmit Roy" />
              </Field>
              <Field label="Student Type" required error={errors.studentType?.message}>
                <Select value={watch('studentType')} onValueChange={(v) => setValue('studentType', v as any, { shouldValidate: true })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="lateral">Lateral</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Admission Year" error={errors.admissionYear?.message as string}>
                <Input type="number" {...register('admissionYear')} placeholder="2024" />
              </Field>
            </Section>

            <Section title="Academic">
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
              <Field label="Current Sem" required>
                <Select value={String(watch('currentSemester') ?? '')} onValueChange={(v) => setValue('currentSemester', Number(v) as any, { shouldValidate: true })}>
                  <SelectTrigger><SelectValue placeholder="Sem" /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Section" required>
                <Select value={watch('section') ?? ''} onValueChange={(v) => setValue('section', v, { shouldValidate: true })}>
                  <SelectTrigger><SelectValue placeholder="Sec" /></SelectTrigger>
                  <SelectContent>
                    {['A','B','C'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </Section>

            <Section title="Personal">
              <Field label="Date of Birth"><Input type="date" {...register('dob')} /></Field>
              <Field label="Gender">
                <Select value={watch('gender') as string} onValueChange={(v) => setValue('gender', v as any)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Blood Group"><Input {...register('bloodGroup')} placeholder="O+" /></Field>
              <Field label="Aadhar"><Input {...register('aadharNo')} placeholder="0000-0000-0000" /></Field>
              <Field label="Phone"><Input {...register('phone')} placeholder="+91 …" /></Field>
              <Field label="Email"><Input type="email" {...register('email')} placeholder="name@aot.edu.in" /></Field>
            </Section>

            <Section title="Parent / Guardian">
              <Field label="Parent Name"><Input {...register('parentName')} /></Field>
              <Field label="Parent Phone"><Input {...register('parentPhone')} /></Field>
              <Field label="Address" wide><Textarea rows={2} {...register('address')} /></Field>
            </Section>

            <Section title="Photo">
              <Field label="Photo Path / URL" wide>
                <Input {...register('photoPath')} placeholder="/uploads/24CSE001.jpg" />
              </Field>
            </Section>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Student'}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {children}
      </div>
    </div>
  );
}

function Field({
  label, required, error, children, wide,
}: { label: string; required?: boolean; error?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'md:col-span-2 lg:col-span-3' : ''}>
      <Label className="block mb-1.5">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-[11px] mt-1 font-semibold text-destructive">{error}</p>}
    </div>
  );
}
