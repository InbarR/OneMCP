export interface RooClineSettings {
  alwaysAllow?: string[];
  autoApprove?: string[];
  disabled?: boolean;
}

export interface ToolSpecificSettings {
  rooCline?: RooClineSettings;
}

export interface McpServer {
  id: string;
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  cwd?: string;
  transportType?: 'stdio' | 'http';
  url?: string; // For HTTP transport
  toolSettings?: ToolSpecificSettings;
  enabledTools?: string[]; // Tool IDs where this server is enabled
  createdAt?: string;
  updatedAt?: string;
}

export interface ServerFormData {
  name: string;
  command: string;
  args: string;
  env: { key: string; value: string }[];
  cwd?: string;
  transportType: 'stdio' | 'http';
  url?: string;
}

export interface ServerTestResult {
  success: boolean;
  message: string;
  capabilities?: {
    tools?: string[];
    prompts?: string[];
    resources?: string[];
  };
  error?: string;
}
