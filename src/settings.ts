import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import * as fs from 'fs';
import * as path from 'path';
import BGServerPlugin from './main';

export class BGServerSettingTab extends PluginSettingTab {
  plugin: BGServerPlugin;

  // Image preview state
  private imageGridWrapper: HTMLElement | null = null;
  private currentPage = 0;
  private totalPages = 0;
  private allImages: string[] = [];

  constructor(app: App, plugin: BGServerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  // ── i18n shortcut ──────────────────────────────────────────

  private t(key: string, vars?: Record<string, string | number>): string {
    return this.plugin.t(key, vars);
  }

  // ── display (called every time the tab opens) ──────────────

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    this.currentPage = 0;

    this.buildStatusSection(containerEl);
    this.buildConfigSection(containerEl);
    this.buildPreviewSection(containerEl);
  }

  // ── section: server status ─────────────────────────────────

  private buildStatusSection(containerEl: HTMLElement): void {
    new Setting(containerEl).setName(this.t('status.title')).setHeading();

    const server = this.plugin.server;
    const isRunning = server.isRunning;

    const statusText = isRunning
      ? this.t('status.running', { url: server.baseUrl })
      : this.t('status.stopped');

    const statusSetting = new Setting(containerEl)
      .setName(this.t('status.label'))
      .setDesc(statusText);

    statusSetting.addButton((btn) => {
      if (isRunning) {
        btn
          .setButtonText(this.t('status.restart'))
          .setCta()
          .onClick(async () => {
            await this.plugin.restartServer();
            this.display();
            new Notice(this.t('status.notice.restarted'));
          });

        const parent = btn.buttonEl.parentElement;
        if (parent) {
          const stopBtn = parent.createEl('button', {
            text: this.t('status.stop'),
            cls: 'mod-warning',
          });
          stopBtn.onclick = async () => {
            this.plugin.server.stop();
            this.display();
            new Notice(this.t('status.notice.stopped'));
          };
        }
      } else {
        btn
          .setButtonText(this.t('status.start'))
          .setCta()
          .onClick(async () => {
            try {
              await this.plugin.startServer();
              this.display();
              new Notice(this.t('status.notice.started'));
            } catch (e) {
              new Notice(
                this.t('status.notice.startFailed', {
                  msg: (e as Error).message,
                }),
              );
            }
          });
      }
    });

    if (isRunning) {
      containerEl.createEl('div', {
        text: this.t('status.path', { path: this.plugin.getImageFolderPath() }),
        cls: 'setting-item-description',
      });
    }
  }

  // ── section: configuration ─────────────────────────────────

  private buildConfigSection(containerEl: HTMLElement): void {
    new Setting(containerEl).setName(this.t('config.title')).setHeading();

    // ── Language ──
    new Setting(containerEl)
      .setName(this.t('language.name'))
      .setDesc(this.t('language.desc'))
      .addDropdown((dropdown) =>
        dropdown
          .addOption('zh', '中文')
          .addOption('en', 'English')
          .setValue(this.plugin.config.language)
          .onChange(async (val) => {
            this.plugin.config.language = val as 'zh' | 'en';
            await this.plugin.saveConfig();
            this.display(); // re-render in the new language
          }),
      );

    // ── Port ──
    new Setting(containerEl)
      .setName(this.t('config.port.name'))
      .setDesc(this.t('config.port.desc'))
      .addText((text) =>
        text
          .setPlaceholder('8989')
          .setValue(String(this.plugin.config.port))
          .onChange(async (val) => {
            const port = parseInt(val, 10);
            if (isNaN(port) || port < 1024 || port > 65535) {
              new Notice(this.t('config.port.invalid'));
              return;
            }
            this.plugin.config.port = port;
            await this.plugin.saveConfig();
          }),
      );

    // ── Hostname ──
    new Setting(containerEl)
      .setName(this.t('config.hostname.name'))
      .setDesc(this.t('config.hostname.desc'))
      .addDropdown((dropdown) =>
        dropdown
          .addOption('localhost', 'localhost')
          .addOption('127.0.0.1', '127.0.0.1')
          .setValue(this.plugin.config.hostname)
          .onChange(async (val) => {
            this.plugin.config.hostname = val;
            await this.plugin.saveConfig();
          }),
      );

    // ── Image folder path ──
    new Setting(containerEl)
      .setName(this.t('config.folder.name'))
      .setDesc(this.t('config.folder.desc'))
      .addText((text) =>
        text
          .setPlaceholder('.bg/')
          .setValue(this.plugin.config.imageFolderPath)
          .onChange(async (val) => {
            this.plugin.config.imageFolderPath = val;
            await this.plugin.saveConfig();
          }),
      );

    // ── Page size ──
    new Setting(containerEl)
      .setName(this.t('config.pageSize.name'))
      .setDesc(this.t('config.pageSize.desc'))
      .addText((text) =>
        text
          .setPlaceholder('30')
          .setValue(String(this.plugin.config.pageSize))
          .onChange(async (val) => {
            const size = parseInt(val, 10);
            if (isNaN(size) || size < 1) {
              new Notice(this.t('config.pageSize.invalid'));
              return;
            }
            this.plugin.config.pageSize = size;
            await this.plugin.saveConfig();
          }),
      );

    // ── Manual restart ──
    new Setting(containerEl)
      .setName(this.t('config.restart.name'))
      .setDesc(this.t('config.restart.desc'))
      .addButton((btn) =>
        btn
          .setButtonText(this.t('config.restart.btn'))
          .setCta()
          .onClick(async () => {
            await this.plugin.restartServer();
            this.display();
            new Notice(this.t('status.notice.restarted'));
          }),
      );
  }

