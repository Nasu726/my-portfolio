import type { APIRoute } from 'astro';
import { getWorks } from '../../../lib/content';
import { createOGImageResponse } from '../../../lib/ogImage';

export async function getStaticPaths() {
  const works = await getWorks();
  return works.map((work) => ({
    params: { slug: work.id },
    props: {
      title: work.data.title,
      description: work.data.description,
    },
  }));
}

export const GET: APIRoute = ({ props }) =>
  createOGImageResponse({
    title: props.title as string,
    description: props.description as string,
    label: 'Works',
  });
