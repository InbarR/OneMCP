import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { Tool } from '@/types';

interface ToolSelectorProps {
  tools: Tool[];
  selectedTools: string[];
  onToggleTool: (toolId: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
}

export function ToolSelector({
  tools,
  selectedTools,
  onToggleTool,
  onSelectAll,
  onSelectNone,
}: ToolSelectorProps) {
  const installedTools = tools.filter((t) => t.isInstalled);
  const allSelected = installedTools.every((t) => selectedTools.includes(t.id));
  const noneSelected = !installedTools.some((t) => selectedTools.includes(t.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Sync to Tools</h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSelectAll}
            disabled={allSelected}
          >
            Select All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSelectNone}
            disabled={noneSelected}
          >
            Select None
          </Button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => tool.isInstalled && onToggleTool(tool.id)}
            disabled={!tool.isInstalled}
            className={cn(
              'flex items-center justify-between rounded-lg border p-3 text-left transition-colors',
              tool.isInstalled
                ? 'hover:bg-accent cursor-pointer'
                : 'cursor-not-allowed opacity-50',
              selectedTools.includes(tool.id) && 'border-primary bg-primary/5'
            )}
          >
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded border',
                  selectedTools.includes(tool.id)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground'
                )}
              >
                {selectedTools.includes(tool.id) && <Check className="h-3 w-3" />}
              </div>
              <span className="font-medium">{tool.name}</span>
            </div>

            {!tool.isInstalled && (
              <Badge variant="outline" className="text-xs">
                Not installed
              </Badge>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
