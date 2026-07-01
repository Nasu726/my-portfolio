// Qiita APIから記事を取得し、src/data/qiita-posts.json を更新するスクリプト。
// ビルド時には実行されない。新しい記事を反映したい時に手動で実行し、
// 更新されたJSONをコミットする。
//   npm run qiita:update
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const STORE_PATH = path.join(process.cwd(), 'src/data/qiita-posts.json');
const QIITA_USER = 'nasu726';

function excerptFromMarkdown(body, length = 100) {
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

function toUnifiedPost(item) {
  return {
    title: item.title,
    description: excerptFromMarkdown(item.body ?? ''),
    pubDate: item.created_at,
    tags: item.tags.map((t) => t.name),
    href: item.url,
    external: true,
    badge: 'Qiita',
  };
}

async function readStore() {
  try {
    const raw = await readFile(STORE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// 新旧の記事一覧をhrefでマージする。同じ記事は新しい内容で上書きし、
// 今回のレスポンスに含まれない過去の記事もそのまま残す（永続蓄積のため）。
function mergePosts(oldPosts, newPosts) {
  const byHref = new Map(oldPosts.map((p) => [p.href, p]));
  for (const post of newPosts) byHref.set(post.href, post);
  return Array.from(byHref.values()).sort(
    (a, b) => new Date(b.pubDate).valueOf() - new Date(a.pubDate).valueOf()
  );
}

const res = await fetch(`https://qiita.com/api/v2/users/${QIITA_USER}/items?per_page=100&page=1`);
if (!res.ok) {
  console.error(`Qiita API error: ${res.status}`);
  process.exit(1);
}

const items = await res.json();
const stored = await readStore();
const merged = mergePosts(stored, items.map(toUnifiedPost));

await mkdir(path.dirname(STORE_PATH), { recursive: true });
await writeFile(STORE_PATH, `${JSON.stringify(merged, null, 2)}\n`, 'utf-8');

console.log(`qiita-posts.json updated: ${stored.length} -> ${merged.length} 件`);
