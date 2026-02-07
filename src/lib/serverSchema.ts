import { z } from 'zod';

export const envVariableSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.string(),
});

export const serverFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Server name is required')
    .max(100, 'Server name must be less than 100 characters')
    .regex(/^[\w\-. ]+$/, 'Server name can only contain letters, numbers, spaces, dots, hyphens, and underscores'),
  command: z
    .string()
    .min(1, 'Command is required'),
  args: z
    .string()
    .optional()
    .transform(val => val || ''),
  env: z
    .array(envVariableSchema)
    .optional()
    .default([]),
  cwd: z
    .string()
    .optional(),
  transportType: z
    .enum(['stdio', 'http'])
    .default('stdio'),
  url: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.startsWith('http://') || val.startsWith('https://'),
      'URL must start with http:// or https://'
    ),
}).refine(
  (data) => data.transportType !== 'http' || (data.url && data.url.trim() !== ''),
  {
    message: 'URL is required for HTTP transport',
    path: ['url'],
  }
);

export const toolSettingsSchema = z.object({
  rooCline: z.object({
    alwaysAllow: z.array(z.string()).optional(),
    autoApprove: z.array(z.string()).optional(),
    disabled: z.boolean().optional(),
  }).optional(),
});

export const mcpServerSchema = z.object({
  id: z.string(),
  name: z.string(),
  command: z.string(),
  args: z.array(z.string()),
  env: z.record(z.string()).optional(),
  cwd: z.string().optional(),
  transportType: z.enum(['stdio', 'http']).optional(),
  url: z.string().optional(),
  toolSettings: toolSettingsSchema.optional(),
  enabledTools: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const customToolSchema = z.object({
  id: z.string().min(1, 'Tool ID is required'),
  name: z.string().min(1, 'Tool name is required'),
  configPath: z.string().min(1, 'Config path is required'),
  configFormat: z.enum(['mcpServers', 'servers', 'mcp.servers']),
  serverKey: z.string().optional(),
});

export type ServerFormData = z.infer<typeof serverFormSchema>;
export type McpServerData = z.infer<typeof mcpServerSchema>;
export type CustomToolData = z.infer<typeof customToolSchema>;

export function parseArgs(argsString: string): string[] {
  if (!argsString.trim()) {
    return [];
  }

  const args: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < argsString.length; i++) {
    const char = argsString[i];

    if (!inQuotes && (char === '"' || char === "'")) {
      inQuotes = true;
      quoteChar = char;
    } else if (inQuotes && char === quoteChar) {
      inQuotes = false;
      quoteChar = '';
    } else if (!inQuotes && char === ' ') {
      if (current.trim()) {
        args.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    args.push(current.trim());
  }

  return args;
}

export function stringifyArgs(args: string[]): string {
  return args
    .map(arg => {
      if (arg.includes(' ') || arg.includes('"') || arg.includes("'")) {
        // Escape quotes and wrap in quotes
        const escaped = arg.replace(/"/g, '\\"');
        return `"${escaped}"`;
      }
      return arg;
    })
    .join(' ');
}
