import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TopNav } from '@/components/top-nav';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const role = (session.user as any).role as 'ADMIN' | 'TEACHER' | 'STUDENT';
  const user = await prisma.user.findUnique({
    where: { email: (session.user as any).email },
    include: {
      student: true,
      teacher: { include: { teacherSubjects: { include: { subject: true } } } },
    },
  });

  if (!user) redirect('/login');

  const studentCount = await prisma.student.count();
  const teacherCount = await prisma.teacher.count();
  const subjectCount = await prisma.subject.count();
  const mockCount = await prisma.mockExam.count();

  if (role === 'ADMIN') {
    return (
      <div className="app-shell">
        <TopNav role="ADMIN" />
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-label">Students</div><div className="stat-value">{studentCount}</div></div>
          <div className="stat-card"><div className="stat-label">Teachers</div><div className="stat-value">{teacherCount}</div></div>
          <div className="stat-card"><div className="stat-label">Subjects</div><div className="stat-value">{subjectCount}</div></div>
          <div className="stat-card"><div className="stat-label">Mocks</div><div className="stat-value">{mockCount}</div></div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <h2>Administrative overview</h2>
          <p style={{ color: 'var(--muted)' }}>Manage staff, students, subjects, mock examinations, grading rules, and notice board results from here.</p>
        </div>
      </div>
    );
  }

  if (role === 'TEACHER') {
    const teacher = user.teacher;
    const mockIds = (teacher?.teacherSubjects || []).map((entry) => entry.subjectId);
    const availableSubjects = await prisma.subject.findMany({
      where: { id: { in: mockIds } },
      orderBy: { name: 'asc' },
    });
    const mockList = await prisma.mockExam.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });

    return (
      <div className="app-shell">
        <TopNav role="TEACHER" />
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-label">Assigned subjects</div><div className="stat-value">{availableSubjects.length}</div></div>
          <div className="stat-card"><div className="stat-label">Mocks</div><div className="stat-value">{mockList.length}</div></div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <h3>Teacher access</h3>
          <p style={{ color: 'var(--muted)' }}>You can only see and mark the subjects assigned to you.</p>
          <ul>
            {availableSubjects.map((subject) => <li key={subject.id}>{subject.name}</li>)}
          </ul>
        </div>
      </div>
    );
  }

  const student = user.student;
  const results = await prisma.resultSlip.findMany({
    where: { studentId: student?.id },
    include: { mock: true },
    orderBy: { issuedAt: 'desc' },
  });

  return (
    <div className="app-shell">
      <TopNav role="STUDENT" />
      <div className="card" style={{ padding: 20 }}>
        <h2>Student dashboard</h2>
        <p style={{ color: 'var(--muted)' }}><strong>{student?.fullName}</strong> · {student?.phsIndex}</p>
        <p style={{ color: 'var(--muted)' }}>Results available: {results.length}</p>
      </div>
    </div>
  );
}
