import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Element, ElementContent, Root } from 'hast';
import { rehypeExternalLinks, rehypeImageCaptions } from './articleHtml.ts';

const externalLinks = rehypeExternalLinks({ site: 'https://nasu.uk' });
const imageCaptions = rehypeImageCaptions();

function el(tagName: string, properties: Element['properties'] = {}, children: ElementContent[] = []): Element {
  return { type: 'element', tagName, properties, children };
}

function rootOf(...children: Element[]): Root {
  return { type: 'root', children };
}

function linkAttrs(href: string, properties: Element['properties'] = {}) {
  const a = el('a', { href, ...properties });
  externalLinks(rootOf(el('p', {}, [a])));
  return { target: a.properties.target, rel: a.properties.rel };
}

test('外部サイトへのリンクは新しいタブで開き、noopener noreferrer を付ける', () => {
  assert.deepEqual(linkAttrs('https://github.com/nasu726'), {
    target: '_blank',
    rel: ['noopener', 'noreferrer'],
  });
});

test('サイト内のリンク・自サイトの絶対URL・見出しリンク・メールはそのまま', () => {
  for (const href of ['/Blog/', 'https://nasu.uk/Works/', '#見出し', 'mailto:a@example.com']) {
    assert.deepEqual(linkAttrs(href), { target: undefined, rel: undefined }, href);
  }
});

test('既に付いている rel は残し、重複させない', () => {
  assert.deepEqual(linkAttrs('https://example.com/', { rel: ['nofollow', 'noopener'] }).rel, [
    'nofollow',
    'noopener',
    'noreferrer',
  ]);
});

test('入れ子の中のリンクも対象にする', () => {
  const a = el('a', { href: 'https://example.com/' });
  externalLinks(rootOf(el('details', {}, [el('ul', {}, [el('li', {}, [a])])])));
  assert.equal(a.properties.target, '_blank');
});

test('alt 付きの画像だけの段落は、alt をキャプションにした figure にする', () => {
  const img = el('img', { src: 'a.png', alt: '説明' });
  const tree = rootOf(el('p', {}, [{ type: 'text', value: '\n' }, img]));
  imageCaptions(tree);
  assert.deepEqual(tree.children[0], el('figure', {}, [img, el('figcaption', {}, [{ type: 'text', value: '説明' }])]));
});

test('alt が空の画像と、文中の画像はキャプションを付けない', () => {
  const noAlt = rootOf(el('p', {}, [el('img', { src: 'a.png', alt: '' })]));
  const inline = rootOf(el('p', {}, [{ type: 'text', value: '文中 ' }, el('img', { src: 'a.png', alt: '説明' })]));
  const before = structuredClone([noAlt, inline]);
  imageCaptions(noAlt);
  imageCaptions(inline);
  assert.deepEqual([noAlt, inline], before);
});
