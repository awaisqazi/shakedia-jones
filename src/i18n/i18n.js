/** Client-side EN/ES toggle. Swaps textContent (or placeholder) of every [data-i18n]. */
// Every page owns its own dictionary in ./parts/<name>.en.json and <name>.es.json.
// Vite bundles them at build time so pages can be edited independently.
import { mergeDictionaries } from './merge.js';

const enParts = import.meta.glob('./parts/*.en.json', { eager: true, import: 'default' });
const esParts = import.meta.glob('./parts/*.es.json', { eager: true, import: 'default' });
const en = mergeDictionaries(enParts, { onDuplicate: (key, file) => console.warn(`[i18n] duplicate top-level key "${key}" in ${file}`) });
const es = mergeDictionaries(esParts, { onDuplicate: (key, file) => console.warn(`[i18n] duplicate top-level key "${key}" in ${file}`) });

const translations = { en, es };
const KEY = 'sj-lang';
const LANGS = ['en', 'es'];
const valid = (l) => (LANGS.includes(l) ? l : null);

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

// A string (including "") is applied; only a missing key keeps the HTML fallback.
// Some EN keys are intentionally empty (Spanish-only "Traduccion:" lines).
const isText = (v) => typeof v === 'string';

// ?lang=es on any URL wins (for Spanish flyers and shared links), then the saved choice.
export function getCurrentLang() {
  const q = valid(new URLSearchParams(location.search).get('lang'));
  if (q) return q;
  try { return valid(localStorage.getItem(KEY)) || 'en'; } catch { return 'en'; }
}

// fromUser: a toggle click. Drop ?lang= from the URL so the choice sticks on reload.
export function setLang(lang, { fromUser = false } = {}) {
  lang = valid(lang) || 'en';
  if (fromUser) {
    try {
      const u = new URL(location.href);
      if (u.searchParams.has('lang')) {
        u.searchParams.delete('lang');
        history.replaceState(history.state, '', u);
      }
    } catch { /* ignore */ }
  }
  try { localStorage.setItem(KEY, lang); } catch { /* private mode */ }
  applyTranslations(lang);
  document.documentElement.setAttribute('lang', lang);
  document.querySelectorAll('[data-lang-toggle]').forEach((btn) => {
    const on = btn.dataset.langToggle === lang;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', String(on));
  });
  document.dispatchEvent(new CustomEvent('sj:langchange', { detail: { lang } }));
}

// Original <title> and description, so switching back to EN restores them when
// the dictionary has no meta.<page> entry.
let baseMeta = null;
function applyMeta(t) {
  const desc = document.querySelector('meta[name="description"]');
  if (!baseMeta) baseMeta = { title: document.title, description: desc?.getAttribute('content') || '' };
  const page = document.body?.dataset.page;
  const m = page ? getNestedValue(t, `meta.${page}`) : undefined;
  const title = m && typeof m.title === 'string' && m.title ? m.title : baseMeta.title;
  const description = m && typeof m.description === 'string' && m.description ? m.description : baseMeta.description;
  document.title = title;
  if (desc) desc.setAttribute('content', description);
}

export function applyTranslations(lang) {
  const t = translations[lang] || translations.en;
  applyMeta(t);
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const value = getNestedValue(t, el.dataset.i18n);
    if (!isText(value)) return;
    if (el.tagName === 'INPUT' && el.type !== 'submit') el.placeholder = value;
    else if (el.tagName === 'TEXTAREA') el.placeholder = value;
    else el.textContent = value;
  });
  // Attribute translations: data-i18n-attr="aria-label:key;alt:key2"
  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(';').forEach((pair) => {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      if (!attr || !key) return;
      const value = getNestedValue(t, key);
      if (isText(value)) el.setAttribute(attr, value);
    });
  });
}

export function initI18n() {
  setLang(getCurrentLang());
  document.querySelectorAll('[data-lang-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => setLang(btn.dataset.langToggle, { fromUser: true }));
  });
}
