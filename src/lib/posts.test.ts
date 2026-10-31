import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasNewlyPublished, isPublished, publishAt } from './posts.ts';

// frontmatter の `pubDate: 2026-12-01` は UTC 0時として読み込まれる
const dec1 = new Date('2026-12-01');
const scheduled = { draft: false, pubDate: dec1 };

test('公開時刻は指定日の日本時間0時0分（= 前日 UTC 15時）', () => {
  assert.equal(publishAt(dec1).toISOString(), '2026-11-30T15:00:00.000Z');
});

test('日本時間 11/30 23:59:59 ではまだ公開されない', () => {
  assert.equal(isPublished(scheduled, new Date('2026-11-30T23:59:59+09:00'), false), false);
});

test('日本時間 12/1 0:00:00 ちょうどに公開される', () => {
  assert.equal(isPublished(scheduled, new Date('2026-12-01T00:00:00+09:00'), false), true);
});

test('下書きは公開日を過ぎても、開発サーバーでも出さない', () => {
  const draft = { draft: true, pubDate: dec1 };
  assert.equal(isPublished(draft, new Date('2027-01-01'), false), false);
  assert.equal(isPublished(draft, new Date('2027-01-01'), true), false);
});

test('開発サーバーでは予約中の記事も表示する', () => {
  assert.equal(isPublished(scheduled, new Date('2026-11-01'), true), true);
});

// 定期実行（日本時間 0:05）が再ビルドを要るか判定する
const run = new Date('2026-12-01T00:05:00+09:00');

test('前回ビルド後に公開時刻を迎えた記事があれば再ビルドする', () => {
  const lastBuild = new Date('2026-11-30T21:00:00+09:00');
  assert.equal(hasNewlyPublished([scheduled], lastBuild, run), true);
});

test('公開時刻の後にもうビルド済みなら再ビルドしない（昼の予備実行で二重に走らない）', () => {
  const lastBuild = new Date('2026-12-01T00:06:00+09:00');
  assert.equal(hasNewlyPublished([scheduled], lastBuild, new Date('2026-12-01T12:00:00+09:00')), false);
});

test('まだ公開時刻前の記事と下書きは再ビルドの理由にならない', () => {
  const lastBuild = new Date('2026-11-30T21:00:00+09:00');
  const future = { draft: false, pubDate: new Date('2026-12-02') };
  const draft = { draft: true, pubDate: dec1 };
  assert.equal(hasNewlyPublished([future, draft], lastBuild, run), false);
});

test('前日の実行が飛んでいても、次の実行でまとめて拾う', () => {
  const lastBuild = new Date('2026-11-29T21:00:00+09:00');
  const nov30 = { draft: false, pubDate: new Date('2026-11-30') };
  assert.equal(hasNewlyPublished([nov30], lastBuild, run), true);
});
