import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';

export function TopNav({ role }: { role: string }) {
  const links = {
    ADMIN: [
      ['Dashboard', '/dashboard'],
      ['Students', '/admin/students'],
      ['Teachers', '/admin/teachers'],
      ['Subjects', '/admin/subjects'],
      ['Mocks', '/admin/mocks'],
      ['Settings', '/admin/settings'],
      ['Search', '/search'],
      ['Notice Board', '/admin/notice-board'],
    ],
    TEACHER: [
      ['Dashboard', '/dashboard'],
      ['Marks', '/teacher/marks'],
      ['Search', '/search'],
    ],
    STUDENT: [
      ['Dashboard', '/dashboard'],
      ['Results', '/student/results'],
      ['Search', '/search'],
    ],
  } as Record<string, Array<[string, string]>>;

  return (
    <div className="topbar no-print">
      <div className="brand">
        <div className="brand-mark">P</div>
        <span>Paradise Hills School</span>
      </div>

      <nav className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
        {links[role]?.map(([label, href]) => (
          <Link key={href} href={href}>{label}</Link>
        ))}
        <ThemeToggle />
      </nav>
    </div>
  );
}
