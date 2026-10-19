// Shared motion: scroll reveal for .animate-in, day countdowns, stat count-ups.
// Nothing touches the DOM or browser APIs at import time, so a failure here can
// never take i18n down with it (Layout wraps each init in its own try/catch).
const prefersReduced = () => {
  try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

// Today's date (YYYY-MM-DD) in Waukegan, whatever the visitor's or CI's time zone.
export function chicagoToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function daysUntil(iso, now = new Date()) {
  const [y, m, d] = String(iso).split('-').map(Number);
  const [a, b, c] = chicagoToday(now).split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(a, b - 1, c)) / 86400000);
}

export const clockState = (days) => (days > 0 ? 'future' : days === 0 ? 'today' : 'past');

// Reveal everything at once (no observer, or something threw).
export function revealAll() {
  document.querySelectorAll('.animate-in').forEach((el) => el.classList.add('visible'));
}

// RaceClock: <div class="race-clock" data-clock-state>. 0 days = Election Day
// (state "today", the label can key off it); past = the clock is hidden.
function initCountdowns() {
  document.querySelectorAll('[data-days-until]').forEach((el) => {
    const days = daysUntil(el.dataset.daysUntil);
    const state = clockState(days);
    const wrap = el.closest('.race-clock') || el;
    wrap.setAttribute('data-clock-state', state);
    wrap.querySelectorAll('[data-clock-label]').forEach((l) => l.setAttribute('data-clock-state', state));
    if (state === 'past') { wrap.hidden = true; return; }
    wrap.hidden = false;
    el.textContent = String(days);
  });
}

// <span data-count-to="600" data-count-suffix="+">600+</span>: the markup holds the
// final value, so no-JS and reduced-motion readers always see the real number.
function initCountUps() {
  const els = document.querySelectorAll('[data-count-to]');
  if (!els.length || prefersReduced() || !('IntersectionObserver' in window)) return;
  const fmt = new Intl.NumberFormat('en-US');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      const el = entry.target;
      const to = Number(el.dataset.countTo);
      const suffix = el.dataset.countSuffix || '';
      const prefix = el.dataset.countPrefix || '';
      const final = el.textContent;
      const t0 = performance.now();
      const dur = 1400;
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = p < 1 ? prefix + fmt.format(Math.round(to * eased)) + suffix : final;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  els.forEach((el) => io.observe(el));
}

// Synchronous safety net: anything already in the viewport is revealed at once.
// Some browsers (and device emulation) delay the observer's first callback
// until a scroll, which would leave the hero blank.
function revealInView() {
  const vh = window.innerHeight;
  document.querySelectorAll('.animate-in:not(.visible)').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < vh && r.bottom > 0) el.classList.add('visible');
  });
}

export function initMotion() {
  // Countdowns first: they must update even if the reveal setup fails.
  try { initCountdowns(); } catch (e) { console.error(e); }
  if (!('IntersectionObserver' in window)) { revealAll(); return; }
  const reveal = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); reveal.unobserve(entry.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.animate-in').forEach((el) => reveal.observe(el));
  revealInView();
  window.addEventListener('load', revealInView, { once: true });
  window.addEventListener('pageshow', revealInView);
  setTimeout(revealInView, 600);
  try { initCountUps(); } catch (e) { console.error(e); }
}
