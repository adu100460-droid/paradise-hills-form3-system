import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveSubject, deleteSubject } from '@/lib/actions';

export default async function SubjectsPage({ searchParams }: { searchParams?: { editId?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') redirect('/dashboard');

  const editId = searchParams?.editId;
  const editSubject = editId ? await prisma.subject.findUnique({ where: { id: editId } }) : null;
  const subjects = await prisma.subject.findMany({ orderBy: { name: 'asc' } });

  return (
    <div className="app-shell">
      <div className="topbar no-print">
        <div className="brand"><div className="brand-mark">P</div><span>Paradise Hills School</span></div>
        <div className="row"><a href="/dashboard">Dashboard</a><a href="/admin/students">Students</a><a href="/admin/teachers">Teachers</a><a href="/admin/mocks">Mocks</a></div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h2>{editSubject ? 'Edit subject' : 'Create subject'}</h2>
        <form action={async (formData: FormData) => {
          'use server';
          await saveSubject({
            id: editSubject?.id,
            code: (formData.get('code') || '').toString(),
            name: (formData.get('name') || '').toString(),
            type: ((formData.get('type') || 'CORE') as 'CORE' | 'ELECTIVE'),
            active: formData.get('active') === 'on',
          });
        }} className="form-grid">
          <div className="field"><label>Code</label><input name="code" defaultValue={editSubject?.code || ''} required /></div>
          <div className="field"><label>Name</label><input name="name" defaultValue={editSubject?.name || ''} required /></div>
          <div className="field">
            <label>Type</label>
            <select name="type" defaultValue={editSubject?.type || 'CORE'}>
              <option value="CORE">Core</option>
              <option value="ELECTIVE">Elective</option>
            </select>
          </div>
          <div className="field">
            <label>Active</label>
            <input type="checkbox" name="active" defaultChecked={editSubject ? editSubject.active : true} />
          </div>
          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button type="submit">{editSubject ? 'Save changes' : 'Create subject'}</button>
          </div>
        </form>
      </div>

      <div className="card" style={{ padding: 20, marginTop: 20 }}>
        <h3>Subjects</h3>
        <table className="table">
          <thead><tr><th>Code</th><th>Name</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {subjects.map((subject) => (
              <tr key={subject.id}>
                <td>{subject.code}</td>
                <td>{subject.name}</td>
                <td>{subject.type}</td>
                <td>{subject.active ? 'Active' : 'Inactive'}</td>
                <td className="row">
                  <a href={`/admin/subjects?editId=${subject.id}`} className="btn secondary">Edit</a>
                  <form action={async () => { 'use server'; await deleteSubject(subject.id); }}><button type="submit" className="danger">Delete</button></form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
