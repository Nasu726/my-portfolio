import type { APIRoute } from 'astro';
import { createOGImageResponse } from '../../../lib/ogImage';

// 記事以外の固定ページ用のOG画像。
// BaseLayoutのogImageのデフォルトも /og/pages/home.png を指している。
const STATIC_PAGES = [
  {
    slug: 'home',
    title: 'nasu',
    description:
      'nasuのポートフォリオサイト。アルゴリズムやプログラミングに関するブログと作品を公開しています。',
    label: 'Portfolio',
  },
  {
    slug: 'blog',
    title: 'Blog',
    description: 'アルゴリズム、プログラミング、日々の学びを書いています。',
    label: 'Blog',
  },
  {
    slug: 'works',
    title: 'Works',
    description: '個人開発・制作物を公開しています。',
    label: 'Works',
  },
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
