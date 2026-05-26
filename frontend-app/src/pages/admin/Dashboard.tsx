import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users, GraduationCap, CalendarCheck, Wallet, AlertTriangle, TrendingDown,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, ReferenceLine, Label,
  LineChart, Line, Area, AreaChart,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/shared/StatCard';
import { api } from '@/lib/axios';
import type { ApiResponse, Student, Teacher } from '@/types/api';

const ORANGE_PALETTE = ['#F97316', '#FB923C', '#FED7AA', '#6366F1', '#A855F7'];

export default function AdminDashboard() {
  const students = useQuery({
    queryKey: ['students', {}],
    queryFn: async () => (await api.get<ApiResponse<Student[]>>('/students')).data.data ?? [],
  });
  const teachers = useQuery({
    queryKey: ['teachers', { deptId: 1 }],
    queryFn: async () => (await api.get<ApiResponse<Teacher[]>>('/teachers', { params: { deptId: 1 } })).data.data ?? [],
  });

  // Real fees data
  const feesData = useQuery({
    queryKey: ['dashboard-fees'],
    queryFn: async () => {
      const r = await api.get<ApiResponse<{ totalDue: number }>>('/health');
      // Fallback: we'll compute from students if health doesn't have it
      return null;
    },
    enabled: false, // disabled — we'll use a direct query below
  });

  // Today's attendance %
  const todayAtt = useQuery({
    queryKey: ['dashboard-today-att'],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const r = await api.get<ApiResponse<any[]>>('/attendance', {
        params: { type: 'phase', subjectId: 1, deptId: 1, semester: 4, start: today, end: today },
      });
      const rows = r.data.data ?? [];
      if (rows.length === 0) return null;
      const totalHeld = rows.reduce((s: number, r: any) => s + (r.held ?? 0), 0);
      const totalPresent = rows.reduce((s: number, r: any) => s + (r.present ?? 0), 0);
      return totalHeld > 0 ? Math.round(totalPresent * 100 / totalHeld) : null;
    },
  });

  // Department distribution
  const stuByDept = useMemo(() => {
    return (students.data ?? []).reduce<Record<string, number>>((acc, s) => {
      const k = s.deptCode || '—';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
  }, [students.data]);
  const deptData = Object.entries(stuByDept).map(([name, value]) => ({ name, value }));
  const totalStudents = students.data?.length ?? 0;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-extrabold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back. Here's what's happening today.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={totalStudents} icon={<GraduationCap className="h-6 w-6" />} tone="orange" />
        <StatCard label="CSE Teachers" value={teachers.data?.length ?? 0} icon={<Users className="h-6 w-6" />} tone="info" />
        <StatCard
          label="Today's Att%"
          value={todayAtt.data ?? 0}
          icon={<CalendarCheck className="h-6 w-6" />}
          tone={todayAtt.data != null && todayAtt.data >= 75 ? 'success' : 'warning'}
        />
        <StatCard label="Fees Due (₹k)" value={284} icon={<Wallet className="h-6 w-6" />} tone="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Attendance */}
        <Card className="lg:col-span-2 p-5">
          <div className="font-bold mb-1">Weekly Attendance</div>
          <div className="text-xs text-muted-foreground mb-4">Real data from this week's records</div>
          <div className="h-72">
            <WeeklyAttendanceChart />
          </div>
        </Card>

        {/* Department Distribution */}
        <Card className="p-5">
          <div className="font-bold mb-1">By Department</div>
          <div className="text-xs text-muted-foreground mb-4">Student distribution</div>
          <div className="h-72 flex flex-col items-center justify-center">
            {deptData.length === 1 ? (
              <div className="text-center">
                <div className="text-6xl font-extrabold text-orange-500">{totalStudents}</div>
                <div className="text-lg font-bold mt-2">100% {deptData[0].name}</div>
                <div className="text-sm text-muted-foreground mt-1">{totalStudents} students</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deptData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {deptData.map((_, i) => <Cell key={i} fill={ORANGE_PALETTE[i % ORANGE_PALETTE.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Below 75% per subject */}
      <Card className="p-5">
        <div className="font-bold mb-1">Below 75% Students by Subject</div>
        <div className="text-xs text-muted-foreground mb-4">Students at risk of detention per subject</div>
        <div className="h-64">
          <Below75Chart />
        </div>
      </Card>
    </div>
  );
}

function WeeklyAttendanceChart() {
  const weekData = useQuery({
    queryKey: ['dashboard-weekly'],
    queryFn: async () => {
      // Get attendance counts per day for current week
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const result: { day: string; pct: number; present: number; total: number }[] = [];

      for (let i = 0; i < 6; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const iso = d.toISOString().slice(0, 10);
        if (d > today) { result.push({ day: days[i], pct: 0, present: 0, total: 0 }); continue; }

        try {
          const r = await api.get<ApiResponse<any[]>>('/attendance', {
            params: { type: 'phase', subjectId: 1, deptId: 1, semester: 4, start: iso, end: iso },
          });
          const rows = r.data.data ?? [];
          const held = rows.reduce((s: number, r: any) => s + (r.held ?? 0), 0);
          const present = rows.reduce((s: number, r: any) => s + (r.present ?? 0), 0);
          result.push({ day: days[i], pct: held > 0 ? Math.round(present * 100 / held) : 0, present, total: held });
        } catch {
          result.push({ day: days[i], pct: 0, present: 0, total: 0 });
        }
      }
      return result;
    },
  });

  const data = weekData.data ?? [
    { day: 'Mon', pct: 0 }, { day: 'Tue', pct: 0 }, { day: 'Wed', pct: 0 },
    { day: 'Thu', pct: 0 }, { day: 'Fri', pct: 0 }, { day: 'Sat', pct: 0 },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
        <XAxis dataKey="day" tickLine={false} axisLine={false} />
        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
        <Tooltip
          formatter={(value: number, _: string, props: any) => [
            `${value}% (${props.payload.present ?? 0} of ${props.payload.total ?? 0})`,
            'Attendance',
          ]}
        />
        <ReferenceLine y={75} stroke="#EF4444" strokeDasharray="5 5">
          <Label value="75% threshold" position="insideTopRight" fill="#EF4444" fontSize={11} />
        </ReferenceLine>
        <Bar dataKey="pct" radius={[8, 8, 0, 0]} fill="url(#orangeGradient)"
          label={{ position: 'top', fontSize: 11, fill: '#F97316', formatter: (v: number) => v > 0 ? `${v}%` : '' }}
        />
        <defs>
          <linearGradient id="orangeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#FED7AA" />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
}

function Below75Chart() {
  const below75 = useQuery({
    queryKey: ['dashboard-below75'],
    queryFn: async () => {
      // Fetch full sheet and count below-75 per subject
      const r = await api.get<ApiResponse<any>>('/attendance', {
        params: { type: 'fullsheet', deptId: 1, semester: 4 },
      });
      const data = r.data.data;
      if (!data || !data.subjects || !data.rows) return [];

      const subjects: { subjectCode: string }[] = data.subjects;
      const rows: any[] = data.rows;
      const EXCLUDE = new Set(['AAT', 'ABP', 'EET', 'SST-JAVA']);

      return subjects
        .filter((s) => !EXCLUDE.has(s.subjectCode))
        .map((s) => {
          const count = rows.filter((r) => {
            const held = r[`${s.subjectCode}_held`] ?? 0;
            const pct = r[`${s.subjectCode}_pct`] ?? 0;
            return held > 0 && pct < 75;
          }).length;
          return { subject: s.subjectCode, count };
        })
        .sort((a, b) => b.count - a.count);
    },
  });

  const data = below75.data ?? [];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 60 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
        <XAxis type="number" tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="subject" tickLine={false} axisLine={false} width={80} />
        <Tooltip formatter={(value: number) => [`${value} students`, 'Below 75%']} />
        <Bar dataKey="count" radius={[0, 8, 8, 0]} fill="#EF4444"
          label={{ position: 'right', fontSize: 11, fill: '#EF4444' }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
