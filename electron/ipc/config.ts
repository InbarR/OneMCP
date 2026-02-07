import * as fs from 'fs';
import * as path from 'path';
import { IpcMainInvokeEvent } from 'electron';

const BACKUP_EXTENSION = '.backup';
const MAX_BACKUPS = 10;

async function ensureDirectory(filePath: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.promises.mkdir(dir, { recursive: true });
}

async function readConfig(_event: IpcMainInvokeEvent, filePath: string): Promise<string | null> {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function writeConfig(
  _event: IpcMainInvokeEvent,
  filePath: string,
  content: string
): Promise<boolean> {
  try {
    await ensureDirectory(filePath);
    await fs.promises.writeFile(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing config:', error);
    return false;
  }
}

async function configExists(_event: IpcMainInvokeEvent, filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function createBackup(_event: IpcMainInvokeEvent, filePath: string): Promise<string | null> {
  try {
    // Check if the file exists
    try {
      await fs.promises.access(filePath);
    } catch {
      return null; // No file to backup
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.dirname(filePath);
    const baseName = path.basename(filePath);
    const backupPath = path.join(backupDir, `${baseName}${BACKUP_EXTENSION}.${timestamp}`);

    await fs.promises.copyFile(filePath, backupPath);

    // Clean up old backups
    await cleanupOldBackups(backupDir, baseName);

    return backupPath;
  } catch (error) {
    console.error('Error creating backup:', error);
    return null;
  }
}

async function cleanupOldBackups(dir: string, baseName: string): Promise<void> {
  try {
    const files = await fs.promises.readdir(dir);
    const backups = files
      .filter(f => f.startsWith(`${baseName}${BACKUP_EXTENSION}`))
      .sort()
      .reverse();

    // Keep only the most recent backups
    const toDelete = backups.slice(MAX_BACKUPS);
    for (const file of toDelete) {
      await fs.promises.unlink(path.join(dir, file));
    }
  } catch {
    // Ignore cleanup errors
  }
}

async function restoreBackup(
  _event: IpcMainInvokeEvent,
  backupPath: string,
  targetPath: string
): Promise<boolean> {
  try {
    await fs.promises.copyFile(backupPath, targetPath);
    return true;
  } catch (error) {
    console.error('Error restoring backup:', error);
    return false;
  }
}

async function listBackups(
  _event: IpcMainInvokeEvent,
  configPath: string
): Promise<string[]> {
  try {
    const dir = path.dirname(configPath);
    const baseName = path.basename(configPath);
    const files = await fs.promises.readdir(dir);

    return files
      .filter(f => f.startsWith(`${baseName}${BACKUP_EXTENSION}`))
      .map(f => path.join(dir, f))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

export const configHandlers = {
  readConfig,
  writeConfig,
  configExists,
  createBackup,
  restoreBackup,
  listBackups,
};
