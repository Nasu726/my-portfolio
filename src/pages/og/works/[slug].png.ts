import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { generateOGImage } from '../../../lib/ogImage';

export async function getStaticPaths() {
  const works = await getCollection('works', ({ data }) => !data.draft);
  return works.map((work) => ({
    params: { slug: work.id },
    props: {
      title: work.data.title,
      description: work.data.description,
    },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  try {
    const png = await generateOGImage({
      title: props.title as string,
      description: props.description as string,
      label: 'Works',
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
