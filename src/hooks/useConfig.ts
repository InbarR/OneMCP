import { useCallback, useState } from 'react';
import type { McpServer, Tool, Backup } from '../types';

export function useConfig() {
  const [backups, setBackups] = useState<Backup[]>([]);

  const exportConfig = useCallback((servers: McpServer[]): string => {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      servers: servers.map((s) => ({
        name: s.name,
        command: s.command,
        args: s.args,
        env: s.env,
        cwd: s.cwd,
        transportType: s.transportType,
        url: s.url,
        toolSettings: s.toolSettings,
        enabledTools: s.enabledTools,
      })),
    };

    return JSON.stringify(exportData, null, 2);
  }, []);

  const importConfig = useCallback(
    (jsonString: string): { servers: McpServer[]; error?: string } => {
      try {
        const data = JSON.parse(jsonString);

        if (!data.servers || !Array.isArray(data.servers)) {
          return { servers: [], error: 'Invalid config format: missing servers array' };
        }

        const servers: McpServer[] = data.servers.map(
          (s: Partial<McpServer>, index: number) => ({
            id: `imported_${Date.now()}_${index}`,
            name: s.name || `Server ${index + 1}`,
            command: s.command || '',
            args: s.args || [],
            env: s.env,
            cwd: s.cwd,
            transportType: s.transportType || 'stdio',
            url: s.url,
            toolSettings: s.toolSettings,
            enabledTools: s.enabledTools || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        );

        return { servers };
      } catch (err) {
        return { servers: [], error: `Parse error: ${(err as Error).message}` };
      }
    },
    []
  );

  const loadBackups = useCallback(async (tool: Tool) => {
    if (!window.electron) return;

    try {
      const backupPaths = await window.electron.config.listBackups(tool.configPath);

      const loadedBackups: Backup[] = backupPaths.map((path, index) => {
        // Extract timestamp from filename
        const match = path.match(/\.backup\.(.+)$/);
        const timestamp = match ? match[1].replace(/-/g, ':') : new Date().toISOString();

        return {
          id: `backup_${index}`,
          timestamp,
          toolId: tool.id,
          configPath: path,
          content: '', // Loaded on demand
        };
      });

      setBackups(loadedBackups);
    } catch (err) {
      console.error('Error loading backups:', err);
    }
  }, []);

  const restoreBackup = useCallback(
    async (backup: Backup, targetPath: string): Promise<boolean> => {
      if (!window.electron) return false;

      try {
        return await window.electron.config.restore(backup.configPath, targetPath);
      } catch (err) {
        console.error('Error restoring backup:', err);
        return false;
      }
    },
    []
  );

  const createBackup = useCallback(async (tool: Tool): Promise<string | null> => {
    if (!window.electron) return null;

    try {
      return await window.electron.config.backup(tool.configPath);
    } catch (err) {
      console.error('Error creating backup:', err);
      return null;
    }
  }, []);

  return {
    backups,
    loadBackups,
    restoreBackup,
    createBackup,
    exportConfig,
    importConfig,
  };
}
