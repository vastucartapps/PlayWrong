import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { BrowserManager } from '../browser-manager.js';
import type { MCPToolResponse } from '../types/index.js';

// Directory name for screenshots (like Playwright MCP's .playwright-mcp)
const SCREENSHOT_DIR = '.playwrong';

export async function screenshotTool(
  browserManager: BrowserManager,
  args: Record<string, unknown>
): Promise<MCPToolResponse> {
  try {
    const sessionId = args.session_id as string | undefined;
    const fullPage = args.full_page !== false; // Default true
    const showBrowser = args.show_browser as boolean | undefined;
    const filename = args.filename as string | undefined;

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

    const viewportSize = session.page.viewportSize();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Create .playwrong directory if it doesn't exist
    if (!existsSync(SCREENSHOT_DIR)) {
      mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }

    // Save to .playwrong directory (like Playwright MCP)
    const defaultFilename = `screenshot-${timestamp}.png`;
    const finalFilename = filename || defaultFilename;
    const filepath = join(SCREENSHOT_DIR, finalFilename);

    writeFileSync(filepath, screenshot);

    return {
      type: 'text',
      text: `Screenshot saved: ${filepath}\nDimensions: ${viewportSize?.width}x${viewportSize?.height}px\nPage: ${session.page.url()}`,
    };
  } catch (error) {
    return {
      type: 'text',
      text: `Failed to take screenshot: ${error}`,
    };
  }
}
