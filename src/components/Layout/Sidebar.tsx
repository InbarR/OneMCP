import { MessageSquare, Terminal, Bot, Code, MousePointer, Server, Plus, Check, Github } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import type { Tool } from '@/types';

const iconMap: Record<string, React.ElementType> = {
  MessageSquare,
  Terminal,
  Bot,
  Code,
  MousePointer,
  Server,
  Github,
};

function getIconComponent(iconName?: string): React.ElementType {
  if (!iconName) return Server;

  const iconMapping: Record<string, string> = {
    claude: 'MessageSquare',
    terminal: 'Terminal',
    bot: 'Bot',
    code: 'Code',
    'mouse-pointer': 'MousePointer',
    'message-square': 'MessageSquare',
    github: 'Github',
  };

  const mappedName = iconMapping[iconName] || iconName;
  return iconMap[mappedName] || Server;
}

interface SidebarProps {
  tools: Tool[];
  selectedToolId: string | null;
  onSelectTool: (id: string | null) => void;
  onAddCustomTool: () => void;
}

export function Sidebar({ tools, selectedToolId, onSelectTool, onAddCustomTool }: SidebarProps) {
  const builtInTools = tools.filter((t) => t.isBuiltIn);
  const customTools = tools.filter((t) => !t.isBuiltIn);

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/30">
      <div className="p-4">
        <Button
          variant={selectedToolId === null ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          onClick={() => onSelectTool(null)}
        >
          <Server className="mr-2 h-4 w-4" />
          All Servers
        </Button>
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <div className="p-4">
          <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tools
          </h3>
          <div className="space-y-1">
            {builtInTools.map((tool) => {
              const Icon = getIconComponent(tool.icon);
              return (
                <Button
                  key={tool.id}
                  variant={selectedToolId === tool.id ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    !tool.isInstalled && 'opacity-50'
                  )}
                  onClick={() => onSelectTool(tool.id)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span className="flex-1 truncate text-left">{tool.name}</span>
                  {tool.isInstalled && (
                    <Check className="ml-2 h-3 w-3 text-green-500" />
                  )}
                </Button>
              );
            })}
          </div>

          {customTools.length > 0 && (
            <>
              <h3 className="mb-2 mt-6 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Custom Tools
              </h3>
              <div className="space-y-1">
                {customTools.map((tool) => (
                  <Button
                    key={tool.id}
                    variant={selectedToolId === tool.id ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start',
                      !tool.isInstalled && 'opacity-50'
                    )}
                    onClick={() => onSelectTool(tool.id)}
                  >
                    <Server className="mr-2 h-4 w-4" />
                    <span className="flex-1 truncate text-left">{tool.name}</span>
                    <Badge variant="outline" className="ml-2 text-[10px]">
                      Custom
                    </Badge>
                  </Button>
                ))}
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      <Separator />

      <div className="p-4">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={onAddCustomTool}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Custom Tool
        </Button>
      </div>
    </div>
  );
}
