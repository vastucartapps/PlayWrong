# PlayWrong - Claude Code Instructions

## Important Rules

**NO AGENTS ALLOWED** - Do not use agents (Task tool with subagent_type) unless explicitly asked by the user.

## Project Overview

PlayWrong is an MCP (Model Context Protocol) server that enables Gemini Code Assistant to control browsers via Playwright.

## Tech Stack
- Node.js + TypeScript
- Express.js (HTTP server)
- Playwright (browser automation)
- MCP SDK (@modelcontextprotocol/sdk)

## Key Files
- `src/index.ts` - Main Express server entry point
- `src/browser-manager.ts` - Browser session management
- `src/mcp-server.ts` - MCP protocol setup
- `src/tools/*.ts` - Individual tool implementations

## Running the Server
```bash
npm install
npx playwright install chromium
npm run build
npm run dev
```

## MCP Endpoint
- URL: `http://localhost:3000/mcp`
- Protocol: JSON-RPC over HTTP
