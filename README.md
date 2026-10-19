# Shakedia Jones for the 1st Ward

Campaign website for **Shakedia Jones**, candidate for 1st Ward Alderperson in Waukegan, Illinois. Election Day: **Tuesday, April 6, 2027**.

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
| `/` | Hero ("She ran for Team USA. Now she's running for the 1st Ward."), record scoreboard, Olympic Way and the council quote, her story as a relay, four-lane plan teaser, FLY spotlight, join band |
| `/meet/` | Full biography, honors, the street dedication, in the news |
| `/plan/` | The Game Plan: four lanes with commitments (draft for candidate approval), how she'll work |
| `/join/` | Ways to help, sign-up (opens soon), donate block, voter info |
| `/links/` | Linktree page for social bios |

## The look: "Olympic Way"

Running-track red-orange, Team USA navy, medal gold, and FLY's teal. Headlines use Big Shoulders Display, the typeface designed for Chicago's city signage, with Barlow for text. Motifs: lane lines, numbered lane chips, a scoreboard countdown, a race bib numbered for the 1st Ward, and a drawn copy of her honorary street sign.

**The mark, "Lane 1":** the numeral 1 beside a track bend. It reads as the 1st Ward, lane one, and first place. Source of truth: `src/components/ui/Mark.astro` (variants: track, navy, mono). Ready-made files in `public/brand/`:

| File | Use |
|---|---|
| `mark.svg`, `mark-navy.svg` | Vector mark for print and video |
| `avatar-512.png`, `avatar-wordless-1000.png` | Social profile pictures |
| `yard-sign-24x16.png` | Yard sign concept at 24x16 proportions (replace the Paid-for line before printing) |
| `lockups.png` | Horizontal and stacked lockups on light, navy and red |

## Before launch: open items

- **Office and ward.** The city's ward GIS puts the 300 block of George Ave in the 1st Ward. Confirm she is running for 1st Ward Alderperson and that her voter registration is in Ward 1. The ward appears in `src/data/campaign.js` (`WARD`) and in copy across the i18n files.
- **Party and primary.** Filing as a Democrat (Oct 19-26, 2026) puts her in the Feb 23, 2027 primary if it is contested. Filing as an independent (Nov 16-23) goes straight to April 6. The site shows only April 6 until this is settled.
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
