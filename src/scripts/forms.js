// Native sign-up forms that post into the campaign's Google Forms (/join/#signup, /join/#yard-sign).
// Progressive enhancement: each <form data-gform> is a real POST to Google's formResponse URL with
// inputs named entry.NNN, so without JavaScript it still submits (Google's confirmation opens in a
// new tab). With JavaScript this script validates inline, then sends the same fields with a no-cors
// fetch so the visitor stays on the page and sees the success panel in the card.
//
// Markup contract (see SignupForm.astro and YardSignForm.astro):
//   [data-form-card]       wraps the form, its success panel and the message strings
//   [data-field]           one question; data-msg = key of its "missing" message in [data-msgs],
//                          data-error = id of its (initially hidden) error paragraph
//   [data-group]           on a [data-field]: a checkbox group where at least one box is required
//   [data-required]        a text input that is required only while visible (the "Other" text)
//   [data-other]           the "Other" checkbox; value = id of the wrapper holding its text input
//   [data-mirror]          also send this input's value under the given name (yard sign email)
//   [data-honeypot]        unnamed decoy input: if filled, show success and send nothing
//   [data-select-all]      button (hidden without JS) that checks every box in the group with that id
//   [data-msgs] [data-msg] translated message strings (data-i18n), read when shown
// A response Google rejects is invisible to a no-cors fetch, so field names must match the form.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_MS = 2000; // submits sooner than this after page load are ignored (bots)

const controlsOf = (field) =>
  field.hasAttribute('data-group')
    ? [...field.querySelectorAll('input[type="checkbox"]')]
    : [...field.querySelectorAll('input:not([type="hidden"]), textarea')].slice(0, 1);

