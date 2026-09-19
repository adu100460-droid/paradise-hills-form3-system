import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function VerifyPage({ params }: { params: { token: string } }) {
  const result = await prisma.resultSlip.findUnique({
    where: { verificationToken: params.token },
    include: { student: true, mock: true },
  });

  if (!result) notFound();

  return (
    <div className="app-shell">
      <div className="card" style={{ padding: 30, maxWidth: 760, margin: '60px auto' }}>
        <h2>Result verification</h2>
        <p><strong>Status:</strong> {result.isValid ? 'Valid' : 'Invalid'}</p>
        <p><strong>Student:</strong> {result.student.fullName}</p>
        <p><strong>PHS Index:</strong> {result.student.phsIndex}</p>
        <p><strong>Mock:</strong> {result.mock.name}</p>
        <p><strong>Certificate ID:</strong> {result.officialCertificateId}</p>
        <p><strong>Aggregate 6:</strong> {result.aggregate6}</p>
      </div>
    </div>
  );
}
