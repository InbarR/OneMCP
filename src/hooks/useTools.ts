import { useEffect, useCallback, useState } from 'react';
import { useStore } from './useStore';
import { getBuiltInTools } from '../lib/toolRegistry';
import { initPathResolver } from '../lib/pathResolver';
import type { Tool } from '../types';

declare global {
  interface Window {
    electron: {
      config: {
        read: (filePath: string) => Promise<string | null>;
        write: (filePath: string, content: string) => Promise<boolean>;
        exists: (filePath: string) => Promise<boolean>;
        backup: (filePath: string) => Promise<string | null>;
        restore: (backupPath: string, targetPath: string) => Promise<boolean>;
        listBackups: (configPath: string) => Promise<string[]>;
      };
      server: {
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
      };
      tool: {
        detectInstalled: (configPaths: string[]) => Promise<Record<string, boolean>>;
        getDefinitions: () => Promise<unknown>;
      };
      fs: {
        exists: (filePath: string) => Promise<boolean>;
        readDir: (dirPath: string) => Promise<string[]>;
      };
      app: {
        getPath: (name: 'home' | 'appData' | 'userData' | 'temp') => Promise<string>;
        getPlatform: () => Promise<string>;
      };
    };
  }
}

export function useTools() {
  const { tools, setTools, preferences, setIsLoading, setError } = useStore();

  const loadTools = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Initialize path resolver before loading tools (needs platform info)
      await initPathResolver();

      // Get built-in tools
      const builtIn = getBuiltInTools();

      // Merge with custom tools from preferences
      const customTools = preferences.customTools || [];
      let allTools: Tool[] = [...builtIn, ...customTools];

      // Apply tool overrides (custom names and paths)
      const overrides = preferences.toolOverrides || {};
      allTools = allTools.map((tool) => {
        const override = overrides[tool.id];
        if (override) {
          return {
            ...tool,
            name: override.name || tool.name,
            configPath: override.configPath || tool.configPath,
          };
        }
        return tool;
      });

      // Filter out hidden tools
      const hiddenTools = preferences.hiddenTools || [];
      allTools = allTools.filter((tool) => !hiddenTools.includes(tool.id));

      // Check which tools are installed (config file exists)
      if (window.electron) {
        const configPaths = allTools.map((t) => t.configPath).filter(Boolean);
        const installed = await window.electron.tool.detectInstalled(configPaths);

        for (const tool of allTools) {
          tool.isInstalled = installed[tool.configPath] || false;
        }
      }

      setTools(allTools);
    } catch (err) {
      setError(`Failed to load tools: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, [preferences.customTools, preferences.toolOverrides, preferences.hiddenTools, setTools, setIsLoading, setError]);

  useEffect(() => {
    loadTools();
  }, [loadTools]);

  const refreshTools = useCallback(() => {
    loadTools();
  }, [loadTools]);

  return {
    tools,
    refreshTools,
    installedTools: tools.filter((t) => t.isInstalled),
  };
}
