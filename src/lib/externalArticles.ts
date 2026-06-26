/**
 * Qiita・Zenn などの外部ブログサービスから記事を取得するモジュールです。
 * Astro のビルド時（SSG）にのみ実行されます。ブラウザには届きません。
 *
 * 新しいサービスを追加する手順:
 *   1. src/config.ts の ExternalBlogService 型にサービス名を追加する
 *   2. このファイルに fetchXxx() 関数を追加する
 *   3. FETCHER_MAP に追加する
 *   4. src/components/ExternalArticleCard.astro の SOURCE_BADGE に追加する
 *   5. src/config.ts の EXTERNAL_BLOG_SOURCES にエントリを追加する（これで有効化）
 */

import { EXTERNAL_BLOG_SOURCES, type ExternalBlogService } from '../config';
import { stripMarkdown } from './utils';

// ─────────────────────────────────────────────────────
// 外部記事の共通型
// ─────────────────────────────────────────────────────

export type ExternalArticle = {
  title:       string;
  description: string;   // Markdown 除去済みの本文先頭（プレーンテキスト）
  pubDate:     Date;
  url:         string;   // 外部サービスの記事 URL
  tags:        string[];
  source:      ExternalBlogService;
  heroImage?:  string;   // OGP 画像（取得できる場合のみ）
};

// ─────────────────────────────────────────────────────
// Qiita 記事フェッチャー
// ─────────────────────────────────────────────────────

async function fetchQiitaArticles(apiUrl: string): Promise<ExternalArticle[]> {
  // 認証トークンがあればリクエストレート制限を緩和できます（1000 req/h）
  const headers: Record<string, string> = {
    'User-Agent': 'nasu-portfolio/1.0',
  };
  if (process.env.QIITA_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.QIITA_TOKEN}`;
  }

  const res = await fetch(apiUrl, { headers });
  if (!res.ok) throw new Error(`Qiita API error: ${res.status}`);

  const items = await res.json() as any[];

  // 非公開記事（private: true）は除外する
  return items
    .filter((item: any) => !item.private)
    .map((item: any): ExternalArticle => ({
      title:       item.title,
      description: stripMarkdown(item.body || item.title),
      pubDate:     new Date(item.created_at),
      url:         item.url,
      tags:        (item.tags || []).map((t: any) => t.name),
      source:      'qiita',
    }));
}

// ─────────────────────────────────────────────────────
// Zenn 記事フェッチャー
// ─────────────────────────────────────────────────────

async function fetchZennArticles(apiUrl: string): Promise<ExternalArticle[]> {
  const res = await fetch(apiUrl, {
    // User-Agent を設定しないとブロックされることがある
    headers: { 'User-Agent': 'nasu-portfolio/1.0' },
  });
  if (!res.ok) throw new Error(`Zenn API error: ${res.status}`);

  const data = await res.json() as any;
  const articles: any[] = data.articles || [];

  return articles.map((item: any): ExternalArticle => ({
    title:       item.title,
    description: stripMarkdown(item.body_letters_count > 0 ? item.title : item.title),
    pubDate:     new Date(item.published_at),
    url:         `https://zenn.dev${item.path}`,
    tags:        item.topics ? item.topics.map((t: any) => t.name) : [],
    source:      'zenn',
    heroImage:   item.cover_image_url || undefined,
  }));
}

// ─────────────────────────────────────────────────────
// サービス → フェッチャー のマッピング
// 新しいサービスを追加したらここにも追加してください
// Record<ExternalBlogService, ...> にすることで追加漏れを型エラーで検出できます
// ─────────────────────────────────────────────────────

const FETCHER_MAP: Record<ExternalBlogService, (apiUrl: string) => Promise<ExternalArticle[]>> = {
  qiita: fetchQiitaArticles,
  zenn:  fetchZennArticles,
};

// ─────────────────────────────────────────────────────
// 全サービスを並列取得する関数
// ─────────────────────────────────────────────────────

/**
 * config.ts の EXTERNAL_BLOG_SOURCES に設定された全サービスから記事を取得します。
 *
 * Promise.allSettled を使うことで、一部のサービスが失敗しても
 * 他のサービスの結果は正常に返ります（Promise.all だと1つでも失敗すると全て失敗する）。
 */
export async function fetchAllExternalArticles(): Promise<ExternalArticle[]> {
  const results = await Promise.allSettled(
    EXTERNAL_BLOG_SOURCES.map((source) => {
      const fetcher = FETCHER_MAP[source.service];
      return fetcher(source.apiUrl);
    })
  );

  const articles: ExternalArticle[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      articles.push(...result.value);
    } else {
      // 失敗してもビルドは続行。ログだけ出す。
      console.warn(
        `[externalArticles] ${EXTERNAL_BLOG_SOURCES[index].service} の記事取得に失敗しました:`,
        result.reason
      );
    }
  });

  return articles;
}
