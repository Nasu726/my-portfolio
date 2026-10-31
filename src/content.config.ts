import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/blog',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    // `updatedDate:` を空欄で書いた場合は、行が無いのと同じ扱い（未設定）にする。
    // そのまま coerce すると null が 1970-01-01 になってしまうため
    updatedDate: z.preprocess(
      (v) => (v === null || v === '' ? undefined : v),
      z.coerce.date().optional(),
    ),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const works = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/works',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    links: z
      .object({
        github: z.url().optional(),
        demo: z.url().optional(),
        article: z.url().optional(),
      })
      .optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, works };
