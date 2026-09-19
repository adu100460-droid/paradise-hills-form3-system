import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function createFirstAdmin(data: { name: string; email: string; password: string }) {
  const count = await prisma.user.count();
  if (count > 0) throw new Error('An administrator already exists');

  const email = data.email.trim().toLowerCase();
  const name = data.name.trim();

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(data.password, 10),
      role: 'ADMIN',
    },
  });

  revalidatePath('/login');
  redirect('/login');
}

export async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return prisma.user.findUnique({
    where: { email: (session.user as any).email },
    include: { student: true, teacher: true },
  });
}
