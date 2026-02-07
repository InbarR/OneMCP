import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { McpServer, Tool, CustomTool, UserPreferences, Profile } from '../types';

export interface LogEntry {
  id: number;
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
}

interface AppStore {
  // Logs
  logs: LogEntry[];
  addLog: (level: LogEntry['level'], message: string) => void;
  clearLogs: () => void;

  // Servers
  servers: McpServer[];
  setServers: (servers: McpServer[]) => void;
  addServer: (server: McpServer) => void;
  updateServer: (id: string, updates: Partial<McpServer>) => void;
  removeServer: (id: string) => void;

  // Tools
  tools: Tool[];
  setTools: (tools: Tool[]) => void;
  addCustomTool: (tool: CustomTool) => void;
  removeCustomTool: (id: string) => void;

  // Selected tool
  selectedToolId: string | null;
  setSelectedToolId: (id: string | null) => void;

  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // Preferences
  preferences: UserPreferences;
  setPreferences: (preferences: Partial<UserPreferences>) => void;

  // Profiles
  activeProfile: Profile | null;
  setActiveProfile: (profile: Profile | null) => void;
  addProfile: (profile: Profile) => void;
  updateProfile: (id: string, updates: Partial<Profile>) => void;
  removeProfile: (id: string) => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  customTools: [],
  profiles: [],
  activeProfileId: null,
  backupEnabled: true,
  maxBackups: 10,
};

let logIdCounter = 0;

export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      // Logs
      logs: [],
      addLog: (level, message) =>
        set((state) => ({
          logs: [...state.logs.slice(-99), { id: ++logIdCounter, timestamp: new Date(), level, message }],
        })),
      clearLogs: () => set({ logs: [] }),

      // Servers
      servers: [],
      setServers: (servers) => set({ servers }),
      addServer: (server) =>
        set((state) => ({
          servers: [...state.servers, server],
        })),
      updateServer: (id, updates) =>
        set((state) => ({
          servers: state.servers.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
          ),
        })),
      removeServer: (id) =>
        set((state) => ({
          servers: state.servers.filter((s) => s.id !== id),
        })),

      // Tools
      tools: [],
      setTools: (tools) => set({ tools }),
      addCustomTool: (tool) =>
        set((state) => ({
          tools: [...state.tools, tool],
          preferences: {
            ...state.preferences,
            customTools: [...state.preferences.customTools, tool],
          },
        })),
      removeCustomTool: (id) =>
        set((state) => ({
          tools: state.tools.filter((t) => t.id !== id),
          preferences: {
            ...state.preferences,
            customTools: state.preferences.customTools.filter((t) => t.id !== id),
          },
        })),

      // Selected tool
      selectedToolId: null,
      setSelectedToolId: (id) => set({ selectedToolId: id }),

      // UI state
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
      error: null,
      setError: (error) => set({ error }),

      // Preferences
      preferences: defaultPreferences,
      setPreferences: (preferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...preferences },
        })),

      // Profiles
      activeProfile: null,
      setActiveProfile: (profile) => set({ activeProfile: profile }),
      addProfile: (profile) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            profiles: [...state.preferences.profiles, profile],
          },
        })),
      updateProfile: (id, updates) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            profiles: state.preferences.profiles.map((p) =>
              p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
            ),
          },
        })),
      removeProfile: (id) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            profiles: state.preferences.profiles.filter((p) => p.id !== id),
          },
        })),
    }),
    {
      name: 'onemcp-storage',
      partialize: (state) => ({
        servers: state.servers,
        preferences: state.preferences,
        selectedToolId: state.selectedToolId,
      }),
    }
  )
);
