import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api';

export interface PhaseRow {
  studentId: number;
  rollNo: string;
  studentName: string;
  studentType: string;
  held: number;
  present: number;
  absent: number;
  leave: number;
  ml: number;
  percent: number;
}

export interface FullSheetSubject {
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  subjectType: string;
}

export interface FullSheetRow {
  studentId: number;
  rollNo: string;
  studentName: string;
  studentType: string;
  theoryHeld: number; theoryPresent: number; theoryPct: number;
  practicalHeld: number; practicalPresent: number; practicalPct: number;
  overallHeld: number; overallPresent: number; overallPct: number;
  [key: string]: any; // dynamic per-subject keys like "PCC-CS401_held"
}

export interface FullSheetData {
  subjects: FullSheetSubject[];
  rows: FullSheetRow[];
}

export function usePhaseAttendance(subjectId?: number, deptId?: number, semester?: number, start?: string, end?: string) {
  return useQuery({
    queryKey: ['attendance-phase', subjectId, deptId, semester, start, end],
    enabled: !!subjectId && !!deptId && !!semester && !!start && !!end,
    queryFn: async () => {
      const r = await api.get<ApiResponse<PhaseRow[]>>('/attendance', {
        params: { type: 'phase', subjectId, deptId, semester, start, end },
      });
      return r.data.data ?? [];
    },
  });
}

export function useFullSheet(deptId?: number, semester?: number) {
  return useQuery({
    queryKey: ['attendance-fullsheet', deptId, semester],
    enabled: !!deptId && !!semester,
    queryFn: async () => {
      const r = await api.get<ApiResponse<FullSheetData>>('/attendance', {
        params: { type: 'fullsheet', deptId, semester },
      });
      return r.data.data ?? { subjects: [], rows: [] };
    },
  });
}
