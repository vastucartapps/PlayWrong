import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { BrowserManager } from '../browser-manager.js';
import type { MCPToolResponse } from '../types/index.js';

// Directory name for screenshots (like Playwright MCP's .playwright-mcp)
const SCREENSHOT_DIR = '.playwrong';

// Viewport presets
const VIEWPORTS = {
  mobile: { width: 375, height: 667 },      // iPhone SE
  tablet: { width: 768, height: 1024 },     // iPad
  desktop: { width: 1280, height: 720 },    // Standard desktop
  'desktop-hd': { width: 1920, height: 1080 }, // Full HD
};

export async function screenshotTool(
  browserManager: BrowserManager,
  args: Record<string, unknown>
): Promise<MCPToolResponse> {
  try {
    const sessionId = args.session_id as string | undefined;
    const fullPage = args.full_page !== false; // Default true
    const showBrowser = args.show_browser as boolean | undefined;
    const filename = args.filename as string | undefined;
    const viewport = args.viewport as string | undefined; // 'mobile', 'tablet', 'desktop', 'desktop-hd'
    const customWidth = args.width as number | undefined;
    const customHeight = args.height as number | undefined;

    const session = sessionId
      ? browserManager.getSession(sessionId)
      : await browserManager.getOrCreateDefaultSession(showBrowser);

    if (!session) {
      return {
        type: 'text',
        text: 'No browser session available',
      };
    }

    // Set viewport if specified
    let viewportSize = session.page.viewportSize();

    if (customWidth && customHeight) {
      // Custom dimensions
      await session.page.setViewportSize({ width: customWidth, height: customHeight });
      viewportSize = { width: customWidth, height: customHeight };
    } else if (viewport && viewport in VIEWPORTS) {
      // Preset viewport
      const preset = VIEWPORTS[viewport as keyof typeof VIEWPORTS];
      await session.page.setViewportSize(preset);
      viewportSize = preset;
    }

    const screenshot = await session.page.screenshot({
      fullPage: fullPage,
      type: 'png',
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const viewportLabel = viewport || 'custom';

    // Create .playwrong directory if it doesn't exist
    if (!existsSync(SCREENSHOT_DIR)) {
      mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }

    // Save to .playwrong directory
    const defaultFilename = `screenshot-${viewportLabel}-${timestamp}.png`;
    const finalFilename = filename || defaultFilename;
    const filepath = join(SCREENSHOT_DIR, finalFilename);

    writeFileSync(filepath, screenshot);

    return {
      type: 'text',
      text: `Screenshot saved: ${filepath}\nViewport: ${viewportSize?.width}x${viewportSize?.height}px (${viewportLabel})\nPage: ${session.page.url()}`,
    };
  } catch (error) {
    return {
      type: 'text',
      text: `Failed to take screenshot: ${error}`,
    };
  }
}
