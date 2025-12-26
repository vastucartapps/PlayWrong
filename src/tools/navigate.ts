import type { BrowserManager } from '../browser-manager.js';
import type { MCPToolResponse, NavigateResult } from '../types/index.js';

export async function navigateTool(
  browserManager: BrowserManager,
  args: Record<string, unknown>
): Promise<MCPToolResponse> {
  try {
    const url = args.url as string;
    const sessionId = args.session_id as string | undefined;
    const showBrowser = args.show_browser as boolean | undefined;

    if (!url) {
      return {
        type: 'text',
        text: 'Error: url parameter is required',
      };
    }

    const session = sessionId
      ? browserManager.getSession(sessionId)
      : await browserManager.getOrCreateDefaultSession(showBrowser);

    if (!session) {
      return {
        type: 'text',
        text: 'No browser session available',
      };
    }

    await session.page.goto(url, { waitUntil: 'domcontentloaded' });

    const result: NavigateResult = {
      success: true,
      url: session.page.url(),
      title: await session.page.title(),
      timestamp: new Date().toISOString(),
    };

    return {
      type: 'text',
      text: JSON.stringify(result, null, 2),
    };
  } catch (error) {
    return {
      type: 'text',
      text: `Failed to navigate: ${error}`,
    };
  }
}
