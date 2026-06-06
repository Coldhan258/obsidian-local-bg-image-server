# Local Background Image Server

专为 Obsidian **桌面端**开发的本地背景图片服务器插件。解决 Obsidian 壁纸功能仅支持线上 URL、无法使用本地图片的痛点。全程本地运行、零网络上传、100% 保护隐私。通过内置的轻量 HTTP 服务器，将本地文件夹映射为 Web 服务，生成可用的 `http://` 格式 URL，直接粘贴到 Obsidian 壁纸设置中即可生效。

A desktop-only Obsidian plugin that solves the limitation of Obsidian's wallpaper feature (online URLs only) by running a lightweight local HTTP server. It maps a local folder to a web service, generating `http://` URLs that work seamlessly with Obsidian's wallpaper settings. Fully local, zero upload, 100% private.

---

## 特点 / Features

- 🔒 **纯本地运行 / Fully Local** — 不依赖外部网络服务，不上传任何数据 / No external network requests, no data uploads
- ⚡ **零额外依赖 / Zero Dependencies** — 仅使用 Node.js 内置 `http` 模块，开箱即用 / Uses only Node.js built-in `http` module, ready out of the box
- 🔌 **即开即用 / Auto Lifecycle** — 插件启动时自动运行，禁用或关闭 Obsidian 时自动停止 / Starts on plugin load, stops on unload
- 🖼️ **图片预览 / Image Preview** — 设置页分页展示图床文件夹内所有图片，支持一键复制 URL / Paginated preview with one-click URL copy
- 🔄 **端口冲突自恢复 / Port Auto-Recovery** — 端口被占用时自动递增尝试 / Auto-increments port when the configured one is in use

---

## ⚠️ 使用说明 / Disclosure

**中文**
- **网络行为**：本插件会在本地启动一个 HTTP 服务器（默认监听 `localhost:8989`），仅在本地回环地址运行，不连接任何外部网络服务。
- **文件访问范围**：插件默认使用 vault 内的 `.bg/` 文件夹，但支持通过设置配置为**绝对路径**（如 `D:/Images`），届时将能够读取 Obsidian vault 外部的文件。

**English**
- **Network**: This plugin starts a local HTTP server (default `localhost:8989`) on the loopback address only. It does not connect to any external network services.
- **File access**: By default the plugin uses `.bg/` inside your vault. However, it also supports **absolute paths** (e.g. `D:/Images`) in settings, which allows reading files outside the Obsidian vault.

---

## 安装 / Installation

### 方法一 / Method 1: Community Marketplace

在 Obsidian 设置 → 社区插件 → 浏览中搜索 "Local Background Image Server"。
Search "Local Background Image Server" in Obsidian Settings → Community Plugins → Browse.

### 方法二 / Method 2: BRAT

1. 安装 [BRAT](https://github.com/TfTHacker/obsidian42-brat) 插件 / Install the BRAT plugin
2. 运行命令 `BRAT: Add a beta plugin for testing`
3. 输入本仓库的 GitHub 地址 / Enter this repository's GitHub URL
4. 启用插件 / Enable the plugin

### 方法三 / Method 3: 手动安装 / Manual Install

1. 从 [Releases](https://github.com/你的用户名/obsidian-local-bg-image-server/releases) 下载最新版本 / Download the latest release
2. 解压到 `.obsidian/plugins/local-bg-image-server/` / Extract to that path
3. 在 Obsidian 设置 → 社区插件中启用 / Enable in Community Plugins settings

---

## 配置 / Configuration

在 Obsidian 设置 → 插件选项 → **Local Background Image Server** 中：
In Obsidian Settings → Plugin Options → **Local Background Image Server**:

| 配置项 / Setting | 说明 / Description | 默认值 / Default |
|---|---|---|
| 服务器端口 / Server Port | HTTP 服务器监听端口（1024–65535） | `8989` |
| 访问主机名 / Hostname | `localhost` 或 `127.0.0.1` | `localhost` |
| 图床文件夹路径 / Image Folder Path | 相对路径或绝对路径 / Relative or absolute | `.bg/` |
| 每页图片数 / Images Per Page | 预览面板每页显示数量 | `30` |

修改端口、主机名或图床路径后，点击 **重启服务器** 按钮使配置生效。
After changing port, hostname or folder path, click **Restart Server** to apply.

---

## 使用方法 / Usage

**中文**

1. 启用插件后，服务器会在后台自动启动
2. 将需要用作壁纸的图片放入 `.bg/` 文件夹（或其他自定义路径）
3. 在插件设置页的图片预览面板中，点击 **复制 URL** 或 **复制 Markdown**
4. 将复制的 URL 粘贴到 Obsidian 壁纸设置中

**English**

1. The server starts automatically when the plugin loads
2. Place your wallpaper images into the `.bg/` folder (or your custom path)
3. In the plugin settings, click **Copy URL** or **Copy Markdown**
4. Paste the copied URL into Obsidian's wallpaper settings

### 文件命名说明 / File Name Notes

图片文件名若包含空格或特殊字符，插件会自动进行 URL 编码。例如 `my wallpaper.png` 会生成为 `http://localhost:8989/my%20wallpaper.png`。
Filenames with spaces or special characters are automatically URL-encoded. For example, `my wallpaper.png` becomes `http://localhost:8989/my%20wallpaper.png`.

### 支持的图片格式 / Supported Formats

`jpg` · `jpeg` · `png` · `gif` · `svg` · `webp` · `bmp` · `ico` · `tiff` · `tif`

---

## 工作原理 / How It Works

```text
Obsidian 壁纸设置 / Obsidian Wallpaper Settings
       ↓
http://localhost:8989/xxx.png
       ↓
  [本插件 HTTP 服务器 / This Plugin's HTTP Server]
       ↓
  .bg/xxx.png (本地文件 / Local File)
```

**中文** — Obsidian 壁纸功能要求使用线上 URL。本插件通过在本地启动一个轻量 HTTP 服务器，将本地文件夹"伪装"成线上图床，让 Obsidian 壁纸功能可以加载本地图片。

**English** — Obsidian's wallpaper feature requires online URLs. This plugin starts a lightweight local HTTP server to "disguise" a local folder as an online image host, enabling Obsidian to load local images as wallpapers.

---

## 许可 / License

MIT
