import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function ensureAuthenticated() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Not authenticated');
  return session;
}

export async function ensureRole(role: 'ADMIN' | 'TEACHER' | 'STUDENT') {
  const session = await ensureAuthenticated();
  if ((session.user as any).role !== role) throw new Error('Unauthorized');
  return session;
}
