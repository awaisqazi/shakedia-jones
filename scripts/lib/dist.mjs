// Small helpers shared by the dist audits (no dependencies, works on any OS).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DIST = path.join(ROOT, 'dist');

export function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}

export function requireDist() {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('dist/ is missing. Run `npm run build` first (or `npm run check`).');
    process.exit(2);
  }
}

const NAMED = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: '\u00a0', rsquo: '\u2019', lsquo: '\u2018', ldquo: '\u201c', rdquo: '\u201d', hellip: '\u2026', ndash: '\u2013', mdash: '\u2014' };
export const decode = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&([a-z]+);/gi, (m, n) => NAMED[n.toLowerCase()] ?? m);

export const norm = (s) => decode(String(s)).replace(/\s+/g, ' ').trim();

// Parse the attributes of one start tag body (`<a href="x" data-y>` -> {href:'x','data-y':''}).
export function attrs(tagBody) {
  const out = {};
  for (const m of tagBody.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    out[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return out;
}

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

// Every start tag in the document, with its attributes and (for non-void tags) the
// inner HTML up to the matching close tag. Script and style bodies are skipped.
export function elements(html) {
  const clean = html.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(<(script|style)\b[^>]*>)[\s\S]*?(<\/\2>)/gi, '$1$3');
  const out = [];
  const re = /<([a-zA-Z][\w-]*)(\s[^>]*)?>/g;
  let m;
  while ((m = re.exec(clean))) {
    const tag = m[1].toLowerCase();
    const el = { tag, attrs: attrs(m[2] || ''), inner: null };
    if (!VOID.has(tag) && !/\/\s*$/.test(m[2] || '')) {
      // Find the matching close tag, counting nested tags of the same name.
      const tagRe = new RegExp(`<(/?)${tag}(?=[\\s>/])[^>]*>`, 'gi');
      tagRe.lastIndex = re.lastIndex;
      let depth = 1, t;
      while (depth && (t = tagRe.exec(clean))) depth += t[1] ? -1 : 1;
      if (!depth) el.inner = clean.slice(re.lastIndex, t.index);
    }
    out.push(el);
  }
  return out;
}

export const textContent = (innerHtml) => innerHtml.replace(/<[^>]*>/g, '');
