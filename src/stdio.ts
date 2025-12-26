#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from './browser-manager.js';

// Tool implementations
import { screenshotTool } from './tools/screenshot.js';
import { clickTool } from './tools/click.js';
import { fillInputTool } from './tools/fill-input.js';
import { navigateTool } from './tools/navigate.js';
import { readLogsTool } from './tools/read-logs.js';
import { getContentTool } from './tools/get-content.js';
import { waitForTool } from './tools/wait-for.js';

const BROWSER_TYPE = (process.env.BROWSER_TYPE || 'chromium') as 'chromium' | 'firefox' | 'webkit';
const HEADLESS = process.env.HEADLESS !== 'false';

// Initialize Browser Manager
const browserManager = new BrowserManager(BROWSER_TYPE, HEADLESS);

// Create MCP Server
const server = new Server(
  {
    name: 'playwrong',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
const TOOLS = [
  {
    name: 'take_screenshot',
    description: 'Take a screenshot and save to .playwrong/ directory. Supports mobile, tablet, desktop viewports.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        viewport: {
          type: 'string',
          description: 'Viewport preset: "mobile" (375x667), "tablet" (768x1024), "desktop" (1280x720), "desktop-hd" (1920x1080)',
        },
        width: {
          type: 'number',
          description: 'Custom viewport width (use with height for custom size)',
        },
        height: {
          type: 'number',
          description: 'Custom viewport height (use with width for custom size)',
        },
        full_page: {
          type: 'boolean',
          description: 'Capture entire page (true) or viewport only (false). Default: true',
        },
        filename: {
          type: 'string',
          description: 'Custom filename. Default: screenshot-{viewport}-{timestamp}.png',
        },
      },
      required: [],
    },
  },
  {
    name: 'click_element',
    description: 'Click on an element on the page using CSS selector or text content.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector or text to match (e.g., "#button-id", ".btn-primary", "text=Submit")',
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
        log_type: {
          type: 'string',
          description: 'Filter by log type: "all", "error", "warn", "log", "info". Default: "all"',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_page_content',
    description: 'Get page content as accessibility snapshot (default), plain text, or HTML file.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        format: {
          type: 'string',
          description: 'Output format: "snapshot" (structured tree, default), "text" (plain text), or "html" (saves to file)',
        },
      },
      required: [],
    },
  },
  {
    name: 'wait_for_element',
    description: 'Wait for an element to appear on the page with timeout.',
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
      },
      required: ['selector'],
    },
  },
];

// Handle list tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle list resources (empty - we don't have resources)
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return { resources: [] };
});

// Handle list prompts (empty - we don't have prompts)
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return { prompts: [] };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      case 'take_screenshot':
        result = await screenshotTool(browserManager, args || {});
        break;
      case 'click_element':
        result = await clickTool(browserManager, args || {});
        break;
      case 'fill_input':
        result = await fillInputTool(browserManager, args || {});
        break;
      case 'navigate':
        result = await navigateTool(browserManager, args || {});
        break;
      case 'read_console_logs':
        result = await readLogsTool(browserManager, args || {});
        break;
      case 'get_page_content':
        result = await getContentTool(browserManager, args || {});
        break;
      case 'wait_for_element':
        result = await waitForTool(browserManager, args || {});
        break;
      default:
        result = { type: 'text', text: `Unknown tool: ${name}` };
    }

    return { content: [result] };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error}` }],
    };
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await browserManager.closeAllSessions();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await browserManager.closeAllSessions();
  process.exit(0);
});

// Start stdio server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
