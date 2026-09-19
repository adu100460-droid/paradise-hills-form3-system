import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: (session.user as any).email },
    include: { student: true, teacher: true },
  });

  if (!user) redirect('/login');
  redirect('/dashboard');
}
