import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { createOGImageResponse } from '../../../lib/ogImage';

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

export const GET: APIRoute = ({ props }) =>
  createOGImageResponse({
    title: props.title as string,
    description: props.description as string,
    label: 'Works',
  });
