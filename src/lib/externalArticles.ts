import { EXTERNAL_BLOG_SOURCES, type ExternalBlogService } from '../config';
import { stripMarkdown } from './utils';

export type ExternalArticle = {
  title:      string;
  description: string;
  pubDate:    Date;
  url:        string;
  tags:       string[];
  source:     ExternalBlogService;
};

// ── Qiita ──────────────────────────────────────────────

async function fetchQiitaArticles(apiUrl: string): Promise<ExternalArticle[]> {
  const headers: Record<string, string> = { 'User-Agent': 'nasu-portfolio/1.0' };
  if (process.env.QIITA_TOKEN) headers['Authorization'] = `Bearer ${process.env.QIITA_TOKEN}`;

  const res = await fetch(apiUrl, { headers });
  if (!res.ok) throw new Error(`Qiita API error: ${res.status}`);

  const items = await res.json() as any[];
  return items
    .filter((item: any) => !item.private && item.user?.id === 'nasu726')
    .map((item: any): ExternalArticle => ({
      title:       item.title,
      description: stripMarkdown(item.body || item.title),
      pubDate:     new Date(item.created_at),
      url:         item.url,
      tags:        (item.tags || []).map((t: any) => t.name),
      source:      'qiita',
    }));
}

// ── はてなブログ (RSS) ─────────────────────────────────

function extractCdata(block: string, tag: string): string {
  return block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`))?.[1] ?? '';
}

function extractText(block: string, tag: string): string {
  return block.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`))?.[1]?.trim() ?? '';
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function fetchHatenaBlogArticles(rssUrl: string): Promise<ExternalArticle[]> {
  const res = await fetch(rssUrl, { headers: { 'User-Agent': 'nasu-portfolio/1.0' } });
  if (!res.ok) throw new Error(`Hatena Blog RSS error: ${res.status} (${rssUrl})`);

  const xml = await res.text();
  const articles: ExternalArticle[] = [];

  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;

  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];

    const title = extractCdata(block, 'title') || extractText(block, 'title');
    const link  = extractText(block, 'link');
    if (!title || !link) continue;

    const rawDesc   = extractCdata(block, 'description') || extractText(block, 'description');
    const pubDate   = new Date(extractText(block, 'pubDate'));
    const subjects  = [...block.matchAll(/<dc:subject><!\[CDATA\[([\s\S]*?)\]\]><\/dc:subject>/g)].map(x => x[1]);
    const cats      = [...block.matchAll(/<category><!\[CDATA\[([\s\S]*?)\]\]><\/category>/g)].map(x => x[1]);
    const tags      = [...new Set([...subjects, ...cats])].filter(Boolean);

    articles.push({
      title,
      description: stripMarkdown(stripHtml(rawDesc)).slice(0, 200),
      pubDate,
      url: link,
      tags,
      source: 'hatenablog',
    });
  }

  return articles;
}

// ── ディスパッチ ────────────────────────────────────────

const FETCHER_MAP: Record<ExternalBlogService, (apiUrl: string) => Promise<ExternalArticle[]>> = {
  qiita:      fetchQiitaArticles,
  hatenablog: fetchHatenaBlogArticles,
};

export async function fetchAllExternalArticles(): Promise<ExternalArticle[]> {
  const results = await Promise.allSettled(
    EXTERNAL_BLOG_SOURCES.map(src => FETCHER_MAP[src.service](src.apiUrl))
  );

  const articles: ExternalArticle[] = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      articles.push(...r.value);
    } else {
      console.warn(`[externalArticles] ${EXTERNAL_BLOG_SOURCES[i].service} の取得失敗:`, r.reason);
    }
  });
  return articles;
}
