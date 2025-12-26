import { chromium, firefox, webkit } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import type { BrowserSession } from './types/index.js';

export class BrowserManager {
  private sessions: Map<string, BrowserSession> = new Map();
  private browserType: 'chromium' | 'firefox' | 'webkit';
  private headless: boolean;
  private consoleLogs: Map<string, Array<{ type: string; message: string; timestamp: string }>> = new Map();

  constructor(browserType = 'chromium', headless = true) {
    this.browserType = browserType as 'chromium' | 'firefox' | 'webkit';
    this.headless = headless;
  }

  /**
   * Create a new browser session
   */
  async createSession(showBrowser?: boolean): Promise<string> {
    try {
      const useHeadless = showBrowser === true ? false : this.headless;
      let browser;

      if (this.browserType === 'chromium') {
        browser = await chromium.launch({ headless: useHeadless });
      } else if (this.browserType === 'firefox') {
        browser = await firefox.launch({ headless: useHeadless });
      } else if (this.browserType === 'webkit') {
        browser = await webkit.launch({ headless: useHeadless });
      } else {
        browser = await chromium.launch({ headless: useHeadless });
      }

      // Create page with desktop viewport (1280x720)
      const page = await browser.newPage({
        viewport: { width: 1280, height: 720 },
      });
      const sessionId = uuidv4();

      // Initialize console log storage for this session
      this.consoleLogs.set(sessionId, []);

      // Set up console message listener
      page.on('console', (msg) => {
        const logs = this.consoleLogs.get(sessionId);
        if (logs) {
          logs.push({
            type: msg.type(),
            message: msg.text(),
            timestamp: new Date().toISOString(),
          });
        }
      });

      // Set up page error listener
      page.on('pageerror', (error) => {
        const logs = this.consoleLogs.get(sessionId);
        if (logs) {
          logs.push({
            type: 'error',
            message: error.toString(),
            timestamp: new Date().toISOString(),
          });
        }
      });

      const session: BrowserSession = {
        id: sessionId,
        browser,
        page,
        createdAt: new Date(),
        lastUsedAt: new Date(),
      };

      this.sessions.set(sessionId, session);
      console.log(`[BrowserManager] Created session: ${sessionId}`);

      return sessionId;
    } catch (error) {
      throw new Error(`Failed to create browser session: ${error}`);
    }
  }

  /**
   * Get an existing session
   */
  getSession(sessionId: string): BrowserSession | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastUsedAt = new Date();
    }
    return session;
  }

  /**
   * Get or create default session (for single-browser workflows)
   */
  async getOrCreateDefaultSession(showBrowser?: boolean): Promise<BrowserSession> {
    const existingSessions = Array.from(this.sessions.values());
    if (existingSessions.length > 0) {
      return existingSessions[0];
    }
    const sessionId = await this.createSession(showBrowser);
    return this.getSession(sessionId)!;
  }

  /**
   * Get console logs for a session
   */
  getConsoleLogs(sessionId: string, logType?: string): Array<{ type: string; message: string; timestamp: string }> {
    const logs = this.consoleLogs.get(sessionId) || [];
    if (logType && logType !== 'all') {
      return logs.filter((log) => log.type === logType);
    }
    return logs;
  }

  /**
   * Clear console logs for a session
   */
  clearConsoleLogs(sessionId: string): void {
    this.consoleLogs.set(sessionId, []);
  }

  /**
   * Close a specific session
   */
  async closeSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (session) {
      await session.page.close();
      await session.browser.close();
      this.sessions.delete(sessionId);
      this.consoleLogs.delete(sessionId);
      console.log(`[BrowserManager] Closed session: ${sessionId}`);
      return true;
    }
    return false;
  }

  /**
   * Close all sessions
   */
  async closeAllSessions(): Promise<void> {
    for (const [sessionId] of this.sessions) {
      await this.closeSession(sessionId);
    }
  }

  /**
   * List all active sessions
   */
  listSessions(): Array<{ id: string; url: string; title: Promise<string> }> {
    return Array.from(this.sessions.values()).map((session) => ({
      id: session.id,
      url: session.page.url(),
      title: session.page.title(),
    }));
  }
}
