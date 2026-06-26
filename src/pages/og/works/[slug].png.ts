/**
 * 作品ごとの OGP 画像生成エンドポイントです。
 * /og/works/[slug].png にアクセスすると作品タイトル入りの PNG 画像が返ります。
 *
 * ブログ版と同じ構成ですが、アクセントカラーが secondary（紫）になっています。
 */
import { getCollection } from 'astro:content';
import { generateOgPng } from '../../../lib/ogImage';
import type { APIRoute, GetStaticPaths } from 'astro';

export const getStaticPaths: GetStaticPaths = async () => {
  const works = await getCollection('works', ({ data }) => !data.draft);

  return works.map((work) => ({
    params: { slug: work.slug },
    props:  { title: work.data.title, tags: work.data.tags ?? [] },
  }));
};

interface Props {
  title: string;
  tags:  string[];
}

export const GET: APIRoute<Props> = async ({ props }) => {
  try {
    const png = await generateOgPng({
      type:  'works',
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
    console.error(`[og/works/${props.title}] OGP 画像生成に失敗しました:`, err);
    return new Response(null, {
      status:  302,
      headers: { Location: '/og/site.png' },
    });
  }
};
