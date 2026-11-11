// Regenerates every derived brand asset in public/brand/ from the Canva SVG exports in brand-src/.
//
//   npm run brand                                   # rebuild everything from brand-src/
//   npm run brand -- --seal=~/Downloads/seal-v3.svg # copy a new seal export into brand-src/ first
//
// Any source can be swapped the same way: --seal, --wide-light, --wide-dark, --stacked-light,
// --stacked-dark, --sign-light, --sign-dark (each copies the file to brand-src/<name>.svg).
//
// Per logo it:
//   1. strips Canva's redundant clip-paths: each clip is removed only if a raster of the result
//      matches the original export (clips that really shape something, like the seal's discs, stay);
//   2. runs svgo (dimensions removed, viewBox kept);
//   3. crops the 2000x1000 page to the artwork plus ~2% padding (the seal keeps its square 750 box);
//   4. checks the final SVG against the original export pixel by pixel and fails loudly if they differ;
//   5. writes <name>.svg and a transparent <name>.png (2000 px wide; the seal 1000 px).
// Then it writes avatar-512.png (the seal at 512x512) and lockups.png (brand sheet).
// SVGs are rasterized with librsvg via sharp. svgo and sharp ship with Astro (no extra install).
import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import { optimize } from 'svgo';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'brand-src');
const OUT = path.join(root, 'public/brand');

const LOGOS = [
  { name: 'seal', flag: 'seal', png: 1000, crop: false },
  { name: 'logo-wide-light', flag: 'wide-light', png: 2000, crop: true },
  { name: 'logo-wide-dark', flag: 'wide-dark', png: 2000, crop: true },
  { name: 'logo-stacked-light', flag: 'stacked-light', png: 2000, crop: true },
  { name: 'logo-stacked-dark', flag: 'stacked-dark', png: 2000, crop: true },
  { name: 'logo-sign-light', flag: 'sign-light', png: 2000, crop: true },
  { name: 'logo-sign-dark', flag: 'sign-dark', png: 2000, crop: true },
];

// ---- CLI: --seal=path etc. copy a new export into brand-src/ ----
for (const arg of process.argv.slice(2)) {
  const m = arg.match(/^--([a-z-]+)=(.+)$/);
  const logo = m && LOGOS.find((l) => l.flag === m[1]);
  if (!logo) { console.error(`Unknown argument: ${arg}`); process.exit(1); }
  const from = path.resolve(m[2].replace(/^~(?=\/)/, os.homedir()));
  const to = path.join(SRC, `${logo.name}.svg`);
  if (from === to) continue;
  await copyFile(from, to);
  console.log(`copied ${from} -> brand-src/${logo.name}.svg`);
}

// ---- helpers ----
const viewBoxOf = (svg) => svg.match(/viewBox="([^"]+)"/)[1].trim().split(/[\s,]+/).map(Number);

