import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { remarkEmbed } from './src/lib/embed.ts';
import { rehypeExternalLinks, rehypeImageCaptions } from './src/lib/articleHtml.ts';

const site = 'https://nasu.uk';

export default defineConfig({
  site,
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    remarkPlugins: [remarkMath, [remarkEmbed, { site }]],
    rehypePlugins: [rehypeKatex, [rehypeExternalLinks, { site }], rehypeImageCaptions],
  },
});
