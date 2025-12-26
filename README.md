# PlayWrong

Browser Control MCP Server for **Gemini Code Assistant** - similar to what Playwright MCP does for Claude Code.

## What is PlayWrong?

PlayWrong is an HTTP-based MCP (Model Context Protocol) server that enables AI assistants like Gemini to control web browsers. It provides tools for:

- Taking screenshots
- Clicking elements
- Filling forms
- Navigating to URLs
- Reading console logs
- Extracting page content
- Waiting for elements

## Installation

### Prerequisites
- Node.js 18+
- npm

### Quick Start

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/playwrong.git
cd playwrong

# Install dependencies
npm install

# Install Chromium browser
npx playwright install chromium

# Build
npm run build

# Start the server
npm start
```

The server will start at `http://localhost:3000`

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `HEADLESS` | true | Run browser without window |
| `BROWSER_TYPE` | chromium | Browser engine (chromium/firefox/webkit) |
| `DEBUG` | false | Enable debug logging |

### Gemini Code Assist / Gemini CLI

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "playwrong": {
      "httpUrl": "http://localhost:3000/mcp"
    }
  }
}
```

**VS Code Settings** (`.vscode/settings.json`):
```json
{
  "geminiCodeAssist.mcpServers": {
    "playwrong": {
      "httpUrl": "http://localhost:3000/mcp"
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `take_screenshot` | Capture page as base64 PNG |
| `click_element` | Click element by CSS selector |
| `fill_input` | Fill text into input fields |
| `navigate` | Go to a URL |
| `read_console_logs` | Get browser console logs |
| `get_page_content` | Extract HTML, text, title, URL |
| `wait_for_element` | Wait for element to appear |

### Tool Parameters

All tools support:
- `session_id` (optional) - Target specific browser session
- `show_browser` (optional) - Show browser window instead of headless

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/mcp` | POST | MCP JSON-RPC endpoint |
| `/health` | GET | Health check |
| `/sessions/create` | POST | Create new browser session |
| `/sessions` | GET | List active sessions |
| `/sessions/:id/close` | POST | Close a session |

## Example Usage

### With cURL

```bash
# Health check
curl http://localhost:3000/health

# List available tools
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Navigate to a page
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"navigate","arguments":{"url":"https://example.com"}}}'

# Take a screenshot
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"take_screenshot","arguments":{}}}'
```

### With Gemini

Once configured, you can use natural language:
- "Navigate to google.com and take a screenshot"
- "Fill the search box with 'hello world' and click the search button"
- "Wait for the results to load and get the page content"

## Development

```bash
# Run in development mode (auto-reload)
npm run dev

# Build TypeScript
npm run build

# Clean build artifacts
npm run clean
```

## Project Structure

```
playwrong/
├── src/
│   ├── index.ts           # Main Express server
│   ├── browser-manager.ts # Browser session management
│   ├── tools/             # Tool implementations
│   │   ├── screenshot.ts
│   │   ├── click.ts
│   │   ├── fill-input.ts
│   │   ├── navigate.ts
│   │   ├── read-logs.ts
│   │   ├── get-content.ts
│   │   └── wait-for.ts
│   └── types/
│       └── index.ts       # TypeScript interfaces
├── dist/                  # Compiled JavaScript
├── package.json
├── tsconfig.json
└── .env.example
```

## License

MIT

## Credits

Inspired by [Playwright MCP](https://github.com/microsoft/playwright-mcp) for Claude Code.
