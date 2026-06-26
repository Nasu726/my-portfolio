/**
 * サイト全体の設定を一元管理するファイルです。
 * ナビゲーション、ソーシャルリンク、外部ブログの設定など、
 * よく変更する設定をここに書くことで、一箇所の変更でサイト全体に反映されます。
 *
 * 使い方：
 *   import { SITE, NAV_ITEMS, SOCIAL_LINKS } from '../config';
 */

// ─────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────

export type NavItem = {
  label: string;
  href: string;
  external?: boolean; // true のとき target="_blank" で開く
};

export type SocialLink = {
  service: string;  // サービス名（aria-label 用）
  url: string;
  icon: string;     // SVG の path d 属性の値（viewBox="0 0 24 24" 想定）
  ariaLabel: string;
};

// 新しいブログサービスを追加する場合は、まずこの型にサービス名を追加してください
// 例: export type ExternalBlogService = 'qiita' | 'zenn' | 'note';
export type ExternalBlogService = 'qiita' | 'zenn';

export type ExternalBlogSource = {
  service: ExternalBlogService;
  userId: string;
  apiUrl: string;
};

// ─────────────────────────────────────────────────────
// サイト基本情報
// ここを変更するとヘッダー・OGP・フッターなどに反映されます
// ─────────────────────────────────────────────────────

export const SITE = {
  title: 'なす | マイページ',
  description:
    'なすのマイページです。プロフィール、今までに作成したプロジェクトとブログ、本棚を公開しています。',
  url: 'https://nasu.uk',
  author: 'nasu',
  twitterHandle: 'ueCube24_1', // @ なし
  defaultOgImage: '/og/site.png',
} as const;

// ─────────────────────────────────────────────────────
// ナビゲーション項目
// 新しいページを追加する場合は、この配列にオブジェクトを追加するだけです
// （BaseLayout の Sidebar が自動的に反映します）
// ─────────────────────────────────────────────────────

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home',      href: '/'          },
  { label: 'Works',     href: '/works'     },
  { label: 'Blog',      href: '/blog'      },
  { label: 'My Career', href: '/my-career' },
];

// ─────────────────────────────────────────────────────
// ソーシャルリンク
// 新しいサービスを追加する場合は、この配列にオブジェクトを追加してください
// icon には SVG の path d 属性の値を入れてください（viewBox="0 0 24 24" を想定）
// ─────────────────────────────────────────────────────

export const SOCIAL_LINKS: SocialLink[] = [
  {
    service: 'GitHub',
    url: 'https://github.com/Nasu726',
    ariaLabel: 'GitHub',
    icon: 'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z',
  },
  {
    service: 'Twitter / X',
    url: 'https://twitter.com/ueCube24_1',
    ariaLabel: 'Twitter / X',
    icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.735-8.845L1.254 2.25H8.08l4.261 5.634L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  },
  {
    service: 'Qiita',
    url: 'https://qiita.com/nasu726',
    ariaLabel: 'Qiita',
    icon: 'M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z',
  },
  {
    service: 'Zenn',
    url: 'https://zenn.dev/nasu726',
    ariaLabel: 'Zenn',
    icon: 'M.264 23.771h4.984c.264 0 .498-.147.645-.352L19.614.874c.176-.293-.029-.645-.381-.645h-4.72c-.235 0-.44.117-.557.323L.03 23.361c-.088.176.029.41.234.41zM17.445 23.419l6.479-10.408c.205-.323-.029-.733-.41-.733h-4.691c-.176 0-.352.088-.44.235l-6.655 10.643c-.176.264.029.616.352.616h4.72c.234-.001.41-.118.645-.353z',
  },
  {
    service: 'note',
    url: 'https://note.com/nasu726',
    ariaLabel: 'note',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z',
  },
  {
    service: 'RSS',
    url: '/rss.xml',
    ariaLabel: 'RSS Feed',
    icon: 'M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z',
  },
];

// ─────────────────────────────────────────────────────
// 外部ブログソース
// 特定のサービスを無効化したい場合は、その行をコメントアウトしてください
//
// 新しいサービスを追加する手順:
//   1. 上の ExternalBlogService 型に新しいサービス名を追加する
//   2. src/lib/externalArticles.ts に fetcher 関数を追加する
//   3. externalArticles.ts の FETCHER_MAP にエントリを追加する
//   4. src/components/ExternalArticleCard.astro の SOURCE_BADGE にバッジ情報を追加する
//   5. この配列にエントリを追加する（ここを編集するだけで有効になる）
// ─────────────────────────────────────────────────────

export const EXTERNAL_BLOG_SOURCES: ExternalBlogSource[] = [
  {
    service: 'qiita',
    userId: 'nasu726',
    // 認証なし: 60 req/時間（IP 単位）。認証ありにするには環境変数 QIITA_TOKEN を設定。
    apiUrl: 'https://qiita.com/api/v2/users/nasu726/items?per_page=100',
  },
  {
    service: 'zenn',
    userId: 'nasu726',
    // Zenn の非公式 API。安定しているが公式サポートなし。
    apiUrl: 'https://zenn.dev/api/articles?username=nasu726&order=latest',
  },
];

// ─────────────────────────────────────────────────────
// "New" バッジの設定
// この日数以内に公開された記事・作品に "New" バッジが表示されます
// ─────────────────────────────────────────────────────

export const BADGE = {
  newDays: 30, // 30日以内なら "New" バッジを表示
} as const;

// ─────────────────────────────────────────────────────
// ホームページの表示件数
// ─────────────────────────────────────────────────────

export const HOME = {
  latestWorksCount: 3, // ホームに表示する最新 Works の件数
  latestBlogCount: 3,  // ホームに表示する最新 Blog の件数
} as const;
