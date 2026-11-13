// X（旧 Twitter）の投稿を引用枠として表示するための処理。
// 本文は `npm run links:update` で X の oEmbed（APIキー不要）から取得して src/data/tweets.json に保存する。
// ページでは保存した本文を引用枠で出し、画面に近づいたら X 公式の埋め込みに置き換える（src/components/TweetEmbed.astro）。

const TWEET_HOSTS = ['x.com', 'www.x.com', 'mobile.x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com'];

export type Tweet = {
  url: string;
  author: string;
  handle: string;
  text: string;
  /** 投稿日時（ISO 8601、UTC） */
  date: string;
};

// X の投稿IDの上位ビットは投稿時刻（2010-11-04 からのミリ秒）になっている
const TWEET_ID_EPOCH_MS = 1288834974657;
const TWEET_ID_TIME_SHIFT = 22n;

/** 投稿IDから投稿日時を求める。oEmbed の日付は UTC の日付だけで、日本時間とずれることがあるため */
export function tweetDate(id: string): Date {
  return new Date(Number(BigInt(id) >> TWEET_ID_TIME_SHIFT) + TWEET_ID_EPOCH_MS);
}

/** X の投稿のURLなら投稿IDを返す。それ以外は null */
export function parseTweetId(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (!TWEET_HOSTS.includes(url.hostname)) return null;
  const [, status, id] = url.pathname.split('/').filter(Boolean);
  return status === 'status' && /^\d+$/.test(id ?? '') ? id : null;
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", mdash: '—', nbsp: ' ' };

function decodeEntities(html: string): string {
  return html.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (match, code: string) => {
    if (code[0] !== '#') return ENTITIES[code] ?? match;
    const point = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : Number(code.slice(1));
    return String.fromCodePoint(point);
  });
}

/** HTMLを文字だけにする。改行の <br> は改行文字にする */
function htmlToText(html: string): string {
  return decodeEntities(html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '')).trim();
}

type OEmbed = { url: string; author_name: string; author_url: string; html: string };

/** oEmbed の応答から、引用枠に出す情報を取り出す。HTMLは保存せず文字だけにする */
export function tweetFromOEmbed({ url, author_name, author_url, html }: OEmbed): Tweet {
  const body = html.match(/<p[^>]*>([\s\S]*?)<\/p>/)?.[1];
  const id = parseTweetId(url);
  if (body === undefined || !id) throw new Error('oEmbed の本文か投稿のURLを読めませんでした');
  return {
    url,
    author: author_name,
    handle: new URL(author_url).pathname.split('/').filter(Boolean)[0] ?? '',
    text: htmlToText(body),
    date: tweetDate(id).toISOString(),
  };
}
