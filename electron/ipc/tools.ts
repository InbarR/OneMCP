import * as fs from 'fs';
import * as path from 'path';
import { IpcMainInvokeEvent } from 'electron';

async function detectInstalled(
  _event: IpcMainInvokeEvent,
  configPaths: string[]
): Promise<Record<string, boolean>> {
  const result: Record<string, boolean> = {};

  for (const configPath of configPaths) {
    try {
      await fs.promises.access(configPath);
      result[configPath] = true;
    } catch {
      result[configPath] = false;
    }
  }

  return result;
}

async function getDefinitions(_event: IpcMainInvokeEvent): Promise<unknown> {
  try {
    // Read from bundled resources in production, or from source in development
    const possiblePaths = [
      path.join(__dirname, '../../resources/tool-definitions.json'),
      path.join(__dirname, '../../../resources/tool-definitions.json'),
      path.join(process.cwd(), 'resources/tool-definitions.json'),
    ];

    for (const defPath of possiblePaths) {
      try {
        const content = await fs.promises.readFile(defPath, 'utf-8');
        return JSON.parse(content);
      } catch {
        // Try next path
      }
    }

    // Return default definitions if file not found
    return {
      tools: [
        {
          id: 'claude-desktop',
          name: 'Claude Desktop',
          platforms: {
            win32: '%APPDATA%/Claude/claude_desktop_config.json',
            darwin: '~/Library/Application Support/Claude/claude_desktop_config.json',
            linux: '~/.config/Claude/claude_desktop_config.json',
          },
          configFormat: 'mcpServers',
          serverKey: 'mcpServers',
        },
        {
          id: 'claude-code',
          name: 'Claude Code',
          platforms: {
            win32: '~/.claude/settings.json',
            darwin: '~/.claude/settings.json',
            linux: '~/.claude/settings.json',
          },
          configFormat: 'mcpServers',
          serverKey: 'mcpServers',
        },
      ],
    };
  } catch (error) {
    console.error('Error loading tool definitions:', error);
    return { tools: [] };
  }
}

export const toolHandlers = {
  detectInstalled,
  getDefinitions,
};
