import { prisma } from '@/lib/prisma';
import { saveStudent, deleteStudent } from '@/lib/actions';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TopNav } from '@/components/top-nav';
import { redirect } from 'next/navigation';

export default async function StudentsPage({ searchParams }: { searchParams?: { editId?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') redirect('/dashboard');

  const editId = searchParams?.editId || null;
  const editStudent = editId ? await prisma.student.findUnique({ where: { id: editId }, include: { user: true } }) : null;
  const students = await prisma.student.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div className="app-shell">
      <TopNav role="ADMIN" />
      <div className="card" style={{ padding: 20 }}>
        <h2>{editStudent ? 'Edit student' : 'Create student'}</h2>
        <form action={async (formData: FormData) => {
          'use server';
          await saveStudent({
            id: editStudent?.id,
            name: (formData.get('name') || '').toString(),
            email: (formData.get('email') || '').toString(),
            password: (formData.get('password') || '').toString(),
            className: (formData.get('className') || '').toString(),
            stream: (formData.get('stream') || '').toString(),
            cohort: (formData.get('cohort') || '').toString(),
            photoUrl: (formData.get('photoUrl') || '').toString(),
          });
        }} className="form-grid">
          <div className="field"><label>Name</label><input name="name" defaultValue={editStudent?.fullName || ''} required /></div>
          <div className="field"><label>Email</label><input type="email" name="email" defaultValue={editStudent?.email || ''} required /></div>
          <div className="field"><label>Password</label><input type="password" name="password" placeholder={editStudent ? 'Leave blank to keep current' : 'Set initial password'} /></div>
          <div className="field"><label>Class</label><input name="className" defaultValue={editStudent?.className || ''} /></div>
          <div className="field"><label>Stream</label><input name="stream" defaultValue={editStudent?.stream || ''} /></div>
          <div className="field"><label>Cohort</label><input name="cohort" defaultValue={editStudent?.academicCohort || '2026/2027'} /></div>
          <div className="field"><label>Photo URL</label><input name="photoUrl" defaultValue={editStudent?.photoUrl || ''} /></div>
          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button type="submit">{editStudent ? 'Update student' : 'Create student'}</button>
          </div>
        </form>
      </div>

      <div className="card" style={{ padding: 20, marginTop: 20 }}>
        <h3>Students</h3>
        <table className="table">
          <thead>
            <tr><th>Name</th><th>PHS Index</th><th>Class</th><th>Cohort</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.fullName}</td>
                <td>{student.phsIndex}</td>
                <td>{student.className || '-'}</td>
                <td>{student.academicCohort || '-'}</td>
                <td className="row">
                  <a href={`/admin/students?editId=${student.id}`} className="btn secondary">Edit</a>
                  <form action={async () => { 'use server'; await deleteStudent(student.id); }}><button type="submit" className="danger">Delete</button></form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
