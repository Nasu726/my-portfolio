/**
 * ブログ記事ごとの OGP 画像生成エンドポイントです。
 * /og/blog/[slug].png にアクセスすると記事タイトル入りの PNG 画像が返ります。
 *
 * 失敗時は 302 でデフォルト OGP 画像にリダイレクトします。
 */
import { getCollection } from 'astro:content';
import { generateOgPng } from '../../../lib/ogImage';
import type { APIRoute, GetStaticPaths } from 'astro';

export const getStaticPaths: GetStaticPaths = async () => {
  // draft 記事は OGP 画像も生成しない
  const posts = await getCollection('blog', ({ data }) => !data.draft);

  return posts.map((post) => ({
    params: { slug: post.slug },
    props:  { title: post.data.title, tags: post.data.tags ?? [] },
  }));
};

interface Props {
  title: string;
  tags:  string[];
}

export const GET: APIRoute<Props> = async ({ props }) => {
  try {
    const png = await generateOgPng({
      type:  'blog',
      title: props.title,
      tags:  props.tags,
    });

    return new Response(png, {
      status: 200,
      headers: {
        'Content-Type':  'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    console.error(`[og/blog/${props.title}] OGP 画像生成に失敗しました:`, err);
    return new Response(null, {
      status:  302,
      headers: { Location: '/og/site.png' },
    });
  }
};
