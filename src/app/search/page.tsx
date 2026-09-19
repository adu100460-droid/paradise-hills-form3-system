import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function NoticeBoardPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') redirect('/dashboard');

  const latestMock = await prisma.mockExam.findFirst({ orderBy: { createdAt: 'desc' } });
  const students = await prisma.student.findMany({ orderBy: { fullName: 'asc' } });

  const rows = await Promise.all(students.map(async (student) => {
    const result = latestMock ? await prisma.resultSlip.findFirst({ where: { studentId: student.id, mockId: latestMock.id } }) : null;
    return { student, result };
  }));

  const sorted = rows
    .filter((row) => row.result)
    .sort((a, b) => {
      const aggDiff = (a.result?.aggregate6 ?? Number.MAX_SAFE_INTEGER) - (b.result?.aggregate6 ?? Number.MAX_SAFE_INTEGER);
      if (aggDiff !== 0) return aggDiff;
      const rawDiff = (b.result?.selectedRawScore ?? 0) - (a.result?.selectedRawScore ?? 0);
      if (rawDiff !== 0) return rawDiff;
      return (b.result?.totalRawScore ?? 0) - (a.result?.totalRawScore ?? 0);
    });

  return (
    <div className="app-shell">
      <div className="topbar no-print">
        <div className="brand"><div className="brand-mark">P</div><span>Paradise Hills School</span></div>
        <div className="row"><a href="/dashboard">Dashboard</a><a href="/admin/mocks">Mocks</a></div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h2>Whole-class result sheet</h2>
        <table className="table">
          <thead><tr><th>#</th><th>Photo</th><th>Name</th><th>Index</th><th>Aggregate 6</th><th>Selected raw score</th><th>QR</th></tr></thead>
          <tbody>
            {sorted.map((row, index) => (
              <tr key={row.student.id}>
                <td>{index + 1}</td>
                <td>{row.student.photoUrl ? <img className="avatar" src={row.student.photoUrl} alt={row.student.fullName} /> : '-'}</td>
                <td>{row.student.fullName}</td>
                <td>{row.student.phsIndex}</td>
                <td>{row.result?.aggregate6 ?? '-'}</td>
                <td>{row.result?.selectedRawScore ?? '-'}</td>
                <td>{row.result?.qrCodeDataUrl ? <img src={row.result.qrCodeDataUrl} alt="QR code" style={{ width: 42, height: 42 }} /> : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
