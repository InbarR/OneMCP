import { useEffect, useState, useCallback } from 'react';
import { Header, Sidebar } from './components/Layout';
import { ServerList } from './components/ServerList';
import { CustomToolForm } from './components/ToolConfig';
import { LogPanel } from './components/LogPanel';
import { useStore, useTools, useServers, useConfig } from './hooks';
import { TooltipProvider } from './components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './components/ui/dialog';
import { Button } from './components/ui/button';
import { Textarea } from './components/ui/textarea';
import { Label } from './components/ui/label';
import { logger } from './lib/logger';
import type { CustomTool } from './types';

function App() {
  const { selectedToolId, setSelectedToolId, isLoading, error, setError, addCustomTool, preferences, setPreferences } = useStore();
  const { tools, refreshTools } = useTools();
  const { servers, loadAllServers, createServer, editServer, deleteServer, testServer, syncToAllTools } = useServers();
  const { exportConfig, importConfig } = useConfig();

  const [customToolFormOpen, setCustomToolFormOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [logPanelOpen, setLogPanelOpen] = useState(false);

  // Load servers on mount and when tools change
  useEffect(() => {
    if (tools.length > 0) {
      loadAllServers();
    }
  }, [tools, loadAllServers]);

  const handleRefresh = useCallback(() => {
    refreshTools();
    loadAllServers();
  }, [refreshTools, loadAllServers]);

  const handleImport = () => {
    setImportText('');
    setImportError(null);
    setImportDialogOpen(true);
  };

  const handleExport = () => {
    setExportDialogOpen(true);
  };

  const handleSettings = () => {
    setSettingsDialogOpen(true);
  };

  const handleImportSubmit = async () => {
    const result = importConfig(importText);
    if (result.error) {
      setImportError(result.error);
      return;
    }

    // Add imported servers
    for (const server of result.servers) {
      await createServer(server);
    }

    setImportDialogOpen(false);
    setImportText('');
    setImportError(null);
  };

  const handleAddCustomTool = (tool: CustomTool) => {
    addCustomTool(tool);
    refreshTools();
  };

  const handleOpenConfig = async (configPath: string) => {
    if (!window.electron) return;
    logger.info(`Opening config file: ${configPath}`);
    const result = await window.electron.shell.openPath(configPath);
    if (!result.success) {
      logger.error(`Failed to open config: ${result.error}`);
      setError(`Failed to open config: ${result.error}`);
    }
  };

  const handleShowInFolder = async (configPath: string) => {
    if (!window.electron) return;
    logger.info(`Showing in folder: ${configPath}`);
    await window.electron.shell.showItemInFolder(configPath);
  };

  const exportedConfig = exportConfig(servers);

  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col bg-background">
        <Header
          onRefresh={handleRefresh}
          onImport={handleImport}
          onExport={handleExport}
          onSettings={handleSettings}
          onToggleLogs={() => setLogPanelOpen(!logPanelOpen)}
          isLoading={isLoading}
          logsOpen={logPanelOpen}
        />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            tools={tools}
            selectedToolId={selectedToolId}
            onSelectTool={setSelectedToolId}
            onAddCustomTool={() => setCustomToolFormOpen(true)}
          />

          <main className="flex-1 overflow-hidden">
            <ServerList
              servers={servers}
              tools={tools}
              selectedToolId={selectedToolId}
              onCreateServer={createServer}
              onEditServer={editServer}
              onDeleteServer={deleteServer}
              onTestServer={testServer}
              onOpenConfig={handleOpenConfig}
              onShowInFolder={handleShowInFolder}
              onEditTool={(toolId, name, configPath) => {
                const currentOverrides = preferences.toolOverrides || {};
                setPreferences({
                  toolOverrides: {
                    ...currentOverrides,
                    [toolId]: { name, configPath },
                  },
                });
                refreshTools();
              }}
              onRemoveTool={(toolId) => {
                const currentHidden = preferences.hiddenTools || [];
                setPreferences({ hiddenTools: [...currentHidden, toolId] });
                setSelectedToolId(null);
                refreshTools();
              }}
            />
          </main>
        </div>

        {/* Error display */}
        {error && (
          <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border bg-destructive px-4 py-2 text-destructive-foreground shadow-lg">
            <div className="flex items-center gap-4">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive-foreground hover:text-destructive-foreground"
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Custom Tool Form */}
        <CustomToolForm
          open={customToolFormOpen}
          onOpenChange={setCustomToolFormOpen}
          onSubmit={handleAddCustomTool}
        />

        {/* Import Dialog */}
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import Configuration</DialogTitle>
              <DialogDescription>
                Paste a previously exported OneMCP configuration to import servers.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Configuration JSON</Label>
                <Textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder='{"version": "1.0", "servers": [...]}'
                  className="min-h-[300px] font-mono text-sm"
                />
                {importError && (
                  <p className="text-sm text-destructive">{importError}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleImportSubmit} disabled={!importText.trim()}>
                Import
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Export Dialog */}
        <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Export Configuration</DialogTitle>
              <DialogDescription>
                Copy this configuration to backup or share your MCP server setup.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Configuration JSON</Label>
                <Textarea
                  value={exportedConfig}
                  readOnly
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                Close
              </Button>
              <Button
                onClick={async () => {
                  await navigator.clipboard.writeText(exportedConfig);
                }}
              >
                Copy to Clipboard
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Settings Dialog */}
        <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Settings</DialogTitle>
              <DialogDescription>
                Configure OneMCP preferences.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Sync</h3>
                <Button onClick={syncToAllTools} className="w-full">
                  Sync All Servers to All Tools
                </Button>
                <p className="text-xs text-muted-foreground">
                  This will update all tool configuration files with the current server list.
                </p>
              </div>

              {(preferences.hiddenTools?.length ?? 0) > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Hidden Tools</h3>
                  <p className="text-xs text-muted-foreground">
                    Click to restore hidden tools.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {preferences.hiddenTools?.map((toolId) => (
                      <Button
                        key={toolId}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPreferences({
                            hiddenTools: preferences.hiddenTools?.filter((id) => id !== toolId),
                          });
                          refreshTools();
                        }}
                      >
                        {toolId}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Log Panel */}
        <LogPanel isOpen={logPanelOpen} onClose={() => setLogPanelOpen(false)} />
      </div>
    </TooltipProvider>
  );
}

export default App;
