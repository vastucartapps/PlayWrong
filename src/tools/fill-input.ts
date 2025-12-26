import type { BrowserManager } from '../browser-manager.js';
import type { MCPToolResponse, FillInputResult } from '../types/index.js';

export async function fillInputTool(
  browserManager: BrowserManager,
  args: Record<string, unknown>
): Promise<MCPToolResponse> {
  try {
    const selector = args.selector as string;
    const text = args.text as string;
    const sessionId = args.session_id as string | undefined;
    const showBrowser = args.show_browser as boolean | undefined;

    if (!selector || text === undefined) {
      return {
        type: 'text',
        text: 'Error: selector and text parameters are required',
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

    const locator = session.page.locator(selector);
    const count = await locator.count();

    if (count === 0) {
      const result: FillInputResult = {
        success: false,
        message: `Input field not found: ${selector}`,
        fieldsFilled: 0,
      };
      return {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      };
    }

    // Fill first matching element
    await locator.first().fill(text);

    const result: FillInputResult = {
      success: true,
      message: `Successfully filled input: ${selector}`,
      fieldsFilled: 1,
    };

    return {
      type: 'text',
      text: JSON.stringify(result, null, 2),
    };
  } catch (error) {
    return {
      type: 'text',
      text: `Failed to fill input: ${error}`,
    };
  }
}
