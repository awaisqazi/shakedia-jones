// i18n audit against the built site (run after `astro build`; `npm run check` does both).
// Fails on:
//   1. a key used in dist (data-i18n or data-i18n-attr) that is missing, or not a string, in en or es
//   2. an empty or whitespace-only value (see ALLOW_EMPTY below)
//   3. a placeholder: [ ... ], TODO or TBD (see ALLOW_PLACEHOLDER below)
//   4. an HTML fallback (the text or attribute rendered at build time) that differs from en
//   5. the same top-level key defined in more than one part file of a language
// Reports (does not fail on): keys no page references.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, DIST, walk, requireDist, elements, textContent, norm } from './lib/dist.mjs';
import { mergeDictionaries } from '../src/i18n/merge.js';

// Intentionally empty values. Allowed only when the EN value is "" and the key matches:
//   footer.disclosure: no disclosure line until the committee exists
//   *_tr, tr_*, *.quote_tr: Spanish-only "Traduccion:" lines (empty in EN by design)
const ALLOW_EMPTY = [/^footer\.disclosure$/, /(^|\.)tr_[^.]*$/, /_tr$/, /\.quote_tr$/];
// Intentional placeholder until the committee is named.
const ALLOW_PLACEHOLDER = ['[Committee Name]'];
const PLACEHOLDER = /\[[^\]]*\]|TODO|TBD/g;

requireDist();
const partsDir = path.join(ROOT, 'src/i18n/parts');
const problems = [];
const fail = (kind, msg) => problems.push(`${kind}: ${msg}`);

function loadLang(suffix) {
  const parts = Object.fromEntries(fs.readdirSync(partsDir).filter((f) => f.endsWith(suffix)).sort()
    .map((f) => [f, JSON.parse(fs.readFileSync(path.join(partsDir, f), 'utf8'))]));
  return mergeDictionaries(parts, {
    onDuplicate: (key, file, first) => fail('duplicate top-level key', `"${key}" in ${file} (already in ${first})`),
  });
}
const flat = (o, p = '') => Object.entries(o).reduce((a, [k, v]) => {
  const K = p ? `${p}.${k}` : k;
  return v && typeof v === 'object' && !Array.isArray(v) ? Object.assign(a, flat(v, K)) : ((a[K] = v), a);
}, {});
const get = (obj, key) => key.split('.').reduce((a, k) => (a == null ? undefined : a[k]), obj);

const en = loadLang('.en.json');
const es = loadLang('.es.json');
const enFlat = flat(en);
const esFlat = flat(es);
const emptyAllowed = (key) => enFlat[key] === '' && ALLOW_EMPTY.some((re) => re.test(key));

// 2 and 3: every value in both languages.
for (const [lang, dict] of [['en', enFlat], ['es', esFlat]]) {
  for (const [key, v] of Object.entries(dict)) {
    if (typeof v !== 'string') continue;
    if (!v.trim() && !emptyAllowed(key)) fail(`empty value (${lang})`, key);
    const hits = (v.match(PLACEHOLDER) || []).filter((h) => !ALLOW_PLACEHOLDER.includes(h));
    if (hits.length) fail(`placeholder (${lang})`, `${key}: ${hits.join(', ')}`);
  }
}

// 1 and 4: walk the built pages.
const used = new Set();
const seen = new Set();
const once = (id, kind, msg) => { if (!seen.has(id)) { seen.add(id); fail(kind, msg); } };
for (const file of walk(DIST).filter((f) => f.endsWith('.html'))) {
  const rel = path.relative(DIST, file);
  for (const el of elements(fs.readFileSync(file, 'utf8'))) {
    const key = el.attrs['data-i18n'];
    if (key !== undefined) {
      used.add(key);
      const v = get(en, key);
      if (typeof v === 'string' && !emptyAllowed(key)) {
        const isField = el.tag === 'textarea' || (el.tag === 'input' && el.attrs.type !== 'submit');
        const fallback = isField ? (el.attrs.placeholder ?? '') : textContent(el.inner ?? '');
        if (norm(fallback) !== norm(v)) once(`${key}|${norm(fallback)}`, 'fallback differs from en', `${rel} [${key}]\n      html: ${norm(fallback)}\n      en  : ${norm(v)}`);
      }
    }
    const spec = el.attrs['data-i18n-attr'];
    if (spec) {
      for (const pair of spec.split(';')) {
        const [attr, k] = pair.split(':').map((s) => s.trim());
        if (!attr || !k) continue;
        used.add(k);
        const v = get(en, k);
        if (typeof v === 'string' && !emptyAllowed(k)) {
          const cur = el.attrs[attr.toLowerCase()];
          if (cur === undefined || norm(cur) !== norm(v)) once(`${k}|${attr}|${cur}`, 'fallback differs from en', `${rel} ${attr} [${k}]\n      html: ${cur === undefined ? '(attribute absent)' : norm(cur)}\n      en  : ${norm(v)}`);
        }
      }
    }
  }
}
for (const key of [...used].sort()) {
  for (const [lang, dict] of [['en', en], ['es', es]]) {
    const v = get(dict, key);
    if (v === undefined) fail(`missing in ${lang}`, key);
    else if (typeof v !== 'string') fail(`not a string in ${lang}`, key);
  }
}

// Advisory: keys in en/es that no built page references (dynamic or JS-only keys show up here too).
const unused = Object.keys(enFlat).filter((k) => !used.has(k) && !k.startsWith('meta.'));
const esOnly = Object.keys(esFlat).filter((k) => !(k in enFlat));
const enOnly = Object.keys(enFlat).filter((k) => !(k in esFlat));

console.log(`i18n audit: en ${Object.keys(enFlat).length} keys, es ${Object.keys(esFlat).length} keys, ${used.size} referenced in dist`);
if (enOnly.length) console.log(`  note: ${enOnly.length} en keys have no es value (not referenced in dist, so not failing): ${enOnly.join(', ')}`);
if (esOnly.length) console.log(`  note: ${esOnly.length} es keys have no en value: ${esOnly.join(', ')}`);
if (unused.length) console.log(`  note: ${unused.length} keys are not referenced by any built page (may be used dynamically from JS)`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log('  OK');
