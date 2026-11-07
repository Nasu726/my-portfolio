// 本文の画像記法 `![説明](URL)` を、URLの種類に応じて埋め込みやリンクカードに置き換える remark プラグイン。
// 画像・動画・カードをすべて同じ書き方で貼れるようにしていて、[] の中は alt / title に使う。
//   YouTube・Twitch・Spotify → iframe のプレイヤー
//   画像のURL               → そのまま画像
//   それ以外のページ        → src/data/link-cards.json の情報からリンクカード
// カードの情報は `npm run links:update` で取得しておく。ビルド時は通信しない。
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Image, Paragraph, Root, RootContent } from 'mdast';

const LINK_CARDS_PATH = path.join(process.cwd(), 'src/data/link-cards.json');

// Spotify の埋め込みの高さ（px）。曲・エピソードは1行の小さいプレイヤー、それ以外はリスト付き
const SPOTIFY_HEIGHT_COMPACT = 152;
const SPOTIFY_HEIGHT_LIST = 352;
const SPOTIFY_COMPACT_TYPES = ['track', 'episode'];
const SPOTIFY_TYPES = [...SPOTIFY_COMPACT_TYPES, 'album', 'playlist', 'artist', 'show'];

const YOUTUBE_HOSTS = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'];
const YOUTUBE_ID = /^[\w-]{11}$/;
// /shorts/ID のように、1階層目が種別で2階層目が動画IDになるパス
const YOUTUBE_ID_PATHS = ['shorts', 'live', 'embed'];

const TWITCH_HOSTS = ['twitch.tv', 'www.twitch.tv', 'm.twitch.tv'];
const TWITCH_CHANNEL = /^\w{3,25}$/;
// twitch.tv/<ここ> がチャンネル名ではないページ
const TWITCH_RESERVED_PATHS = ['directory', 'downloads', 'jobs', 'p', 'settings', 'subscriptions', 'turbo', 'videos'];

export type Embed = {
  provider: 'youtube' | 'twitch' | 'spotify';
  src: string;
  title: string;
  height?: number;
};

export type LinkCard = {
  title: string;
  description: string;
  image?: string;
};

/** YouTube の t パラメータ（90 / 90s / 1m30s / 1h2m3s）を秒数にする。読めなければ null */
function parseYouTubeStart(t: string | null): number | null {
  const match = t?.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
  if (!match) return null;
  const [, hours = 0, minutes = 0, seconds = 0] = match;
  const total = Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
  return total > 0 ? total : null;
}

function parseYouTube(url: URL): Embed | null {
  const [first, second] = url.pathname.split('/').filter(Boolean);
  const title = 'YouTube 動画';

  if (url.hostname !== 'youtu.be' && first === 'playlist') {
    const list = url.searchParams.get('list');
    if (!list) return null;
    const query = new URLSearchParams({ list });
    return { provider: 'youtube', title, src: `https://www.youtube-nocookie.com/embed/videoseries?${query}` };
  }

  let id: string | null | undefined;
  if (url.hostname === 'youtu.be') id = first;
  else if (first === 'watch') id = url.searchParams.get('v');
  else if (YOUTUBE_ID_PATHS.includes(first)) id = second;
  if (!id || !YOUTUBE_ID.test(id)) return null;

  const start = parseYouTubeStart(url.searchParams.get('t') ?? url.searchParams.get('start'));
  const query = start === null ? '' : `?start=${start}`;
  return { provider: 'youtube', title, src: `https://www.youtube-nocookie.com/embed/${id}${query}` };
}

function parseTwitch(url: URL, parents: string[]): Embed | null {
  const segments = url.pathname.split('/').filter(Boolean);
  // Twitch の埋め込みは、表示するサイトのドメインを parent に指定しないと動かない
  const query = (key: string, value: string) => {
    const params = new URLSearchParams({ [key]: value, autoplay: 'false' });
    for (const parent of parents) params.append('parent', parent);
    return params;
  };
  const clip = (slug: string): Embed => ({
    provider: 'twitch',
    title: 'Twitch クリップ',
    src: `https://clips.twitch.tv/embed?${query('clip', slug)}`,
  });

  if (url.hostname === 'clips.twitch.tv') return segments.length === 1 ? clip(segments[0]) : null;

  const [first, second, third] = segments;
  if (first === 'videos' && second && /^\d+$/.test(second)) {
    return { provider: 'twitch', title: 'Twitch 動画', src: `https://player.twitch.tv/?${query('video', second)}` };
  }
  if (second === 'clip' && third) return clip(third);
  if (segments.length === 1 && TWITCH_CHANNEL.test(first) && !TWITCH_RESERVED_PATHS.includes(first)) {
    return { provider: 'twitch', title: 'Twitch チャンネル', src: `https://player.twitch.tv/?${query('channel', first)}` };
  }
  return null;
}

