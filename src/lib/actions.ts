import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import QRCode from 'qrcode';
import { computeAggregate6, getGradeForScore, getRemarkForGrade } from '@/lib/grading';

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function getAuthenticatedUser() {
  const session = await getCurrentSession();
  if (!session) return null;

  return prisma.user.findUnique({
    where: { email: (session.user as any).email },
    include: { student: true, teacher: true },
  });
}

export async function createFirstAdmin(data: { name: string; email: string; password: string }) {
  const existingCount = await prisma.user.count();
  if (existingCount > 0) throw new Error('An administrator already exists.');

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

export async function createAccount(form: { name: string; email: string; password: string; role: 'ADMIN' | 'TEACHER' | 'STUDENT' }) {
  const session = await getCurrentSession();
  if (!session || (session.user as any).role !== 'ADMIN') throw new Error('Unauthorized');

  const email = form.email.trim().toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) throw new Error('User with this email already exists.');

  return prisma.user.create({
    data: {
      name: form.name.trim(),
      email,
      passwordHash: await bcrypt.hash(form.password, 10),
      role: form.role,
    },
  });
}

export async function saveStudent(form: {
  id?: string;
  name: string;
  email: string;
  password?: string;
  className?: string;
  stream?: string;
  cohort?: string;
  photoUrl?: string;
}) {
  const session = await getCurrentSession();
  if (!session || (session.user as any).role !== 'ADMIN') throw new Error('Unauthorized');

  if (form.id) {
    const student = await prisma.student.findUnique({ where: { id: form.id }, include: { user: true } });
    if (!student) throw new Error('Student not found');

    const updated = await prisma.student.update({
      where: { id: form.id },
      data: {
        fullName: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        className: form.className || null,
        stream: form.stream || null,
        academicCohort: form.cohort || student.academicCohort,
        photoUrl: form.photoUrl || null,
      },
    });

    if (form.password && form.password.trim()) {
      await prisma.user.update({
        where: { id: student.userId },
        data: { passwordHash: await bcrypt.hash(form.password, 10) },
      });
    }

    revalidatePath('/admin/students');
    return updated;
  }

  const email = form.email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error('A user with this email already exists.');

  const cohort = form.cohort || '2026/2027';
  const yearToken = cohort.split('/')[0].slice(-2);
  const latest = await prisma.student.findFirst({
    where: { academicCohort: cohort },
    orderBy: { createdAt: 'desc' },
  });

  let nextNumber = 1;
  if (latest && latest.phsIndex) {
    const match = latest.phsIndex.match(/(\d+)$/);
    if (match) nextNumber = Number(match[1]) + 1;
  }

  const user = await prisma.user.create({
    data: {
      name: form.name.trim(),
      email,
      passwordHash: await bcrypt.hash(form.password || 'default123', 10),
      role: 'STUDENT',
    },
  });

  const student = await prisma.student.create({
    data: {
      userId: user.id,
      fullName: form.name.trim(),
      email,
      className: form.className || null,
      stream: form.stream || null,
      academicCohort: cohort,
      phsIndex: `PHS-${yearToken}-${String(nextNumber).padStart(3, '0')}`,
      photoUrl: form.photoUrl || null,
    },
  });

  revalidatePath('/admin/students');
  return student;
}

export async function saveTeacher(form: {
  id?: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  subjectIds?: string[];
}) {
  const session = await getCurrentSession();
  if (!session || (session.user as any).role !== 'ADMIN') throw new Error('Unauthorized');

  if (form.id) {
    const teacher = await prisma.teacher.findUnique({ where: { id: form.id }, include: { user: true } });
    if (!teacher) throw new Error('Teacher not found');

    const updated = await prisma.teacher.update({
      where: { id: form.id },
      data: {
        fullName: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone || null,
      },
    });

    if (form.subjectIds) {
      await prisma.teacherSubject.deleteMany({ where: { teacherId: form.id } });
      if (form.subjectIds.length > 0) {
        await prisma.teacherSubject.createMany({
          data: form.subjectIds.map((subjectId) => ({ teacherId: form.id!, subjectId })),
        });
      }
    }

    if (form.password && form.password.trim()) {
      await prisma.user.update({
        where: { id: teacher.userId },
        data: { passwordHash: await bcrypt.hash(form.password, 10) },
      });
    }

    revalidatePath('/admin/teachers');
    return updated;
  }

  const email = form.email.trim().toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) throw new Error('A user with this email already exists.');

  const user = await prisma.user.create({
    data: {
      name: form.name.trim(),
      email,
      passwordHash: await bcrypt.hash(form.password || 'default123', 10),
      role: 'TEACHER',
    },
  });

  const teacher = await prisma.teacher.create({
    data: {
      userId: user.id,
      fullName: form.name.trim(),
      email,
      phone: form.phone || null,
      teacherSubjects: form.subjectIds && form.subjectIds.length > 0 ? {
        create: form.subjectIds.map((subjectId) => ({ subjectId })),
      } : undefined,
    },
  });

  revalidatePath('/admin/teachers');
  return teacher;
}

