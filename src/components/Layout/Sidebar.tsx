import { MessageSquare, Terminal, Bot, Code, MousePointer, Server, Plus, Check, Github, GripVertical, TerminalSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import type { Tool } from '@/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const iconMap: Record<string, React.ElementType> = {
  MessageSquare,
  Terminal,
  Bot,
  Code,
  MousePointer,
  Server,
  Github,
  TerminalSquare,
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
    'terminal-square': 'TerminalSquare',
  };

  const mappedName = iconMapping[iconName] || iconName;
  return iconMap[mappedName] || Server;
}

interface SortableToolItemProps {
  tool: Tool;
  isSelected: boolean;
  onSelect: () => void;
}

function SortableToolItem({ tool, isSelected, onSelect }: SortableToolItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tool.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = getIconComponent(tool.icon);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-1 rounded-md',
        isDragging && 'opacity-50 bg-muted'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1 cursor-grab hover:bg-muted rounded text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <Button
        variant={isSelected ? 'secondary' : 'ghost'}
        className={cn(
          'flex-1 justify-start',
          !tool.isInstalled && 'opacity-50'
        )}
        onClick={onSelect}
      >
        <Icon className="mr-2 h-4 w-4" />
        <span className="flex-1 truncate text-left">{tool.name}</span>
        {tool.isInstalled && (
          <Check className="ml-2 h-3 w-3 text-green-500" />
        )}
      </Button>
    </div>
  );
}

interface SidebarProps {
  tools: Tool[];
  selectedToolId: string | null;
  onSelectTool: (id: string | null) => void;
  onAddCustomTool: () => void;
  onReorderTools?: (toolIds: string[]) => void;
}

export function Sidebar({ tools, selectedToolId, onSelectTool, onAddCustomTool, onReorderTools }: SidebarProps) {
  const builtInTools = tools.filter((t) => t.isBuiltIn);
  const customTools = tools.filter((t) => !t.isBuiltIn);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = builtInTools.findIndex((t) => t.id === active.id);
      const newIndex = builtInTools.findIndex((t) => t.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(builtInTools, oldIndex, newIndex);
        onReorderTools?.(newOrder.map((t) => t.id));
      }
    }
  };

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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={builtInTools.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {builtInTools.map((tool) => (
                  <SortableToolItem
                    key={tool.id}
                    tool={tool}
                    isSelected={selectedToolId === tool.id}
                    onSelect={() => onSelectTool(tool.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

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
