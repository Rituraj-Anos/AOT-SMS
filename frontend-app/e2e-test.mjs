// Multi-role end-to-end navigation test.
import { chromium } from 'playwright';
const BASE = 'http://localhost:5173';

const SUITES = [
  {
    user: 'admin', password: 'Admin@AOT2026', role: 'admin',
    routes: [
      { path: '/admin/dashboard',   expected: 'Dashboard' },
      { path: '/admin/students',    expected: 'Student Roster' },
      { path: '/admin/teachers',    expected: 'Faculty Roster' },
      { path: '/admin/attendance',  expected: 'Attendance Reports' },
      { path: '/admin/marks',       expected: 'Marks Management' },
      { path: '/admin/results',     expected: 'Semester Results' },
      { path: '/admin/fees',        expected: 'Fees' },
      { path: '/admin/notices',     expected: 'Notice Board' },
      { path: '/admin/settings',    expected: 'Settings' },
    ],
  },
  {
    user: 'TCH2021001', password: 'Teacher@123', role: 'teacher',
    routes: [
      { path: '/teacher/dashboard',         expected: null },  // first name greeting
      { path: '/teacher/mark-attendance',   expected: 'Mark Attendance' },
      { path: '/teacher/enter-marks',       expected: 'Enter Marks' },
      { path: '/teacher/my-students',       expected: 'My Students' },
      { path: '/teacher/my-notices',        expected: 'My Notices' },
    ],
  },
  {
    user: '24CSE001', password: 'Student@123', role: 'student',
    routes: [
      { path: '/student/dashboard',     expected: null },
      { path: '/student/my-attendance', expected: 'My Attendance' },
      { path: '/student/my-marks',      expected: 'My Marks & Grades' },
      { path: '/student/my-fees',       expected: 'My Fees' },
      { path: '/student/notices',       expected: 'Notice Board' },
    ],
  },
];

(async () => {
  const browser = await chromium.launch({ headless: true });

  let totalPass = 0, totalFail = 0;
  for (const suite of SUITES) {
    const ctx  = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await ctx.newPage();

    console.log(`\n━━━ ${suite.role.toUpperCase()} (${suite.user}) ━━━`);
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });

    // Pick role tab
    const tabIdx = { admin: 0, teacher: 1, student: 2 }[suite.role];
    await page.locator('button[type="button"]').nth(tabIdx).click();

    await page.fill('input[autofocus]', suite.user).catch(async () => {
      const inputs = page.locator('input').first();
      await inputs.fill(suite.user);
    });
    await page.fill('input[type="password"]', suite.password);
    await page.click('button:has-text("Sign In")');

    try {
      await page.waitForURL(new RegExp(`${suite.role}/dashboard`), { timeout: 10000 });
    } catch {
      console.log(`  ✗ Login failed`);
      totalFail += suite.routes.length;
      await ctx.close();
      continue;
    }
    await page.waitForTimeout(1500);

    for (const r of suite.routes) {
      await page.click(`aside a[href="${r.path}"]`);
      await page.waitForTimeout(2200);
      const h1 = ((await page.locator('main h1').first().textContent()) || '').trim();
      const url = page.url().replace(BASE, '');
      const ok = url === r.path && (r.expected === null || h1.includes(r.expected));
      if (ok) {
        console.log(`  ✓ ${r.path.padEnd(30)} → "${h1}"`);
        totalPass++;
      } else {
        console.log(`  ✗ ${r.path.padEnd(30)} → URL=${url}  H1="${h1}"  (wanted "${r.expected}")`);
        totalFail++;
      }
    }

    await ctx.close();
  }

  console.log(`\n━━━ TOTAL: ${totalPass} passed / ${totalFail} failed ━━━`);
  await browser.close();
  process.exit(totalFail === 0 ? 0 : 1);
})().catch((e) => { console.error('Fatal:', e); process.exit(1); });
