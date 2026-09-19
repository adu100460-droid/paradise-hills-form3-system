import { prisma } from '@/lib/prisma';
import { saveMock, finalizeMock, reopenMock, deleteMock } from '@/lib/actions';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TopNav } from '@/components/top-nav';
import { redirect } from 'next/navigation';

export default async function MocksPage({ searchParams }: { searchParams?: { editId?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') redirect('/dashboard');

  const editId = searchParams?.editId || null;
  const editMock = editId ? await prisma.mockExam.findUnique({ where: { id: editId } }) : null;
  const mocks = await prisma.mockExam.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div className="app-shell">
      <TopNav role="ADMIN" />
      <div className="card" style={{ padding: 20 }}>
        <h2>{editMock ? 'Edit mock' : 'Create mock'}</h2>
        <form action={async (formData: FormData) => {
          'use server';
          await saveMock({
            id: editMock?.id,
            name: (formData.get('name') || '').toString(),
            academicYear: (formData.get('academicYear') || '2026/2027').toString(),
            status: ((formData.get('status') || 'DRAFT') as 'DRAFT' | 'MARKS_SUBMITTED' | 'FINALIZED'),
          });
        }} className="form-grid">
          <div className="field"><label>Name</label><input name="name" defaultValue={editMock?.name || ''} required /></div>
          <div className="field"><label>Academic year</label><input name="academicYear" defaultValue={editMock?.academicYear || '2026/2027'} required /></div>
          <div className="field">
            <label>Status</label>
            <select name="status" defaultValue={editMock?.status || 'DRAFT'}>
              <option value="DRAFT">Draft</option>
              <option value="MARKS_SUBMITTED">Marks Submitted</option>
              <option value="FINALIZED">Finalized</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'end' }}><button type="submit">{editMock ? 'Update mock' : 'Create mock'}</button></div>
        </form>
      </div>

      <div className="card" style={{ padding: 20, marginTop: 20 }}>
        <h3>Mocks</h3>
        <table className="table">
          <thead><tr><th>Name</th><th>Academic year</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {mocks.map((mock) => (
              <tr key={mock.id}>
                <td>{mock.name}</td>
                <td>{mock.academicYear}</td>
                <td><span className={`badge ${mock.status.toLowerCase()}`}>{mock.status}</span></td>
                <td className="row">
                  <a href={`/admin/mocks?editId=${mock.id}`} className="btn secondary">Edit</a>
                  <form action={async () => { 'use server'; await finalizeMock(mock.id); }}><button type="submit" className="success">Finalize</button></form>
                  <form action={async () => { 'use server'; await reopenMock(mock.id); }}><button type="submit" className="secondary">Reopen</button></form>
                  <form action={async () => { 'use server'; await deleteMock(mock.id); }}><button type="submit" className="danger">Delete</button></form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
