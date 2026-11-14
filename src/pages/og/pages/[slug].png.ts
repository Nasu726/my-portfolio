import type { APIRoute } from 'astro';
import { createOGImageResponse } from '../../../lib/ogImage';
import { BLOG_DESCRIPTION, SITE_DESCRIPTION, WORKS_DESCRIPTION } from '../../../lib/site';

// 記事以外の固定ページ用のOG画像。
// BaseLayoutのogImageのデフォルトも /og/pages/home.png を指している。
const STATIC_PAGES = [
  { slug: 'home', title: 'nasu', description: SITE_DESCRIPTION, label: 'Portfolio' },
  { slug: 'blog', title: 'Blog', description: BLOG_DESCRIPTION, label: 'Blog' },
  { slug: 'works', title: 'Works', description: WORKS_DESCRIPTION, label: 'Works' },
];

export function getStaticPaths() {
  return STATIC_PAGES.map(({ slug, title, description, label }) => ({
    params: { slug },
    props: { title, description, label },
  }));
}

export const GET: APIRoute = ({ props }) =>
  createOGImageResponse({
    title: props.title as string,
    description: props.description as string,
    label: props.label as string,
  });
