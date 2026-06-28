/**
 * OGP 画像（Open Graph Protocol 用の 1200×630px PNG）を生成するモジュールです。
 *
 * 技術スタック:
 *   - Satori:  HTML-like オブジェクト → SVG
 *   - Sharp:   SVG → PNG（既存依存）
 *   - @fontsource/noto-sans-jp: 日本語フォント
 *
 * 注意:
 *   - Satori は flex レイアウトのみ対応（grid は使わない）
 *   - フォントはビルド全体で1回だけ読み込みキャッシュする
 *   - 失敗してもビルドが止まらないよう、呼び出し元でエラーハンドリングすること
 */

import satori from 'satori';
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join } from 'path';

// ─────────────────────────────────────────────────────
// テーマカラー（tailwind.config.cjs と揃えること）
// ─────────────────────────────────────────────────────

const COLOR = {
  primary:   '#818cf8',  // ソフトインディゴ
  secondary: '#c084fc',  // ソフトパープル
  white:     '#ffffff',
  text:      '#1e2a3a',  // base-content に近い濃紺
  textLight: '#9ca3af',  // 薄いグレー（サブテキスト）
  bg:        '#ffffff',
} as const;

const OG_WIDTH  = 1200;
const OG_HEIGHT = 630;

// ─────────────────────────────────────────────────────
// フォントキャッシュ（ビルド全体で1回だけ読み込む）
// ─────────────────────────────────────────────────────

// process.cwd() はビルド実行時のプロジェクトルート（SSG プリレンダリングでも正しいパスを指す）
const FONT_DIR = join(process.cwd(), 'node_modules', '@fontsource', 'noto-sans-jp', 'files');

let fontCache: {
  latinRegular: Buffer;
  latinBold:    Buffer;
  jpRegular:    Buffer;
  jpBold:       Buffer;
} | null = null;

/**
 * フォントを読み込みます（初回のみ）。
 * ファイルが存在しない場合は例外を投げます。
 */
function loadFonts() {
  if (fontCache) return fontCache;

  // Satori は WOFF2 を解析できないため、WOFF1 (.woff) を使用する
  fontCache = {
    latinRegular: readFileSync(join(FONT_DIR, 'noto-sans-jp-latin-400-normal.woff')),
    latinBold:    readFileSync(join(FONT_DIR, 'noto-sans-jp-latin-700-normal.woff')),
    jpRegular:    readFileSync(join(FONT_DIR, 'noto-sans-jp-japanese-400-normal.woff')),
    jpBold:       readFileSync(join(FONT_DIR, 'noto-sans-jp-japanese-700-normal.woff')),
  };
  return fontCache;
}

// ─────────────────────────────────────────────────────
// OGP 画像の種類
// ─────────────────────────────────────────────────────

export type OgImageOptions =
  | { type: 'site' }
  | { type: 'blog'  | 'works'; title: string; tags?: string[] };

// ─────────────────────────────────────────────────────
// レイアウト定義（Satori の JSX-like オブジェクト）
// ─────────────────────────────────────────────────────

function buildSiteLayout(): any {
  return {
    type: 'div',
    props: {
      style: {
        width: `${OG_WIDTH}px`,
        height: `${OG_HEIGHT}px`,
        background: COLOR.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
      },
      children: [
        // "n" アイコン（丸角四角）
        {
          type: 'div',
          props: {
            style: {
              width: '120px',
              height: '120px',
              background: COLOR.primary,
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            },
            children: [{
              type: 'span',
              props: {
                style: { fontSize: '80px', fontWeight: 700, color: COLOR.white, lineHeight: 1 },
                children: 'n',
              },
            }],
          },
        },
        // サイト名
        {
          type: 'div',
          props: {
            style: { fontSize: '52px', fontWeight: 700, color: COLOR.text },
            children: 'なす | マイページ',
          },
        },
        // サブテキスト
        {
          type: 'div',
          props: {
            style: { fontSize: '28px', color: COLOR.textLight },
            children: '面倒なことはコンピュータにやらせよう',
          },
        },
        // URL
        {
          type: 'div',
          props: {
            style: { fontSize: '24px', color: COLOR.textLight },
            children: 'nasu.uk',
          },
        },
      ],
    },
  };
}

