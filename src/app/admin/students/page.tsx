html, body {
  margin: 0;
  padding: 0;
  min-height: 100%;
  font-family: Arial, sans-serif;
  background: #f3f7fb;
  color: #0f172a;
}

* { box-sizing: border-box; }
a { color: inherit; text-decoration: none; }
button, input, select, textarea { font: inherit; }

:root {
  --bg: #f3f7fb;
  --panel: #fff;
  --panel-2: #edf3ff;
  --text: #0f172a;
  --muted: #5b6474;
  --primary: #0f766e;
  --danger: #dc2626;
  --success: #16a34a;
  --border: #dfe7f3;
  --shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
}

body.dark {
  --bg: #08111e;
  --panel: #111827;
  --panel-2: #14253b;
  --text: #e2e8f0;
  --muted: #9aa9bc;
  --primary: #34d399;
  --danger: #f87171;
  --success: #4ade80;
  --border: #233148;
  --shadow: 0 12px 30px rgba(2, 6, 23, 0.52);
}

body {
  background: var(--bg);
  color: var(--text);
}

.page-shell, .app-shell {
  min-height: 100vh;
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: var(--shadow);
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 14px 0 18px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 18px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
}

.brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--primary), #0ea5e9);
  color: white;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

button, .btn, input, select, textarea {
  border-radius: 10px;
}

button, .btn {
  background: var(--primary);
  color: white;
  padding: 10px 15px;
  border: none;
  cursor: pointer;
  font-weight: 700;
}

button.secondary, .btn.secondary {
  background: #e2e8f0; color: #0f172a;
}

button.danger, .btn.danger { background: var(--danger); }
button.success, .btn.success { background: var(--success); color: #092b1d; }

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label { font-weight: 600; color: var(--muted); }

input, select, textarea {
  width: 100%;
  background: var(--panel-2);
  color: var(--text);
  border: 1px solid var(--border);
  padding: 10px 12px;
}

.auth-box {
  max-width: 560px;
  margin: 60px auto 0;
  padding: 28px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 18px;
  margin: 18px 0;
}

.stat-card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 18px;
}

.stat-label { color: var(--muted); font-size: 0.8rem; }
.stat-value { font-size: 2rem; font-weight: 800; margin-top: 6px; }

.table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
}

.table th, .table td {
  padding: 12px 10px;
  border-bottom: 1px solid var(--border);
  text-align: left;
}

.table th { background: var(--panel-2); }

.badge {
  display: inline-flex;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.72rem;
  font-weight: 700;
}
.badge.draft { background: #fef3c7; color: #92400e; }
.badge.marks_submitted { background: #dbeafe; color: #1d4ed8; }
.badge.finalized { background: #dcfce7; color: #166534; }

.avatar { width: 42px; height: 42px; object-fit: cover; border-radius: 50%; }

@media (max-width: 768px) {
  .topbar { flex-direction: column; align-items: flex-start; }
  .page-shell, .app-shell { padding: 12px; }
}
