import { Plugin, Notice } from 'obsidian';
import * as fs from 'fs';
import * as path from 'path';
import { BGServerConfig, DEFAULT_CONFIG } from './types';
import { ImageServer } from './server';
import { BGServerSettingTab } from './settings';
import { t } from './i18n';

export default class BGServerPlugin extends Plugin {
  config!: BGServerConfig;
  server: ImageServer = new ImageServer();

  // ── i18n helper ────────────────────────────────────────────

  /** Translate key using the current config language. */
  t(key: string, vars?: Record<string, string | number>): string {
    return t(key, this.config.language, vars);
  }

  // ── lifecycle ──────────────────────────────────────────────

  async onload(): Promise<void> {
    await this.loadConfig();
    this.server = new ImageServer();

    // Auto-start server
    try {
      await this.startServer();
    } catch (e) {
      console.warn('[BG Server] auto-start failed:', (e as Error).message);
    }

    // Register settings tab
    this.addSettingTab(new BGServerSettingTab(this.app, this));
  }

  onunload(): void {
    this.server.stop();
  }

  // ── configuration ──────────────────────────────────────────

  async loadConfig(): Promise<void> {
    const data: Partial<BGServerConfig> = await this.loadData();
    this.config = Object.assign({}, DEFAULT_CONFIG, data || {});
  }

  async saveConfig(): Promise<void> {
    await this.saveData(this.config);
  }

  // ── image folder resolution ────────────────────────────────

  /** Resolve the configured image folder to an absolute path. */
  getImageFolderPath(): string {
    const adapter = this.app.vault.adapter as unknown as Record<string, unknown>;
    const vaultPath = typeof adapter.getBasePath === 'function'
      ? (adapter.getBasePath as () => string)() : undefined;

    if (!vaultPath) {
      return path.resolve(this.config.imageFolderPath);
    }

    if (path.isAbsolute(this.config.imageFolderPath)) {
      return this.config.imageFolderPath;
    }

    return path.join(vaultPath, this.config.imageFolderPath);
  }

  // ── server management ──────────────────────────────────────

  /** Start the server. Creates the image folder if it doesn't exist. */
  async startServer(): Promise<void> {
    const folderPath = this.getImageFolderPath();

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    try {
      const actualPort = await this.server.start(
        folderPath,
        this.config.port,
        this.config.hostname,
      );

      if (actualPort !== this.config.port) {
        new Notice(
          this.t('main.portConflict', {
            port: this.config.port,
            actual: actualPort,
          }),
        );
      }
    } catch (e) {
      new Notice(this.t('main.portExhausted', { max: 10 }));
      throw e;
    }
  }

  /** Stop and restart the server (uses the latest config values). */
  async restartServer(): Promise<void> {
    this.server.stop();
    await this.startServer();
  }
}
