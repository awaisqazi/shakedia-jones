# Shakedia Jones for the 1st Ward

Campaign website for **Shakedia Jones**, candidate for 1st Ward Alderman in Waukegan, Illinois. Primary election: **Tuesday, February 23, 2027** (the countdown target). General election: Tuesday, April 6, 2027.

Built with Astro and vanilla CSS. It has a client-side English/Spanish toggle and uses the same architecture as the Cassandra for Aurora site. Read [BRIEF.md](BRIEF.md) before writing copy: it holds the verified facts, voice, design tokens and i18n rules. 

## Run it

```sh
npm install
npm run dev        # http://localhost:4410/ (via .claude/launch.json) or 4321 by default
npm run build      # static output in dist/
npm run check      # build + EN/ES audit + internal link check (what CI runs)
npm run check:types
```

## Pages

| Route | What it is |
|---|---|
| `/` | Sunset hero with the campaign portrait, About Shakedia stats, the four priorities, the honorary street name, FLY, join band |
| `/meet/` | Full biography, honors, the street dedication, in the news |
| `/plan/` | 1st Ward Priorities: the campaign's four priorities with draft steps (for candidate approval), how she will work |
| `/join/` | Ways to help, sign-up (opens soon), donate block, voter info |
| `/links/` | Linktree page for social bios |

## The look: "Building a Stronger 1st Ward Together"

The site matches the campaign's own flyers, sign and banner (`public/images/campaign/`): royal purple (`#4a0375`) and dark purple fields, the campaign gold (`#fec60a`, on purple only), a sunset-sky gradient, and a sparing blazer green. Headlines use **Playfair Display** (heavy, mixed case), the slogan uses **Kaushan Script**, body text is **Barlow** and labels are **Barlow Condensed** in caps. Motifs: gold stars, the ribbon band ("For 1st Ward Alderman"), thin gold swooshes and hairlines, white cards with a gold top edge, round purple icon badges with a gold ring, and the values strip (Family, Opportunity, Safer Neighborhoods, Stronger Communities) above the footer. Tokens and utilities are documented at the top of `src/styles/global.css`.

### Logos and brand files

The logos were built in Canva (Personal workspace) and approved by the campaign's design lead. All lettering is outlined, so nothing depends on installed fonts. Canva designs:

- **"Shakedia Jones - Campaign Mark"**: the round seal (the small round "1st" header mark was made alongside it)
- **"Shakedia Jones - Favicon Glyph"**: the favicon (plain disc with a "1")
- **"Shakedia Jones - Wide Logo"**: the one-line, stacked and yard-sign logos, each in a light and a dark version

"Light" versions are for light backgrounds (all purple with gold accents); "dark" versions are for purple backgrounds (white "Shakedia", gold "Jones", gold band).

**Licensing note:** the laurel wreath in the seal is a free Canva library element ("corona circulo" by Oscar Atehortua). The seal can be used under Canva's content license, but because it contains a stock element it cannot be registered as a trademark. The wordmark logos contain no stock elements.

On the site: the header uses the "1st" mark with live, translated text (`src/components/ui/Wordmark.astro`, `Mark.astro`); the footer uses the one-line dark logo; `/links/` uses the stacked dark logo; the seal sits beside the closing "Let's build a stronger 1st Ward together" band on the home page and on the 404 page. Logos go on the page through `src/components/ui/Logo.astro` (`variant` wide | stacked | sign | seal, `tone` light | dark, `width`), which sets width/height from `src/data/brand-sizes.json` and translated alt text (`brand.logo_alt`, `brand.seal_alt` in `src/i18n/parts/shared.*.json`).

Files in `public/brand/` (SVGs are cleaned and optimized, with the viewBox cropped to the artwork plus about 2% padding, so they size by width; PNGs are transparent):

| File | Use |
|---|---|
| `logo-wide-light.svg` / `.png` | Main logo, one line ("Shakedia Jones" over the "For 1st Ward Alderman" band), for light backgrounds. PNG 2000 px wide |
| `logo-wide-dark.svg` / `.png` | The same for purple backgrounds (site footer) |
| `logo-stacked-light.svg` / `.png` | Stacked logo (Shakedia / big Jones, band tucked beside the J), light backgrounds. PNG 2000 px wide |
| `logo-stacked-dark.svg` / `.png` | The same for purple backgrounds (`/links/`, share card) |
| `logo-sign-light.svg` / `.png` | Yard-sign version: stacked with a full-width band, light backgrounds |
| `logo-sign-dark.svg` / `.png` | The same for purple backgrounds |
| `seal.svg` / `.png` | Round campaign seal. PNG 1000 px. Do not show it smaller than 120 px: the rim lettering stops reading |
| `avatar-512.png` | The seal at 512x512 with transparent corners: social profile picture and the web manifest's 512 icon |
| `mark.svg`, `mark-small.svg` | The round "1st" header mark (44 px and up) and its simplified small version |
| `lockups.png` | Brand sheet: header mark, one-line logo, stacked logo and seal on cream, purple and deep purple |

