import { prisma } from '@/lib/prisma';
import { upsertSchoolSettings } from '@/lib/actions';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TopNav } from '@/components/top-nav';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') redirect('/dashboard');

  const settings = (await prisma.schoolSetting.findFirst()) || {
    schoolName: 'Paradise Hills School',
    motto: 'Love, Care & Discipline',
    academicYear: '2026/2027',
    logoUrl: '',
  };

  return (
    <div className="app-shell">
      <TopNav role="ADMIN" />
      <div className="card" style={{ padding: 20 }}>
        <h2>School settings</h2>
        <form action={async (formData: FormData) => {
          'use server';
          await upsertSchoolSettings({
            schoolName: (formData.get('schoolName') || '').toString(),
            motto: (formData.get('motto') || '').toString(),
            academicYear: (formData.get('academicYear') || '').toString(),
            logoUrl: (formData.get('logoUrl') || '').toString(),
          });
        }} className="form-grid">
          <div className="field"><label>School name</label><input name="schoolName" defaultValue={settings.schoolName} required /></div>
          <div className="field"><label>Motto</label><input name="motto" defaultValue={settings.motto} required /></div>
          <div className="field"><label>Academic year</label><input name="academicYear" defaultValue={settings.academicYear} required /></div>
          <div className="field"><label>Logo URL</label><input name="logoUrl" defaultValue={settings.logoUrl || ''} /></div>
          <div style={{ display: 'flex', alignItems: 'end' }}><button type="submit">Save settings</button></div>
        </form>
      </div>
    </div>
  );
}
