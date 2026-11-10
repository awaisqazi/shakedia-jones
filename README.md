# Shakedia Jones for the 1st Ward

Campaign website for **Shakedia Jones**, candidate for 1st Ward Alderman in Waukegan, Illinois. Primary election: **Tuesday, February 23, 2027** (the countdown target). General election: Tuesday, April 6, 2027.

Built with Astro and vanilla CSS. It has a client-side English/Spanish toggle and uses the same architecture as the Cassandra for Aurora site. Read [BRIEF.md](BRIEF.md) before writing copy: it holds the verified facts, voice, design tokens and i18n rules. 

## Run it

```sh
npm install
npm run dev        # http://localhost:4410/shakedia-jones/ (via .claude/launch.json) or 4321 by default
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

**The mark:** a purple tile with a gold star over a white "1" for the 1st Ward. Source of truth: `src/components/ui/Mark.astro` (variants: purple, deep, mono). Ready-made files in `public/brand/`:

| File | Use |
|---|---|
| `mark.svg` | Vector mark for print and video |
| `avatar-512.png` | Social profile picture |
| `lockups.png` | Horizontal and stacked lockups on cream, purple and dark purple |

`public/images/og-card.jpg` is the link preview (1200x630). Brand images are rendered from HTML with Playwright's headless shell.

## Before launch: open items

- **Office and ward.** The city's ward GIS puts the 300 block of George Ave in the 1st Ward. Confirm she is running for 1st Ward Alderman and that her voter registration is in Ward 1. The ward appears in `src/data/campaign.js` (`WARD`) and in copy across the i18n files.
- **Primary.** The site now treats the Tuesday, Feb 23, 2027 primary as the headline date (she asked voters for Feb 23 on video) and names April 6, 2027 as the general election. `DATES.primary` / `DATES.general` in `src/data/campaign.js`; `public/election-day.ics` is the Feb 23 primary.
- **Committee name** for "Paid for by" (`footer.paid_for` in `src/i18n/parts/shared.*.json`). No ISBE committee exists yet.
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

`.github/workflows/deploy.yml` builds and publishes `dist/` to GitHub Pages on every push to `main` (Pages source: GitHub Actions). The site is live at `https://awaisqazi.github.io/shakedia-jones/` from the `awaisqazi/shakedia-jones` repo. `npm run check` (build, translation audit, link check) runs in CI before every deploy, and a daily rebuild keeps the countdown current.

## i18n in one paragraph

Every visible string carries `data-i18n="page.key"`, and attributes use `data-i18n-attr="alt:page.key"`. Each page owns a dictionary pair in `src/i18n/parts/<page>.en.json` and `<page>.es.json`, merged at build time. The HTML text is the English fallback and the JSON wins at runtime. No child HTML goes inside a `data-i18n` element. Run `npm run i18n:check` after any copy change.
