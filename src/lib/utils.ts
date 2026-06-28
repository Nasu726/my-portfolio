/**
 * サイト全体で使う汎用ユーティリティ関数です。
 *
 * 使い方：
 *   import { formatDate, isNew, stripMarkdown, collectTags } from '../lib/utils';
 */

import dayjs from 'dayjs';
import { BADGE } from '../config';

// ─────────────────────────────────────────────────────
// 日付フォーマット
// ─────────────────────────────────────────────────────

/**
 * Date オブジェクトを "2026年1月8日" 形式の文字列に変換します。
 */
export function formatDate(date: Date): string {
  return dayjs(date).format('YYYY年M月D日');
}

// ─────────────────────────────────────────────────────
// "New" バッジ判定
// ─────────────────────────────────────────────────────

/**
 * 指定した日付が BADGE.newDays 以内なら true を返します。
 * BlogCard、WorkCard、ExternalArticleCard で使います。
 */
export function isNew(date: Date): boolean {
  const now = dayjs();
  const pub = dayjs(date);
  return now.diff(pub, 'day') <= BADGE.newDays;
}

// ─────────────────────────────────────────────────────
// Markdown 除去
// ─────────────────────────────────────────────────────

/**
 * 外部記事の本文に含まれる Markdown 記法を除去して、
 * プレーンテキストの先頭部分を返します。
 * ExternalArticle の description 生成に使います。
 */
export function stripMarkdown(text: string, maxLength = 120): string {
  return text
    .replace(/```[\s\S]*?```/g, '')        // コードブロック除去
    .replace(/`[^`]*`/g, '')               // インラインコード除去
    .replace(/!\[.*?\]\(.*?\)/g, '')       // 画像除去
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1') // リンクのテキストを残す
    .replace(/#{1,6}\s/g, '')              // 見出し記号除去
    .replace(/[*_~>]/g, '')               // 装飾記号除去
    .replace(/\n+/g, ' ')                 // 改行をスペースに
    .trim()
    .slice(0, maxLength);
}

// ─────────────────────────────────────────────────────
// タグ一覧生成
// ─────────────────────────────────────────────────────

/**
 * 複数のタグ配列を受け取って、重複なし・ソート済みの配列を返します。
 * blog/index.astro などでタグ一覧を作るのに使います。
 */
export function collectTags(tagArrays: string[][]): string[] {
  return [...new Set(tagArrays.flat())].filter(Boolean).sort();
}

// ─────────────────────────────────────────────────────
// 読了時間推定
// ─────────────────────────────────────────────────────

/**
 * Markdown 本文の文字数から読了時間（分）を推定します。
 * 日本語は約 500 字/分を基準にしています。
 */
export function calcReadingTime(text: string): number {
  const noCode = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '');
  const charCount = noCode.replace(/\s/g, '').length;
  return Math.max(1, Math.ceil(charCount / 500));
}
