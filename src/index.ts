import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { BrowserManager } from './browser-manager.js';

// Tool implementations
import { screenshotTool } from './tools/screenshot.js';
import { clickTool } from './tools/click.js';
import { fillInputTool } from './tools/fill-input.js';
import { navigateTool } from './tools/navigate.js';
import { readLogsTool } from './tools/read-logs.js';
import { getContentTool } from './tools/get-content.js';
import { waitForTool } from './tools/wait-for.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const BROWSER_TYPE = (process.env.BROWSER_TYPE || 'chromium') as
  | 'chromium'
  | 'firefox'
  | 'webkit';
const HEADLESS = process.env.HEADLESS !== 'false'; // Default true
const DEBUG = process.env.DEBUG === 'true';

// Initialize Express app for HTTP MCP endpoint
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Browser Manager
const browserManager = new BrowserManager(BROWSER_TYPE, HEADLESS);

// Tool definitions
const TOOLS = [
  {
    name: 'take_screenshot',
    description:
      'Take a screenshot of the current page. Returns base64-encoded PNG image.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        session_id: {
          type: 'string',
          description:
            'Optional session ID. If not provided, uses default/first session.',
        },
        full_page: {
          type: 'boolean',
          description: 'Capture entire page (true) or viewport (false). Default: true',
        },
        show_browser: {
          type: 'boolean',
          description: 'Show browser window instead of headless. Default: false',
        },
      },
      required: [],
    },
  },
  {
    name: 'click_element',
    description:
      'Click on an element on the page using CSS selector or text content.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        selector: {
          type: 'string',
          description:
            'CSS selector or text to match (e.g., "#button-id", ".btn-primary", "text=Submit")',
        },
        session_id: {
          type: 'string',
          description: 'Optional session ID',
        },
        show_browser: {
          type: 'boolean',
          description: 'Show browser window instead of headless. Default: false',
        },
      },
      required: ['selector'],
    },
  },
  {
    name: 'fill_input',
    description: 'Fill text input fields on the page.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector for the input field',
        },
        text: {
          type: 'string',
          description: 'Text to fill in the field',
        },
        session_id: {
          type: 'string',
          description: 'Optional session ID',
        },
        show_browser: {
          type: 'boolean',
          description: 'Show browser window instead of headless. Default: false',
        },
      },
      required: ['selector', 'text'],
    },
  },
  {
    name: 'navigate',
    description: 'Navigate to a URL in the browser.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        url: {
          type: 'string',
          description: 'Full URL to navigate to (e.g., https://example.com)',
        },
        session_id: {
          type: 'string',
          description: 'Optional session ID',
        },
        show_browser: {
          type: 'boolean',
          description: 'Show browser window instead of headless. Default: false',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'read_console_logs',
    description: 'Read all console logs, errors, and warnings from the page.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        session_id: {
          type: 'string',
          description: 'Optional session ID',
        },
        log_type: {
          type: 'string',
          description:
            'Filter by log type: "all", "error", "warn", "log", "info". Default: "all"',
        },
        show_browser: {
          type: 'boolean',
          description: 'Show browser window instead of headless. Default: false',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_page_content',
    description:
      'Get the current page HTML, text content, title, and URL.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        session_id: {
          type: 'string',
          description: 'Optional session ID',
        },
        include_html: {
          type: 'boolean',
          description: 'Include full HTML. Default: true',
        },
        show_browser: {
          type: 'boolean',
          description: 'Show browser window instead of headless. Default: false',
        },
      },
      required: [],
    },
  },
  {
    name: 'wait_for_element',
    description:
      'Wait for an element to appear on the page with timeout.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector or text to wait for',
        },
        timeout_ms: {
          type: 'number',
          description: 'Timeout in milliseconds. Default: 30000',
        },
        session_id: {
          type: 'string',
          description: 'Optional session ID',
        },
        show_browser: {
          type: 'boolean',
          description: 'Show browser window instead of headless. Default: false',
        },
      },
      required: ['selector'],
    },
  },
];

// ========================================
// MCP HTTP Endpoint
// ========================================