export async function saveSubject(form: { id?: string; code: string; name: string; type: 'CORE' | 'ELECTIVE'; active?: boolean }) {
  const session = await getCurrentSession();
  if (!session || (session.user as any).role !== 'ADMIN') throw new Error('Unauthorized');

  if (form.id) {
    const subject = await prisma.subject.update({
      where: { id: form.id },
      data: {
        code: form.code.trim(),
        name: form.name.trim(),
        type: form.type,
        active: Boolean(form.active),
      },
    });
    revalidatePath('/admin/subjects');
    return subject;
  }

  const subject = await prisma.subject.create({
    data: {
      code: form.code.trim(),
      name: form.name.trim(),
      type: form.type,
      active: form.active ?? true,
    },
  });

  revalidatePath('/admin/subjects');
  return subject;
}

export async function saveMock(form: { id?: string; name: string; academicYear: string; status?: 'DRAFT' | 'MARKS_SUBMITTED' | 'FINALIZED' }) {
  const session = await getCurrentSession();
  if (!session || (session.user as any).role !== 'ADMIN') throw new Error('Unauthorized');

  if (form.id) {
    const mock = await prisma.mockExam.update({
      where: { id: form.id },
      data: {
        name: form.name.trim(),
        academicYear: form.academicYear.trim(),
        status: form.status || 'DRAFT',
      },
    });
    revalidatePath('/admin/mocks');
    return mock;
  }

  const mock = await prisma.mockExam.create({
    data: {
      name: form.name.trim(),
      academicYear: form.academicYear.trim(),
      status: form.status || 'DRAFT',
    },
  });

  revalidatePath('/admin/mocks');
  return mock;
}

export async function saveSchoolSettings(form: { schoolName: string; motto: string; academicYear: string; logoUrl?: string }) {
  const session = await getCurrentSession();
  if (!session || (session.user as any).role !== 'ADMIN') throw new Error('Unauthorized');

  const existing = await prisma.schoolSetting.findFirst();
  if (existing) {
    const updated = await prisma.schoolSetting.update({
      where: { id: existing.id },
      data: {
        schoolName: form.schoolName.trim(),
        motto: form.motto.trim(),
        academicYear: form.academicYear.trim(),
        logoUrl: form.logoUrl || existing.logoUrl,
      },
    });
    revalidatePath('/admin/settings');
    return updated;
  }

  const created = await prisma.schoolSetting.create({
    data: {
      schoolName: form.schoolName.trim(),
      motto: form.motto.trim(),
      academicYear: form.academicYear.trim(),
      logoUrl: form.logoUrl || null,
    },
  });
  revalidatePath('/admin/settings');
  return created;
}

export async function saveMarks(form: { mockId: string; subjectId: string; studentId: string; rawScore?: string; isAbsent?: boolean }) {
  const session = await getCurrentSession();
  if (!session) throw new Error('Unauthorized');

  const mock = await prisma.mockExam.findUnique({ where: { id: form.mockId } });
  if (!mock) throw new Error('Mock not found.');

  if (mock.status === 'FINALIZED' && (session.user as any).role !== 'ADMIN') {
    throw new Error('Marks are locked after finalization.');
  }

  const rawValue = form.rawScore === undefined || form.rawScore === '' ? null : Number(form.rawScore);
  const grade = rawValue === null ? 9 : getGradeForScore(rawValue);
  const remark = rawValue === null ? 'Absent / Not Applicable' : getRemarkForGrade(grade);

  await prisma.markEntry.upsert({
    where: {
      studentId_subjectId_mockId: {
        studentId: form.studentId,
        subjectId: form.subjectId,
        mockId: form.mockId,
      },
    },
    update: {
      rawScore: rawValue,
      grade,
      remark,
      isAbsent: Boolean(form.isAbsent) || rawValue === null,
    },
    create: {
      studentId: form.studentId,
      subjectId: form.subjectId,
      mockId: form.mockId,
      rawScore: rawValue,
      grade,
      remark,
      isAbsent: Boolean(form.isAbsent) || rawValue === null,
    },
  });

  revalidatePath('/teacher/marks');
  revalidatePath('/dashboard');
  return true;
}

