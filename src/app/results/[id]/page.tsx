import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TopNav } from '@/components/top-nav';
import { redirect } from 'next/navigation';

export default async function ResultsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') redirect('/dashboard');

  const results = await prisma.resultSlip.findMany({
    include: { student: true, mock: true },
    orderBy: { issuedAt: 'desc' },
  });

  return (
    <div className="app-shell">
      <TopNav role="ADMIN" />
      <div className="card" style={{ padding: 20 }}>
        <h2>Finalized results</h2>
        <table className="table">
          <thead><tr><th>Student</th><th>PHS Index</th><th>Mock</th><th>Aggregate 6</th><th>Verification</th></tr></thead>
          <tbody>
            {results.map((result) => (
              <tr key={result.id}>
                <td>{result.student.fullName}</td>
                <td>{result.student.phsIndex}</td>
                <td>{result.mock.name}</td>
                <td>{result.aggregate6 ?? '-'}</td>
                <td><a href={`/verify/${result.verificationToken}`}>Open</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
