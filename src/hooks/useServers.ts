import { useCallback } from 'react';
import { useStore } from './useStore';
import { generateServerId, serversToToolConfig, toolConfigToServers, buildFullConfig } from '../lib/configManager';
import { logger } from '../lib/logger';
import type { McpServer, Tool, ToolConfig, ServerTestResult } from '../types';

export function useServers() {
  const {
    servers,
    setServers,
    addServer,
    updateServer,
    removeServer,
    tools,
    preferences,
    setIsLoading,
    setError,
  } = useStore();

  const loadServersFromTool = useCallback(async (tool: Tool): Promise<McpServer[]> => {
    if (!window.electron) return [];

    try {
      const content = await window.electron.config.read(tool.configPath);
      if (!content) return [];

      const config = JSON.parse(content) as ToolConfig;
      return toolConfigToServers(config, tool);
    } catch (err) {
      logger.error(`Error loading servers from ${tool.name}:`, err);
      return [];
    }
  }, []);

  const loadAllServers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const allServers: McpServer[] = [];
      const seenNames = new Set<string>();

      for (const tool of tools.filter((t) => t.isInstalled)) {
        const toolServers = await loadServersFromTool(tool);

        for (const server of toolServers) {
          if (!seenNames.has(server.name)) {
            seenNames.add(server.name);
            allServers.push(server);
          } else {
            // Merge enabled tools for servers with the same name
            const existing = allServers.find((s) => s.name === server.name);
            if (existing && server.enabledTools) {
              existing.enabledTools = [
                ...(existing.enabledTools || []),
                ...server.enabledTools,
              ];
            }
          }
        }
      }

      setServers(allServers);
    } catch (err) {
      setError(`Failed to load servers: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, [tools, loadServersFromTool, setServers, setIsLoading, setError]);

  const saveServerToTool = useCallback(
    async (server: McpServer, tool: Tool): Promise<boolean> => {
      logger.info(`saveServerToTool: Saving "${server.name}" to ${tool.name}`);
      logger.info(`saveServerToTool: Tool config path: ${tool.configPath}`);

      if (!window.electron) {
        logger.error(`saveServerToTool: window.electron not available`);
        return false;
      }

      try {
        // Create backup if enabled
        if (preferences.backupEnabled) {
          logger.info(`saveServerToTool: Creating backup...`);
          await window.electron.config.backup(tool.configPath);
        }

        // Read existing config
        let existingConfig: ToolConfig = {};
        const content = await window.electron.config.read(tool.configPath);
        if (content) {
          existingConfig = JSON.parse(content);
          logger.info(`saveServerToTool: Read existing config`);
        } else {
          logger.info(`saveServerToTool: No existing config, creating new`);
        }

        // Get current servers for this tool (including the new/updated one)
        const currentServers = servers.filter(
          (s) => s.enabledTools?.includes(tool.id) || s.id === server.id
        );
        logger.info(`saveServerToTool: ${currentServers.length} servers for this tool`);

        // Update the server's enabled tools
        const updatedServer = {
          ...server,
          enabledTools: [...(server.enabledTools || []), tool.id].filter(
            (v, i, a) => a.indexOf(v) === i
          ),
        };

        // Find and update or add the server
        const serverIndex = currentServers.findIndex((s) => s.id === server.id);
        if (serverIndex >= 0) {
          currentServers[serverIndex] = updatedServer;
          logger.info(`saveServerToTool: Updated existing server in list`);
        } else {
          currentServers.push(updatedServer);
          logger.info(`saveServerToTool: Added new server to list`);
        }

        // Convert to tool config format
        const toolServers = serversToToolConfig(currentServers, tool);
        const newConfig = buildFullConfig(existingConfig, toolServers, tool);
        logger.info(`saveServerToTool: Built new config: ${JSON.stringify(newConfig, null, 2)}`);

        // Write config
        const success = await window.electron.config.write(
          tool.configPath,
          JSON.stringify(newConfig, null, 2)
        );
        logger.info(`saveServerToTool: Write result: ${success ? 'SUCCESS' : 'FAILED'}`);

        return success;
      } catch (err) {
        logger.error(`saveServerToTool: Error saving server to ${tool.name}:`, err);
        return false;
      }
    },
    [servers, preferences.backupEnabled]
  );

  const createServer = useCallback(
    async (serverData: Omit<McpServer, 'id' | 'createdAt' | 'updatedAt'>) => {
      logger.info(`createServer: Creating new server: ${serverData.name}`);
      logger.info(`createServer: Enabled tools: ${JSON.stringify(serverData.enabledTools)}`);

      const newServer: McpServer = {
        ...serverData,
        id: generateServerId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      logger.info(`createServer: Generated server ID: ${newServer.id}`);

      addServer(newServer);

      // Save to enabled tools
      const enabledTools = tools.filter(
        (t) => t.isInstalled && serverData.enabledTools?.includes(t.id)
      );
      logger.info(`createServer: Saving to ${enabledTools.length} enabled tool(s): ${enabledTools.map(t => t.name).join(', ')}`);

      for (const tool of enabledTools) {
        logger.info(`createServer: Saving to ${tool.name}...`);
        await saveServerToTool(newServer, tool);
      }

      logger.info(`createServer: Done`);
      return newServer;
    },
    [addServer, tools, saveServerToTool]
  );

  const removeServerFromTool = useCallback(
    async (server: McpServer, tool: Tool): Promise<boolean> => {
      logger.info(`removeServerFromTool: Removing "${server.name}" from ${tool.name}`);
      if (!window.electron) return false;

      try {
        if (preferences.backupEnabled) {
          await window.electron.config.backup(tool.configPath);
        }

        const content = await window.electron.config.read(tool.configPath);
        if (!content) {
          logger.info(`removeServerFromTool: No config file exists`);
          return true;
        }

        const config = JSON.parse(content) as ToolConfig;

        // Get all servers for this tool EXCEPT the one we're removing
        const remainingServers = servers.filter(
          (s) => s.id !== server.id && s.enabledTools?.includes(tool.id)
        );
        logger.info(`removeServerFromTool: ${remainingServers.length} servers remaining for ${tool.name}`);

        const toolServers = serversToToolConfig(remainingServers, tool);
        const newConfig = buildFullConfig(config, toolServers, tool);
        logger.info(`removeServerFromTool: Writing updated config to ${tool.name}`);

        const success = await window.electron.config.write(
          tool.configPath,
          JSON.stringify(newConfig, null, 2)
        );
        logger.info(`removeServerFromTool: ${success ? 'SUCCESS' : 'FAILED'}`);
        return success;
      } catch (err) {
        logger.error(`removeServerFromTool: Error:`, err);
        return false;
      }
    },
    [servers, preferences.backupEnabled]
  );

  const editServer = useCallback(
    async (id: string, updates: Partial<McpServer>) => {
      logger.info(`editServer: Editing server ID: ${id}`);
      logger.info(`editServer: Updates: ${JSON.stringify(updates)}`);

      // Find the original server BEFORE updating
      const originalServer = servers.find((s) => s.id === id);
      if (!originalServer) {
        logger.warn(`editServer: Server not found!`);
        return;
      }

      const updatedServer = { ...originalServer, ...updates };
      logger.info(`editServer: Updated server: ${updatedServer.name}`);
      logger.info(`editServer: Original enabledTools: ${JSON.stringify(originalServer.enabledTools)}`);
      logger.info(`editServer: New enabledTools: ${JSON.stringify(updatedServer.enabledTools)}`);

      // Find tools that were REMOVED (were in original but not in updated)
      const removedToolIds = (originalServer.enabledTools || []).filter(
        (toolId) => !updatedServer.enabledTools?.includes(toolId)
      );
      logger.info(`editServer: Tools removed: ${JSON.stringify(removedToolIds)}`);

      // Remove server from tools that were disabled
      for (const toolId of removedToolIds) {
        const tool = tools.find((t) => t.id === toolId && t.isInstalled);
        if (tool) {
          logger.info(`editServer: Removing from ${tool.name}`);
          await removeServerFromTool(originalServer, tool);
        }
      }

      // Now update the store
      updateServer(id, updates);

      // Save to all currently enabled tools
      const enabledTools = tools.filter(
        (t) => t.isInstalled && updatedServer.enabledTools?.includes(t.id)
      );
      logger.info(`editServer: Saving to ${enabledTools.length} enabled tool(s): ${enabledTools.map(t => t.name).join(', ')}`);

      for (const tool of enabledTools) {
        await saveServerToTool(updatedServer, tool);
      }
      logger.info(`editServer: Done`);
    },
    [updateServer, servers, tools, saveServerToTool, removeServerFromTool]
  );

  const deleteServer = useCallback(
    async (id: string) => {
      const server = servers.find((s) => s.id === id);
      if (!server) return;

      // Remove from all tool configs
      for (const tool of tools.filter((t) => t.isInstalled)) {
        if (!server.enabledTools?.includes(tool.id)) continue;

        try {
          if (preferences.backupEnabled) {
            await window.electron?.config.backup(tool.configPath);
          }

          const content = await window.electron?.config.read(tool.configPath);
          if (!content) continue;

          const config = JSON.parse(content) as ToolConfig;
          const remainingServers = servers.filter(
            (s) => s.id !== id && s.enabledTools?.includes(tool.id)
          );
          const toolServers = serversToToolConfig(remainingServers, tool);
          const newConfig = buildFullConfig(config, toolServers, tool);

          await window.electron?.config.write(
            tool.configPath,
            JSON.stringify(newConfig, null, 2)
          );
        } catch (err) {
          logger.error(`Error removing server from ${tool.name}:`, err);
        }
      }

      removeServer(id);
    },
    [servers, tools, preferences.backupEnabled, removeServer]
  );

  const testServer = useCallback(
    async (server: McpServer): Promise<ServerTestResult> => {
      if (!window.electron) {
        return { success: false, message: 'Electron API not available' };
      }

      try {
        const result = await window.electron.server.test(
          server.command,
          server.args,
          server.env
        );
        return result;
      } catch (err) {
        return {
          success: false,
          message: `Test failed: ${(err as Error).message}`,
        };
      }
    },
    []
  );

  const syncToAllTools = useCallback(async () => {
    logger.info(`syncToAllTools: Starting sync...`);
    setIsLoading(true);
    setError(null);

    try {
      const installedTools = tools.filter((t) => t.isInstalled);
      logger.info(`syncToAllTools: Syncing to ${installedTools.length} installed tool(s)`);

      for (const tool of installedTools) {
        const toolServers = servers.filter((s) => s.enabledTools?.includes(tool.id));
        logger.info(`syncToAllTools: ${tool.name} - ${toolServers.length} server(s)`);
        logger.info(`syncToAllTools: ${tool.name} config path: ${tool.configPath}`);

        if (preferences.backupEnabled) {
          logger.info(`syncToAllTools: Creating backup for ${tool.name}`);
          await window.electron?.config.backup(tool.configPath);
        }

        let existingConfig: ToolConfig = {};
        const content = await window.electron?.config.read(tool.configPath);
        if (content) {
          existingConfig = JSON.parse(content);
        }

        const toolServersConfig = serversToToolConfig(toolServers, tool);
        const newConfig = buildFullConfig(existingConfig, toolServersConfig, tool);
        logger.info(`syncToAllTools: Writing config to ${tool.name}`);

        await window.electron?.config.write(
          tool.configPath,
          JSON.stringify(newConfig, null, 2)
        );
        logger.info(`syncToAllTools: ${tool.name} sync complete`);
      }
      logger.info(`syncToAllTools: All syncs complete`);
    } catch (err) {
      logger.error(`syncToAllTools: Error:`, err);
      setError(`Sync failed: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, [servers, tools, preferences.backupEnabled, setIsLoading, setError]);

  return {
    servers,
    loadAllServers,
    createServer,
    editServer,
    deleteServer,
    testServer,
    syncToAllTools,
  };
}
