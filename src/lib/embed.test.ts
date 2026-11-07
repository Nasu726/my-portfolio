import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { PhrasingContent, Root } from 'mdast';
import { parseEmbed, remarkEmbed } from './embed.ts';
import { extractLinkCard } from './ogp.ts';

const VIDEO_ID = 'dQw4w9WgXcQ';
const SPOTIFY_ID = '4uLU6hMCjMI75M1A2tKUQC';
const YOUTUBE_EMBED = `https://www.youtube-nocookie.com/embed/${VIDEO_ID}`;

test('YouTube の各形式のURLを埋め込みURLにする', () => {
  for (const url of [
    `https://www.youtube.com/watch?v=${VIDEO_ID}`,
    `https://youtu.be/${VIDEO_ID}`,
    `https://youtu.be/${VIDEO_ID}?si=abc`,
    `https://m.youtube.com/watch?v=${VIDEO_ID}&list=PLx`,
    `https://www.youtube.com/shorts/${VIDEO_ID}`,
    `https://www.youtube.com/live/${VIDEO_ID}`,
  ]) {
    assert.equal(parseEmbed(url)?.src, YOUTUBE_EMBED, url);
  }
});

test('YouTube の開始位置を秒数で引き継ぐ', () => {
  assert.equal(parseEmbed(`https://youtu.be/${VIDEO_ID}?t=90`)?.src, `${YOUTUBE_EMBED}?start=90`);
  assert.equal(parseEmbed(`https://youtu.be/${VIDEO_ID}?t=1m30s`)?.src, `${YOUTUBE_EMBED}?start=90`);
  assert.equal(parseEmbed(`https://youtu.be/${VIDEO_ID}?t=1h0m5s`)?.src, `${YOUTUBE_EMBED}?start=3605`);
});

test('YouTube の再生リストを埋め込む', () => {
  assert.equal(
    parseEmbed('https://www.youtube.com/playlist?list=PL123')?.src,
    'https://www.youtube-nocookie.com/embed/videoseries?list=PL123',
  );
});

test('動画ではない YouTube のURLは埋め込まない', () => {
  assert.equal(parseEmbed('https://www.youtube.com/@nasu726'), null);
  assert.equal(parseEmbed('https://www.youtube.com/watch?v=short'), null);
});

test('Twitch は parent を全部付け、自動再生しない', () => {
  const parents = ['nasu.uk', 'localhost'];
  const tail = 'autoplay=false&parent=nasu.uk&parent=localhost';
  assert.equal(parseEmbed('https://www.twitch.tv/videos/123', parents)?.src, `https://player.twitch.tv/?video=123&${tail}`);
  assert.equal(parseEmbed('https://www.twitch.tv/nasu726', parents)?.src, `https://player.twitch.tv/?channel=nasu726&${tail}`);
  assert.equal(parseEmbed('https://www.twitch.tv/nasu726/clip/Slug-1', parents)?.src, `https://clips.twitch.tv/embed?clip=Slug-1&${tail}`);
  assert.equal(parseEmbed('https://clips.twitch.tv/Slug-1', parents)?.src, `https://clips.twitch.tv/embed?clip=Slug-1&${tail}`);
});

test('チャンネルではない Twitch のページは埋め込まない', () => {
  assert.equal(parseEmbed('https://www.twitch.tv/directory'), null);
  assert.equal(parseEmbed('https://www.twitch.tv/nasu726/videos'), null);
});

test('Spotify は種類に応じた高さにする', () => {
  const track = parseEmbed(`https://open.spotify.com/track/${SPOTIFY_ID}?si=abc`);
  assert.equal(track?.src, `https://open.spotify.com/embed/track/${SPOTIFY_ID}`);
  assert.equal(track?.height, 152);
  assert.equal(parseEmbed(`https://open.spotify.com/intl-ja/album/${SPOTIFY_ID}`)?.height, 352);
  assert.equal(parseEmbed('https://open.spotify.com/user/nasu'), null);
});