  // ── section: image preview ─────────────────────────────────

  private buildPreviewSection(containerEl: HTMLElement): void {
    new Setting(containerEl).setName(this.t('preview.title')).setHeading();

    new Setting(containerEl)
      .setName(this.t('preview.refresh.name'))
      .addButton((btn) =>
        btn.setButtonText(this.t('preview.refresh.btn')).onClick(() => {
          this.refreshImageList();
        }),
      );

    this.imageGridWrapper = containerEl.createDiv({
      cls: 'bg-image-grid',
    });

    this.refreshImageList();
  }

  // ── image list management ──────────────────────────────────

  private refreshImageList(): void {
    if (!this.imageGridWrapper) return;

    const folderPath = this.plugin.getImageFolderPath();

    if (!fs.existsSync(folderPath)) {
      this.imageGridWrapper.empty();
      this.imageGridWrapper.createEl('p', {
        text: this.t('preview.folderNotFound'),
        cls: 'setting-item-description',
      });
      return;
    }

    try {
      const files = fs.readdirSync(folderPath);
      this.allImages = files
        .filter((f) => {
          const ext = path.extname(f).toLowerCase();
          return [
            '.jpg', '.jpeg', '.png', '.gif', '.svg',
            '.webp', '.bmp', '.ico', '.tiff', '.tif',
          ].includes(ext);
        })
        .sort();
    } catch (e) {
      this.imageGridWrapper.empty();
      this.imageGridWrapper.createEl('p', {
        text: this.t('preview.readError', { msg: (e as Error).message }),
        cls: 'setting-item-description',
      });
      return;
    }

    if (this.allImages.length === 0) {
      this.imageGridWrapper.empty();
      this.imageGridWrapper.createEl('p', {
        text: this.t('preview.empty'),
        cls: 'setting-item-description',
      });
      return;
    }

    this.totalPages = Math.ceil(
      this.allImages.length / this.plugin.config.pageSize,
    );
    this.currentPage = Math.min(this.currentPage, this.totalPages - 1);
    if (this.currentPage < 0) this.currentPage = 0;

    this.renderImageGrid();
  }

  private renderImageGrid(): void {
    if (!this.imageGridWrapper) return;
    this.imageGridWrapper.empty();

    // ── Pagination bar ──
    this.buildPaginationBar();

    // ── Image grid ──
    const gridInner = this.imageGridWrapper.createDiv({
      cls: 'bg-image-grid-inner',
    });

    const pageSize = this.plugin.config.pageSize;
    const start = this.currentPage * pageSize;
    const end = Math.min(start + pageSize, this.allImages.length);
    const pageImages = this.allImages.slice(start, end);
    const serverRunning = this.plugin.server.isRunning;
    const baseUrl = this.plugin.server.baseUrl;

    for (const imgFile of pageImages) {
      const encoded = encodeURIComponent(imgFile);
      const url = serverRunning ? `${baseUrl}/${encoded}` : '';
      const mdUrl = url ? `![](${url})` : '';

      const item = gridInner.createDiv({ cls: 'bg-image-item' });

      // Thumbnail
      const img = item.createEl('img', { cls: 'bg-thumbnail' });
      if (serverRunning) {
        img.src = url;
        img.alt = imgFile;
        img.loading = 'lazy';
        img.onerror = () => {
          img.classList.add('bg-thumbnail-hidden');
        };
      } else {
        img.classList.add('bg-thumbnail-hidden');
      }

      // Filename
      item.createDiv({ text: imgFile, cls: 'bg-image-name' });

      // URL display
      if (url) {
        item.createDiv({ text: url, cls: 'bg-image-url' });
        item.createDiv({ text: mdUrl, cls: 'bg-image-url' });
      }

      // Copy buttons
      const actions = item.createDiv({ cls: 'bg-image-actions' });

      this.addCopyButton(actions, url, this.t('preview.copyUrl'));
      this.addCopyButton(actions, mdUrl, this.t('preview.copyMd'));
    }

    // Show hint if server is not running
    if (!serverRunning) {
      this.imageGridWrapper.createEl('p', {
        text: this.t('preview.serverStopped'),
        cls: 'setting-item-description',
      });
    }
  }

  private buildPaginationBar(): void {
    if (!this.imageGridWrapper || this.totalPages <= 1) return;

    const bar = this.imageGridWrapper.createDiv({ cls: 'bg-pagination' });

    const prevBtn = bar.createEl('button', {
      text: this.t('preview.prev'),
      cls: 'clickable-icon',
    });
    prevBtn.disabled = this.currentPage <= 0;
    prevBtn.onclick = () => {
      if (this.currentPage > 0) {
        this.currentPage--;
        this.renderImageGrid();
      }
    };

    bar.createSpan({
      text: this.t('preview.pageInfo', {
        cur: this.currentPage + 1,
        total: this.totalPages,
        count: this.allImages.length,
      }),
    });

    const nextBtn = bar.createEl('button', {
      text: this.t('preview.next'),
      cls: 'clickable-icon',
    });
    nextBtn.disabled = this.currentPage >= this.totalPages - 1;
    nextBtn.onclick = () => {
      if (this.currentPage < this.totalPages - 1) {
        this.currentPage++;
        this.renderImageGrid();
      }
    };
  }

  private addCopyButton(
    parent: HTMLElement,
    text: string,
    label: string,
  ): void {
    if (!text) return;
    const btn = parent.createEl('button', {
      text: label,
      cls: 'clickable-icon',
    });
    btn.onclick = () => {
      navigator.clipboard.writeText(text).then(() => {
        new Notice(this.t('preview.copySuccess'));
      }).catch(() => {});
    };
  }
}
