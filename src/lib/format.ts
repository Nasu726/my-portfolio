// 記事・作品の表示用の整形。

// frontmatter の日付（`pubDate: 2026-04-01`）は UTC の0時として読み込まれるので、
// UTC で表示すればビルドするマシンのタイムゾーンによらず書いた日付のまま出る
const DATE_FORMAT = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
});

/** 「2026年4月1日」の形にする */
export function formatDate(date: Date): string {
  return DATE_FORMAT.format(date);
}

// 1分で読める文字数
const CHARS_PER_MINUTE = 500;

/** 読了時間（分）。コードブロック・数式・HTMLタグ・表を除いた文字数から求める。最低1分 */
export function readingTime(body: string): number {
  const cleaned = body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]+`/g, '')
    .replace(/\$\$[\s\S]*?\$\$/g, '')
    .replace(/\$[^$\n]+\$/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/^\s*\|.*\|\s*$/gm, '');
  const chars = cleaned.replace(/\s+/g, '').length;
  return Math.max(1, Math.ceil(chars / CHARS_PER_MINUTE));
}