interface MCPRequest {
  jsonrpc: string;
  id?: string | number;
  method: string;
  params?: {
    name?: string;
    arguments?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

interface MCPResponse {
  jsonrpc: string;
  id?: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

async function handleToolCall(name: string, args: Record<string, unknown>) {
  switch (name) {
    case 'take_screenshot':
      return await screenshotTool(browserManager, args);
    case 'click_element':
      return await clickTool(browserManager, args);
    case 'fill_input':
      return await fillInputTool(browserManager, args);
    case 'navigate':
      return await navigateTool(browserManager, args);
    case 'read_console_logs':
      return await readLogsTool(browserManager, args);
    case 'get_page_content':
      return await getContentTool(browserManager, args);
    case 'wait_for_element':
      return await waitForTool(browserManager, args);
    default:
      return {
        type: 'text',
        text: `Unknown tool: ${name}`,
      };
  }
}

app.post('/mcp', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const request = req.body as MCPRequest;

    if (DEBUG) {
      console.log('[MCP] Received request:', JSON.stringify(request, null, 2));
    }

    let result: unknown;

    switch (request.method) {
      case 'initialize':
        result = {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: 'playwrong',
            version: '1.0.0',
          },
        };
        break;

      case 'tools/list':
        result = { tools: TOOLS };
        break;

      case 'tools/call':
        const toolName = request.params?.name;
        const toolArgs = request.params?.arguments || {};

        if (!toolName) {
          const errorResponse: MCPResponse = {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32602,
              message: 'Missing tool name in params',
            },
          };
          res.json(errorResponse);
          return;
        }

        const toolResult = await handleToolCall(toolName, toolArgs);
        result = { content: [toolResult] };
        break;

      default:
        const unknownMethodResponse: MCPResponse = {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32601,
            message: `Unknown method: ${request.method}`,
          },
        };
        res.json(unknownMethodResponse);
        return;
    }

    const response: MCPResponse = {
      jsonrpc: '2.0',
      id: request.id,
      result: result,
    };

    if (DEBUG) {
      console.log('[MCP] Sending response:', JSON.stringify(response, null, 2));
    }

    res.json(response);
  } catch (error) {
    console.error('[MCP] Error:', error);
    const response: MCPResponse = {
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: `Internal error: ${error}`,
      },
    };
    res.status(500).json(response);
  }
});

// ========================================
// Health Check Endpoint
// ========================================

app.get('/health', async (_req, res) => {
  const sessions = browserManager.listSessions();
  const sessionInfo = await Promise.all(
    sessions.map(async (s) => ({
      id: s.id,
      url: s.url,
      title: await s.title,
    }))
  );

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    activeSessions: sessions.length,
    sessions: sessionInfo,
  });
});

// ========================================
// Browser Session Management Endpoints
// ========================================

app.post('/sessions/create', async (req, res) => {
  try {
    const showBrowser = req.body?.show_browser as boolean | undefined;
    const sessionId = await browserManager.createSession(showBrowser);
    res.json({
      success: true,
      sessionId: sessionId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

app.get('/sessions', async (_req, res) => {
  const sessions = browserManager.listSessions();
  const sessionInfo = await Promise.all(
    sessions.map(async (s) => ({
      id: s.id,
      url: s.url,
      title: await s.title,
    }))
  );

  res.json({
    sessions: sessionInfo,
    count: sessions.length,
  });
});

app.post('/sessions/:sessionId/close', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const success = await browserManager.closeSession(sessionId);
    res.json({
      success: success,
      sessionId: sessionId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

// ========================================
// Error Handling
// ========================================

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// ========================================
// Server Startup
// ========================================

async function main() {
  try {
    console.log('PlayWrong MCP Server Starting...');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Browser: ${BROWSER_TYPE}`);
    console.log(`Headless: ${HEADLESS}`);
    console.log(`Debug: ${DEBUG}`);

    const server = app.listen(PORT, () => {
      console.log(`\nPlayWrong MCP Server running on http://localhost:${PORT}`);
      console.log(`MCP Endpoint: http://localhost:${PORT}/mcp`);
      console.log(`Health Check: http://localhost:${PORT}/health\n`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('\nShutting down gracefully...');
      await browserManager.closeAllSessions();
      server.close(() => {
        console.log('Server stopped');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('\nShutting down gracefully...');
      await browserManager.closeAllSessions();
      server.close(() => {
        console.log('Server stopped');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
