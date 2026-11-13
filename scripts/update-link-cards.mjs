// 記事の `![説明](URL)` だけの行を集めて、リンクカードと X の投稿の情報を取得するスクリプト。
//   ページ  → OGP を src/data/link-cards.json に追記
//   X の投稿 → oEmbed の本文を src/data/tweets.json に追記
// ビルド時には実行されない。URLを貼った記事を書いたら手動で実行し、更新されたJSONをコミットする。
//   npm run links:update
// 取得済みのURLは取り直さない。取り直したいときは JSON から該当の項目を消して実行する。
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { hasImageExtension, parseEmbed } from '../src/lib/embed.ts';
import { extractLinkCard } from '../src/lib/ogp.ts';
import { parseTweetId, tweetFromOEmbed } from '../src/lib/tweet.ts';

const CONTENT_DIR = 'src/content';
const STORE_PATH = 'src/data/link-cards.json';
const TWEETS_PATH = 'src/data/tweets.json';
const FETCH_TIMEOUT_MS = 10_000;
// ブラウザ以外を弾くサイトがあるので、ブラウザに近い User-Agent にしておく
const USER_AGENT = 'Mozilla/5.0 (compatible; nasu.uk link-card; +https://nasu.uk/)';

/** Markdown の中の `![説明](URL)` だけの行のURLを返す。frontmatter とコードブロックの中は見ない */
function imageUrls(markdown) {
  const body = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---/, '');
  const urls = [];
  let inCodeBlock = false;
  for (const line of body.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) inCodeBlock = !inCodeBlock;
    const url = line.trim().match(/^!\[[^\]]*\]\((https?:\/\/[^\s)]+)(?:\s+"[^"]*")?\)$/)?.[1];
    if (url && !inCodeBlock) urls.push(url);
  }
  return urls;
}

/** 文字コードを判定して本文を読む。日本語サイトには UTF-8 以外もある */
async function readHtml(res) {
  const bytes = await res.arrayBuffer();
  const utf8 = new TextDecoder().decode(bytes);
  const charset =
    res.headers.get('content-type')?.match(/charset=([\w-]+)/i)?.[1] ??
    utf8.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1];
  try {
    return charset ? new TextDecoder(charset).decode(bytes) : utf8;
  } catch {
    return utf8;
  }
}

async function fetchCard(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'ja' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  // 拡張子が無い画像のURL。null を記録すると、記事ではそのまま画像として表示される
  if (res.headers.get('content-type')?.startsWith('image/')) return null;
  const card = extractLinkCard(await readHtml(res), res.url);
  if (!card) throw new Error('タイトルを取得できませんでした');
  return card;
}

const urls = readdirSync(CONTENT_DIR, { recursive: true })
  .filter((file) => file.endsWith('.md'))
  .flatMap((file) => imageUrls(readFileSync(join(CONTENT_DIR, file), 'utf8')));

async function fetchTweet(url) {
  const query = new URLSearchParams({ url, omit_script: '1', dnt: 'true' });
  const res = await fetch(`https://publish.x.com/oembed?${query}`, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  // 削除された投稿や非公開アカウントの投稿は 404 / 403 になる
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return tweetFromOEmbed(await res.json());
}

/** まだ取得していないものを取得して JSON に追記する。失敗したものは飛ばして他の取得を続ける */
async function update(path, targets, fetchOne) {
  const store = JSON.parse(readFileSync(path, 'utf8'));
  const missing = targets.filter(({ key }) => !(key in store));
  let failed = 0;
  for (const { key, url } of missing) {
    try {
      store[key] = await fetchOne(url);
      console.log(`取得: ${url}`);
    } catch (error) {
      // 取得できないURLは普通のリンクとして表示される
      failed++;
      console.warn(`失敗: ${url}（${error.message}）`);
    }
  }
  writeFileSync(path, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
  console.log(`${path}: 新規 ${missing.length - failed} 件 / 失敗 ${failed} 件 / 合計 ${Object.keys(store).length} 件`);
}

const uniqueUrls = [...new Set(urls)];
const tweets = uniqueUrls.flatMap((url) => {
  const id = parseTweetId(url);
  return id ? [{ key: id, url }] : [];
});
const pages = uniqueUrls
  .filter((url) => !parseEmbed(url) && !parseTweetId(url) && !hasImageExtension(url))
  .map((url) => ({ key: url, url }));

await update(STORE_PATH, pages, fetchCard);
await update(TWEETS_PATH, tweets, fetchTweet);
