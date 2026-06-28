/**
 * RSS フィード生成エンドポイントです。
 * ローカルのブログ記事のみを出力します（Qiita・Zenn などの外部記事は含みません）。
 */
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../config';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  // draft 除外、日付降順で取得
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title:       SITE.title,
    description: SITE.description,
    site:        context.site!.toString(),
    items: posts.map((post) => ({
      title:       post.data.title,
      description: post.data.description,
      pubDate:     post.data.pubDate,
      link:        `/blog/${post.id}/`,
    })),
    customData: '<language>ja</language>',
  });
}