function setup(form) {
  if (form.dataset.ready) return;
  form.dataset.ready = '1';
  form.noValidate = true; // our messages replace the browser's bubbles (native validation stays for no-JS)

  const card = form.closest('[data-form-card]');
  const success = card.querySelector('[data-success]');
  const live = card.querySelector('[data-live]');
  const status = form.querySelector('[data-status]');
  const button = form.querySelector('button[type="submit"]');
  const label = button?.querySelector('[data-btn-label]');
  const fields = [...form.querySelectorAll('[data-field]')];
  const msg = (key) => card.querySelector(`[data-msgs] [data-msg="${key}"]`)?.textContent.trim() || '';
  let busy = false;

  // --- errors ---
  const errorEl = (field) => document.getElementById(field.dataset.error);
  function showError(field, key) {
    const err = errorEl(field);
    err.dataset.key = key;
    err.textContent = msg(key);
    err.hidden = false;
    field.classList.add('has-error');
    if (field.hasAttribute('data-group')) {
      field.setAttribute('aria-describedby', err.id);
    }
    controlsOf(field).forEach((c) => {
      c.setAttribute('aria-invalid', 'true');
      const ids = (c.getAttribute('aria-describedby') || '').split(' ').filter((id) => id && id !== err.id);
      c.setAttribute('aria-describedby', [...ids, err.id].join(' '));
    });
  }
  function clearError(field) {
    const err = errorEl(field);
    if (!err || err.hidden) return;
    err.hidden = true;
    err.textContent = '';
    delete err.dataset.key;
    field.classList.remove('has-error');
    field.removeAttribute('aria-describedby');
    controlsOf(field).forEach((c) => {
      c.removeAttribute('aria-invalid');
      const ids = (c.getAttribute('aria-describedby') || '').split(' ').filter((id) => id && id !== err.id);
      if (ids.length) c.setAttribute('aria-describedby', ids.join(' '));
      else c.removeAttribute('aria-describedby');
    });
  }
  function showStatus(key) {
    if (!status) return;
    status.dataset.key = key;
    status.textContent = msg(key);
    status.hidden = false;
  }
  function clearStatus() {
    if (!status) return;
    status.hidden = true;
    status.textContent = '';
    delete status.dataset.key;
  }

  // Returns the message key for a problem, or '' when the field is fine.
  function problem(field) {
    if (field.closest('[hidden]')) return '';
    if (field.hasAttribute('data-group')) {
      return controlsOf(field).some((c) => c.checked) ? '' : field.dataset.msg;
    }
    const input = controlsOf(field)[0];
    if (!input || input.disabled) return '';
    const value = input.value.trim();
    const required = input.required || input.hasAttribute('data-required');
    if (required && !value) return field.dataset.msg;
    if (value && input.type === 'email' && !EMAIL_RE.test(value)) return 'err_email_shape';
    return '';
  }
  const validate = (field) => {
    const key = problem(field);
    if (key) showError(field, key); else clearError(field);
    return !key;
  };

  // Re-check a field as soon as it is fixed (never nag while someone is still typing a fresh field).
  const recheck = (e) => {
    const field = e.target.closest?.('[data-field]');
    if (field && field.classList.contains('has-error')) validate(field);
  };
  form.addEventListener('input', recheck);
  form.addEventListener('change', recheck);

  // --- "Other" reveals its text input; while unchecked the input is disabled, so it is never sent ---
  const others = [...form.querySelectorAll('[data-other]')];
  const syncOther = (cb) => {
    const wrap = document.getElementById(cb.dataset.other);
    if (!wrap) return;
    const input = wrap.querySelector('input');
    wrap.hidden = !cb.checked;
    if (input) input.disabled = !cb.checked;
    if (!cb.checked) clearError(wrap);
  };
  others.forEach((cb) => {
    syncOther(cb);
    cb.addEventListener('change', () => {
      syncOther(cb);
      if (cb.checked) document.getElementById(cb.dataset.other)?.querySelector('input')?.focus();
    });
  });

  // --- "Select all weekday evenings" ---
  form.querySelectorAll('[data-select-all]').forEach((btn) => {
    const group = document.getElementById(btn.dataset.selectAll);
    if (!group) return;
    btn.hidden = false;
    btn.addEventListener('click', () => {
      group.querySelectorAll('input[type="checkbox"]').forEach((c) => { c.checked = true; });
      const field = group.closest('[data-field]');
      if (field?.classList.contains('has-error')) validate(field);
    });
  });

  // Translated messages follow a language switch.
  document.addEventListener('sj:langchange', () => {
    card.querySelectorAll('.fm-error[data-key], [data-status][data-key]').forEach((el) => { el.textContent = msg(el.dataset.key); });
    if (label && busy) label.textContent = msg('busy');
  });

  // --- the request body: exactly what a no-JS submit would post, trimmed, plus mirrors ---
  function body() {
    const out = new URLSearchParams();
    for (const [k, v] of new FormData(form)) {
      if (typeof v === 'string') out.append(k, v.trim());
    }
    form.querySelectorAll('[data-mirror]').forEach((input) => out.append(input.dataset.mirror, input.value.trim()));
    return out;
  }

  function setBusy(on) {
    busy = on;
    form.setAttribute('aria-busy', String(on));
    if (!button) return;
    button.classList.toggle('is-busy', on);
    button.setAttribute('aria-disabled', String(on));
    if (label) {
      if (on) { label.dataset.idle = label.textContent; label.textContent = msg('busy'); }
      else if (label.dataset.idle) { label.textContent = label.dataset.idle; delete label.dataset.idle; }
    }
  }

  function showSuccess() {
    form.hidden = true;
    success.hidden = false;
    const heading = success.querySelector('[data-success-title]');
    if (live && heading) live.textContent = heading.textContent;
    heading?.focus();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    if (performance.now() < MIN_MS) return;
    clearStatus();

    const bad = fields.filter((f) => !validate(f));
    if (bad.length) {
      showStatus('err_summary');
      controlsOf(bad[0])[0]?.focus();
      return;
    }

    const trap = form.querySelector('[data-honeypot]');
    if (trap && trap.value) { showSuccess(); return; }

    setBusy(true);
    try {
      // no-cors: the response is opaque, so a resolved fetch is the best success signal there is.
      await fetch(form.action, { method: 'POST', mode: 'no-cors', body: body() });
      setBusy(false);
      showSuccess();
    } catch {
      setBusy(false);
      showStatus('err_network');
      button?.focus();
    }
  });

  card.querySelector('[data-again]')?.addEventListener('click', () => {
    form.reset();
    fields.forEach(clearError);
    clearStatus();
    others.forEach(syncOther);
    if (live) live.textContent = '';
    success.hidden = true;
    form.hidden = false;
    controlsOf(fields[0])[0]?.focus();
  });
}

export function initForms() {
  document.querySelectorAll('form[data-gform]').forEach(setup);
}
