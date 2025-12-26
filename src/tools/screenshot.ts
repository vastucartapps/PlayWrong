import type { BrowserManager } from '../browser-manager.js';
import type { MCPToolResponse } from '../types/index.js';

export async function screenshotTool(
  browserManager: BrowserManager,
  args: Record<string, unknown>
): Promise<MCPToolResponse> {
  try {
    const sessionId = args.session_id as string | undefined;
    const fullPage = args.full_page !== false; // Default true
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

    const screenshot = await session.page.screenshot({
      fullPage: fullPage,
      type: 'png',
    });

    const base64 = screenshot.toString('base64');
    const viewportSize = session.page.viewportSize();

    return {
      type: 'text',
      text: `Screenshot taken successfully\n\nDimensions: ${viewportSize?.width}x${viewportSize?.height}px\n\nImage (Base64): data:image/png;base64,${base64}`,
    };
  } catch (error) {
    return {
      type: 'text',
      text: `Failed to take screenshot: ${error}`,
    };
  }
}
