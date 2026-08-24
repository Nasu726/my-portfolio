import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { createOGImageResponse } from '../../../lib/ogImage';
import { tagToSlug } from '../../../lib/tags';

export async function getStaticPaths() {
  const [posts, works] = await Promise.all([
    getCollection('blog', ({ data }) => !data.draft),
    getCollection('works', ({ data }) => !data.draft),
  ]);

  // タグごとの件数を数える
  const counts = new Map<string, number>();
  for (const entry of [...posts, ...works]) {
    for (const tag of entry.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()].map(([tag, count]) => ({
    // リンク生成側（TagBadge等）と同じスラグにしないと404になる（"C++" などの記号対策）
    params: { tag: tagToSlug(tag) },
    props: { tag, count },
  }));
}

export const GET: APIRoute = ({ props }) =>
  createOGImageResponse({
    title: `#${props.tag as string}`,
    description: `タグ「${props.tag as string}」の記事・作品 ${props.count as number} 件`,
    label: 'Tag',
  });
