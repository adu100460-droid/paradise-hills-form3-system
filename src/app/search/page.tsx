import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TopNav } from '@/components/top-nav';
import { redirect } from 'next/navigation';

export default async function NoticeBoardPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') redirect('/dashboard');

  const students = await prisma.student.findMany({ orderBy: { fullName: 'asc' } });
  const latestMock = await prisma.mockExam.findFirst({ orderBy: { createdAt: 'desc' } });

  const rows = await Promise.all(students.map(async (student) => {
    const result = await prisma.resultSlip.findFirst({
      where: { studentId: student.id, mockId: latestMock?.id || '' },
    });

    return {
      student,
      result,
    };
  }));

  const sorted = rows
    .filter((r) => r.result)
    .sort((a, b) => {
      const aggA = a.result?.aggregate6 ?? Number.MAX_SAFE_INTEGER;
      const aggB = b.result?.aggregate6 ?? Number.MAX_SAFE_INTEGER;
      if (aggA !== aggB) return aggA - aggB;
      const rawA = a.result?.selectedRawScore ?? 0;
      const rawB = b.result?.selectedRawScore ?? 0;
      if (rawA !== rawB) return rawB - rawA;
      return (b.result?.totalRawScore ?? 0) - (a.result?.totalRawScore ?? 0);
    });

  return (
    <div className="app-shell">
      <TopNav role="ADMIN" />
      <div className="card" style={{ padding: 20 }}>
        <h2>Whole-class result sheet</h2>
        <p style={{ color: 'var(--muted)' }}>Sorted by lowest aggregate, highest selected raw score, then total raw score.</p>
        <table className="table">
          <thead><tr><th>#</th><th>Photo</th><th>Name</th><th>Index</th><th>Aggregate 6</th><th>Selected raw score</th><th>QR</th></tr></thead>
          <tbody>
            {sorted.map((item, index) => (
              <tr key={item.student.id}>
                <td>{index + 1}</td>
                <td><img className="avatar" src={item.student.photoUrl || 'https://placehold.co/60x60'} alt={item.student.fullName} /></td>
                <td>{item.student.fullName}</td>
                <td>{item.student.phsIndex}</td>
                <td>{item.result?.aggregate6 ?? '-'}</td>
                <td>{item.result?.selectedRawScore ?? '-'}</td>
                <td>{item.result?.verificationToken ? <img src={item.result.qrCodeDataUrl || ''} alt="QR" style={{ width: 36, height: 36 }} /> : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
