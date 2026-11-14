import type { APIRoute } from 'astro';
import { getTagIndex } from '../../../lib/content';
import { createOGImageResponse } from '../../../lib/ogImage';
import { tagToSlug } from '../../../lib/tags';

export async function getStaticPaths() {
  const index = await getTagIndex();
  return [...index].map(([tag, { posts, works }]) => ({
    // リンク生成側（TagBadge等）と同じスラグにしないと404になる（"C++" などの記号対策）
    params: { tag: tagToSlug(tag) },
    props: { tag, count: posts.length + works.length },
  }));
}

export const GET: APIRoute = ({ props }) =>
  createOGImageResponse({
    title: `#${props.tag as string}`,
    description: `タグ「${props.tag as string}」の記事・作品 ${props.count as number} 件`,
    label: 'Tag',
  });
