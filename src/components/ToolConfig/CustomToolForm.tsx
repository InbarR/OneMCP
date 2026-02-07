import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { customToolSchema, type CustomToolData } from '@/lib/serverSchema';
import type { CustomTool, ConfigFormat } from '@/types';

interface CustomToolFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (tool: CustomTool) => void;
}

export function CustomToolForm({ open, onOpenChange, onSubmit }: CustomToolFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CustomToolData>({
    resolver: zodResolver(customToolSchema),
    defaultValues: {
      id: '',
      name: '',
      configPath: '',
      configFormat: 'mcpServers',
    },
  });

  const configFormat = watch('configFormat');

  const onFormSubmit = (data: CustomToolData) => {
    const customTool: CustomTool = {
      id: data.id.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      name: data.name,
      configPath: data.configPath,
      configFormat: data.configFormat,
      serverKey: data.serverKey || data.configFormat,
      isBuiltIn: false,
      addedAt: new Date().toISOString(),
    };

    onSubmit(customTool);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Custom Tool</DialogTitle>
          <DialogDescription>
            Define a custom AI tool that uses MCP server configurations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tool Name</Label>
            <Input
              id="name"
              placeholder="My Custom Tool"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="id">Tool ID</Label>
            <Input
              id="id"
              placeholder="my-custom-tool"
              {...register('id')}
            />
            <p className="text-xs text-muted-foreground">
              Unique identifier (lowercase, hyphens allowed)
            </p>
            {errors.id && (
              <p className="text-xs text-destructive">{errors.id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="configPath">Config File Path</Label>
            <Input
              id="configPath"
              placeholder="~/.mytool/config.json"
              {...register('configPath')}
            />
            <p className="text-xs text-muted-foreground">
              Use ~ for home directory, %APPDATA% for Windows AppData
            </p>
            {errors.configPath && (
              <p className="text-xs text-destructive">{errors.configPath.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="configFormat">Config Format</Label>
            <Select
              value={configFormat}
              onValueChange={(value: ConfigFormat) => setValue('configFormat', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select config format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mcpServers">
                  mcpServers (Claude Desktop style)
                </SelectItem>
                <SelectItem value="servers">
                  servers (Simple key)
                </SelectItem>
                <SelectItem value="mcp.servers">
                  mcp.servers (VS Code style)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              The JSON key where MCP servers are stored
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Tool</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
