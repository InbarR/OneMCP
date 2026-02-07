import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { configHandlers } from './ipc/config';
import { serverHandlers } from './ipc/servers';
import { toolHandlers } from './ipc/tools';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

let mainWindow: BrowserWindow | null = null;

const createWindow = async () => {
  // Get icon path - works in both dev and production
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icon.png')
    : path.join(__dirname, '../../resources/icon.png');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    x: 100,
    y: 100,
    backgroundColor: '#1a1a2e',
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: true,
  });

  // Focus and bring to front
  mainWindow.focus();
  mainWindow.moveTop();

  // Log any load errors
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', errorCode, errorDescription, validatedURL);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
    mainWindow?.show();
    mainWindow?.focus();
  });

  // Try to load from dist folder first (production build)
  const distPath = path.join(__dirname, '../../dist/index.html');
  const rendererPath = path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`);

  if (fs.existsSync(distPath)) {
    console.log('Loading from dist:', distPath);
    mainWindow.loadFile(distPath);
  } else if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    console.log('Loading dev server URL:', MAIN_WINDOW_VITE_DEV_SERVER_URL);
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    console.log('Loading file:', rendererPath);
    mainWindow.loadFile(rendererPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// Register IPC handlers
function registerIpcHandlers() {
  // Config handlers
  ipcMain.handle('config:read', configHandlers.readConfig);
  ipcMain.handle('config:write', configHandlers.writeConfig);
  ipcMain.handle('config:exists', configHandlers.configExists);
  ipcMain.handle('config:backup', configHandlers.createBackup);
  ipcMain.handle('config:restore', configHandlers.restoreBackup);
  ipcMain.handle('config:list-backups', configHandlers.listBackups);

  // Server handlers
  ipcMain.handle('server:test', serverHandlers.testServer);
  ipcMain.handle('server:discover', serverHandlers.discoverServers);

  // Tool handlers
  ipcMain.handle('tool:detect-installed', toolHandlers.detectInstalled);
  ipcMain.handle('tool:get-definitions', toolHandlers.getDefinitions);

  // File system handlers
  ipcMain.handle('fs:exists', async (_, filePath: string) => {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('fs:read-dir', async (_, dirPath: string) => {
    try {
      return await fs.promises.readdir(dirPath);
    } catch {
      return [];
    }
  });

  // App info
  ipcMain.handle('app:get-path', (_, name: string) => {
    return app.getPath(name as 'home' | 'appData' | 'userData' | 'temp');
  });

  ipcMain.handle('app:get-platform', () => process.platform);

  // Shell handlers
  ipcMain.handle('shell:open-path', async (_, filePath: string) => {
    try {
      const result = await shell.openPath(filePath);
      return { success: !result, error: result || undefined };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle('shell:show-item-in-folder', async (_, filePath: string) => {
    try {
      shell.showItemInFolder(filePath);
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });
}

app.whenReady().then(() => {
  console.log('App is ready, creating window...');
  registerIpcHandlers();
  createWindow();
  console.log('Window created');

  app.on('activate', () => {
    console.log('App activated');
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  console.log('All windows closed, platform:', process.platform);
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  console.log('App is about to quit');
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
