import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { createOGImageResponse } from '../../../lib/ogImage';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.id },
    props: {
      title: post.data.title,
      description: post.data.description,
    },
  }));
}

export const GET: APIRoute = ({ props }) =>
  createOGImageResponse({
    title: props.title as string,
    description: props.description as string,
    label: 'Blog',
  });