// Rasterize an SVG string so that one viewBox unit = `scale` px. Returns raw RGBA.
async function raster(svg, scale) {
  const [, , w, h] = viewBoxOf(svg);
  // librsvg sizes by width/height when present, else by viewBox; force both so the scale is exact
  const sized = svg.replace(/<svg\b([^>]*)>/, (_, attrs) =>
    `<svg${attrs.replace(/\s(width|height)="[^"]*"/g, '')} width="${w}" height="${h}">`);
  const { data, info } = await sharp(Buffer.from(sized), { density: 72 * scale })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

// Compare two rasters (b may be a window of a, offset by ox/oy).
// edge: pixels whose largest channel difference exceeds 16. Rounding a coordinate by a hair can
//   flip a row of anti-aliasing samples on an edge that sits exactly on the pixel grid, so a few
//   of these are expected and harmless.
// bad: pixels whose value falls outside the range (per channel, +-16) of the 3x3 neighbourhood
//   around their counterpart, i.e. a real change (missing or extra artwork), not a sub-pixel
//   edge shift (a shifted edge pixel always lies between its neighbours). Must be 0.
function diff(a, b, ox = 0, oy = 0) {
  let edge = 0, bad = 0, max = 0;
  const px = (img, x, y) => (y * img.width + x) * 4;
  // compare premultiplied colour: the RGB of a nearly transparent pixel is meaningless noise
  const val = (img, i, c) => (c === 3 ? img.data[i + 3] : (img.data[i + c] * img.data[i + 3]) / 255);
  for (let y = 0; y < b.height; y++) {
    for (let x = 0; x < b.width; x++) {
      const ib = px(b, x, y), ia = px(a, x + ox, y + oy);
      let d = 0;
      for (let c = 0; c < 4; c++) d = Math.max(d, Math.abs(val(a, ia, c) - val(b, ib, c)));
      if (d > max) max = Math.round(d);
      if (d <= 16) continue;
      edge++;
      for (let c = 0; c < 4; c++) {
        let lo = 255, hi = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const ax = x + ox + dx, ay = y + oy + dy;
          if (ax < 0 || ay < 0 || ax >= a.width || ay >= a.height) continue;
          const v = val(a, px(a, ax, ay), c);
          if (v < lo) lo = v;
          if (v > hi) hi = v;
        }
        const v = val(b, ib, c);
        if (v < lo - 16 || v > hi + 16) { bad++; break; }
      }
    }
  }
  return { edge, bad, max, share: edge / (b.width * b.height) };
}
const sameEnough = (d) => d.bad === 0 && d.share <= 0.0005;

// Bounding box of non-transparent pixels.
function alphaBox({ data, width, height }) {
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] > 2) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  return { x0, y0, x1: x1 + 1, y1: y1 + 1 };
}

const svgoConfig = {
  multipass: true,
  floatPrecision: 3,
  plugins: [
    'preset-default',
    'removeDimensions',
    'removeXlink',
    { name: 'removeAttrs', params: { attrs: ['zoomAndPan', 'version', 'preserveAspectRatio'] } },
  ],
};

