import type { Tool, ToolDefinition, CustomTool, ConfigFormat } from '../types/tool';
import { getConfigPathForPlatform } from './pathResolver';
import toolDefinitionsData from '../../resources/tool-definitions.json';

const toolDefinitions: { tools: ToolDefinition[] } = toolDefinitionsData as { tools: ToolDefinition[] };

export function getBuiltInTools(): Tool[] {
  return toolDefinitions.tools.map((def) => {
    const configPath = getConfigPathForPlatform(def.platforms);
    return {
      id: def.id,
      name: def.name,
      icon: def.icon,
      configPath: configPath || '',
      configFormat: def.configFormat,
      serverKey: def.serverKey,
      supportsAlwaysAllow: def.supportsAlwaysAllow,
      supportsAutoApprove: def.supportsAutoApprove,
      supportsDisabled: def.supportsDisabled,
      isBuiltIn: true,
    };
  }).filter(tool => tool.configPath !== '');
}

export function createCustomTool(
  id: string,
  name: string,
  configPath: string,
  configFormat: ConfigFormat,
  serverKey?: string
): CustomTool {
  return {
    id,
    name,
    configPath,
    configFormat,
    serverKey: serverKey || configFormat === 'mcp.servers' ? 'mcp.servers' : 'mcpServers',
    isBuiltIn: false,
    addedAt: new Date().toISOString(),
  };
}

export function getServerKeyForFormat(format: ConfigFormat): string {
  switch (format) {
    case 'mcpServers':
      return 'mcpServers';
    case 'servers':
      return 'servers';
    case 'mcp.servers':
      return 'mcp.servers';
    default:
      return 'mcpServers';
  }
}

export function detectConfigFormat(config: Record<string, unknown>): ConfigFormat | null {
  if ('mcpServers' in config) {
    return 'mcpServers';
  }
  if ('servers' in config) {
    return 'servers';
  }
  if ('mcp.servers' in config || 'mcp' in config) {
    return 'mcp.servers';
  }
  return null;
}

export function getToolIcon(iconName?: string): string {
  // Return icon name for lucide-react
  const iconMap: Record<string, string> = {
    claude: 'MessageSquare',
    terminal: 'Terminal',
    bot: 'Bot',
    code: 'Code',
    'mouse-pointer': 'MousePointer',
  };
  return iconMap[iconName || ''] || 'Server';
}
