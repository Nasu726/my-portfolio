import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '../lib/content';
import { BLOG_DESCRIPTION } from '../lib/site';

export async function GET(context: APIContext) {
  const posts = await getPosts();

  return rss({
    title: 'nasuのブログ',
    description: BLOG_DESCRIPTION,
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/Blog/${post.id}`,
      categories: post.data.tags,
    })),
    customData: `<language>ja</language>`,
  });
}
