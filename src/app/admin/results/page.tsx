import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { saveMarks } from '@/lib/actions';
import { TopNav } from '@/components/top-nav';
import { redirect } from 'next/navigation';

export default async function TeacherMarksPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'TEACHER') redirect('/dashboard');

  const teacher = await prisma.teacher.findUnique({
    where: { userId: (await prisma.user.findUnique({ where: { email: (session.user as any).email } }))?.id || '' },
    include: { teacherSubjects: { include: { subject: true } } },
  });

  const subjectIds = teacher?.teacherSubjects.map((item) => item.subjectId) || [];
  const subjects = await prisma.subject.findMany({ where: { id: { in: subjectIds } } });
  const mock = await prisma.mockExam.findFirst({ orderBy: { createdAt: 'desc' } });
  const students = await prisma.student.findMany({ orderBy: { fullName: 'asc' } });

  if (!mock) return <div className="app-shell"><TopNav role="TEACHER" /><div className="card" style={{ padding: 20 }}><h2>No mock available</h2></div></div>;

  return (
    <div className="app-shell">
      <TopNav role="TEACHER" />
      <div className="card" style={{ padding: 20 }}>
        <h2>Marks entry · {mock.name}</h2>
        <table className="table">
          <thead><tr><th>Student</th>{subjects.map((subject) => <th key={subject.id}>{subject.name}</th>)}</tr></thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.fullName}</td>
                {subjects.map((subject) => (
                  <td key={`${student.id}-${subject.id}`}>
                    <form action={async (formData: FormData) => {
                      'use server';
                      await saveMarks({
                        mockId: mock.id,
                        subjectId: subject.id,
                        studentId: student.id,
                        rawScore: (formData.get('rawScore') || '').toString(),
                        isAbsent: !!formData.get('isAbsent'),
                      });
                    }}>
                      <input type="number" min={0} max={100} name="rawScore" defaultValue={
                        ((await prisma.markEntry.findUnique({ where: { studentId_subjectId_mockId: { studentId: student.id, subjectId: subject.id, mockId: mock.id } } }))?.rawScore ?? '') as any
                      } style={{ width: 90 }} />
                      <div style={{ marginTop: 8 }}><label><input type="checkbox" name="isAbsent" /> Absent</label></div>
                      <button type="submit" style={{ marginTop: 8 }}>Save</button>
                    </form>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