export async function finalizeMock(mockId: string) {
  const session = await getCurrentSession();
  if (!session || (session.user as any).role !== 'ADMIN') throw new Error('Unauthorized');

  const mock = await prisma.mockExam.findUnique({ where: { id: mockId } });
  if (!mock) throw new Error('Mock not found');

  await prisma.mockExam.update({
    where: { id: mockId },
    data: { status: 'FINALIZED', finalizedAt: new Date() },
  });

  const students = await prisma.student.findMany({
    include: { marks: { where: { mockId }, include: { subject: true } } },
  });

  for (const student of students) {
    const marksForCalc = student.marks.map((mark) => ({
      rawScore: mark.rawScore,
      grade: mark.grade,
      type: mark.subject.type,
      name: mark.subject.name,
    }));

    if (marksForCalc.length === 0) continue;

    const result = computeAggregate6(marksForCalc);
    const verificationToken = `${student.phsIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const qrCodeDataUrl = await QRCode.toDataURL(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify/${verificationToken}`);

    await prisma.resultSlip.upsert({
      where: { studentId_mockId: { studentId: student.id, mockId } },
      update: {
        aggregate6: result.aggregate,
        selectedRawScore: result.selectedRawScore,
        totalRawScore: marksForCalc.reduce((sum, item) => sum + (item.rawScore ?? 0), 0),
        gradeSummary: marksForCalc.map((item) => `${item.name}:${item.grade ?? 9}`).join(', '),
        verificationToken,
        qrCodeDataUrl,
        isValid: true,
      },
      create: {
        studentId: student.id,
        mockId,
        aggregate6: result.aggregate,
        selectedRawScore: result.selectedRawScore,
        totalRawScore: marksForCalc.reduce((sum, item) => sum + (item.rawScore ?? 0), 0),
        gradeSummary: marksForCalc.map((item) => `${item.name}:${item.grade ?? 9}`).join(', '),
        verificationToken,
        qrCodeDataUrl,
      },
    });
  }

  revalidatePath('/admin/mocks');
  revalidatePath('/dashboard');
}

export async function reopenMock(mockId: string) {
  const session = await getCurrentSession();
  if (!session || (session.user as any).role !== 'ADMIN') throw new Error('Unauthorized');

  await prisma.mockExam.update({
    where: { id: mockId },
    data: { status: 'DRAFT', finalizedAt: null },
  });

  await prisma.resultSlip.deleteMany({ where: { mockId } });
  revalidatePath('/admin/mocks');
}

export async function deleteStudent(id: string) {
  const session = await getCurrentSession();
  if (!session || (session.user as any).role !== 'ADMIN') throw new Error('Unauthorized');

  await prisma.student.delete({ where: { id } });
  revalidatePath('/admin/students');
}

export async function deleteTeacher(id: string) {
  const session = await getCurrentSession();
  if (!session || (session.user as any).role !== 'ADMIN') throw new Error('Unauthorized');

  await prisma.teacher.delete({ where: { id } });
  revalidatePath('/admin/teachers');
}

export async function deleteSubject(id: string) {
  const session = await getCurrentSession();
  if (!session || (session.user as any).role !== 'ADMIN') throw new Error('Unauthorized');

  await prisma.subject.delete({ where: { id } });
  revalidatePath('/admin/subjects');
}

export async function deleteMock(id: string) {
  const session = await getCurrentSession();
  if (!session || (session.user as any).role !== 'ADMIN') throw new Error('Unauthorized');

  await prisma.mockExam.delete({ where: { id } });
  revalidatePath('/admin/mocks');
}

export async function searchEntities(query: string) {
  const q = query.trim();
  if (!q) return { students: [], teachers: [], subjects: [], mocks: [] };

  const [students, teachers, subjects, mocks] = await Promise.all([
    prisma.student.findMany({
      where: {
        OR: [{ fullName: { contains: q, mode: 'insensitive' } }, { phsIndex: { contains: q, mode: 'insensitive' } }],
      },
      take: 10,
    }),
    prisma.teacher.findMany({
      where: { OR: [{ fullName: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] },
      take: 10,
    }),
    prisma.subject.findMany({
      where: { OR: [{ name: { contains: q, mode: 'insensitive' } }, { code: { contains: q, mode: 'insensitive' } }] },
      take: 10,
    }),
    prisma.mockExam.findMany({
      where: { OR: [{ name: { contains: q, mode: 'insensitive' } }, { academicYear: { contains: q, mode: 'insensitive' } }] },
      take: 10,
    }),
  ]);

  return { students, teachers, subjects, mocks };
}

export async function getResultsForStudent(studentId: string) {
  return prisma.resultSlip.findMany({
    where: { studentId },
    include: { mock: true },
    orderBy: { issuedAt: 'desc' },
  });
}

export async function generateSingleResultSlip(studentId: string, mockId: string) {
  const session = await getCurrentSession();
  if (!session || (session.user as any).role !== 'ADMIN') throw new Error('Unauthorized');

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { marks: { where: { mockId }, include: { subject: true } } },
  });
  if (!student) throw new Error('Student not found');

  const result = computeAggregate6(
    student.marks.map((mark) => ({
      rawScore: mark.rawScore,
      grade: mark.grade,
      type: mark.subject.type,
      name: mark.subject.name,
    })),
  );

  const token = `${student.phsIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const qr = await QRCode.toDataURL(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify/${token}`);

  return prisma.resultSlip.upsert({
    where: { studentId_mockId: { studentId, mockId } },
    update: {
      aggregate6: result.aggregate,
      selectedRawScore: result.selectedRawScore,
      totalRawScore: result.selectedRawScore,
      verificationToken: token,
      qrCodeDataUrl: qr,
      isValid: true,
    },
    create: {
      studentId,
      mockId,
      aggregate6: result.aggregate,
      selectedRawScore: result.selectedRawScore,
      totalRawScore: result.selectedRawScore,
      verificationToken: token,
      qrCodeDataUrl: qr,
    },
  });
}

export async function getSchoolSettings() {
  return prisma.schoolSetting.findFirst();
}
