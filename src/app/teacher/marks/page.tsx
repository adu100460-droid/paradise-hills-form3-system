import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function StudentResultsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'STUDENT') redirect('/dashboard');

  const user = await prisma.user.findUnique({ where: { email: (session.user as any).email }, include: { student: true } });
  if (!user?.student) redirect('/dashboard');

  const results = await prisma.resultSlip.findMany({
    where: { studentId: user.student.id },
    include: { mock: true },
    orderBy: { issuedAt: 'desc' },
  });

  return (
    <div className="app-shell">
      <div className="topbar no-print">
        <div className="brand"><div className="brand-mark">P</div><span>Paradise Hills School</span></div>
        <div className="row"><a href="/dashboard">Dashboard</a><a href="/student/results">Results</a></div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h2>My results</h2>
        {results.length === 0 ? <p>No finalized results yet.</p> : (
          <table className="table">
            <thead><tr><th>Mock</th><th>Aggregate 6</th><th>Certificate ID</th><th>Verification</th></tr></thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.id}>
                  <td>{result.mock.name}</td>
                  <td>{result.aggregate6 ?? '-'}</td>
                  <td>{result.officialCertificateId}</td>
                  <td><a href={`/verify/${result.verificationToken}`}>View</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
