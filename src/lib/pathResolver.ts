// Path resolver that works in the renderer process via IPC

let cachedPlatform: 'win32' | 'darwin' | 'linux' | null = null;
let cachedHome: string | null = null;

export async function initPathResolver(): Promise<void> {
  if (window.electron) {
    cachedPlatform = await window.electron.app.getPlatform() as 'win32' | 'darwin' | 'linux';
    cachedHome = await window.electron.app.getPath('home');
  }
}

export function getPlatform(): 'win32' | 'darwin' | 'linux' {
  return cachedPlatform || 'win32';
}

export function resolvePath(pathTemplate: string): string {
  const currentPlatform = getPlatform();
  let resolved = pathTemplate;
  const home = cachedHome || '';

  // Resolve home directory
  resolved = resolved.replace(/^~/, home);

  // Resolve Windows environment variables
  if (currentPlatform === 'win32') {
    // %APPDATA%
    const appData = `${home}/AppData/Roaming`;
    resolved = resolved.replace(/%APPDATA%/gi, appData);

    // %LOCALAPPDATA%
    const localAppData = `${home}/AppData/Local`;
    resolved = resolved.replace(/%LOCALAPPDATA%/gi, localAppData);

    // %USERPROFILE%
    resolved = resolved.replace(/%USERPROFILE%/gi, home);
  }

  // Normalize path separators
  resolved = resolved.replace(/\\/g, '/');

  return resolved;
}

export function getConfigPathForPlatform(
  platforms: { win32?: string; darwin?: string; linux?: string }
): string | null {
  const currentPlatform = getPlatform();
  const pathTemplate = platforms[currentPlatform];

  if (!pathTemplate) {
    return null;
  }

  return resolvePath(pathTemplate);
}

export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

export function joinPaths(...parts: string[]): string {
  return parts
    .map((part, i) => {
      if (i === 0) {
        return part.replace(/\/+$/, '');
      }
      return part.replace(/^\/+/, '').replace(/\/+$/, '');
    })
    .join('/');
}

export function dirname(filePath: string): string {
  const normalized = normalizePath(filePath);
  const lastSlash = normalized.lastIndexOf('/');
  if (lastSlash === -1) {
    return '.';
  }
  return normalized.substring(0, lastSlash);
}

export function basename(filePath: string): string {
  const normalized = normalizePath(filePath);
  const lastSlash = normalized.lastIndexOf('/');
  return normalized.substring(lastSlash + 1);
}
