import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Invalid email or password.');
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="form-grid">
      <div className="field">
        <label>Email</label>
        <input type="email" name="email" required />
      </div>
      <div className="field">
        <label>Password</label>
        <input type="password" name="password" required />
      </div>
      {error ? <p style={{ color: 'var(--danger)' }}>{error}</p> : null}
      <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
    </form>
  );
}
