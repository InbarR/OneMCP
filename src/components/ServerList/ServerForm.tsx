import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { serverFormSchema, parseArgs, stringifyArgs, type ServerFormData } from '@/lib/serverSchema';
import type { McpServer, Tool } from '@/types';

interface ServerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  server?: McpServer | null;
  tools: Tool[];
  onSubmit: (data: McpServer) => void;
}

export function ServerForm({ open, onOpenChange, server, tools, onSubmit }: ServerFormProps) {
  const isEditing = !!server;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ServerFormData>({
    resolver: zodResolver(serverFormSchema),
    defaultValues: {
      name: '',
      command: '',
      args: '',
      env: [],
      cwd: '',
      transportType: 'stdio',
      url: '',
    },
  });

  const { fields: envFields, append: appendEnv, remove: removeEnv } = useFieldArray({
    control,
    name: 'env',
  });

  const transportType = watch('transportType');

  useEffect(() => {
    if (server) {
      reset({
        name: server.name,
        command: server.command,
        args: stringifyArgs(server.args),
        env: Object.entries(server.env || {}).map(([key, value]) => ({ key, value })),
        cwd: server.cwd || '',
        transportType: server.transportType || 'stdio',
        url: server.url || '',
      });
    } else {
      reset({
        name: '',
        command: '',
        args: '',
        env: [],
        cwd: '',
        transportType: 'stdio',
        url: '',
      });
    }
  }, [server, reset]);

  const [enabledTools, setEnabledTools] = useState<string[]>(server?.enabledTools || []);

  useEffect(() => {
    setEnabledTools(server?.enabledTools || []);
  }, [server]);

  const toggleTool = (toolId: string) => {
    setEnabledTools((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    );
  };

  const onFormSubmit = (data: ServerFormData) => {
    const envRecord: Record<string, string> = {};
    data.env.forEach(({ key, value }) => {
      if (key.trim()) {
        envRecord[key.trim()] = value;
      }
    });

    const serverData: McpServer = {
      id: server?.id || '',
      name: data.name.trim(),
      command: data.command.trim(),
      args: parseArgs(data.args),
      env: Object.keys(envRecord).length > 0 ? envRecord : undefined,
      cwd: data.cwd?.trim() || undefined,
      transportType: data.transportType,
      url: data.transportType === 'http' ? data.url : undefined,
      enabledTools,
      toolSettings: server?.toolSettings,
    };

    onSubmit(serverData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Server' : 'Add Server'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)}>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
              <TabsTrigger value="environment" className="flex-1">Environment</TabsTrigger>
              <TabsTrigger value="tools" className="flex-1">Tools</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[400px] pr-4">
              <TabsContent value="general" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Server Name</Label>
                  <Input
                    id="name"
                    placeholder="my-mcp-server"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="command">Command</Label>
                  <Input
                    id="command"
                    placeholder="npx, node, python, etc."
                    {...register('command')}
                  />
                  {errors.command && (
                    <p className="text-xs text-destructive">{errors.command.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="args">Arguments</Label>
                  <Textarea
                    id="args"
                    placeholder="-y @modelcontextprotocol/server-filesystem"
                    className="font-mono text-sm"
                    {...register('args')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Space-separated arguments. Use quotes for arguments with spaces.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transportType">Transport Type</Label>
                  <Select
                    value={transportType}
                    onValueChange={(value: 'stdio' | 'http') => setValue('transportType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select transport type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stdio">stdio (Standard I/O)</SelectItem>
                      <SelectItem value="http">HTTP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {transportType === 'http' && (
                  <div className="space-y-2">
                    <Label htmlFor="url">Server URL</Label>
                    <Input
                      id="url"
                      placeholder="http://localhost:3000"
                      {...register('url')}
                    />
                    {errors.url && (
                      <p className="text-xs text-destructive">{errors.url.message}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="cwd">Working Directory (Optional)</Label>
                  <Input
                    id="cwd"
                    placeholder="/path/to/project"
                    {...register('cwd')}
                  />
                </div>
              </TabsContent>

              <TabsContent value="environment" className="space-y-4 mt-4">
                <div className="space-y-3">
                  {envFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <Input
                        placeholder="KEY"
                        className="flex-1 font-mono"
                        {...register(`env.${index}.key`)}
                      />
                      <Input
                        placeholder="value"
                        className="flex-[2] font-mono"
                        type="password"
                        {...register(`env.${index}.value`)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeEnv(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendEnv({ key: '', value: '' })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Variable
                </Button>

                <p className="text-xs text-muted-foreground">
                  Environment variables are stored securely and passed to the server process.
                </p>
              </TabsContent>

              <TabsContent value="tools" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Select which tools should use this server:
                </p>

                <div className="space-y-3">
                  {tools.map((tool) => (
                    <div
                      key={tool.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{tool.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {tool.isInstalled ? 'Installed' : 'Not installed'}
                        </p>
                      </div>
                      <Switch
                        checked={enabledTools.includes(tool.id)}
                        onCheckedChange={() => toggleTool(tool.id)}
                        disabled={!tool.isInstalled}
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEditing ? 'Save Changes' : 'Add Server'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
