import { writeFileSync } from 'fs';
import type { BrowserManager } from '../browser-manager.js';
import type { MCPToolResponse } from '../types/index.js';

// Extract a simplified DOM structure
async function getSimplifiedStructure(page: import('playwright').Page): Promise<string> {
  const structure = await page.evaluate(() => {
    const result: string[] = [];
    const maxDepth = 4;
    const maxChildrenPerNode = 15;

    function getRole(el: Element): string {
      const role = el.getAttribute('role');
      if (role) return role;

      const tagRoles: Record<string, string> = {
        'A': 'link',
        'BUTTON': 'button',
        'INPUT': 'input',
        'IMG': 'image',
        'H1': 'heading',
        'H2': 'heading',
        'H3': 'heading',
        'H4': 'heading',
        'NAV': 'navigation',
        'MAIN': 'main',
        'HEADER': 'banner',
        'FOOTER': 'contentinfo',
        'FORM': 'form',
        'UL': 'list',
        'OL': 'list',
        'LI': 'listitem',
        'TABLE': 'table',
        'SELECT': 'combobox',
        'TEXTAREA': 'textbox',
      };
      return tagRoles[el.tagName] || el.tagName.toLowerCase();
    }

    function getName(el: Element): string {
      // Try aria-label first
      const ariaLabel = el.getAttribute('aria-label');
      if (ariaLabel) return ariaLabel;

      // Try title
      const title = el.getAttribute('title');
      if (title) return title;

      // Try alt for images
      if (el.tagName === 'IMG') {
        const alt = el.getAttribute('alt');
        if (alt) return alt;
      }

      // For links and buttons, get text content
      if (['A', 'BUTTON', 'H1', 'H2', 'H3', 'H4', 'LABEL'].includes(el.tagName)) {
        const text = el.textContent?.trim().substring(0, 50);
        if (text) return text;
      }

      // For inputs, get placeholder or name
      if (el.tagName === 'INPUT') {
        const placeholder = el.getAttribute('placeholder');
        if (placeholder) return placeholder;
        const name = el.getAttribute('name');
        if (name) return name;
      }

      return '';
    }

    function traverse(el: Element, depth: number) {
      if (depth > maxDepth) return;

      const role = getRole(el);
      const name = getName(el);
      const indent = '  '.repeat(depth);

      // Skip script, style, svg internals
      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH'].includes(el.tagName)) return;

      // Build node string
      let nodeStr = `${indent}- ${role}`;
      if (name) {
        nodeStr += ` "${name.substring(0, 60)}"`;
      }

      // Add useful attributes
      const attrs: string[] = [];
      if (el.tagName.match(/^H[1-6]$/)) {
        attrs.push(`level=${el.tagName[1]}`);
      }
      if (el instanceof HTMLInputElement) {
        attrs.push(`type=${el.type}`);
        if (el.value) attrs.push(`value="${el.value.substring(0, 20)}"`);
      }
      const href = el.getAttribute('href');
      if (href && href.startsWith('http')) {
        attrs.push(`href=${href.substring(0, 50)}`);
      }

      if (attrs.length > 0) {
        nodeStr += ` [${attrs.join('] [')}]`;
      }

      result.push(nodeStr);

      // Process children
      const children = Array.from(el.children).slice(0, maxChildrenPerNode);
      for (const child of children) {
        traverse(child, depth + 1);
      }

      if (el.children.length > maxChildrenPerNode) {
        result.push(`${indent}  ... and ${el.children.length - maxChildrenPerNode} more`);
      }
    }

    traverse(document.body, 0);
    return result.join('\n');
  });

  return structure;
}

export async function getContentTool(
  browserManager: BrowserManager,
  args: Record<string, unknown>
): Promise<MCPToolResponse> {
  try {
    const sessionId = args.session_id as string | undefined;
    const showBrowser = args.show_browser as boolean | undefined;
    const format = (args.format as string) || 'snapshot'; // 'snapshot', 'text', or 'html'

    const session = sessionId
      ? browserManager.getSession(sessionId)
      : await browserManager.getOrCreateDefaultSession(showBrowser);

    if (!session) {
      return {
        type: 'text',
        text: 'No browser session available',
      };
    }

    const title = await session.page.title();
    const url = session.page.url();

    // Default: Return simplified structure (like Playwright MCP's snapshot)
    if (format === 'snapshot') {
      const structure = await getSimplifiedStructure(session.page);

      // Limit total output
      const maxLength = 3000;
      const truncated = structure.length > maxLength;
      const output = truncated ? structure.substring(0, maxLength) + '\n... [truncated]' : structure;

      return {
        type: 'text',
        text: `Page: ${title}\nURL: ${url}\n\nPage Structure:\n${output}`,
      };
    }

    // Text format: Clean text extraction
    if (format === 'text') {
      let text = await session.page.locator('body').innerText();

      // Clean up text
      text = text
        .replace(/[\t\r]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/ {2,}/g, ' ')
        .trim();

      // Truncate
      const maxLength = 2000;
      if (text.length > maxLength) {
        text = text.substring(0, maxLength) + '\n\n... [truncated]';
      }

      return {
        type: 'text',
        text: `Page: ${title}\nURL: ${url}\n\nContent:\n${text}`,
      };
    }

    // HTML format: Save to current directory
    if (format === 'html') {
      const html = await session.page.content();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `page-content-${timestamp}.html`;
      writeFileSync(filename, html);

      return {
        type: 'text',
        text: `Page: ${title}\nURL: ${url}\n\nFull HTML saved to: ${filename}`,
      };
    }

    return {
      type: 'text',
      text: `Unknown format: ${format}. Use 'snapshot', 'text', or 'html'`,
    };
  } catch (error) {
    return {
      type: 'text',
      text: `Failed to get page content: ${error}`,
    };
  }
}
