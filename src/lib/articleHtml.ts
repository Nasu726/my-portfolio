// 記事本文の HTML（Markdown を変換した結果）を整える rehype プラグイン。
import type { Element, ElementContent, Root, RootContent } from 'hast';

type Parent = Root | Element;

function isWhitespace(node: RootContent): boolean {
  return node.type === 'text' && node.value.trim() === '';
}

/** href が、このサイト以外を指す http(s) のURLか。サイト内リンクや #見出し は対象外 */
function isExternal(href: string, site: URL): boolean {
  try {
    const url = new URL(href, site);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname !== site.hostname;
  } catch {
    return false;
  }
}

/** 外部サイトへのリンクを新しいタブで開く。
 *  rel="noopener" で、開いた先のページから元のタブを別のページへ移動させられないようにし
 *  （リバースタブナビング対策）、noreferrer でどのページから来たかも相手に伝えない */
export function rehypeExternalLinks({ site }: { site: string }) {
  const siteUrl = new URL(site);

  const visit = (node: Parent) => {
    for (const child of node.children) {
      if (child.type !== 'element') continue;
      if (child.tagName === 'a' && isExternal(String(child.properties.href ?? ''), siteUrl)) {
        // 既に付いている rel（nofollow など）は残す
        const rel = child.properties.rel;
        const current = Array.isArray(rel) ? rel.map(String) : String(rel ?? '').split(/\s+/);
        child.properties.target = '_blank';
        child.properties.rel = [...new Set([...current.filter(Boolean), 'noopener', 'noreferrer'])];
      }
      visit(child);
    }
  };

  return (tree: Root) => visit(tree);
}

/** 段落の中身が alt 付きの画像だけなら、その img 要素と alt を返す。文中の画像は対象外 */
function standaloneImage(node: RootContent): { img: Element; alt: string } | null {
  if (node.type !== 'element' || node.tagName !== 'p') return null;
  const content = node.children.filter((child) => !isWhitespace(child));
  if (content.length !== 1) return null;
  const [img] = content;
  if (img.type !== 'element' || img.tagName !== 'img') return null;
  const alt = String(img.properties.alt ?? '').trim();
  return alt ? { img, alt } : null;
}

/** `![説明](画像)` だけの段落を <figure> にし、説明（alt）を画像の下のキャプションにも出す */
export function rehypeImageCaptions() {
  const visit = (node: Parent) => {
    node.children = node.children.map((child) => {
      const image = standaloneImage(child);
      if (image) {
        const caption: Element = {
          type: 'element',
          tagName: 'figcaption',
          properties: {},
          children: [{ type: 'text', value: image.alt }],
        };
        return { type: 'element', tagName: 'figure', properties: {}, children: [image.img, caption] };
      }
      if (child.type === 'element') visit(child);
      return child;
    }) as ElementContent[];
  };

  return (tree: Root) => visit(tree);
}