test('対応サービス以外と不正なURLは埋め込まない', () => {
  assert.equal(parseEmbed('https://qiita.com/nasu726/items/b639535fb89ba60dc8aa'), null);
  assert.equal(parseEmbed('not a url'), null);
});

const transform = remarkEmbed({ site: 'https://nasu.uk' });

function treeWith(...children: PhrasingContent[]): Root {
  return { type: 'root', children: [{ type: 'paragraph', children }] };
}

function image(url: string, alt = ''): PhrasingContent {
  return { type: 'image', url, alt };
}

test('`![説明](動画URL)` はプレイヤーにし、説明を title に使う', () => {
  const tree = treeWith(image(`https://youtu.be/${VIDEO_ID}`, '好きな動画'));
  transform(tree);
  const data = tree.children[0].data as { hName: string; hChildren: { properties: { title: string } }[] };
  assert.equal(data.hName, 'div');
  assert.equal(data.hChildren[0].properties.title, '好きな動画');
});

test('説明が空なら、サービスごとの既定の title を使う', () => {
  const tree = treeWith(image(`https://youtu.be/${VIDEO_ID}`));
  transform(tree);
  const data = tree.children[0].data as { hChildren: { properties: { title: string } }[] };
  assert.equal(data.hChildren[0].properties.title, 'YouTube 動画');
});

test('画像のURLはそのまま画像にしておく', () => {
  const tree = treeWith(image('https://example.com/photo.PNG?w=100', '写真'));
  const before = structuredClone(tree);
  transform(tree);
  assert.deepEqual(tree, before);
});

test('サイト内の画像はそのまま画像にしておく', () => {
  const tree = treeWith(image('/images/photo', '写真'));
  const before = structuredClone(tree);
  transform(tree);
  assert.deepEqual(tree, before);
});

test('カード情報が無いページは、壊れた画像ではなく説明文のリンクにする', () => {
  const url = 'https://example.com/no-card-yet';
  const tree = treeWith(image(url, '参考ページ'));
  transform(tree);
  assert.deepEqual(tree.children[0], {
    type: 'paragraph',
    children: [{ type: 'link', url, children: [{ type: 'text', value: '参考ページ' }] }],
  });
});

test('文中の画像とURLそのままのリンクは置き換えない', () => {
  const url = `https://youtu.be/${VIDEO_ID}`;
  const inline = treeWith({ type: 'text', value: '文中 ' }, image(url));
  const link = treeWith({ type: 'link', url, children: [{ type: 'text', value: url }] });
  const before = structuredClone([inline, link]);
  transform(inline);
  transform(link);
  assert.deepEqual([inline, link], before);
});

test('OGP からカードの情報を取り出す（属性の順番と文字参照も扱う）', () => {
  const html = `<head><title>別のタイトル</title>
    <meta content="A &amp; B" property="og:title">
    <meta property='og:description' content='説明&#x3002;'>
    <meta property="og:image" content="/ogp.png"></head>`;
  assert.deepEqual(extractLinkCard(html, 'https://example.com/a/b'), {
    title: 'A & B',
    description: '説明。',
    image: 'https://example.com/ogp.png',
  });
});

test('OGP が無いページは title と description を使う', () => {
  const html = '<title>題名</title><meta name="description" content="概要">';
  assert.deepEqual(extractLinkCard(html, 'https://example.com/'), { title: '題名', description: '概要' });
});

test('タイトルが取れないページはカードにしない', () => {
  assert.equal(extractLinkCard('<p>本文</p>', 'https://example.com/'), null);
});

test('http(s) 以外のサムネイルは使わない', () => {
  const html = '<title>題名</title><meta property="og:image" content="javascript:alert(1)">';
  assert.equal(extractLinkCard(html, 'https://example.com/')?.image, undefined);
});
