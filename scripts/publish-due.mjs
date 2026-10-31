// 定期実行（.github/workflows/scheduled-publish.yml）から呼ばれ、
// 本番の再ビルドが必要なら "true"、不要なら "false" を出力する。
// 「最後のコミット以降に公開時刻を迎えた記事があるか」で判定する。
// Pages は push のたびにビルドされるので、最後のコミット時刻 ≒ 最後のビルド時刻。
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { hasNewlyPublished } from '../src/lib/posts.ts';

const BLOG_DIR = 'src/content/blog';

const posts = readdirSync(BLOG_DIR, { recursive: true })
  .filter((f) => f.endsWith('.md'))
  .map((f) => {
    const text = readFileSync(join(BLOG_DIR, f), 'utf8');
    const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
    const pubDate = frontmatter.match(/^pubDate:\s*["']?([\d-]+)/m)?.[1];
    return {
      draft: /^draft:\s*true\b/m.test(frontmatter),
      pubDate: pubDate ? new Date(pubDate) : new Date(NaN),
    };
  })
  .filter((p) => !Number.isNaN(p.pubDate.valueOf()));

const lastCommit = new Date(execSync('git log -1 --format=%cI').toString().trim());

console.log(hasNewlyPublished(posts, lastCommit) ? 'true' : 'false');
