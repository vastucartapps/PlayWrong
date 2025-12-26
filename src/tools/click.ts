import type { BrowserManager } from '../browser-manager.js';
import type { MCPToolResponse, ClickResult } from '../types/index.js';

export async function clickTool(
  browserManager: BrowserManager,
  args: Record<string, unknown>
): Promise<MCPToolResponse> {
  try {
    const selector = args.selector as string;
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

    // Try to find and click the element
    const locator = session.page.locator(selector);
    const count = await locator.count();

    if (count === 0) {
      const result: ClickResult = {
        success: false,
        message: `Element not found: ${selector}`,
        elementFound: false,
      };
      return {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      };
    }

    await locator.first().click();

    const result: ClickResult = {
      success: true,
      message: `Successfully clicked element: ${selector}`,
      elementFound: true,
    };

    return {
      type: 'text',
      text: JSON.stringify(result, null, 2),
    };
  } catch (error) {
    return {
      type: 'text',
      text: `Failed to click element: ${error}`,
    };
  }
}
