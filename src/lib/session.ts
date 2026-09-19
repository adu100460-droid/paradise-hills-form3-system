import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export async function ensureAuthenticated() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return session;
}

export async function ensureRole(role: 'ADMIN' | 'TEACHER' | 'STUDENT') {
  const session = await ensureAuthenticated();
  if ((session.user as any).role !== role) redirect('/dashboard');
  return session;
}

export async function getCurrentUser() {
  const session = await ensureAuthenticated();
  const user = await prisma.user.findUnique({
    where: { email: (session.user as any).email },
    include: { teacher: true, student: true },
  });
  return user;
}
