export type Lang = 'zh' | 'en';

const dict: Record<string, Record<Lang, string>> = {
  // ── Language selector ──────────────────────────────────────
  'language.name': { zh: '语言 / Language', en: '语言 / Language' },
  'language.desc': { zh: '切换界面显示语言', en: 'Switch display language' },

  // ── Server status section ──────────────────────────────────
  'status.title': { zh: '服务器状态', en: 'Server Status' },
  'status.label': { zh: '运行状态', en: 'Status' },
  'status.running': { zh: '✅ 运行中 — {url}', en: '✅ Running — {url}' },
  'status.stopped': { zh: '⛔ 已停止', en: '⛔ Stopped' },
  'status.restart': { zh: '重启服务器', en: 'Restart Server' },
  'status.stop': { zh: '停止服务器', en: 'Stop Server' },
  'status.start': { zh: '启动服务器', en: 'Start Server' },
  'status.path': { zh: '图床路径: {path}', en: 'Image path: {path}' },
  'status.notice.restarted': { zh: '服务器已重启', en: 'Server restarted' },
  'status.notice.stopped': { zh: '服务器已停止', en: 'Server stopped' },
  'status.notice.started': { zh: '服务器已启动', en: 'Server started' },
  'status.notice.startFailed': { zh: '启动失败: {msg}', en: 'Start failed: {msg}' },

  // ── Configuration section ──────────────────────────────────
  'config.title': { zh: '配置选项', en: 'Configuration' },
  'config.port.name': { zh: '服务器端口', en: 'Server Port' },
  'config.port.desc': { zh: 'HTTP 服务器监听端口（1024–65535），修改后需重启服务器生效', en: 'HTTP server port (1024–65535). Restart required after change.' },
  'config.port.invalid': { zh: '端口号必须在 1024–65535 之间', en: 'Port must be between 1024–65535' },
  'config.hostname.name': { zh: '访问主机名', en: 'Hostname' },
  'config.hostname.desc': { zh: '服务器绑定地址，同时用于生成 URL 中的主机名', en: 'Server bind address, also used in generated URLs' },
  'config.folder.name': { zh: '图床文件夹路径', en: 'Image Folder Path' },
  'config.folder.desc': { zh: '支持仓库相对路径（如 .bg/）或绝对路径（如 D:/Images），修改后需重启服务器生效', en: 'Relative path (e.g. .bg/) or absolute path (e.g. D:/Images). Restart required.' },
  'config.pageSize.name': { zh: '每页图片数', en: 'Images Per Page' },
  'config.pageSize.desc': { zh: '图片预览面板每页显示图片数量', en: 'Number of images per page in the preview panel' },
  'config.pageSize.invalid': { zh: '每页图片数必须大于 0', en: 'Images per page must be greater than 0' },
  'config.restart.name': { zh: '重启服务器', en: 'Restart Server' },
  'config.restart.desc': { zh: '修改端口、主机名或图床路径后，点击此按钮使配置生效', en: 'Apply changes after modifying port, hostname or folder path' },
  'config.restart.btn': { zh: '重启', en: 'Restart' },

  // ── Image preview section ──────────────────────────────────
  'preview.title': { zh: '图片预览', en: 'Image Preview' },
  'preview.refresh.name': { zh: '刷新图片列表', en: 'Refresh Image List' },
  'preview.refresh.btn': { zh: '刷新', en: 'Refresh' },
  'preview.folderNotFound': { zh: '图床文件夹不存在，请检查路径配置', en: 'Image folder not found. Please check your path setting.' },
  'preview.readError': { zh: '读取文件夹失败: {msg}', en: 'Failed to read folder: {msg}' },
  'preview.empty': { zh: '图床文件夹中没有图片', en: 'No images found in the folder' },
  'preview.serverStopped': { zh: '⚠ 服务器未运行，缩略图无法加载。请先启动服务器。', en: '⚠ Server is not running. Thumbnails unavailable. Please start the server first.' },
  'preview.copyUrl': { zh: '复制 URL', en: 'Copy URL' },
  'preview.copyMd': { zh: '复制 Markdown', en: 'Copy Markdown' },
  'preview.copySuccess': { zh: '复制成功', en: 'Copied!' },
  'preview.pageInfo': { zh: '第 {cur}/{total} 页（共 {count} 张）', en: 'Page {cur}/{total} ({count} images)' },
  'preview.prev': { zh: '◀ 上一页', en: '◀ Previous' },
  'preview.next': { zh: '下一页 ▶', en: 'Next ▶' },

  // ── Notices from main.ts ───────────────────────────────────
  'main.portConflict': { zh: '端口 {port} 已被占用，已自动切换到端口 {actual}', en: 'Port {port} is in use, automatically switched to port {actual}' },
  'main.portExhausted': { zh: '已达最大尝试次数 ({max})，所有候选端口均被占用。请更换端口后重试。', en: 'Max attempts ({max}) reached, all candidate ports are occupied. Try a different port.' },
};

export function t(key: string, lang: Lang, vars?: Record<string, string | number>): string {
  let str = dict[key]?.[lang];
  if (str === undefined) {
    // Fallback: try Chinese, then the key itself
    str = dict[key]?.zh ?? key;
  }
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, String(v));
    }
  }
  return str;
}
