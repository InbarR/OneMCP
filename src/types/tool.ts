export type ConfigFormat = 'mcpServers' | 'servers' | 'mcp.servers';

export interface Tool {
  id: string;
  name: string;
  icon?: string;
  configPath: string; // With platform placeholders like %APPDATA%, ~
  configFormat: ConfigFormat;
  serverKey?: string; // Key path to servers object, e.g., 'mcpServers' or 'mcp.servers'
  supportsAlwaysAllow?: boolean;
  supportsAutoApprove?: boolean;
  supportsDisabled?: boolean;
  isBuiltIn: boolean;
  isInstalled?: boolean; // Detected at runtime
}

export interface ToolDefinition {
  id: string;
  name: string;
  icon?: string;
  platforms: {
    win32?: string;
    darwin?: string;
    linux?: string;
  };
  configFormat: ConfigFormat;
  serverKey: string;
  supportsAlwaysAllow?: boolean;
  supportsAutoApprove?: boolean;
  supportsDisabled?: boolean;
}

export interface CustomTool extends Tool {
  isBuiltIn: false;
  addedAt: string;
}

export interface ToolConfig {
  [key: string]: unknown;
  mcpServers?: Record<string, ToolServerConfig>;
  servers?: Record<string, ToolServerConfig>;
  'mcp.servers'?: Record<string, ToolServerConfig>;
}

export interface ToolServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  url?: string;
  alwaysAllow?: string[];
  autoApprove?: string[];
  disabled?: boolean;
}
