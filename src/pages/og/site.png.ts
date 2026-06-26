/**
 * サイト共通 OGP 画像の生成エンドポイントです。
 * /og/site.png にアクセスすると静的な PNG 画像が返ります。
 *
 * 失敗時は 302 でデフォルト画像（/nasucat.webp など）にリダイレクトします。
 */
import { generateOgPng } from '../../lib/ogImage';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    const png = await generateOgPng({ type: 'site' });

    return new Response(png, {
      status: 200,
      headers: {
        'Content-Type':  'image/png',
        // 1年間キャッシュ（内容が変わる場合はサイト再ビルドで URL が変わるため問題なし）
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    // 生成に失敗してもビルドは止めない
    console.error('[og/site.png] OGP 画像生成に失敗しました:', err);
    return new Response(null, {
      status:  302,
      headers: { Location: '/nasucat.webp' },
    });
  }
};
