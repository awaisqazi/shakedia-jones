// Deep-merge dictionary parts ({ fileName: object }). Used by the runtime (i18n.js)
// and by scripts/i18n-audit.mjs, so both see the same merged dictionary.
// Each top-level key should live in exactly one part file; a repeat is reported via
// onDuplicate(key, fileName) and then deep-merged rather than silently overwritten.
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function deepMerge(target, source) {
  for (const [k, v] of Object.entries(source)) {
    if (isObj(v) && isObj(target[k])) deepMerge(target[k], v);
    else if (isObj(v)) target[k] = deepMerge({}, v);
    else target[k] = v;
  }
  return target;
}

export function mergeDictionaries(parts, { onDuplicate } = {}) {
  const out = {};
  const owner = {};
  for (const [file, part] of Object.entries(parts)) {
    if (!isObj(part)) continue;
    for (const key of Object.keys(part)) {
      if (key in owner && onDuplicate) onDuplicate(key, file, owner[key]);
      else owner[key] = file;
    }
    deepMerge(out, part);
  }
  return out;
}
