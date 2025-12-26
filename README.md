# PlayWrong

Browser Control MCP Server for **Gemini Code Assistant** - like Playwright MCP but for Gemini.

## Quick Install (Automatic - Recommended)

### Step 1: Install globally
```bash
npm install -g playwrong
npx playwright install chromium
```

### Step 2: Configure Gemini CLI
Add to your Gemini config (`~/.gemini/settings.json`):
```json
{
  "mcpServers": {
    "playwrong": {
      "command": "playwrong"
    }
  }
}
```

**That's it!** Gemini will auto-start PlayWrong when needed.

---

## Alternative: Install from GitHub

```bash
git clone https://github.com/vastucartapps/PlayWrong.git
cd PlayWrong
npm install
npx playwright install chromium
npm run build
npm link  # Makes 'playwrong' command available globally
```

Then configure Gemini:
```json
{
  "mcpServers": {
    "playwrong": {
      "command": "playwrong"
    }
  }
}
```

---

## Manual Mode (HTTP Server)

If you prefer running a server manually:

```bash
npm start  # Starts on http://localhost:3000
```

Configure Gemini for HTTP:
```json
{
  "mcpServers": {
    "playwrong": {
      "httpUrl": "http://localhost:3000/mcp"
    }
  }
}
```

---

## Available Tools

| Tool | Description |
|------|-------------|
| `navigate` | Go to a URL |
| `take_screenshot` | Capture page as PNG |
| `click_element` | Click by CSS selector |
| `fill_input` | Type into input fields |
| `get_page_content` | Get HTML/text content |
| `read_console_logs` | Get browser console logs |
| `wait_for_element` | Wait for element to appear |

---

## Usage Examples

Once configured, use natural language with Gemini:

```
"Navigate to google.com and take a screenshot"
"Fill the search box with 'hello world' and click search"
"Wait for results and get the page content"
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HEADLESS` | `true` | Run browser without window |
| `BROWSER_TYPE` | `chromium` | Browser (chromium/firefox/webkit) |

---

## License

MIT

## Credits

Inspired by [Playwright MCP](https://github.com/microsoft/playwright-mcp) for Claude Code.
