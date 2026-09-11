#!/usr/bin/env node
// Regenerates public/index.html by scanning public/ for experiment folders.
// An "experiment" is any folder in public/ containing an index.html.
// Nothing here is clever on purpose — drop a folder in, push, it shows up.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const PUBLIC = path.join(__dirname, '..', 'public');

const pick = (html, re) => {
  const m = html.match(re);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
};

function lastTouched(dir) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', dir], {
      cwd: path.join(__dirname, '..'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (out) return out;
  } catch { /* not a git checkout yet, or folder never committed */ }
  return fs.statSync(dir).mtime.toISOString();
}

function collect() {
  if (!fs.existsSync(PUBLIC)) return [];
  return fs.readdirSync(PUBLIC, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith('.') && !e.name.startsWith('_'))
    .map(e => {
      const dir = path.join(PUBLIC, e.name);
      const entry = path.join(dir, 'index.html');
      if (!fs.existsSync(entry)) return null;
      const html = fs.readFileSync(entry, 'utf8');
      return {
        slug: e.name,
        title: pick(html, /<title[^>]*>([\s\S]*?)<\/title>/i) || e.name,
        blurb: pick(html, /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i) || '',
        updated: lastTouched(dir),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.updated.localeCompare(a.updated));
}

const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const fmt = iso => new Date(iso).toLocaleDateString('en-GB', {
  day: 'numeric', month: 'short', year: 'numeric',
});

function render(items) {
  const cards = items.length ? items.map(i => `      <a class="card" href="/${esc(i.slug)}/">
        <h2>${esc(i.title)}</h2>
        ${i.blurb ? `<p>${esc(i.blurb)}</p>` : ''}
        <footer><code>/${esc(i.slug)}</code><time datetime="${esc(i.updated)}">${esc(fmt(i.updated))}</time></footer>
      </a>`).join('\n')
    : `      <p class="empty">Nothing here yet. Add <code>public/&lt;name&gt;/index.html</code>, push, and it appears.</p>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>try.videoclaw — sandbox</title>
<meta name="description" content="Scratch space for videoclaw experiments. Nothing here is production.">
<style>
  :root{--bg:#faf8f4;--fg:#16161a;--mut:#6b6b73;--line:#e4e0d7;--card:#fff;--accent:#2b00ff}
  @media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#111114;--fg:#f2f0ec;--mut:#9a9aa4;--line:#2a2a31;--card:#191920;--accent:#8c78ff}}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 ui-sans-serif,-apple-system,"Segoe UI",Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  .wrap{max-width:760px;margin:0 auto;padding:56px 24px 80px}
  .tag{display:inline-block;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);border:1px solid currentColor;border-radius:999px;padding:3px 10px;margin-bottom:18px}
  h1{font-size:30px;line-height:1.2;margin:0 0 10px;letter-spacing:-.02em}
  .lede{color:var(--mut);margin:0 0 6px}
  .warn{color:var(--mut);font-size:14px;margin:0 0 40px;padding-top:14px;border-top:1px solid var(--line)}
  .grid{display:grid;gap:12px}
  .card{display:block;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px 20px;text-decoration:none;color:inherit;transition:border-color .15s,transform .15s}
  .card:hover{border-color:var(--accent);transform:translateY(-1px)}
  .card h2{margin:0 0 4px;font-size:17px;letter-spacing:-.01em}
  .card p{margin:0;color:var(--mut);font-size:14px}
  .card footer{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-top:12px;font-size:12px;color:var(--mut)}
  code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}
  .empty{color:var(--mut);border:1px dashed var(--line);border-radius:12px;padding:28px;text-align:center}
  footer.foot{margin-top:44px;padding-top:18px;border-top:1px solid var(--line);font-size:13px;color:var(--mut)}
  a.src{color:var(--accent)}
</style>
</head>
<body>
  <div class="wrap">
    <span class="tag">Sandbox</span>
    <h1>try.videoclaw</h1>
    <p class="lede">Scratch space for videoclaw experiments — ${items.length} ${items.length === 1 ? 'thing' : 'things'} parked here.</p>
    <p class="warn">Nothing on this domain is production. Things break, disappear, and get overwritten without notice. Production demos live on <strong>demo.videoclaw.com</strong>.</p>
    <div class="grid">
${cards}
    </div>
    <footer class="foot">Built from <a class="src" href="https://github.com/INFR-Organisation/try-videoclaw">INFR-Organisation/try-videoclaw</a> — add a folder under <code>public/</code>, push, done.</footer>
  </div>
</body>
</html>
`;
}

const items = collect();
fs.writeFileSync(path.join(PUBLIC, 'index.html'), render(items));
console.log(`built index with ${items.length} experiment(s):`);
for (const i of items) console.log(`  /${i.slug}  —  ${i.title}`);
