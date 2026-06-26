/** @type {import('tailwindcss').Config} */
module.exports = {
  // data-theme 属性でダークモードを切り替える（DaisyUI の方式）
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Helvetica Neue',
          'Arial',
          'Meiryo',
          'Hiragino Gothic',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui')],
  daisyui: {
    themes: [
      {
        // カスタムライトテーマ（白ベース + ソフトインディゴのプライマリ）
        light: {
          primary:           'hsl(248 87% 73%)',  // #818cf8 ソフトインディゴ
          'primary-content': 'hsl(0 0% 100%)',
          secondary:         'hsl(292 47% 74%)',  // #c084fc ソフトパープル
          'secondary-content':'hsl(0 0% 100%)',
          accent:            'hsl(160 60% 65%)',  // #6ee7b7 ソフトティール
          'accent-content':  'hsl(0 0% 15%)',
          neutral:           'hsl(220 9% 46%)',
          'neutral-content': 'hsl(0 0% 100%)',
          'base-100':        'hsl(0 0% 100%)',    // #ffffff 白（メイン背景）
          'base-200':        'hsl(220 14% 96%)',  // 薄グレー（サブ背景）
          'base-300':        'hsl(220 13% 91%)',  // ボーダー
          'base-content':    'hsl(220 43% 11%)',  // テキスト（濃紺）
          info:              'hsl(212 85% 68%)',
          success:           'hsl(142 69% 58%)',
          warning:           'hsl(38 92% 65%)',
          error:             'hsl(0 84% 70%)',
        },
      },
      // DaisyUI 組み込みのダークテーマ
      'dark',
    ],
    defaultTheme: 'light',
    logs: false,
  },
};
