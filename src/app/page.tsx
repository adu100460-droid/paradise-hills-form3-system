import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email || '' },
    include: { student: true, teacher: true },
  });

  if (!user) redirect('/login');
  redirect('/dashboard');
}
