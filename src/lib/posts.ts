// ブログ記事の公開判定（予約投稿）。
// このサイトは静的サイトなので「ビルドした時点で公開時刻を過ぎている記事」だけを出力する。
// 公開日のうちに記事を出すため、公開時刻を迎えた記事がある日は空コミットを push して
// Cloudflare Pages に再ビルドさせている（.github/workflows/scheduled-publish.yml）。

// 日本時間は UTC+9
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** frontmatter の pubDate（日付のみ）が示す日の、日本時間0時0分の時刻を返す。
 *  `pubDate: 2026-12-01` は UTC の0時として読み込まれるため、UTC の年月日を取り出して
 *  日本時間の0時（= 前日 UTC 15時）に直す。ビルドするマシンのタイムゾーンに依存しない。 */
export function publishAt(pubDate: Date): Date {
  const utcMidnight = Date.UTC(
    pubDate.getUTCFullYear(),
    pubDate.getUTCMonth(),
    pubDate.getUTCDate(),
  );
  return new Date(utcMidnight - JST_OFFSET_MS);
}

/** 記事を出力してよいか。下書きと、公開時刻前の記事は出力しない。
 *  出力しない記事はページ自体が生成されないので、URLを直接打っても404になる。 */
export function isPublished(
  data: { draft: boolean; pubDate: Date },
  now: Date = new Date(),
  showScheduled: boolean = import.meta.env?.DEV ?? false,
): boolean {
  if (data.draft) return false;
  // 開発サーバー（npm run dev）では予約中の記事も表示し、公開前に見た目を確認できるようにする
  if (showScheduled) return true;
  return publishAt(data.pubDate) <= now;
}

/** 前回のビルド（= 最後の push）以降に公開時刻を迎えた記事があるか。
 *  あれば本番を再ビルドする必要がある。定期実行が飛んだ日があっても、次の実行で拾える。 */
export function hasNewlyPublished(
  posts: { draft: boolean; pubDate: Date }[],
  lastBuild: Date,
  now: Date = new Date(),
): boolean {
  return posts.some((p) => {
    if (p.draft) return false;
    const at = publishAt(p.pubDate);
    return lastBuild < at && at <= now;
  });
}
