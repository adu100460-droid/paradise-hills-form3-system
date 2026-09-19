"use client";
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const match = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const stored = localStorage.getItem('phs-theme');
    const shouldDark = stored ? stored === 'dark' : match;
    setDark(shouldDark);
    document.body.classList.toggle('dark', shouldDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('phs-theme', next ? 'dark' : 'light');
    document.body.classList.toggle('dark', next);
  };

  return (
    <button type="button" className="secondary" onClick={toggle}>
      {dark ? 'Light mode' : 'Dark mode'}
    </button>
  );
}
