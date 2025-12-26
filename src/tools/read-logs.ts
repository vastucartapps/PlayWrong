import type { BrowserManager } from '../browser-manager.js';
import type { MCPToolResponse, ConsoleLogsResult } from '../types/index.js';

export async function readLogsTool(
  browserManager: BrowserManager,
  args: Record<string, unknown>
): Promise<MCPToolResponse> {
  try {
    const sessionId = args.session_id as string | undefined;
    const logType = (args.log_type as string) || 'all';
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

    const logs = browserManager.getConsoleLogs(session.id, logType);

    const result: ConsoleLogsResult = {
      logs: logs.map((log) => ({
        type: log.type as 'log' | 'error' | 'warn' | 'info',
        message: log.message,
        timestamp: log.timestamp,
      })),
      totalCount: logs.length,
    };

    return {
      type: 'text',
      text: JSON.stringify(result, null, 2),
    };
  } catch (error) {
    return {
      type: 'text',
      text: `Failed to read logs: ${error}`,
    };
  }
}
