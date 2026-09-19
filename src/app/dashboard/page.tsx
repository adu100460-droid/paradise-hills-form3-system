import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { TopNav } from '@/components/top-nav';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: (session.user as any).email },
    include: { student: true, teacher: true },
  });

  if (!user) redirect('/login');

  const role = (session.user as any).role || user.role;
  const stats = {
    students: await prisma.student.count(),
    teachers: await prisma.teacher.count(),
    subjects: await prisma.subject.count(),
    mocks: await prisma.mockExam.count(),
  };

  return (
    <div className="app-shell">
      <TopNav role={role} />
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Students</div><div className="stat-value">{stats.students}</div></div>
        <div className="stat-card"><div className="stat-label">Teachers</div><div className="stat-value">{stats.teachers}</div></div>
        <div className="stat-card"><div className="stat-label">Subjects</div><div className="stat-value">{stats.subjects}</div></div>
        <div className="stat-card"><div className="stat-label">Mocks</div><div className="stat-value">{stats.mocks}</div></div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h2>Welcome, {user.name || user.email}</h2>
        <p style={{ color: 'var(--muted)' }}>
          Role: {role}. Access is restricted to your assigned responsibilities.
        </p>
      </div>
    </div>
  );
}
