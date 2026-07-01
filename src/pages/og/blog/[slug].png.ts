import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { generateOGImage } from '../../../lib/ogImage';

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

export const GET: APIRoute = async ({ props }) => {
  try {
    const png = await generateOGImage({
      title: props.title as string,
      description: props.description as string,
      label: 'Blog',
    });
    return new Response(png, { headers: { 'Content-Type': 'image/png' } });
  } catch {
    const { default: sharp } = await import('sharp');
    const fallback = await sharp({
      create: { width: 1200, height: 630, channels: 3, background: { r: 232, g: 213, b: 245 } },
    }).png().toBuffer();
    return new Response(fallback, { headers: { 'Content-Type': 'image/png' } });
  }
};
