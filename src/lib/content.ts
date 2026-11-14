// ページで使う記事・作品の一覧の取得をまとめたもの。
// astro:content を使うので、node のテストから読む posts.ts とは分けている。
import { getCollection, type CollectionEntry } from 'astro:content';
import { isPublished } from './posts';
import { fetchQiitaPosts, type UnifiedPost } from './qiita';

export type Post = CollectionEntry<'blog'>;
export type Work = CollectionEntry<'works'>;

function newestFirst(a: { data: { pubDate: Date } }, b: { data: { pubDate: Date } }): number {
  return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
}

/** 公開済みのブログ記事（予約投稿は公開時刻まで含めない）を新しい順に返す */
export async function getPosts(): Promise<Post[]> {
  return (await getCollection('blog', ({ data }) => isPublished(data))).sort(newestFirst);
}

/** 下書きでない作品を新しい順に返す。作品は予約投稿に対応していない */
export async function getWorks(): Promise<Work[]> {
  return (await getCollection('works', ({ data }) => !data.draft)).sort(newestFirst);
}

/** 自分のブログ記事と Qiita の記事を合わせ、カード用の形にして新しい順に返す */
export async function getBlogCards(): Promise<UnifiedPost[]> {
  const [posts, qiitaPosts] = await Promise.all([getPosts(), fetchQiitaPosts()]);
  const ownPosts = posts.map((post) => ({
    title: post.data.title,
    description: post.data.description,
    pubDate: post.data.pubDate,
    tags: post.data.tags,
    href: `/Blog/${post.id}`,
    external: false,
  }));
  return [...ownPosts, ...qiitaPosts].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());
}

export type TagEntries = { posts: Post[]; works: Work[] };

/** タグごとに、そのタグが付いた記事と作品（それぞれ新しい順）をまとめて返す */
export async function getTagIndex(): Promise<Map<string, TagEntries>> {
  const [posts, works] = await Promise.all([getPosts(), getWorks()]);
  const index = new Map<string, TagEntries>();
  const entriesOf = (tag: string) => {
    if (!index.has(tag)) index.set(tag, { posts: [], works: [] });
    return index.get(tag)!;
  };
  for (const post of posts) for (const tag of post.data.tags) entriesOf(tag).posts.push(post);
  for (const work of works) for (const tag of work.data.tags) entriesOf(tag).works.push(work);
  return index;
}