// ---- 1-5: clean, optimize, crop, verify, write ----
await mkdir(OUT, { recursive: true });
const built = {};
for (const logo of LOGOS) {
  const source = await readFile(path.join(SRC, `${logo.name}.svg`), 'utf8');
  const [, , vw, vh] = viewBoxOf(source);
  // canonical page size: Canva writes 749.999995 for 750
  const page = { w: Math.round(vw), h: Math.round(vh) };
  let svg = source.replace(/viewBox="[^"]+"/, `viewBox="0 0 ${page.w} ${page.h}"`);
  const fullScale = logo.png / page.w;          // 1 unit = this many px in the shipped PNG
  const refTest = await raster(svg, fullScale);

  // 1. drop clip-paths one at a time, keeping each removal only if the render is unchanged
  const uses = [...svg.matchAll(/ clip-path="url\(#[^)]+\)"/g)].map((m) => m[0]);
  let removed = 0;
  for (const use of uses) {
    const trial = svg.replace(use, '');
    if (sameEnough(diff(refTest, await raster(trial, fullScale)))) { svg = trial; removed++; }
  }

  // 2. svgo
  svg = optimize(svg, svgoConfig).data;

  // 3. crop to the artwork + 2% padding, snapped to whole PNG pixels so the check below is exact
  const ref = await raster(source.replace(/viewBox="[^"]+"/, `viewBox="0 0 ${page.w} ${page.h}"`), fullScale);
  let box = { x: 0, y: 0, w: page.w, h: page.h };
  if (logo.crop) {
    const b = alphaBox(ref);
    const pad = Math.round(0.02 * (b.x1 - b.x0));
    const x0 = Math.max(0, b.x0 - pad), y0 = Math.max(0, b.y0 - pad);
    const x1 = Math.min(ref.width, b.x1 + pad), y1 = Math.min(ref.height, b.y1 + pad);
    const u = 1 / fullScale;
    const r = (n) => +(n * u).toFixed(4);
    box = { x: r(x0), y: r(y0), w: r(x1 - x0), h: r(y1 - y0) };
    box.px = { x0, y0 };
  }
  svg = svg.replace(/viewBox="[^"]+"/, `viewBox="${box.x} ${box.y} ${box.w} ${box.h}"`);

  // 4. verify against the original export at full PNG resolution
  const out = await raster(svg, fullScale);
  const d = diff(ref, out, box.px?.x0 ?? 0, box.px?.y0 ?? 0);
  if (!sameEnough(d)) {
    console.error(`${logo.name}: cleaned SVG differs from source (${d.bad} changed px, ${d.edge} edge px, max ${d.max})`);
    process.exit(1);
  }

  // 5. write
  await writeFile(path.join(OUT, `${logo.name}.svg`), svg);
  const png = await sharp(Buffer.from(svg), { density: 72 * (logo.png / box.w) })
    .png({ compressionLevel: 9, palette: true, quality: 100, effort: 10 }).toBuffer();
  await writeFile(path.join(OUT, `${logo.name}.png`), png);
  const meta = await sharp(png).metadata();
  built[logo.name] = { svg, w: box.w, h: box.h };
  console.log(`${logo.name.padEnd(19)} viewBox ${box.x} ${box.y} ${box.w} ${box.h}  ` +
    `clips removed ${removed}/${uses.length}  svg ${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB  ` +
    `png ${meta.width}x${meta.height} ${(png.length / 1024).toFixed(1)} KB  diff: ${d.bad} changed, ${d.edge} edge px`);
}

// Aspect ratios for src/components/ui/Logo.astro (explicit width/height on its <img>)
const sizes = Object.fromEntries(Object.entries(built).map(([n, b]) => [n, { w: b.w, h: b.h }]));
await writeFile(path.join(root, 'src/data/brand-sizes.json'), `${JSON.stringify(sizes, null, 2)}\n`);
console.log('src/data/brand-sizes.json');

// ---- avatar: the seal at 512x512, transparent corners ----
const sealSvg = Buffer.from(built.seal.svg);
await sharp(sealSvg, { density: 72 * (512 / built.seal.w) }).resize(512, 512)
  .png({ compressionLevel: 9, palette: true, quality: 100, effort: 10 }).toFile(path.join(OUT, 'avatar-512.png'));
console.log('avatar-512.png      512x512');

// ---- lockups.png: brand sheet, one panel per background ----
const W = 1600, PANEL = 400;
const panels = [
  { bg: '#fbf7ef', tone: 'light' },
  { bg: '#4a0375', tone: 'dark' },
  { bg: '#2b0747', tone: 'dark' },
];
const svgPng = (svg, width) => sharp(Buffer.isBuffer(svg) ? svg : Buffer.from(svg), { density: 72 * 4 })
  .resize({ width }).png().toBuffer();
const markSvg = await readFile(path.join(OUT, 'mark.svg'));
const layers = [];
for (const [i, p] of panels.entries()) {
  const top = i * PANEL;
  layers.push({ input: { create: { width: W, height: PANEL, channels: 4, background: p.bg } }, left: 0, top });
  // left to right: header mark, one-line logo, stacked logo, seal; vertically centred
  const items = [
    { buf: await svgPng(markSvg, 96), w: 96, h: 96 },
    { name: `logo-wide-${p.tone}`, w: 560 },
    { name: `logo-stacked-${p.tone}`, w: 300 },
    { buf: await svgPng(built.seal.svg, 250), w: 250, h: 250 },
  ];
  for (const it of items) {
    if (it.name) {
      const b = built[it.name];
      it.h = Math.round((it.w * b.h) / b.w);
      it.buf = await svgPng(b.svg, it.w);
    }
  }
  const gap = (W - items.reduce((s, it) => s + it.w, 0)) / (items.length + 1);
  let x = gap;
  for (const it of items) {
    layers.push({ input: it.buf, left: Math.round(x), top: top + Math.round((PANEL - it.h) / 2) });
    x += it.w + gap;
  }
}
await sharp({ create: { width: W, height: PANEL * panels.length, channels: 4, background: '#ffffff' } })
  .composite(layers).png({ compressionLevel: 9, palette: true, quality: 100, effort: 10 })
  .toFile(path.join(OUT, 'lockups.png'));
console.log(`lockups.png         ${W}x${PANEL * panels.length}`);
