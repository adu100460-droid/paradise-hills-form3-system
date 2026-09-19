import { searchEntities } from '@/lib/actions';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TopNav } from '@/components/top-nav';
import { redirect } from 'next/navigation';

export default async function SearchPage({ searchParams }: { searchParams?: { q?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const q = searchParams?.q || '';
  const results = q ? await searchEntities(q) : { students: [], teachers: [], subjects: [], mocks: [] };

  return (
    <div className="app-shell">
      <TopNav role={(session.user as any).role || 'ADMIN'} />
      <div className="card" style={{ padding: 20 }}>
        <h2>Global search</h2>
        <form action="/search" method="get" className="row" style={{ marginBottom: 20 }}>
          <input name="q" defaultValue={q} placeholder="Search students, teachers, subjects and mocks" style={{ maxWidth: 500 }} />
          <button type="submit">Search</button>
        </form>

        <div className="grid">
          <div>
            <h3>Students</h3>
            <ul>
              {results.students.map((student) => <li key={student.id}>{student.fullName} · {student.phsIndex}</li>)}
            </ul>
          </div>
          <div>
            <h3>Teachers</h3>
            <ul>
              {results.teachers.map((teacher) => <li key={teacher.id}>{teacher.fullName} · {teacher.email}</li>)}
            </ul>
          </div>
          <div>
            <h3>Subjects</h3>
            <ul>
              {results.subjects.map((subject) => <li key={subject.id}>{subject.name} · {subject.code}</li>)}
            </ul>
          </div>
          <div>
            <h3>Mocks</h3>
            <ul>
              {results.mocks.map((mock) => <li key={mock.id}>{mock.name} · {mock.academicYear}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
