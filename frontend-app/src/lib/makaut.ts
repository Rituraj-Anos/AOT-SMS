/**
 * MAKAUT-specific calculations — TypeScript port of MAKAUTCalculator.java.
 * Keep in sync with the backend (same algorithms, same rounding rules).
 */

const num = (v: number | null | undefined) => (v == null || Number.isNaN(v) ? 0 : Number(v));

/** Average of the top 2 of 4 CTs. CTs are out of 25. Returns raw average (max 25). */
export function calcBestTwo(
  ct1?: number | null,
  ct2?: number | null,
  ct3?: number | null,
  ct4?: number | null,
): number {
  const arr = [num(ct1), num(ct2), num(ct3), num(ct4)].sort((a, b) => b - a);
  return Math.round(((arr[0] + arr[1]) / 2) * 100) / 100;
}

/** Best-2 raw average scaled to /25. CAs are out of 25, so best2 IS already out of 25. */
export function scaleBestTwoTo25(best2Raw: number): number {
  return Math.round(best2Raw * 100) / 100;
}

/** Attendance marks — same step function as backend. */
export function calcAttMarks(percentage: number): number {
  if (percentage >= 90) return 5;
  if (percentage >= 80) return 4;
  if (percentage >= 75) return 3;
  if (percentage >= 65) return 2;
  if (percentage >= 50) return 1;
  return 0;
}

export type Grade = 'O' | 'E' | 'A' | 'B' | 'C' | 'D' | 'F';

/** Letter grade from total /100. */
export function calcGrade(total: number): Grade {
  if (total >= 90) return 'O';
  if (total >= 80) return 'E';
  if (total >= 70) return 'A';
  if (total >= 60) return 'B';
  if (total >= 50) return 'C';
  if (total >= 40) return 'D';
  return 'F';
}

export function gradePoint(g: Grade): number {
  return ({ O: 10, E: 9, A: 8, B: 7, C: 6, D: 5, F: 0 } as const)[g];
}

export interface SubjectResult { credits: number; gradePoint: number }

export function calcSGPA(subjects: SubjectResult[]): number {
  let credit = 0;
  let weighted = 0;
  for (const s of subjects) {
    credit += s.credits;
    weighted += s.credits * s.gradePoint;
  }
  if (credit === 0) return 0;
  return Math.round((weighted / credit) * 100) / 100;
}

export function calcCGPA(sgpas: number[]): number {
  const valid = sgpas.filter((x) => typeof x === 'number' && !Number.isNaN(x));
  if (valid.length === 0) return 0;
  const sum = valid.reduce((a, b) => a + b, 0);
  return Math.round((sum / valid.length) * 100) / 100;
}

export function cgpaToPercentage(cgpa: number): number {
  return Math.round((cgpa - 0.75) * 10 * 100) / 100;
}

/** Solve (present + x) / (held + x) >= 0.75 → ⌈(0.75·held − present) / 0.25⌉. */
export function classesNeededFor75(held: number, present: number): number {
  if (held <= 0) return 0;
  const cur = (present * 100) / held;
  if (cur >= 75) return 0;
  return Math.ceil((0.75 * held - present) / 0.25);
}

export const SEM4_CREDITS: Record<string, number> = {
  'PCC-CS401': 4, 'PCC-CS402': 3, 'PCC-CS403': 3, 'PCC-CS404': 3,
  'BSC-401':   3, 'MC-401':    1, 'PCC-CS492': 2, 'PCC-CS494': 2,
  'EET':       0, 'ABP':       0,
};

/** Color tokens for grade badges (Tailwind class names). */
export const GRADE_COLORS: Record<Grade, string> = {
  O: 'bg-emerald-100 text-emerald-700',
  E: 'bg-indigo-100  text-indigo-700',
  A: 'bg-blue-100    text-blue-700',
  B: 'bg-teal-100    text-teal-700',
  C: 'bg-amber-100   text-amber-700',
  D: 'bg-orange-100  text-orange-700',
  F: 'bg-red-100     text-red-700',
};
