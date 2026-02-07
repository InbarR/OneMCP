import { useEffect, useCallback } from 'react';
import { useStore } from './useStore';
import { getBuiltInTools } from '../lib/toolRegistry';
import { initPathResolver } from '../lib/pathResolver';
import type { Tool } from '../types';

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
