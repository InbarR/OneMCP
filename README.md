# OneMCP

A unified MCP (Model Context Protocol) Server Manager for AI coding tools.

## Features

- **Manage MCP servers** across multiple AI tools from one place
- **Supported tools**: Claude Desktop, Claude Code, Roo, Cline, VS Code Copilot, GHCP, Cursor
- **Add, edit, clone, and delete** MCP server configurations
- **Test servers** to verify they're working
- **Sync servers** across all your tools with one click
- **Import/Export** configurations for backup and sharing
- **Dark theme** UI

## Screenshot

![OneMCP Screenshot](docs/screenshot.png)

## Installation

### Option 1: Run from source

```bash
# Clone the repository
git clone https://github.com/InbarR/OneMCP.git
cd OneMCP

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Option 2: Download portable exe

Download `OneMCP-Portable.exe` from the [Releases](https://github.com/InbarR/OneMCP/releases) page.

## Building

```bash
# Package the app (creates out/OneMCP-win32-x64 folder)
npm run package

# Create installer
npm run make
```

## How it works

OneMCP reads and writes to the configuration files of each supported AI tool:

| Tool | Config Path (Windows) |
|------|----------------------|
| Claude Desktop | `%APPDATA%/Claude/claude_desktop_config.json` |
| Claude Code | `~/.claude.json` |
| Roo | `%APPDATA%/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json` |
| Cline | `%APPDATA%/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` |
| VS Code Copilot | `%APPDATA%/Code/User/settings.json` |
| GHCP | `%APPDATA%/Code/User/mcp.json` |
| Cursor | `~/.cursor/mcp.json` |

## Tech Stack

- Electron
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

## License

MIT
