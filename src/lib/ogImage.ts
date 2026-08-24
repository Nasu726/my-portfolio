import satori from 'satori';
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();

// OGP画像の標準サイズ。TwitterやSlackが大きいカードで表示する 1.91:1 の比率
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

// アイコンの描画サイズ。埋め込む元画像はRetina相当でその2倍の解像度にする
const ICON_RENDER_SIZE = 56;
const ICON_SOURCE_SIZE = ICON_RENDER_SIZE * 2;

// タイトルがこの文字数を超えたら、2行に収まるようフォントサイズを落とす
const TITLE_LENGTH_THRESHOLD = 30;
const TITLE_FONT_SIZE_LONG = '48px';
const TITLE_FONT_SIZE_SHORT = '60px';

// フォントを一度だけ読み込む
function loadFont(file: string): Buffer | null {
  try {
    return readFileSync(join(root, 'public/fonts/Noto_Sans_JP/static', file));
  } catch {
    return null;
  }
}

let fontCache: { regular: Buffer | null; bold: Buffer | null } | null = null;
function getFonts() {
  if (fontCache === null) {
    fontCache = {
      regular: loadFont('NotoSansJP-Regular.ttf'),
      bold: loadFont('NotoSansJP-Bold.ttf'),
    };
  }
  return fontCache;
}

// nasucat.webp をアイコンとして埋め込む。
// satori は WebP をデコードできない（`a is not iterable` を投げる）ため、
// 必ず sharp で PNG に変換してからデータURL化する。
let nasucatDataUrl: string | null = null;
async function getNasucatDataUrl(): Promise<string> {
  if (nasucatDataUrl === null) {
    try {
      const buf = readFileSync(join(root, 'public/nasucat.webp'));
      const png = await sharp(buf).resize(ICON_SOURCE_SIZE, ICON_SOURCE_SIZE).png().toBuffer();
      nasucatDataUrl = `data:image/png;base64,${png.toString('base64')}`;
    } catch {
      // アイコンだけのために画像全体を失敗させない。アイコンなしで描画を続ける
      nasucatDataUrl = '';
    }
  }
  return nasucatDataUrl;
}

export interface OGImageOptions {
  title: string;
  description: string;
  label?: string; // "Blog" | "Works" | "Portfolio" など
}

export async function generateOGImage(opts: OGImageOptions): Promise<Buffer> {
  const { title, description, label = 'nasu' } = opts;
  const icon = await getNasucatDataUrl();
  const { regular, bold } = getFonts();

  // Regular(400) だけでなく Bold(700) も登録する。
  // 登録しないと fontWeight: 700 を指定したタイトル・ラベルが太字にならない。
  const toArrayBuffer = (b: Buffer) =>
    b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;

  const fonts: Parameters<typeof satori>[1]['fonts'] = [
    ...(regular ? [{ name: 'NotoSansJP', data: toArrayBuffer(regular), weight: 400 as const }] : []),
    ...(bold ? [{ name: 'NotoSansJP', data: toArrayBuffer(bold), weight: 700 as const }] : []),
  ];

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: `${OG_WIDTH}px`,
          height: `${OG_HEIGHT}px`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 72px',
          background: 'linear-gradient(135deg, #faf5ff 0%, #f0e6ff 50%, #e8d5f5 100%)',
          fontFamily: fonts.length > 0 ? 'NotoSansJP' : 'sans-serif',
          position: 'relative',
        },
        children: [
          // ラベル
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '32px',
              },
              children: [
                // アイコン
                icon
                  ? {
                      type: 'img',
                      props: {
                        src: icon,
                        width: ICON_RENDER_SIZE,
                        height: ICON_RENDER_SIZE,
                        style: {
                          borderRadius: '50%',
                          border: '3px solid #c4b5fd',
                        },
                      },
                    }
                  : null,
                {
                  type: 'span',
                  props: {
                    style: {
                      fontSize: '22px',
                      fontWeight: 700,
                      color: '#7c3aed',
                    },
                    children: `nasu · ${label}`,
                  },
                },
              ].filter(Boolean),
            },
          },
          // タイトル
          {
            type: 'div',
            props: {
              style: {
                fontSize:
                  title.length > TITLE_LENGTH_THRESHOLD
                    ? TITLE_FONT_SIZE_LONG
                    : TITLE_FONT_SIZE_SHORT,
                fontWeight: 700,
                color: '#1e1b4b',
                lineHeight: 1.3,
                marginBottom: '20px',
                maxWidth: '1056px',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              },
              children: title,
            },
          },
          // 説明文
          {
            type: 'div',
            props: {
              style: {
                fontSize: '26px',
                color: '#6b7280',
                lineHeight: 1.6,
                maxWidth: '980px',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              },
              children: description,
            },
          },
          // 右下の装飾
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                bottom: '40px',
                right: '72px',
                fontSize: '18px',
                color: '#a78bfa',
              },
              children: 'nasu726.dev',
            },
          },
        ],
      },
    },
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      fonts,
    },
  );

  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** OG画像ルート共通のレスポンス生成。
 *  生成に失敗しても単色のフォールバック画像を返してビルドは通すが、
 *  理由を console.error に出す。
 *  （以前、satoriがWebPを読めずに例外を投げていたのを catch が握り潰し、
 *    全記事が単色画像のまま本番に出続けていたため） */
export async function createOGImageResponse(opts: OGImageOptions): Promise<Response> {
  try {
    const png = await generateOGImage(opts);
    return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
  } catch (e) {
    console.error(`[og] OG画像の生成に失敗しました: "${opts.title}"\n`, e);
    const fallback = await sharp({
      create: {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        channels: 3,
        background: { r: 232, g: 213, b: 245 },
      },
    })
      .png()
      .toBuffer();
    return new Response(new Uint8Array(fallback), { headers: { 'Content-Type': 'image/png' } });
  }
}
