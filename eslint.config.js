import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import globals from 'globals';

export default defineConfig(
  { ignores: ['dist/', '.astro/', 'node_modules/'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      // 型情報を使うルール（no-deprecated）のため
      parserOptions: { projectService: true },
    },
    rules: {
      // 非推奨APIの使用をエラーにする（z.string().url() のような修正漏れを防ぐ）
      '@typescript-eslint/no-deprecated': 'error',
    },
  },
  {
    // astro-eslint-parser は projectService 非対応なので、.astro だけ project 指定にする
    files: ['**/*.astro'],
    languageOptions: {
      parserOptions: { projectService: false, project: true, extraFileExtensions: ['.astro'] },
    },
  },
);
