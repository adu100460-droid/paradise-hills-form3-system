import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveSchoolSettings } from '@/lib/actions';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') redirect('/dashboard');

  const settings = await prisma.schoolSetting.findFirst();

  return (
    <div className="app-shell">
      <div className="topbar no-print">
        <div className="brand"><div className="brand-mark">P</div><span>Paradise Hills School</span></div>
        <div className="row"><a href="/dashboard">Dashboard</a><a href="/admin/mocks">Mocks</a></div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h2>School settings</h2>
        <form action={async (formData: FormData) => {
          'use server';
          await saveSchoolSettings({
            schoolName: (formData.get('schoolName') || '').toString(),
            motto: (formData.get('motto') || '').toString(),
            academicYear: (formData.get('academicYear') || '').toString(),
            logoUrl: (formData.get('logoUrl') || '').toString(),
          });
        }} className="form-grid">
          <div className="field"><label>School name</label><input name="schoolName" defaultValue={settings?.schoolName || 'Paradise Hills School'} required /></div>
          <div className="field"><label>Motto</label><input name="motto" defaultValue={settings?.motto || 'Love, Care & Discipline'} required /></div>
          <div className="field"><label>Academic year</label><input name="academicYear" defaultValue={settings?.academicYear || '2026/2027'} required /></div>
          <div className="field"><label>Logo URL</label><input name="logoUrl" defaultValue={settings?.logoUrl || ''} /></div>
          <div style={{ display: 'flex', alignItems: 'end' }}><button type="submit">Save settings</button></div>
        </form>
      </div>
    </div>
  );
}
