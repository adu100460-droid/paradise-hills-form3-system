import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { createFirstAdmin } from '@/lib/actions';

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/dashboard');

  const userCount = await prisma.user.count();

  return (
    <div className="page-shell">
      <div className="wrapper">
        <div className="card auth-box">
          <div className="brand" style={{ marginBottom: 20 }}>
            <div className="brand-mark">P</div>
            <span>Paradise Hills School</span>
          </div>

          {userCount === 0 ? (
            <>
              <h2>Create first administrator</h2>
              <p style={{ color: 'var(--muted)', marginBottom: 20 }}>
                Set up the initial system administrator.
              </p>
              <form action={async (formData: FormData) => {
                'use server';
                const name = (formData.get('name') || '').toString();
                const email = (formData.get('email') || '').toString();
                const password = (formData.get('password') || '').toString();
                await createFirstAdmin({ name, email, password });
              }} className="form-grid">
                <div className="field">
                  <label>Admin name</label>
                  <input name="name" required />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input type="email" name="email" required />
                </div>
                <div className="field">
                  <label>Password</label>
                  <input type="password" name="password" required minLength={8} />
                </div>
                <button type="submit">Create administrator</button>
              </form>
            </>
          ) : (
            <>
              <h2>Login</h2>
              <p style={{ color: 'var(--muted)', marginBottom: 20 }}>
                Sign in with your school email and password.
              </p>
              <form action="/api/auth/callback/credentials" method="post" className="form-grid">
                <div className="field">
                  <label>Email</label>
                  <input type="email" name="email" required />
                </div>
                <div className="field">
                  <label>Password</label>
                  <input type="password" name="password" required />
                </div>
                <button type="submit">Login</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
