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
  // --font-display / --font-script / --font-body / --font-label design tokens in global.css.
  fonts: [
    {
      // The heavy mixed-case serif of the campaign's flyers and signs.
      provider: fontProviders.google(),
      name: 'Playfair Display',
      cssVariable: '--ff-display',
      weights: [700, 800, 900],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['Georgia', 'Times New Roman', 'serif'],
    },
    {
      // The slogan script ("Building a Stronger 1st Ward Together"). Slogan only.
      provider: fontProviders.google(),
      name: 'Kaushan Script',
      cssVariable: '--ff-script',
      weights: [400],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Brush Script MT', 'cursive'],
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
      weights: [500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Arial Narrow', 'sans-serif'],
    },
  ],
});
