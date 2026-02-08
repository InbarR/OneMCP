<p align="center">
  <img src="resources/logo.png" alt="OneMCP Logo" width="128" height="128">
</p>

# OneMCP

A unified MCP (Model Context Protocol) Server Manager for AI coding tools.

## Features

- **Manage MCP servers** across multiple AI tools from one place
- **Supported tools**: Claude Desktop, Claude Code, Roo, Cline, VS Code, GHCP, Cursor, Copilot CLI
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

### Option 2: Download from Releases

Download the appropriate package for your platform from the [Releases](https://github.com/InbarR/OneMCP/releases) page.

#### Windows

| File | Description |
|------|-------------|
| `OneMCP-1.0.0.Setup.exe` | **Installer** - Standard Windows installer using Squirrel. Installs to `%LocalAppData%\OneMCP` with auto-updates support. |
| `OneMCP-win32-x64-portable.zip` | **Portable** - Extract and run directly, no installation required. Good for USB drives or restricted environments. |

#### macOS

| File | Description |
|------|-------------|
| `OneMCP-darwin-x64.dmg` | **Intel Macs** - Disk image for Macs with Intel processors. Drag to Applications to install. |
| `OneMCP-darwin-arm64.dmg` | **Apple Silicon** - Disk image for M1/M2/M3 Macs. Drag to Applications to install. |
| `OneMCP-darwin-*-1.0.0.zip` | **ZIP archives** - Alternative to DMG, extract the .app directly. |

#### Linux

| File | Description |
|------|-------------|
| `onemcp_1.0.0_amd64.deb` | **Debian/Ubuntu** - Install with `sudo dpkg -i onemcp_1.0.0_amd64.deb` |
| `onemcp-1.0.0-1.x86_64.rpm` | **Fedora/RHEL** - Install with `sudo rpm -i onemcp-1.0.0-1.x86_64.rpm` |

#### macOS: Gatekeeper Warning

Since the app isn't signed with an Apple Developer certificate, macOS may show a warning that the app "is damaged" or "can't be opened". To fix this:

```bash
xattr -cr /Applications/OneMCP.app
```

Then open the app normally.

## Building

```bash
# Package the app for your platform
npm run package

# Create platform-specific installer
npm run make
```

Build outputs by platform:
- **Windows**: Squirrel installer in `out/make/squirrel.windows/`
- **macOS**: ZIP in `out/make/zip/darwin/`
- **Linux**: DEB in `out/make/deb/` and RPM in `out/make/rpm/`

## How it works

OneMCP reads and writes to the configuration files of each supported AI tool:

### Windows
| Tool | Config Path |
|------|-------------|
| Claude Desktop | `%APPDATA%/Claude/claude_desktop_config.json` |
| Claude Code | `~/.claude.json` |
| Roo | `%APPDATA%/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json` |
| Cline | `%APPDATA%/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` |
| VS Code | `%APPDATA%/Code/User/settings.json` |
| GHCP | `%APPDATA%/Code/User/mcp.json` |
| Cursor | `~/.cursor/mcp.json` |
| Copilot CLI | `~/.copilot/mcp-config.json` |

### macOS
| Tool | Config Path |
|------|-------------|
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Claude Code | `~/.claude.json` |
| Roo | `~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json` |
| Cline | `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` |
| VS Code | `~/Library/Application Support/Code/User/settings.json` |
| GHCP | `~/Library/Application Support/Code/User/mcp.json` |
| Cursor | `~/.cursor/mcp.json` |
| Copilot CLI | `~/.copilot/mcp-config.json` |

### Linux
| Tool | Config Path |
|------|-------------|
| Claude Desktop | `~/.config/Claude/claude_desktop_config.json` |
| Claude Code | `~/.claude.json` |
| Roo | `~/.config/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json` |
| Cline | `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` |
| VS Code | `~/.config/Code/User/settings.json` |
| GHCP | `~/.config/Code/User/mcp.json` |
| Cursor | `~/.cursor/mcp.json` |
| Copilot CLI | `~/.copilot/mcp-config.json` |

## Tech Stack

- Electron
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

## License

MIT
