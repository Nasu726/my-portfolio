import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 拡張子を除いたファイル名をIDとして使用（例: post1.md → post1）
function makeGenerateId() {
  return ({ entry }: { entry: string }) =>
    entry.replace(/\.(md|mdx)$/, '').replace(/\/index$/, '');
}

const blogCollection = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/blog',
    generateId: makeGenerateId(),
  }),
  schema: z.object({
    title:       z.string(),
    description: z.string(),
    pubDate:     z.coerce.date(),
    heroImage:   z.string().optional(),
    tags:        z.array(z.string()).default([]),
    draft:       z.boolean().default(false),
  }),
});

const worksCollection = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/works',
    generateId: makeGenerateId(),
  }),
  schema: z.object({
    title:       z.string(),
    description: z.string(),
    pubDate:     z.coerce.date(),
    projectUrl:  z.string().url(),
    badge:       z.string().optional(),
    heroImage:   z.string().optional(),
    tags:        z.array(z.string()).default([]),
    draft:       z.boolean().default(false),
  }),
});

export const collections = {
  blog: blogCollection,
  works: worksCollection,
};
