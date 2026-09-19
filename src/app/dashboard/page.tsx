import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: (session.user as any).email },
    include: { student: true, teacher: true },
  });

  if (!user) redirect('/login');

  const role = (session.user as any).role || user.role;
  const studentCount = await prisma.student.count();
  const teacherCount = await prisma.teacher.count();
  const subjectCount = await prisma.subject.count();
  const mockCount = await prisma.mockExam.count();

  return (
    <div className="app-shell">
      <div className="topbar no-print">
        <div className="brand">
          <div className="brand-mark">P</div>
          <span>Paradise Hills School</span>
        </div>
        <div className="row">
          <a href="/dashboard">Dashboard</a>
          {role === 'ADMIN' ? (
            <>
              <a href="/admin/students">Students</a>
              <a href="/admin/teachers">Teachers</a>
              <a href="/admin/subjects">Subjects</a>
              <a href="/admin/mocks">Mocks</a>
              <a href="/admin/settings">Settings</a>
              <a href="/search">Search</a>
            </>
          ) : role === 'TEACHER' ? (
            <><a href="/teacher/marks">Marks</a><a href="/search">Search</a></>
          ) : (
            <><a href="/student/results">Results</a><a href="/search">Search</a></>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Students</div><div className="stat-value">{studentCount}</div></div>
        <div className="stat-card"><div className="stat-label">Teachers</div><div className="stat-value">{teacherCount}</div></div>
        <div className="stat-card"><div className="stat-label">Subjects</div><div className="stat-value">{subjectCount}</div></div>
        <div className="stat-card"><div className="stat-label">Mocks</div><div className="stat-value">{mockCount}</div></div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h2>Welcome, {user.name || user.email}</h2>
        <p style={{ color: 'var(--muted)' }}>Role: {role}</p>
      </div>
    </div>
  );
}
