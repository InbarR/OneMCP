import type { McpServer } from '../types/server';
import type { Tool, ToolConfig, ToolServerConfig } from '../types/tool';

// This module provides config management logic.
// Actual file operations are done via IPC to the main process.

export function serversToToolConfig(
  servers: McpServer[],
  tool: Tool
): Record<string, ToolServerConfig> {
  const result: Record<string, ToolServerConfig> = {};

  for (const server of servers) {
    // Skip servers not enabled for this tool
    if (server.enabledTools && !server.enabledTools.includes(tool.id)) {
      continue;
    }

    const config: ToolServerConfig = {
      command: server.command,
    };

    if (server.args && server.args.length > 0) {
      config.args = server.args;
    }

    if (server.env && Object.keys(server.env).length > 0) {
      config.env = server.env;
    }

    if (server.cwd) {
      config.cwd = server.cwd;
    }

    if (server.transportType === 'http' && server.url) {
      config.url = server.url;
    }

    // Add tool-specific settings
    if (tool.id === 'roo-cline' && server.toolSettings?.rooCline) {
      const rooCline = server.toolSettings.rooCline;
      if (rooCline.alwaysAllow) {
        config.alwaysAllow = rooCline.alwaysAllow;
      }
      if (rooCline.autoApprove) {
        config.autoApprove = rooCline.autoApprove;
      }
      if (rooCline.disabled !== undefined) {
        config.disabled = rooCline.disabled;
      }
    }

    result[server.name] = config;
  }

  return result;
}

export function toolConfigToServers(
  config: ToolConfig,
  tool: Tool
): McpServer[] {
  const serverKey = tool.serverKey || 'mcpServers';
  let serversObj: Record<string, ToolServerConfig> | undefined;

  // Handle nested key like 'mcp.servers'
  if (serverKey.includes('.')) {
    const keys = serverKey.split('.');
    let current: unknown = config;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        current = undefined;
        break;
      }
    }
    serversObj = current as Record<string, ToolServerConfig> | undefined;
  } else {
    serversObj = config[serverKey] as Record<string, ToolServerConfig> | undefined;
  }

  if (!serversObj || typeof serversObj !== 'object') {
    return [];
  }

  const servers: McpServer[] = [];

  for (const [name, serverConfig] of Object.entries(serversObj)) {
    const server: McpServer = {
      id: generateServerId(),
      name,
      command: serverConfig.command,
      args: serverConfig.args || [],
      env: serverConfig.env,
      cwd: serverConfig.cwd,
      transportType: serverConfig.url ? 'http' : 'stdio',
      url: serverConfig.url,
      enabledTools: [tool.id],
    };

    // Parse tool-specific settings
    if (tool.id === 'roo-cline') {
      server.toolSettings = {
        rooCline: {
          alwaysAllow: serverConfig.alwaysAllow,
          autoApprove: serverConfig.autoApprove,
          disabled: serverConfig.disabled,
        },
      };
    }

    servers.push(server);
  }

  return servers;
}

export function mergeServers(existing: McpServer[], imported: McpServer[]): McpServer[] {
  const result = [...existing];

  for (const importedServer of imported) {
    const existingIndex = result.findIndex(s => s.name === importedServer.name);

    if (existingIndex >= 0) {
      // Merge enabled tools
      const existingServer = result[existingIndex];
      const mergedTools = new Set([
        ...(existingServer.enabledTools || []),
        ...(importedServer.enabledTools || []),
      ]);
      result[existingIndex] = {
        ...existingServer,
        enabledTools: Array.from(mergedTools),
      };
    } else {
      result.push(importedServer);
    }
  }

  return result;
}

export function generateServerId(): string {
  return `server_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function buildFullConfig(
  existingConfig: ToolConfig,
  servers: Record<string, ToolServerConfig>,
  tool: Tool
): ToolConfig {
  const serverKey = tool.serverKey || 'mcpServers';

  // Handle nested key like 'mcp.servers'
  if (serverKey.includes('.')) {
    const keys = serverKey.split('.');
    const result = { ...existingConfig };
    let current: Record<string, unknown> = result;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      } else {
        current[key] = { ...(current[key] as Record<string, unknown>) };
      }
      current = current[key] as Record<string, unknown>;
    }

    current[keys[keys.length - 1]] = servers;
    return result;
  }

  return {
    ...existingConfig,
    [serverKey]: servers,
  };
}

export function validateServerConfig(server: Partial<McpServer>): string[] {
  const errors: string[] = [];

  if (!server.name || server.name.trim() === '') {
    errors.push('Server name is required');
  }

  if (!server.command || server.command.trim() === '') {
    errors.push('Command is required');
  }

  if (server.transportType === 'http' && (!server.url || server.url.trim() === '')) {
    errors.push('URL is required for HTTP transport');
  }

  // Validate name format (no special characters that could cause issues)
  if (server.name && !/^[\w\-. ]+$/.test(server.name)) {
    errors.push('Server name contains invalid characters');
  }

  return errors;
}
