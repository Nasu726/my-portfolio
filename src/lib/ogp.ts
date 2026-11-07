// HTML からリンクカード用の情報（タイトル・説明・サムネイル）を取り出す。
// `npm run links:update` から使う。ビルド時には呼ばれない。
import type { LinkCard } from './embed.ts';

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

function decodeEntities(value: string): string {
  return value.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (entity, code: string) => {
    if (code.startsWith('#')) {
      const isHex = code[1].toLowerCase() === 'x';
      return String.fromCodePoint(Number.parseInt(code.slice(isHex ? 2 : 1), isHex ? 16 : 10));
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? entity;
  });
}

/** `<meta property="og:title" content="...">` を { 'og:title': '...' } の形で集める */
function readMetaTags(html: string): Record<string, string> {
  const metas: Record<string, string> = {};
  for (const [tag] of html.matchAll(/<meta\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi)) {
    const attrs = Object.fromEntries(
      [...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(([, name, double, single]) => [
        name.toLowerCase(),
        double ?? single,
      ]),
    );
    const key = attrs.property ?? attrs.name;
    // 同じ名前が複数あるときは、先に書かれたものを優先する
    if (key && attrs.content && !(key in metas)) metas[key] = decodeEntities(attrs.content).trim();
  }
  return metas;
}

/** サムネイルのURLを絶対URLにする。http(s) でなければ使わない */
function resolveImage(image: string | undefined, pageUrl: string): string | undefined {
  if (!image) return undefined;
  try {
    const url = new URL(image, pageUrl);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/** ページの HTML からカードの情報を作る。タイトルが取れなければ null */
export function extractLinkCard(html: string, pageUrl: string): LinkCard | null {
  const metas = readMetaTags(html);
  const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1];
  const title = metas['og:title'] ?? (titleTag ? decodeEntities(titleTag).trim() : '');
  if (!title) return null;

  const image = resolveImage(metas['og:image'] ?? metas['twitter:image'], pageUrl);
  return {
    title,
    description: metas['og:description'] ?? metas.description ?? '',
    ...(image && { image }),
  };
}
