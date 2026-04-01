import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from "@astrojs/tailwind";
import mermaid from 'astro-mermaid';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// https://astro.build/config
export default defineConfig({
  site: 'https://nasu.uk',
  integrations: [mermaid(), mdx(), sitemap(), tailwind()],
  image: {
    domains: ["www.hanmoto.com", "assets.nasu.uk"]
  },
  markdown: {
    shikiConfig: {
      theme: "monokai",
    },
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});
