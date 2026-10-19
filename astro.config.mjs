// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub Pages project site: https://awaisqazi.github.io/shakedia-jones/
// When a custom domain is registered: set site to it, base to '/', and add public/CNAME.
export default defineConfig({
  site: 'https://awaisqazi.github.io',
  base: '/shakedia-jones',
  trailingSlash: 'always',
  integrations: [
    sitemap({ filter: (page) => !/\/404\/?$/.test(page) }),
  ],
  // Self-hosted fonts (Astro Fonts API). The --ff-* variables are aliased to the
  // --font-display / --font-body / --font-label design tokens in global.css.
  fonts: [
    {
      // Google's metadata API now lists only the merged "Big Shoulders" family, so the
      // Google provider cannot resolve "Big Shoulders Display". Fontsource mirrors the
      // same Google files under the original name (the face the site was designed with).
      provider: fontProviders.fontsource(),
      name: 'Big Shoulders Display',
      cssVariable: '--ff-display',
      weights: [700, 800, 900],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Impact', 'Arial Narrow', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Barlow',
      cssVariable: '--ff-body',
      weights: [400, 500, 600, 700],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['system-ui', '-apple-system', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Barlow Condensed',
      cssVariable: '--ff-label',
      weights: [600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Arial Narrow', 'sans-serif'],
    },
  ],
});
