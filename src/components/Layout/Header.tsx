import { RefreshCw, Upload, Download, Settings, ScrollText } from 'lucide-react';
import logoImage from '../../assets/logo.png';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

interface HeaderProps {
  onRefresh: () => void;
  onImport: () => void;
  onExport: () => void;
  onSettings: () => void;
  onToggleLogs: () => void;
  isLoading?: boolean;
  logsOpen?: boolean;
}

export function Header({ onRefresh, onImport, onExport, onSettings, onToggleLogs, isLoading, logsOpen }: HeaderProps) {
  return (
    <header className="drag-region flex h-14 items-center justify-between border-b px-6">
      <div className="flex items-center gap-3">
        <img src={logoImage} alt="OneMCP" className="h-8 w-8 rounded-lg" />
        <h1 className="text-lg font-semibold">OneMCP</h1>
      </div>

      <div className="no-drag flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onImport}>
                <Upload className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Import Config</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onExport}>
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export Config</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={logsOpen ? "secondary" : "ghost"}
                size="icon"
                onClick={onToggleLogs}
              >
                <ScrollText className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Logs</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onSettings}>
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
}
