import { useState } from 'react';
import { Play, Pencil, Trash2, Copy, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import type { McpServer, Tool, ServerTestResult } from '@/types';

interface ServerCardProps {
  server: McpServer;
  tools: Tool[];
  onEdit: (server: McpServer) => void;
  onDelete: (server: McpServer) => void;
  onClone: (server: McpServer) => void;
  onTest: (server: McpServer) => Promise<ServerTestResult>;
}

export function ServerCard({ server, tools, onEdit, onDelete, onClone, onTest }: ServerCardProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ServerTestResult | null>(null);

  const enabledToolNames = (server.enabledTools || [])
    .map((id) => tools.find((t) => t.id === id)?.name)
    .filter(Boolean);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await onTest(server);
      setTestResult(result);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="group relative">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-medium truncate">
              {server.name}
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground font-mono truncate">
              {server.command} {server.args.join(' ')}
            </p>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleTest}
                    disabled={isTesting}
                  >
                    {isTesting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Test Server</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(server)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onClone(server)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clone</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete(server)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap gap-1.5">
          {enabledToolNames.map((name) => (
            <Badge key={name} variant="secondary" className="text-xs">
              {name}
            </Badge>
          ))}
          {enabledToolNames.length === 0 && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              No tools enabled
            </Badge>
          )}
        </div>

        {server.env && Object.keys(server.env).length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            {Object.keys(server.env).length} environment variable(s)
          </div>
        )}

        {testResult && (
          <div
            className={`mt-3 flex items-center gap-2 text-xs ${
              testResult.success ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {testResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <span className="truncate">{testResult.message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
