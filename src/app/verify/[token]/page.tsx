import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveMarks } from '@/lib/actions';

export default async function TeacherMarksPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'TEACHER') redirect('/dashboard');

  const user = await prisma.user.findUnique({ where: { email: (session.user as any).email }, include: { teacher: true } });
  if (!user?.teacher) redirect('/dashboard');

  const assignments = await prisma.teacherSubject.findMany({
    where: { teacherId: user.teacher.id },
    include: { subject: true },
  });
  const subjects = assignments.map((item) => item.subject);
  const mock = await prisma.mockExam.findFirst({ orderBy: { createdAt: 'desc' } });
  const students = await prisma.student.findMany({ orderBy: { fullName: 'asc' } });

  return (
    <div className="app-shell">
      <div className="topbar no-print">
        <div className="brand"><div className="brand-mark">P</div><span>Paradise Hills School</span></div>
        <div className="row"><a href="/dashboard">Dashboard</a><a href="/teacher/marks">Marks</a></div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h2>Marks entry</h2>
        {mock ? (
          <>
            <p>Current mock: <strong>{mock.name}</strong> — {mock.status}</p>
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  {subjects.map((subject) => <th key={subject.id}>{subject.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.fullName}</td>
                    {subjects.map((subject) => {
                      const mark = (mock ? prisma.markEntry.findUnique({
                        where: { studentId_subjectId_mockId: { studentId: student.id, subjectId: subject.id, mockId: mock.id } },
                      }) : null);

                      return (
                        <td key={`${student.id}-${subject.id}`}>
                          <form action={async (formData: FormData) => {
                            'use server';
                            await saveMarks({
                              mockId: mock.id,
                              subjectId: subject.id,
                              studentId: student.id,
                              rawScore: (formData.get('rawScore') || '').toString(),
                              isAbsent: formData.get('isAbsent') === 'on',
                            });
                          }}>
                            <input type="number" min={0} max={100} name="rawScore" defaultValue={''} style={{ width: 90 }} />
                            <label style={{ display: 'block', marginTop: 8 }}><input type="checkbox" name="isAbsent" /> Absent</label>
                            <button type="submit" style={{ marginTop: 8 }}>Save</button>
                          </form>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : <p>No mock exists yet. Create one from admin area.</p>}
      </div>
    </div>
  );
}
