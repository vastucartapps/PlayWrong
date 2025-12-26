import type { BrowserManager } from '../browser-manager.js';
import type { MCPToolResponse, WaitForResult } from '../types/index.js';

export async function waitForTool(
  browserManager: BrowserManager,
  args: Record<string, unknown>
): Promise<MCPToolResponse> {
  try {
    const selector = args.selector as string;
    const timeoutMs = (args.timeout_ms as number) || 30000;
    const sessionId = args.session_id as string | undefined;
    const showBrowser = args.show_browser as boolean | undefined;

    if (!selector) {
      return {
        type: 'text',
        text: 'Error: selector parameter is required',
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

    const startTime = Date.now();

    try {
      await session.page.locator(selector).waitFor({ timeout: timeoutMs });

      const waitTime = Date.now() - startTime;

      const result: WaitForResult = {
        success: true,
        message: `Element appeared: ${selector}`,
        elementFound: true,
        waitTimeMs: waitTime,
      };

      return {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      };
    } catch {
      const waitTime = Date.now() - startTime;

      const result: WaitForResult = {
        success: false,
        message: `Element did not appear within ${timeoutMs}ms: ${selector}`,
        elementFound: false,
        waitTimeMs: waitTime,
      };

      return {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      };
    }
  } catch (error) {
    return {
      type: 'text',
      text: `Failed to wait for element: ${error}`,
    };
  }
}