The Canva SVG exports these are made from live in `brand-src/` (not deployed). `public/favicon.svg`, `favicon-32x32.png` and `apple-touch-icon.png` are separate (Favicon Glyph design).

**Regenerating:** after a new Canva export, run

```sh
npm run brand -- --seal=/path/to/new-seal.svg   # copies it to brand-src/seal.svg, then rebuilds
npm run brand                                   # rebuild everything from brand-src/
```

Other sources swap the same way (`--wide-light`, `--wide-dark`, `--stacked-light`, `--stacked-dark`, `--sign-light`, `--sign-dark`). `scripts/brand-assets.mjs` strips Canva's redundant clip-paths (keeping each removal only if a render is unchanged), runs svgo, crops the viewBox, checks the result against the original export pixel by pixel (it stops with an error if they differ), and rewrites every SVG/PNG above plus `avatar-512.png`, `lockups.png` and `src/data/brand-sizes.json`. It uses svgo and sharp, which come with Astro. Then run `npm run check` and look at the footer, `/links/` and the home join band.

`public/images/og-card.jpg` is the link preview (1200x630): the campaign portrait, the stacked dark logo and the slogan. It is rendered from HTML with Playwright's headless shell (not by the script), so re-render it by hand if the stacked logo changes.

## Before launch: open items

- **Office and ward.** The city's ward GIS puts the 300 block of George Ave in the 1st Ward. Confirm she is running for 1st Ward Alderman and that her voter registration is in Ward 1. The ward appears in `src/data/campaign.js` (`WARD`) and in copy across the i18n files.
- **Primary.** The site now treats the Tuesday, Feb 23, 2027 primary as the headline date (she asked voters for Feb 23 on video) and names April 6, 2027 as the general election. `DATES.primary` / `DATES.general` in `src/data/campaign.js`; `public/election-day.ics` is the Feb 23 primary.
- **Committee name**: "Friends of Shakedia Jones" is now in "Paid for by" and the donation legal line. Confirm it matches the ISBE filing once registered.
- **Donate link.** Set `DONATE_URL` in `src/data/campaign.js`. Until then every Donate button goes to `/join/#donate`, which says online giving opens soon.
- **Campaign email and social accounts.** Set `EMAIL` and `SOCIALS` in `src/data/campaign.js`. Social icons stay hidden while empty.
- **Sign-up form.** Contact info was removed from the site at the campaign's request, so `/join/` shows an "online sign-up opens soon" card. Setting `EMAIL` in `src/data/campaign.js` turns on a form that opens a prefilled email; a real backend (Google Form, ActBlue, Supabase) is better.
- **Plan commitments** on `/plan/` are a draft. The candidate should approve every line.
- **The D60 job.** She is Waukegan Public Schools' Family and Community Engagement Manager. The site mentions it. Check conflict-of-interest and incompatibility rules for an alderperson who works for the school district.
- **Photos.** Ask for a recent solo portrait. The hero uses the July 2024 dedication photo. Do not use the Getty relay photo unless it is licensed.
- **Photo releases.** The FLY group photos include minors. Get signed parental releases (and permission from the adults shown) or replace them before launch.
- **Legal review.** Have counsel review the donation notice, the FLY and District 60 separation lines, and petition circulator rules.
- **Domain.** Set `site` and `base` in `astro.config.mjs` and add `public/CNAME` once a domain is registered.

## Deploy

`.github/workflows/deploy.yml` builds and publishes `dist/` to GitHub Pages on every push to `main` (Pages source: GitHub Actions). The site is live at `https://shakediafor1stward.com/` (custom domain via `public/CNAME`; DNS at Squarespace points to GitHub Pages) from the `awaisqazi/shakedia-jones` repo. `npm run check` (build, translation audit, link check) runs in CI before every deploy, and a daily rebuild keeps the countdown current.

## i18n in one paragraph

Every visible string carries `data-i18n="page.key"`, and attributes use `data-i18n-attr="alt:page.key"`. Each page owns a dictionary pair in `src/i18n/parts/<page>.en.json` and `<page>.es.json`, merged at build time. The HTML text is the English fallback and the JSON wins at runtime. No child HTML goes inside a `data-i18n` element. Run `npm run i18n:check` after any copy change.
