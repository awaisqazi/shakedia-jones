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
| `/join/` | Ways to help, volunteer sign-up form (`#signup`), host-a-yard-sign form (`#yard-sign`), donate block, voter info |
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
- **Sign-up forms.** Live: both post into the campaign's Google Forms (see "Sign-up forms" below). Contact info stays off the site at the campaign's request, so `EMAIL` stays empty.
- **Plan commitments** on `/plan/` are a draft. The candidate should approve every line.
- **The D60 job.** She is Waukegan Public Schools' Family and Community Engagement Manager. The site mentions it. Check conflict-of-interest and incompatibility rules for an alderperson who works for the school district.
- **Photos.** Ask for a recent solo portrait. The hero uses the July 2024 dedication photo. Do not use the Getty relay photo unless it is licensed.
- **Photo releases.** The FLY group photos include minors. Get signed parental releases (and permission from the adults shown) or replace them before launch.
- **Legal review.** Have counsel review the donation notice, the FLY and District 60 separation lines, and petition circulator rules.
- **Domain.** Set `site` and `base` in `astro.config.mjs` and add `public/CNAME` once a domain is registered.

## Sign-up forms

`/join/` has two native forms that submit straight into the campaign's two Google Forms: **Volunteer Sign-Up** (`src/components/join/SignupForm.astro`, `#signup`) and **Host a Yard Sign** (`src/components/join/YardSignForm.astro`, `#yard-sign`). Responses land in those Google Forms (and any linked Sheet) exactly as if they were filled in on Google.

- **Where the IDs live.** `FORMS` in `src/data/campaign.js` holds each form's public ID, its `formResponse` URL, every `entry.NNN` key and every option value. Components read from there; nothing is hard-coded in them. One shared script, `src/scripts/forms.js`, runs both forms.
- **Option values must match Google exactly** (capitals, spacing, `&`, the `Monday: 5pm - 8pm` format) and stay in English in both site languages. Only the visible labels are translated (`join.volunteer.*`, `join.yard.*`, `join.forms.*` in `src/i18n/parts/join.*.json`). If the campaign edits a question or an option in Google Forms, update the matching key or value in `src/data/campaign.js`, or answers to that question will silently stop arriving.
- **`emailAddress` is required.** Both Google Forms have Settings > Responses > **Collect email addresses: Responder input**, which adds a required built-in email field. Google rejects any submission without `emailAddress`. The volunteer form's Email input is named `emailAddress`. The yard-sign form asks for email once and the script sends it under both `emailAddress` and the form's own Email question (`entry.1045781291`); with JavaScript off, a second "Confirm your email" input appears (from `<noscript>`) so the plain POST still carries both. If the campaign switches that setting **off**, remove `emailAddress` (the `email` field in `FORMS`, and the volunteer Email input if they no longer want it). If they switch it to **Verified**, Google requires a signed-in Google account and anonymous submissions from the site stop working.
- **How it submits.** Each form is a real `<form method="POST" action=".../formResponse" target="_blank">` with inputs named `entry.NNN`, so it works without JavaScript (Google's confirmation opens in a new tab). With JavaScript, the script validates inline, then sends the same fields with `fetch(..., { mode: 'no-cors' })` and shows a thank-you panel in the card. A `no-cors` response is opaque: **the site cannot see if Google rejected a submission**, which is why the keys above must be exactly right. Each submission also sends `fvv=1` and `pageHistory=0`, as Google's own single-page form does (`FORM_STATIC_FIELDS`); per-load tokens such as `fbzx` are not sent. Spam friction: an unnamed honeypot input (never sent; if filled, the thank-you shows and nothing is sent) and submits within 2 seconds of page load are ignored.
- **After any change, test once for real**: submit each form on the live site and check the response appears in Google Forms (Responses tab).

**Re-reading the entry keys.** Open the form's public link `https://docs.google.com/forms/d/e/<PUBLIC_ID>/viewform` (no sign-in needed), view the page source and find `FB_PUBLIC_LOAD_DATA_`. It is JSON: `data[1][1]` is the list of questions. For each question, `[1]` is its title, `[3]` its type (0 short text, 1 paragraph, 2 multiple choice, 4 checkboxes), and `[4][0]` holds `[entryId, options, required]`: the input name is `entry.<entryId>`, each option's string is `options[i][0]` (an option flagged as "Other" has an empty string and is sent as `__other_option__` plus `entry.<entryId>.other_option_response`), and `required` is 1 for required questions. A quick script:

```sh
curl -sL "https://docs.google.com/forms/d/e/<PUBLIC_ID>/viewform" | node -e '
  let h="";process.stdin.on("data",d=>h+=d).on("end",()=>{
  const d=JSON.parse(h.match(/FB_PUBLIC_LOAD_DATA_ = (.*?);<\/script>/s)[1]);
  for(const q of d[1][1]) for(const s of q[4]||[]) console.log(`entry.${s[0]}`,s[2]?"required":"optional",JSON.stringify(q[1]),(s[1]||[]).map(o=>o[0]));})'
```

Do not test by POSTing to `formResponse` from a script: every POST is a real response in the campaign's form.

## Deploy

`.github/workflows/deploy.yml` builds and publishes `dist/` to GitHub Pages on every push to `main` (Pages source: GitHub Actions). The site is live at `https://shakediafor1stward.com/` (custom domain via `public/CNAME`; DNS at Squarespace points to GitHub Pages) from the `awaisqazi/shakedia-jones` repo. `npm run check` (build, translation audit, link check) runs in CI before every deploy, and a daily rebuild keeps the countdown current.

## i18n in one paragraph

Every visible string carries `data-i18n="page.key"`, and attributes use `data-i18n-attr="alt:page.key"`. Each page owns a dictionary pair in `src/i18n/parts/<page>.en.json` and `<page>.es.json`, merged at build time. The HTML text is the English fallback and the JSON wins at runtime. No child HTML goes inside a `data-i18n` element. Run `npm run i18n:check` after any copy change.
