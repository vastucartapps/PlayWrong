import type { BrowserManager } from '../browser-manager.js';
import type { MCPToolResponse, PageContentResult } from '../types/index.js';

export async function getContentTool(
  browserManager: BrowserManager,
  args: Record<string, unknown>
): Promise<MCPToolResponse> {
  try {
    const sessionId = args.session_id as string | undefined;
    const includeHtml = args.include_html !== false; // Default true
    const showBrowser = args.show_browser as boolean | undefined;

    const session = sessionId
      ? browserManager.getSession(sessionId)
      : await browserManager.getOrCreateDefaultSession(showBrowser);

    if (!session) {
      return {
        type: 'text',
        text: 'No browser session available',
      };
    }

    const html = includeHtml ? await session.page.content() : '';
    const text = await session.page.locator('body').innerText();
    const title = await session.page.title();
    const url = session.page.url();

    const result: PageContentResult = {
      html: html,
      text: text,
      title: title,
      url: url,
    };

    return {
      type: 'text',
      text: JSON.stringify(result, null, 2),
    };
  } catch (error) {
    return {
      type: 'text',
      text: `Failed to get page content: ${error}`,
    };
  }
}
