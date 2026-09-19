import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { searchEntities } from '@/lib/actions';

export default async function SearchPage({ searchParams }: { searchParams?: { q?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const q = searchParams?.q || '';
  const results = q ? await searchEntities(q) : { students: [], teachers: [], subjects: [], mocks: [] };

  return (
    <div className="app-shell">
      <div className="topbar no-print">
        <div className="brand"><div className="brand-mark">P</div><span>Paradise Hills School</span></div>
        <div className="row"><a href="/dashboard">Dashboard</a></div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h2>Global search</h2>
        <form method="get" action="/search" className="row" style={{ marginBottom: 20 }}>
          <input name="q" defaultValue={q} placeholder="Search by name, PHS index, subject or mock" style={{ maxWidth: 500 }} />
          <button type="submit">Search</button>
        </form>

        <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
          <div><h3>Students</h3><ul>{results.students.length ? results.students.map((s) => <li key={s.id}>{s.fullName} · {s.phsIndex}</li>) : <li>No matches</li>}</ul></div>
          <div><h3>Teachers</h3><ul>{results.teachers.length ? results.teachers.map((t) => <li key={t.id}>{t.fullName} · {t.email}</li>) : <li>No matches</li>}</ul></div>
          <div><h3>Subjects</h3><ul>{results.subjects.length ? results.subjects.map((s) => <li key={s.id}>{s.name} · {s.code}</li>) : <li>No matches</li>}</ul></div>
          <div><h3>Mocks</h3><ul>{results.mocks.length ? results.mocks.map((m) => <li key={m.id}>{m.name} · {m.academicYear}</li>) : <li>No matches</li>}</ul></div>
        </div>
      </div>
    </div>
  );
}
