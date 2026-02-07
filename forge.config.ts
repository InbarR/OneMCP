import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import * as path from 'path';
import * as fs from 'fs';

// Check which icon files exist
const resourcesDir = path.join(__dirname, 'resources');
const hasIco = fs.existsSync(path.join(resourcesDir, 'icon.ico'));
const hasIcns = fs.existsSync(path.join(resourcesDir, 'icon.icns'));
const hasPng = fs.existsSync(path.join(resourcesDir, 'icon.png'));

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    name: 'OneMCP',
    icon: path.join(resourcesDir, 'icon'),
    extraResource: [
      path.join(resourcesDir, 'icon.png'),
    ],
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: 'OneMCP',
      iconUrl: 'https://raw.githubusercontent.com/InbarR/OneMCP/main/resources/logo.png',
      ...(hasIco && { setupIcon: path.join(resourcesDir, 'icon.ico') }),
    }),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({
      options: {
        ...(hasPng && { icon: path.join(resourcesDir, 'icon.png') }),
      },
    }),
    new MakerDeb({
      options: {
        ...(hasPng && { icon: path.join(resourcesDir, 'icon.png') }),
      },
    }),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'electron/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'electron/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
