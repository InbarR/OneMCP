/// <reference types="vite/client" />

import type { ElectronApi } from '../electron/preload';

declare global {
  interface Window {
    electron?: ElectronApi;
  }
}
