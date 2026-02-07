import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { IpcMainInvokeEvent } from 'electron';

interface TestResult {
  success: boolean;
  message: string;
  capabilities?: {
    tools?: string[];
    prompts?: string[];
    resources?: string[];
  };
}

interface DiscoveredServer {
  name: string;
  command: string;
  args: string[];
  source: string;
}

async function testServer(
  _event: IpcMainInvokeEvent,
  command: string,
  args: string[],
  env?: Record<string, string>
): Promise<TestResult> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({
        success: false,
        message: 'Server test timed out after 10 seconds',
      });
    }, 10000);

    try {
      // Check if command exists
      const isPath = command.includes('/') || command.includes('\\');

      if (isPath) {
        // Check if file exists
        if (!fs.existsSync(command)) {
          clearTimeout(timeout);
          resolve({
            success: false,
            message: `Command not found: ${command}`,
          });
          return;
        }
      }

      const childEnv = {
        ...process.env,
        ...env,
      };

      const child = spawn(command, args, {
        env: childEnv,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      // Send initialize request
      const initRequest = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'OneMCP',
            version: '1.0.0',
          },
        },
      });

      child.stdin?.write(initRequest + '\n');

      // Wait for response
      const responseTimeout = setTimeout(() => {
        child.kill();
        clearTimeout(timeout);

        if (stdout.includes('"result"')) {
          resolve({
            success: true,
            message: 'Server responded to initialize request',
          });
        } else {
          resolve({
            success: false,
            message: stderr || 'Server did not respond to initialize request',
          });
        }
      }, 3000);

      child.on('error', (error) => {
        clearTimeout(timeout);
        clearTimeout(responseTimeout);
        resolve({
          success: false,
          message: `Failed to start server: ${error.message}`,
        });
      });

      child.on('close', (code) => {
        clearTimeout(timeout);
        clearTimeout(responseTimeout);

        if (code === 0 || stdout.includes('"result"')) {
          resolve({
            success: true,
            message: 'Server executed successfully',
          });
        } else {
          resolve({
            success: false,
            message: `Server exited with code ${code}. ${stderr}`,
          });
        }
      });
    } catch (error) {
      clearTimeout(timeout);
      resolve({
        success: false,
        message: `Error testing server: ${(error as Error).message}`,
      });
    }
  });
}

async function discoverServers(_event: IpcMainInvokeEvent): Promise<DiscoveredServer[]> {
  const discovered: DiscoveredServer[] = [];

  // Scan npm global packages
  try {
    const npmGlobalPath = await getNpmGlobalPath();
    if (npmGlobalPath) {
      const packages = await scanNpmPackages(npmGlobalPath);
      discovered.push(...packages);
    }
  } catch {
    // Ignore npm scan errors
  }

  // Scan common MCP server locations
  try {
    const commonServers = await scanCommonLocations();
    discovered.push(...commonServers);
  } catch {
    // Ignore scan errors
  }

  return discovered;
}

async function getNpmGlobalPath(): Promise<string | null> {
  return new Promise((resolve) => {
    const npm = spawn('npm', ['root', '-g'], { shell: true });
    let output = '';

    npm.stdout.on('data', (data) => {
      output += data.toString();
    });

    npm.on('close', (code) => {
      if (code === 0 && output.trim()) {
        resolve(output.trim());
      } else {
        resolve(null);
      }
    });

    npm.on('error', () => resolve(null));
  });
}

async function scanNpmPackages(globalPath: string): Promise<DiscoveredServer[]> {
  const servers: DiscoveredServer[] = [];

  try {
    const packages = await fs.promises.readdir(globalPath);

    for (const pkg of packages) {
      if (pkg.includes('mcp') || pkg.includes('model-context')) {
        const pkgPath = path.join(globalPath, pkg);
        const pkgJsonPath = path.join(pkgPath, 'package.json');

        try {
          const pkgJson = JSON.parse(await fs.promises.readFile(pkgJsonPath, 'utf-8'));
          if (pkgJson.bin) {
            const binName = typeof pkgJson.bin === 'string'
              ? pkg
              : Object.keys(pkgJson.bin)[0];

            servers.push({
              name: pkg,
              command: binName,
              args: [],
              source: 'npm-global',
            });
          }
        } catch {
          // Skip packages without valid package.json
        }
      }
    }
  } catch {
    // Ignore read errors
  }

  return servers;
}

async function scanCommonLocations(): Promise<DiscoveredServer[]> {
  const servers: DiscoveredServer[] = [];
  const home = os.homedir();

  const commonPaths = [
    path.join(home, '.mcp'),
    path.join(home, 'mcp-servers'),
    path.join(home, '.local', 'share', 'mcp'),
  ];

  for (const searchPath of commonPaths) {
    try {
      const stat = await fs.promises.stat(searchPath);
      if (stat.isDirectory()) {
        const entries = await fs.promises.readdir(searchPath);

        for (const entry of entries) {
          const entryPath = path.join(searchPath, entry);
          const entryStat = await fs.promises.stat(entryPath);

          if (entryStat.isDirectory()) {
            // Check for common server patterns
            const possibleEntries = ['index.js', 'main.js', 'server.js', 'index.py', 'server.py'];

            for (const possible of possibleEntries) {
              const fullPath = path.join(entryPath, possible);
              try {
                await fs.promises.access(fullPath);
                const ext = path.extname(possible);
                const command = ext === '.py' ? 'python' : 'node';

                servers.push({
                  name: entry,
                  command,
                  args: [fullPath],
                  source: searchPath,
                });
                break;
              } catch {
                // File doesn't exist
              }
            }
          }
        }
      }
    } catch {
      // Path doesn't exist
    }
  }

  return servers;
}

export const serverHandlers = {
  testServer,
  discoverServers,
};
