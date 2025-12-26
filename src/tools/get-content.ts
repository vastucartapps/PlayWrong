import { writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import type { BrowserManager } from '../browser-manager.js';
import type { MCPToolResponse } from '../types/index.js';

export async function getContentTool(
  browserManager: BrowserManager,
  args: Record<string, unknown>
): Promise<MCPToolResponse> {
  try {
    const sessionId = args.session_id as string | undefined;
    const includeHtml = args.include_html === true; // Default FALSE now
    const showBrowser = args.show_browser as boolean | undefined;
    const maxTextLength = (args.max_length as number) || 5000;

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
    let text = await session.page.locator('body').innerText();

    // Truncate text if too long
    const wasTruncated = text.length > maxTextLength;
    if (wasTruncated) {
      text = text.substring(0, maxTextLength) + '\n\n... [truncated]';
    }

    let response = `Page: ${title}\nURL: ${url}\n\nContent:\n${text}`;

    // If HTML requested, save to file instead of returning inline
    if (includeHtml) {
      const html = await session.page.content();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `page-content-${timestamp}.html`;
      const filepath = join(tmpdir(), filename);
      writeFileSync(filepath, html);
      response += `\n\nFull HTML saved to: ${filepath}`;
    }

    return {
      type: 'text',
      text: response,
    };
  } catch (error) {
    return {
      type: 'text',
      text: `Failed to get page content: ${error}`,
    };
  }
}
