import { useState } from 'react';
import { Plus, Search, FileText, FolderOpen, Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { ServerCard } from './ServerCard';
import { ServerForm } from './ServerForm';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Label } from '../ui/label';
import type { McpServer, Tool, ServerTestResult } from '@/types';

interface ServerListProps {
  servers: McpServer[];
  tools: Tool[];
  selectedToolId: string | null;
  onCreateServer: (server: Omit<McpServer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<McpServer>;
  onEditServer: (id: string, updates: Partial<McpServer>) => Promise<void>;
  onDeleteServer: (id: string) => Promise<void>;
  onTestServer: (server: McpServer) => Promise<ServerTestResult>;
  onOpenConfig?: (configPath: string) => void;
  onShowInFolder?: (configPath: string) => void;
  onEditTool?: (toolId: string, name: string, configPath: string) => void;
  onRemoveTool?: (toolId: string) => void;
}

export function ServerList({
  servers,
  tools,
  selectedToolId,
  onCreateServer,
  onEditServer,
  onDeleteServer,
  onTestServer,
  onOpenConfig,
  onShowInFolder,
  onEditTool,
  onRemoveTool,
}: ServerListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<McpServer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<McpServer | null>(null);
  const [isEditingTool, setIsEditingTool] = useState(false);
  const [editToolName, setEditToolName] = useState('');
  const [editToolPath, setEditToolPath] = useState('');

  // Filter servers based on selected tool and search query
  const filteredServers = servers.filter((server) => {
    // Filter by tool if one is selected
    if (selectedToolId && !server.enabledTools?.includes(selectedToolId)) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        server.name.toLowerCase().includes(query) ||
        server.command?.toLowerCase().includes(query) ||
        server.args?.some((arg) => arg.toLowerCase().includes(query))
      );
    }

    return true;
  });

  const selectedTool = selectedToolId ? tools.find((t) => t.id === selectedToolId) : null;

  const handleCreateOrEdit = async (serverData: McpServer) => {
    if (editingServer) {
      await onEditServer(editingServer.id, serverData);
    } else {
      await onCreateServer(serverData);
    }
    setEditingServer(null);
  };

  const handleEdit = (server: McpServer) => {
    setEditingServer(server);
    setFormOpen(true);
  };

  const handleClone = (server: McpServer) => {
    setEditingServer({
      ...server,
      id: '',
      name: `${server.name} (copy)`,
    });
    setFormOpen(true);
  };

  const handleDelete = async (server: McpServer) => {
    if (deleteConfirm?.id === server.id) {
      await onDeleteServer(server.id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(server);
      // Auto-clear confirmation after 3 seconds
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleAddNew = () => {
    setEditingServer(null);
    setFormOpen(true);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4">
        {selectedTool && isEditingTool ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tool Name</Label>
              <Input
                value={editToolName}
                onChange={(e) => setEditToolName(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Config Path</Label>
              <Input
                value={editToolPath}
                onChange={(e) => setEditToolPath(e.target.value)}
                className="h-9 font-mono text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditingTool(false)}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={() => {
                onEditTool?.(selectedTool.id, editToolName, editToolPath);
                setIsEditingTool(false);
              }}>
                <Check className="h-4 w-4 mr-1" /> Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold">
                {selectedTool ? `${selectedTool.name} Servers` : 'All Servers'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {filteredServers.length} server{filteredServers.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {selectedTool && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditToolName(selectedTool.name);
                          setEditToolPath(selectedTool.configPath);
                          setIsEditingTool(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit Tool</TooltipContent>
                  </Tooltip>
                  {onOpenConfig && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onOpenConfig(selectedTool.configPath)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Open Config</TooltipContent>
                    </Tooltip>
                  )}
                  {onShowInFolder && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onShowInFolder(selectedTool.configPath)}
                        >
                          <FolderOpen className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Show in Folder</TooltipContent>
                    </Tooltip>
                  )}
                  {onRemoveTool && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => onRemoveTool(selectedTool.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Remove Tool</TooltipContent>
                    </Tooltip>
                  )}
                </>
              )}
              <Button onClick={handleAddNew}>
                <Plus className="mr-2 h-4 w-4" />
                Add Server
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="border-b p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search servers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Server Grid */}
      <ScrollArea className="flex-1">
        <div className="grid gap-4 p-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {filteredServers.map((server) => (
            <ServerCard
              key={server.id}
              server={server}
              tools={tools}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onClone={handleClone}
              onTest={onTestServer}
            />
          ))}

          {filteredServers.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              {searchQuery ? (
                <>No servers found matching "{searchQuery}"</>
              ) : selectedTool ? (
                <>No servers configured for {selectedTool.name}</>
              ) : (
                <>No MCP servers configured yet. Click "Add Server" to get started.</>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Delete Confirmation Toast */}
      {deleteConfirm && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg border bg-background p-4 shadow-lg">
          <p className="mb-2">Click delete again to confirm removal of "{deleteConfirm.name}"</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(deleteConfirm)}
            >
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Server Form Dialog */}
      <ServerForm
        open={formOpen}
        onOpenChange={setFormOpen}
        server={editingServer}
        tools={tools}
        onSubmit={handleCreateOrEdit}
      />
    </div>
  );
}
