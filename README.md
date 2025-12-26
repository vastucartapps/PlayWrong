# PlayWrong

<p align="center">
  <strong>Browser Control MCP Server for Gemini Code Assistant</strong>
</p>

<p align="center">
  Like <a href="https://github.com/microsoft/playwright-mcp">Playwright MCP</a> for Claude Code, but for <strong>Gemini</strong>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/MCP-Server-blue" alt="MCP Server">
  <img src="https://img.shields.io/badge/Node.js-18%2B-green" alt="Node.js 18+">
  <img src="https://img.shields.io/badge/Playwright-Powered-orange" alt="Playwright">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License">
</p>

---

## What is PlayWrong?

PlayWrong is a **Model Context Protocol (MCP)** server that enables Gemini Code Assistant to control a browser using Playwright. Perfect for:

- 📸 **Screenshot Testing** - Capture pages at mobile, tablet, and desktop viewports
- 🔍 **Responsive Debugging** - Compare layouts across different screen sizes
- 🤖 **Automated Interactions** - Click, type, navigate programmatically
- 🐛 **Console Debugging** - Read browser console logs and errors

---

## Quick Install

### Step 1: Clone and Build

```bash
git clone https://github.com/vastucartapps/PlayWrong.git
cd PlayWrong
npm install
npx playwright install chromium
npm run build
```

### Step 2: Configure Gemini CLI

Add to your Gemini settings file:

**Linux/Mac:** `~/.gemini/settings.json`
**Windows:** `%USERPROFILE%\.gemini\settings.json`

```json
{
  "mcpServers": {
    "playwrong": {
      "command": "node",
      "args": ["/full/path/to/PlayWrong/dist/stdio.js"]
    }
  }
}
```

> Replace `/full/path/to/PlayWrong` with the actual path where you cloned the repository.

### Step 3: Restart Gemini CLI

That's it! Gemini will auto-start PlayWrong when needed.

---

## Available Tools

| Tool | Description |
|------|-------------|
| `navigate` | Navigate to a URL |
| `take_screenshot` | Capture screenshot (mobile/tablet/desktop/custom) |
| `click_element` | Click element by CSS selector or text |
| `fill_input` | Type into input fields |
| `get_page_content` | Get page as structured DOM tree, text, or HTML |
| `read_console_logs` | Read browser console logs |
| `wait_for_element` | Wait for element to appear |

---

## Screenshot Viewports

Take screenshots at different viewport sizes for responsive testing:

| Preset | Dimensions | Device |
|--------|------------|--------|
| `mobile` | 375 x 667 | iPhone SE |
| `tablet` | 768 x 1024 | iPad |
| `desktop` | 1280 x 720 | Standard Desktop |
| `desktop-hd` | 1920 x 1080 | Full HD |

**Usage:**
```
take_screenshot({viewport: "mobile"})
take_screenshot({viewport: "desktop"})
take_screenshot({width: 1440, height: 900})  // Custom size
```

Screenshots are saved to `.playwrong/` directory in your project folder.

---

## Usage Examples

### Basic Navigation
```
"Go to https://example.com and take a screenshot"
```

### Responsive Testing
```
"Take screenshots of the homepage at mobile, tablet, and desktop sizes"
```

### Form Interaction
```
"Fill the login form with username 'test' and password 'demo', then click submit"
```

### Debugging
```
"Navigate to my app and show me any console errors"
```

---

## Output Directory

All screenshots and HTML files are saved to `.playwrong/` in your current working directory:

```
your-project/
├── .playwrong/
│   ├── screenshot-mobile-2025-12-26T17-30-00.png
│   ├── screenshot-desktop-2025-12-26T17-30-05.png
│   └── page-content-2025-12-26T17-30-10.html
└── ...
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HEADLESS` | `true` | Run browser without visible window |
| `BROWSER_TYPE` | `chromium` | Browser engine (chromium/firefox/webkit) |

Create a `.env` file in the project root to customize.

---

## Manual HTTP Mode

If you prefer running a server manually instead of stdio:

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

## Troubleshooting

### "MCP ERROR" on startup
Ensure the path in your Gemini settings points to the correct `dist/stdio.js` file.

### Screenshots are blank
The page might not have loaded yet. Use `wait_for_element` before taking screenshots.

### Browser not found
Run `npx playwright install chromium` to install the browser.

### Mobile-sized screenshots
Specify viewport: `take_screenshot({viewport: "desktop"})`

---

## Development

```bash
npm run build      # Build TypeScript
npm run start      # Run HTTP server
npm run start:stdio # Run stdio mode
```

---

## License

MIT License - see [LICENSE](LICENSE) file.

---

## Author

**Prashantt Vaishnava**

- GitHub: [@vastucartapps](https://github.com/vastucartapps)

---

## Acknowledgments

Inspired by [Playwright MCP](https://github.com/microsoft/playwright-mcp) for Claude Code.
