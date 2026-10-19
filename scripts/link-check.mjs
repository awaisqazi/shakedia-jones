// Internal link check against the built site (run after `astro build`).
// Every internal href / src / srcset / poster in dist HTML, url() in built CSS, and icon
// in site.webmanifest must resolve to a file in dist, respecting the base path and
// trailing slashes. A #fragment on a link to an HTML page must match an id (or name)
// on that page. Absolute URLs on the site's own origin (canonical, og:image) are checked too.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, DIST, walk, requireDist, elements } from './lib/dist.mjs';

requireDist();
const config = fs.readFileSync(path.join(ROOT, 'astro.config.mjs'), 'utf8');
const SITE = (config.match(/site:\s*['"]([^'"]+)['"]/) || [])[1] || '';
const BASE = '/' + ((config.match(/base:\s*['"]([^'"]*)['"]/) || [])[1] || '').replace(/^\/+|\/+$/g, '');
const basePrefix = BASE === '/' ? '/' : BASE + '/';
const ORIGIN = SITE ? new URL(SITE).origin : null;

const problems = [];
const idCache = new Map();
const idsOf = (file) => {
  if (!idCache.has(file)) {
    const ids = new Set();
    for (const el of elements(fs.readFileSync(file, 'utf8'))) {
      if (el.attrs.id) ids.add(el.attrs.id);
      if (el.tag === 'a' && el.attrs.name) ids.add(el.attrs.name);
    }
    idCache.set(file, ids);
  }
  return idCache.get(file);
};

// Map a URL path (already absolute, under the site) to a dist file, or null.
function resolve(urlPath) {
  if (urlPath === BASE) urlPath = basePrefix; // "/shakedia-jones" -> its index
  if (!urlPath.startsWith(basePrefix)) return { error: `outside base ${basePrefix}` };
  let rel = decodeURIComponent(urlPath.slice(basePrefix.length));
  const candidates = rel === '' || rel.endsWith('/')
    ? [path.join(rel, 'index.html')]
    : [rel, `${rel}.html`, path.join(rel, 'index.html')];
  for (const c of candidates) {
    const f = path.join(DIST, c);
    if (fs.existsSync(f) && fs.statSync(f).isFile()) {
      const note = rel && !rel.endsWith('/') && !path.extname(rel) && c.endsWith('index.html') ? 'no trailing slash (trailingSlash is "always")' : null;
      return { file: f, note };
    }
  }
  return { error: 'no such file in dist' };
}

let checked = 0;
function check(raw, from, baseUrl) {
  const ref = raw.trim();
  if (!ref || /^(mailto:|tel:|sms:|data:|javascript:|blob:)/i.test(ref)) return;
  let u;
  try { u = new URL(ref, baseUrl); } catch { problems.push(`${from}: unparseable URL "${ref}"`); return; }
  if (!/^https?:$/.test(u.protocol) || u.origin !== ORIGIN) return; // external
  checked++;
  const r = resolve(u.pathname);
  if (r.error) { problems.push(`${from}: ${ref} (${r.error})`); return; }
  if (r.note) problems.push(`${from}: ${ref} (${r.note})`);
  const frag = decodeURIComponent(u.hash.slice(1));
  if (frag && r.file.endsWith('.html') && !idsOf(r.file).has(frag)) problems.push(`${from}: ${ref} (no element with id="${frag}")`);
}

const pageUrl = (file) => {
  const rel = path.relative(DIST, file).split(path.sep).join('/');
  const p = rel.endsWith('index.html') ? rel.slice(0, -'index.html'.length) : rel;
  return `${ORIGIN}${basePrefix}${p}`;
};

for (const file of walk(DIST)) {
  const rel = path.relative(DIST, file);
  if (file.endsWith('.html')) {
    const from = pageUrl(file);
    for (const el of elements(fs.readFileSync(file, 'utf8'))) {
      for (const a of ['href', 'src', 'poster', 'action']) if (el.attrs[a] !== undefined) check(el.attrs[a], rel, from);
      for (const a of ['srcset', 'imagesrcset']) {
        if (el.attrs[a]) el.attrs[a].split(',').map((s) => s.trim().split(/\s+/)[0]).filter(Boolean).forEach((s) => check(s, rel, from));
      }
      if (el.tag === 'meta' && /^(og:(url|image)|twitter:image)$/.test(el.attrs.property || el.attrs.name || '')) check(el.attrs.content || '', rel, from);
    }
    // url() inside inline <style> blocks (Fonts API output).
    const html = fs.readFileSync(file, 'utf8');
    for (const s of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
      for (const m of s[1].matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) check(m[1], `${rel} <style>`, from);
    }
  } else if (file.endsWith('.css')) {
    const from = `${ORIGIN}${basePrefix}${rel.split(path.sep).join('/')}`;
    for (const m of fs.readFileSync(file, 'utf8').matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) check(m[1], rel, from);
  } else if (file.endsWith('.webmanifest')) {
    const from = `${ORIGIN}${basePrefix}${rel}`;
    const man = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const i of man.icons || []) check(i.src, rel, from);
    if (man.start_url) check(man.start_url, rel, from);
  }
}

console.log(`link check: ${checked} internal references checked (base ${basePrefix})`);
if (problems.length) {
  const uniq = [...new Set(problems)];
  console.error(`\n${uniq.length} problem(s):`);
  for (const p of uniq) console.error('  - ' + p);
  process.exit(1);
}
console.log('  OK');
