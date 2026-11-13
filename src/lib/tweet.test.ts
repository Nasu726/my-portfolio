import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTweetId, tweetDate, tweetFromOEmbed } from './tweet.ts';

test('x.com と twitter.com の投稿URLから投稿IDを取り出す', () => {
  assert.equal(parseTweetId('https://x.com/AnthropicAI/status/2116349211549843666'), '2116349211549843666');
  assert.equal(parseTweetId('https://twitter.com/a/status/123?s=20'), '123');
  assert.equal(parseTweetId('https://mobile.x.com/a/status/123/photo/1'), '123');
});

test('投稿以外のURLは null', () => {
  for (const url of ['https://x.com/AnthropicAI', 'https://x.com/a/status/abc', 'https://example.com/a/status/1', 'not a url']) {
    assert.equal(parseTweetId(url), null, url);
  }
});

test('投稿IDから投稿日時を求める', () => {
  // 実際の投稿（2026-11-04 20:11:28 UTC）
  assert.equal(tweetDate('2118073667858887068').toISOString(), '2026-11-04T20:11:28.980Z');
});

test('oEmbed の応答から本文・投稿者・投稿日時を取り出す', () => {
  const url = 'https://x.com/AnthropicAI/status/2118073667858887068';
  const tweet = tweetFromOEmbed({
    url,
    author_name: 'Anthropic',
    author_url: 'https://x.com/AnthropicAI',
    html:
      '<blockquote class="twitter-tweet"><p lang="en" dir="ltr">New research.<br><br>A &amp; B&#39;s <a href="https://t.co/x">pic.twitter.com/x</a></p>' +
      `&mdash; Anthropic (@AnthropicAI) <a href="${url}?ref_src=twsrc%5Etfw">November 4, 2026</a></blockquote>`,
  });
  assert.deepEqual(tweet, {
    url,
    author: 'Anthropic',
    handle: 'AnthropicAI',
    text: "New research.\n\nA & B's pic.twitter.com/x",
    date: '2026-11-04T20:11:28.980Z',
  });
});

test('本文や投稿のURLが読めない応答はエラーにする', () => {
  const author = { author_name: 'a', author_url: 'https://x.com/a' };
  assert.throws(() => tweetFromOEmbed({ ...author, url: 'https://x.com/a/status/1', html: '<div></div>' }));
  assert.throws(() => tweetFromOEmbed({ ...author, url: 'https://x.com/a', html: '<p>本文</p>' }));
});
