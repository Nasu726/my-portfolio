import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

// キャッシュファイルの保存先（ビルド環境ごとの再取得を避けるためリポジトリ外に置く）
const CACHE_PATH = path.join(process.cwd(), '.cache', 'qiita.json');
// キャッシュの有効期限。この時間以内なら再フェッチせずキャッシュを使う
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6時間

type QiitaCache = { fetchedAt: number; items: QiitaItem[] };

async function readCache(): Promise<QiitaCache | null> {
  try {
    const raw = await readFile(CACHE_PATH, 'utf-8');
    return JSON.parse(raw) as QiitaCache;
  } catch {
    return null;
  }
}

async function writeCache(items: QiitaItem[]): Promise<void> {
  try {
    await mkdir(path.dirname(CACHE_PATH), { recursive: true });
    await writeFile(CACHE_PATH, JSON.stringify({ fetchedAt: Date.now(), items }), 'utf-8');
  } catch {
    // キャッシュ書き込み失敗はビルドを止めるほどの問題ではないので無視
  }
}

export type QiitaItem = {
  id: string;
  title: string;
  url: string;
  created_at: string;
  body: string;
  tags: Array<{ name: string }>;
};

export type UnifiedPost = {
  title: string;
  description: string;
  pubDate: Date;
  tags: string[];
  href: string;
  external: boolean;
  badge?: string;
};

function excerptFromMarkdown(body: string, length = 100): string {
  const plain = body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/[*_>~-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > length ? `${plain.slice(0, length)}…` : plain;
}

/** Qiitaの記事を取得し、minYear年以降のものだけをブログカード形式に変換して返す。
 *  APIの取得に失敗した場合は、Qiitaのプロフィールページへ飛べるカードを1件返す。 */
export async function fetchQiitaPosts(minYear = 2026): Promise<UnifiedPost[]> {
  const cached = await readCache();
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return toUnifiedPosts(cached.items, minYear);
  }

  let fetchFailed = false;

  const items: QiitaItem[] = await fetch(
    'https://qiita.com/api/v2/users/nasu726/items?per_page=100&page=1'
  )
    .then((r) => {
      if (!r.ok) {
        fetchFailed = true;
        return [];
      }
      return r.json() as Promise<QiitaItem[]>;
    })
    .catch(() => {
      fetchFailed = true;
      return [];
    });

  if (fetchFailed) {
    // ネットワーク取得に失敗した場合、古いキャッシュが残っていればそれを使う
    if (cached) return toUnifiedPosts(cached.items, minYear);
    return [
      {
        title: 'Qiitaで記事を読む',
        description: '記事一覧の取得に失敗しました。Qiitaのプロフィールページから直接ご覧ください。',
        pubDate: new Date(),
        tags: [],
        href: 'https://qiita.com/nasu726',
        external: true,
        badge: 'Qiita',
      },
    ];
  }

  await writeCache(items);
  return toUnifiedPosts(items, minYear);
}

function toUnifiedPosts(items: QiitaItem[], minYear: number): UnifiedPost[] {
  return items
    .filter((item) => new Date(item.created_at).getFullYear() >= minYear)
    .map((item) => ({
      title: item.title,
      description: excerptFromMarkdown(item.body ?? ''),
      pubDate: new Date(item.created_at),
      tags: item.tags.map((t) => t.name),
      href: item.url,
      external: true,
      badge: 'Qiita',
    }));
}
