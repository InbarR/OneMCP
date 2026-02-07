import { useEffect, useRef } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useStore, LogEntry } from '../hooks/useStore';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

interface LogPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LogPanel({ isOpen, onClose }: LogPanelProps) {
  const { logs, clearLogs } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (!isOpen) return null;

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'text-red-400';
      case 'warn':
        return 'text-yellow-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-64 border-t bg-background z-50">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h3 className="text-sm font-medium">Logs</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearLogs}>
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ScrollArea className="h-[calc(100%-40px)]" ref={scrollRef}>
        <div className="p-2 font-mono text-xs space-y-1">
          {logs.length === 0 ? (
            <div className="text-muted-foreground py-4 text-center">
              No logs yet. Perform an action to see logs.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex gap-2">
                <span className="text-muted-foreground shrink-0">
                  {formatTime(log.timestamp)}
                </span>
                <span className={getLevelColor(log.level)}>
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
