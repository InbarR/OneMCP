export * from './server';
export * from './tool';

export interface AppState {
  servers: import('./server').McpServer[];
  tools: import('./tool').Tool[];
  selectedToolId: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface Backup {
  id: string;
  timestamp: string;
  toolId: string;
  configPath: string;
  content: string;
}

export interface Profile {
  id: string;
  name: string;
  servers: import('./server').McpServer[];
  createdAt: string;
  updatedAt: string;
}

export interface ToolOverride {
  name?: string;
  configPath?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  customTools: import('./tool').CustomTool[];
  profiles: Profile[];
  activeProfileId: string | null;
  backupEnabled: boolean;
  maxBackups: number;
  toolOverrides?: Record<string, ToolOverride>;
  hiddenTools?: string[];
}
