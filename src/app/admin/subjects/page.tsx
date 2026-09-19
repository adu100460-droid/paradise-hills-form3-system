import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveTeacher, deleteTeacher } from '@/lib/actions';

export default async function TeachersPage({ searchParams }: { searchParams?: { editId?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') redirect('/dashboard');

  const editId = searchParams?.editId;
  const editTeacher = editId ? await prisma.teacher.findUnique({ where: { id: editId } }) : null;
  const subjects = await prisma.subject.findMany({ orderBy: { name: 'asc' } });
  const teachers = await prisma.teacher.findMany({
    orderBy: { createdAt: 'desc' },
    include: { teacherSubjects: { include: { subject: true } } },
  });

  return (
    <div className="app-shell">
      <div className="topbar no-print">
        <div className="brand"><div className="brand-mark">P</div><span>Paradise Hills School</span></div>
        <div className="row"><a href="/dashboard">Dashboard</a><a href="/admin/students">Students</a><a href="/admin/teachers">Teachers</a><a href="/admin/mocks">Mocks</a></div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h2>{editTeacher ? 'Edit teacher' : 'Create teacher'}</h2>
        <form action={async (formData: FormData) => {
          'use server';
          const subjectIds = Array.from(formData.getAll('subjects')) as string[];
          await saveTeacher({
            id: editTeacher?.id,
            name: (formData.get('name') || '').toString(),
            email: (formData.get('email') || '').toString(),
            password: (formData.get('password') || '').toString(),
            phone: (formData.get('phone') || '').toString(),
            subjectIds,
          });
        }} className="form-grid">
          <div className="field"><label>Name</label><input name="name" defaultValue={editTeacher?.fullName || ''} required /></div>
          <div className="field"><label>Email</label><input type="email" name="email" defaultValue={editTeacher?.email || ''} required /></div>
          <div className="field"><label>Password</label><input type="password" name="password" placeholder={editTeacher ? 'Leave blank to keep current' : 'Set initial password'} /></div>
          <div className="field"><label>Phone</label><input name="phone" defaultValue={editTeacher?.phone || ''} /></div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label>Assigned subjects</label>
            <div className="row">
              {subjects.map((subject) => (
                <label key={subject.id} className="row" style={{ gap: 8 }}>
                  <input type="checkbox" name="subjects" value={subject.id} defaultChecked={editTeacher ? !!(await prisma.teacherSubject.findFirst({ where: { teacherId: editTeacher.id, subjectId: subject.id } })) : false} />
                  {subject.name}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button type="submit">{editTeacher ? 'Save changes' : 'Create teacher'}</button>
          </div>
        </form>
      </div>

      <div className="card" style={{ padding: 20, marginTop: 20 }}>
        <h3>Teachers</h3>
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Subjects</th><th>Actions</th></tr></thead>
          <tbody>
            {teachers.map((teacher) => (
              <tr key={teacher.id}>
                <td>{teacher.fullName}</td>
                <td>{teacher.email}</td>
                <td>{teacher.teacherSubjects.map((entry) => entry.subject.name).join(', ') || '-'}</td>
                <td className="row">
                  <a href={`/admin/teachers?editId=${teacher.id}`} className="btn secondary">Edit</a>
                  <form action={async () => { 'use server'; await deleteTeacher(teacher.id); }}><button type="submit" className="danger">Delete</button></form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
