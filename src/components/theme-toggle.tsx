'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('phs-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldDark = stored ? stored === 'dark' : prefersDark;

    setDark(shouldDark);
    document.body.classList.toggle('dark', shouldDark);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('phs-theme', next ? 'dark' : 'light');
    document.body.classList.toggle('dark', next);
  };

  return (
    <button type="button" className="secondary" onClick={toggleTheme}>
      {dark ? 'Light mode' : 'Dark mode'}
    </button>
  );
}
