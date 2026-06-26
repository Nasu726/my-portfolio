/**
 * コンテンツコレクションのスキーマ定義ファイルです（Astro v5 形式）。
 *
 * ここで各コレクションのフロントマターのバリデーションルールを定義します。
 * 定義した型に違反する .md / .mdx ファイルがあると、ビルド時にエラーが出ます。
 *
 * コレクションの追加方法:
 *   1. defineCollection() でスキーマを定義する
 *   2. collections オブジェクトに追加する
 *   3. src/content/<コレクション名>/ にファイルを置く
 */

import { defineCollection, z } from 'astro:content';

// ─────────────────────────────────────────────────────
// Blog コレクション（src/content/blog/）
// ─────────────────────────────────────────────────────

const blogCollection = defineCollection({
  schema: z.object({
    title:       z.string(),
    description: z.string(),
    pubDate:     z.coerce.date(),
    heroImage:   z.string().optional(),
    tags:        z.array(z.string()).default([]),
    draft:       z.boolean().default(false),
  }),
});

// ─────────────────────────────────────────────────────
// Works コレクション（src/content/works/）
//
// 移行上の注意: 既存の .md ファイルの `url` フィールドを `projectUrl` にリネームしてください
// ─────────────────────────────────────────────────────

const worksCollection = defineCollection({
  schema: z.object({
    title:       z.string(),
    description: z.string(),
    pubDate:     z.coerce.date(),
    projectUrl:  z.string().url(),       // 必須: カードクリック時の遷移先（GitHub, デモ等）
    badge:       z.string().optional(),  // 任意: "v1.0", "FOSS" など短いアピールテキスト
    heroImage:   z.string().optional(),
    tags:        z.array(z.string()).default([]),
    draft:       z.boolean().default(false),
  }),
});

export const collections = {
  blog: blogCollection,
  works: worksCollection,
};
