import { contextBridge, ipcRenderer } from 'electron';

export interface ConfigApi {
  read: (filePath: string) => Promise<string | null>;
  write: (filePath: string, content: string) => Promise<boolean>;
  exists: (filePath: string) => Promise<boolean>;
  backup: (filePath: string) => Promise<string | null>;
  restore: (backupPath: string, targetPath: string) => Promise<boolean>;
  listBackups: (configPath: string) => Promise<string[]>;
}

export interface ServerApi {
  test: (command: string, args: string[], env?: Record<string, string>) => Promise<{
    success: boolean;
    message: string;
    capabilities?: { tools?: string[]; prompts?: string[]; resources?: string[] };
  }>;
  discover: () => Promise<Array<{
    name: string;
    command: string;
    args: string[];
    source: string;
  }>>;
}

export interface ToolApi {
  detectInstalled: (configPaths: string[]) => Promise<Record<string, boolean>>;
  getDefinitions: () => Promise<unknown>;
}

export interface FsApi {
  exists: (filePath: string) => Promise<boolean>;
  readDir: (dirPath: string) => Promise<string[]>;
}

export interface AppApi {
  getPath: (name: 'home' | 'appData' | 'userData' | 'temp') => Promise<string>;
  getPlatform: () => Promise<string>;
}

export interface ShellApi {
  openPath: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  showItemInFolder: (filePath: string) => Promise<{ success: boolean; error?: string }>;
}

export interface ElectronApi {
  config: ConfigApi;
  server: ServerApi;
  tool: ToolApi;
  fs: FsApi;
  app: AppApi;
  shell: ShellApi;
}

const electronApi: ElectronApi = {
  config: {
    read: (filePath: string) => ipcRenderer.invoke('config:read', filePath),
    write: (filePath: string, content: string) => ipcRenderer.invoke('config:write', filePath, content),
    exists: (filePath: string) => ipcRenderer.invoke('config:exists', filePath),
    backup: (filePath: string) => ipcRenderer.invoke('config:backup', filePath),
    restore: (backupPath: string, targetPath: string) => ipcRenderer.invoke('config:restore', backupPath, targetPath),
    listBackups: (configPath: string) => ipcRenderer.invoke('config:list-backups', configPath),
  },
  server: {
    test: (command: string, args: string[], env?: Record<string, string>) =>
      ipcRenderer.invoke('server:test', command, args, env),
    discover: () => ipcRenderer.invoke('server:discover'),
  },
  tool: {
    detectInstalled: (configPaths: string[]) => ipcRenderer.invoke('tool:detect-installed', configPaths),
    getDefinitions: () => ipcRenderer.invoke('tool:get-definitions'),
  },
  fs: {
    exists: (filePath: string) => ipcRenderer.invoke('fs:exists', filePath),
    readDir: (dirPath: string) => ipcRenderer.invoke('fs:read-dir', dirPath),
  },
  app: {
    getPath: (name: 'home' | 'appData' | 'userData' | 'temp') => ipcRenderer.invoke('app:get-path', name),
    getPlatform: () => ipcRenderer.invoke('app:get-platform'),
  },
  shell: {
    openPath: (filePath: string) => ipcRenderer.invoke('shell:open-path', filePath),
    showItemInFolder: (filePath: string) => ipcRenderer.invoke('shell:show-item-in-folder', filePath),
  },
};

contextBridge.exposeInMainWorld('electron', electronApi);