function buildArticleLayout(type: 'blog' | 'works', title: string, tags: string[]): any {
  const accentColor = type === 'blog' ? COLOR.primary : COLOR.secondary;
  const badgeLabel  = type === 'blog' ? 'Blog' : 'Works';

  // タグバッジは最大5個まで表示
  const visibleTags = tags.slice(0, 5);

  return {
    type: 'div',
    props: {
      style: {
        width: `${OG_WIDTH}px`,
        height: `${OG_HEIGHT}px`,
        background: COLOR.bg,
        display: 'flex',
        flexDirection: 'row',
      },
      children: [
        // 左端アクセントバー
        {
          type: 'div',
          props: {
            style: {
              width: '12px',
              height: '100%',
              background: accentColor,
              flexShrink: 0,
            },
          },
        },
        // メインコンテンツ
        {
          type: 'div',
          props: {
            style: {
              flex: 1,
              padding: '60px 72px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            },
            children: [
              // 上部: バッジ + URL
              {
                type: 'div',
                props: {
                  style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
                  children: [
                    // カテゴリバッジ
                    {
                      type: 'div',
                      props: {
                        style: {
                          background: accentColor,
                          color: COLOR.white,
                          fontSize: '28px',
                          fontWeight: 700,
                          padding: '8px 24px',
                          borderRadius: '9999px',
                        },
                        children: badgeLabel,
                      },
                    },
                    // URL
                    {
                      type: 'div',
                      props: {
                        style: { fontSize: '24px', color: COLOR.textLight },
                        children: 'nasu.uk',
                      },
                    },
                  ],
                },
              },
              // 中央: タイトル（最大3行）
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '56px',
                    fontWeight: 700,
                    color: COLOR.text,
                    lineHeight: 1.4,
                    // Satori はテキストの折り返しを自動でやってくれる
                    maxWidth: '100%',
                    overflow: 'hidden',
                  },
                  children: title,
                },
              },
              // 下部: タグバッジ一覧
              {
                type: 'div',
                props: {
                  style: { display: 'flex', flexWrap: 'wrap', gap: '12px' },
                  children: visibleTags.map((tag) => ({
                    type: 'div',
                    props: {
                      style: {
                        background: '#f3f4f6',
                        color: COLOR.text,
                        fontSize: '24px',
                        padding: '6px 18px',
                        borderRadius: '9999px',
                      },
                      children: `#${tag}`,
                    },
                  })),
                },
              },
            ],
          },
        },
      ],
    },
  };
}

// ─────────────────────────────────────────────────────
// メイン生成関数
// ─────────────────────────────────────────────────────

/**
 * OGP 画像を PNG として生成し、Buffer を返します。
 *
 * @throws フォントが読み込めない場合や Satori / Sharp が失敗した場合は例外を投げます。
 *         呼び出し元で try/catch して、失敗時はデフォルト画像へリダイレクトしてください。
 */
export async function generateOgPng(options: OgImageOptions): Promise<Buffer> {
  const fonts = loadFonts();

  // Satori の fonts 設定（日本語を含む記事タイトルのために latin + japanese 両方を読み込む）
  const satorifonts = [
    { name: 'NotoSansJP', data: fonts.latinRegular.buffer as ArrayBuffer, weight: 400 as const, style: 'normal' as const },
    { name: 'NotoSansJP', data: fonts.latinBold.buffer   as ArrayBuffer, weight: 700 as const, style: 'normal' as const },
    { name: 'NotoSansJP', data: fonts.jpRegular.buffer   as ArrayBuffer, weight: 400 as const, style: 'normal' as const },
    { name: 'NotoSansJP', data: fonts.jpBold.buffer      as ArrayBuffer, weight: 700 as const, style: 'normal' as const },
  ];

  // レイアウトを選択
  let layout: any;
  if (options.type === 'site') {
    layout = buildSiteLayout();
  } else {
    layout = buildArticleLayout(options.type, options.title, options.tags ?? []);
  }

  // Satori: JSX-like オブジェクト → SVG 文字列
  const svg = await satori(layout as any, {
    width:  OG_WIDTH,
    height: OG_HEIGHT,
    fonts:  satorifonts,
  });

  // Sharp: SVG → PNG バッファ
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return png;
}
