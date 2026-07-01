import satori from 'satori';
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();

// フォントを一度だけ読み込む
let notoSansBuffer: Buffer | null = null;
function getNotoFont(): Buffer | null {
  if (notoSansBuffer === null) {
    try {
      const fontPath = join(root, 'public/fonts/Noto_Sans_JP/static/NotoSansJP-Regular.ttf');
      notoSansBuffer = readFileSync(fontPath);
    } catch {
      notoSansBuffer = Buffer.alloc(0);
    }
  }
  return notoSansBuffer.length > 0 ? notoSansBuffer : null;
}

// nasucat.webp を base64 で読み込む
let nasucatDataUrl: string;
function getNasucatDataUrl(): string {
  if (!nasucatDataUrl) {
    try {
      const imgPath = join(root, 'public/nasucat.webp');
      const buf = readFileSync(imgPath);
      nasucatDataUrl = `data:image/webp;base64,${buf.toString('base64')}`;
    } catch {
      nasucatDataUrl = '';
    }
  }
  return nasucatDataUrl;
}

interface OGImageOptions {
  title: string;
  description: string;
  label?: string; // "Blog" | "Works"
}

export async function generateOGImage(opts: OGImageOptions): Promise<Buffer> {
  const { title, description, label = 'nasu' } = opts;
  const icon = getNasucatDataUrl();
  const font = getNotoFont();

  const fonts: Parameters<typeof satori>[1]['fonts'] = font
    ? [{ name: 'NotoSansJP', data: font.buffer.slice(font.byteOffset, font.byteOffset + font.byteLength) as ArrayBuffer, weight: 400 }]
    : [];

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
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
                        width: 56,
                        height: 56,
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
                fontSize: title.length > 30 ? '48px' : '60px',
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
      width: 1200,
      height: 630,
      fonts,
    },
  );

  return sharp(Buffer.from(svg)).png().toBuffer();
}