function parseSpotify(url: URL): Embed | null {
  // 言語付きのURL（/intl-ja/track/...）は先頭を読み飛ばす
  const segments = url.pathname.split('/').filter((s) => s && !s.startsWith('intl-'));
  const [type, id] = segments;
  if (segments.length !== 2 || !SPOTIFY_TYPES.includes(type) || !/^[A-Za-z0-9]{22}$/.test(id)) return null;
  return {
    provider: 'spotify',
    title: 'Spotify',
    src: `https://open.spotify.com/embed/${type}/${id}`,
    height: SPOTIFY_COMPACT_TYPES.includes(type) ? SPOTIFY_HEIGHT_COMPACT : SPOTIFY_HEIGHT_LIST,
  };
}

/** 埋め込みプレイヤーに対応するURLなら、その情報を返す。対応外なら null */
export function parseEmbed(rawUrl: string, twitchParents: string[] = []): Embed | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.hostname === 'youtu.be' || YOUTUBE_HOSTS.includes(url.hostname)) return parseYouTube(url);
  if (url.hostname === 'clips.twitch.tv' || TWITCH_HOSTS.includes(url.hostname)) return parseTwitch(url, twitchParents);
  if (url.hostname === 'open.spotify.com') return parseSpotify(url);
  return null;
}

/** URLの拡張子が画像のものか。ページか画像かの見分けに使う */
export function hasImageExtension(rawUrl: string): boolean {
  return /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(new URL(rawUrl).pathname);
}

/** 段落の中身が外部URLの `![説明](URL)` だけなら、その画像ノードを返す。文中の画像は対象外 */
function standaloneImage(node: RootContent): Image | null {
  if (node.type !== 'paragraph' || node.children.length !== 1) return null;
  const [image] = node.children;
  return image.type === 'image' && /^https?:\/\//.test(image.url) ? image : null;
}

// mdast の段落を、指定した HTML 要素として出力させる。
// 値はエスケープされて出力されるので、外部サイト由来のタイトルなどをそのまま渡してよい
function htmlNode(tagName: string, properties: object, children: object[]): Paragraph {
  return {
    type: 'paragraph',
    children: [],
    data: { hName: tagName, hProperties: properties, hChildren: children } as Paragraph['data'],
  };
}

function element(tagName: string, properties: object, children: object[] = []) {
  return { type: 'element', tagName, properties, children };
}

function text(value: string) {
  return { type: 'text', value };
}

function embedNode({ provider, src, title, height }: Embed, alt: string): Paragraph {
  const iframe = element('iframe', {
    src,
    title: alt || title,
    height,
    loading: 'lazy',
    allow: 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; web-share',
    allowFullScreen: true,
  });
  return htmlNode('div', { className: ['embed', `embed-${provider}`] }, [iframe]);
}

function linkCardNode(url: string, { title, description, image }: LinkCard, alt: string): Paragraph {
  const body = element('span', { className: ['link-card-body'] }, [
    element('span', { className: ['link-card-title'] }, [text(title)]),
    element('span', { className: ['link-card-description'] }, [text(description)]),
    element('span', { className: ['link-card-host'] }, [text(new URL(url).hostname.replace(/^www\./, ''))]),
  ]);
  const thumbnail = image
    ? [element('img', { className: ['link-card-image'], src: image, alt, loading: 'lazy', referrerPolicy: 'no-referrer' })]
    : [];
  return htmlNode(
    'a',
    { className: ['link-card', 'not-prose'], href: url, target: '_blank', rel: 'noopener noreferrer' },
    [body, ...thumbnail],
  );
}

export function remarkEmbed({ site }: { site: string }) {
  const twitchParents = [new URL(site).hostname, 'localhost'];

  return (tree: Root) => {
    // 値が null のURLは、拡張子が無いが中身は画像だったもの
    const cards: Record<string, LinkCard | null> = JSON.parse(readFileSync(LINK_CARDS_PATH, 'utf8'));

    tree.children = tree.children.map((node) => {
      const image = standaloneImage(node);
      if (!image) return node;

      const { url } = image;
      const alt = image.alt ?? '';
      const embed = parseEmbed(url, twitchParents);
      if (embed) return embedNode(embed, alt);
      if (hasImageExtension(url) || cards[url] === null) return node;

      const card = cards[url];
      if (card) return linkCardNode(url, card, alt);

      // 壊れた画像にならないよう、カードの情報が無ければ普通のリンクにする
      console.warn(`[link-card] カード情報がありません: ${url}（npm run links:update で取得できます）`);
      return { type: 'paragraph', children: [{ type: 'link', url, children: [{ type: 'text', value: alt || url }] }] };
    });
  };
}
