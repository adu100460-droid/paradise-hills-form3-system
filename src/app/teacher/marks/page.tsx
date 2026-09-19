import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { TopNav } from '@/components/top-nav';

export default async function StudentResultsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'STUDENT') redirect('/dashboard');

  const student = await prisma.student.findUnique({
    where: { userId: (await prisma.user.findUnique({ where: { email: (session.user as any).email } }))?.id || '' },
  });

  if (!student) redirect('/dashboard');

  const results = await prisma.resultSlip.findMany({
    where: { studentId: student.id },
    include: { mock: true },
    orderBy: { issuedAt: 'desc' },
  });

  return (
    <div className="app-shell">
      <TopNav role="STUDENT" />
      <div className="card" style={{ padding: 20 }}>
        <h2>Previous finalized result slips</h2>
        {results.length === 0 ? <p>No finalized results yet.</p> : (
          <table className="table">
            <thead><tr><th>Mock</th><th>Aggregate 6</th><th>Certificate ID</th><th>Verification</th></tr></thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.id}>
                  <td>{result.mock.name}</td>
                  <td>{result.aggregate6 ?? '-'}</td>
                  <td>{result.officialCertificateId}</td>
                  <td><a href={`/verify/${result.verificationToken}`}>Open</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
