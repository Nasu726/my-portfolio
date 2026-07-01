import { readFile } from 'node:fs/promises';
import path from 'node:path';

// 記事ストア。Qiita APIから取得した記事を表示用フォーマットのままリポジトリに
// コミットして保持する。ビルド時はこのファイルを読むだけでネットワーク通信は発生しない。
// 新しい記事を反映したい時は `npm run qiita:update` を実行し、更新されたファイルをコミットする。
const STORE_PATH = path.join(process.cwd(), 'src/data/qiita-posts.json');

export type UnifiedPost = {
  title: string;
  description: string;
  pubDate: Date;
  tags: string[];
  href: string;
  external: boolean;
  badge?: string;
};

type StoredPost = Omit<UnifiedPost, 'pubDate'> & { pubDate: string };

async function readStore(): Promise<UnifiedPost[]> {
  try {
    const raw = await readFile(STORE_PATH, 'utf-8');
    const posts = JSON.parse(raw) as StoredPost[];
    return posts.map((p) => ({ ...p, pubDate: new Date(p.pubDate) }));
  } catch {
    return [];
  }
}

/** ストア済みのQiita記事のうち、minYear年以降のものをブログカード形式で返す。
 *  ストアが空の場合のみ、Qiitaのプロフィールページへ飛べるカードを1件返す。 */
export async function fetchQiitaPosts(minYear = 2026): Promise<UnifiedPost[]> {
  const stored = await readStore();

  if (stored.length === 0) {
    return [
      {
        title: 'Qiitaで記事を読む',
        description: '記事ストアが空です。`npm run qiita:update` を実行してください。',
        pubDate: new Date(),
        tags: [],
        href: 'https://qiita.com/nasu726',
        external: true,
        badge: 'Qiita',
      },
    ];
  }

  return stored.filter((post) => post.pubDate.getFullYear() >= minYear);
}
