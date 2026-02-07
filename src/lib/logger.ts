import { useStore } from '../hooks/useStore';

type LogLevel = 'info' | 'warn' | 'error';

class Logger {
  private log(level: LogLevel, ...args: unknown[]) {
    const message = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');

    // Also log to console
    const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    consoleFn(`[OneMCP]`, ...args);

    // Add to store
    const { addLog } = useStore.getState();
    addLog(level, message);
  }

  info(...args: unknown[]) {
    this.log('info', ...args);
  }

  warn(...args: unknown[]) {
    this.log('warn', ...args);
  }

  error(...args: unknown[]) {
    this.log('error', ...args);
  }
}

export const logger = new Logger();
