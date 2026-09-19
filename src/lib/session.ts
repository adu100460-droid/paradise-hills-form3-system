import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Not authenticated');
  return session;
}

export async function requireRole(role: 'ADMIN' | 'TEACHER' | 'STUDENT') {
  const session = await requireAuth();
  if ((session.user as any).role !== role) throw new Error('Unauthorized');
  return session;
}

export async function getCurrentUser() {
  const session = await requireAuth();
  return prisma.user.findUnique({
    where: { email: (session.user as any).email },
    include: { student: true, teacher: true },
  });
}
