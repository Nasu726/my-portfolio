import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDate, readingTime } from './format.ts';

test('frontmatter の日付を、書いた日付のまま日本語で表示する', () => {
  assert.equal(formatDate(new Date('2026-04-01')), '2026年4月1日');
});

test('読了時間は500文字で1分、端数は切り上げ、最低1分', () => {
  assert.equal(readingTime(''), 1);
  assert.equal(readingTime('あ'.repeat(500)), 1);
  assert.equal(readingTime('あ'.repeat(501)), 2);
});

test('コードブロック・インラインコード・数式・HTMLタグ・表・空白は数えない', () => {
  const ignored = [
    '```py\n' + 'x'.repeat(2000) + '\n```',
    '`' + 'x'.repeat(600) + '`',
    '$$' + 'x'.repeat(600) + '$$',
    '$' + 'x'.repeat(600) + '$',
    '<div class="' + 'x'.repeat(600) + '">',
    '| ' + 'x'.repeat(600) + ' |',
    ' '.repeat(600),
  ].join('\n');
  assert.equal(readingTime(ignored + '\n' + 'あ'.repeat(500)), 1);
});
