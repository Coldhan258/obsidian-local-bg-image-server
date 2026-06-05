import type { Lang } from './i18n';

export interface BGServerConfig {
  port: number;
  hostname: string;
  imageFolderPath: string;
  pageSize: number;
  language: Lang;
}

export const DEFAULT_CONFIG: BGServerConfig = {
  port: 8989,
  hostname: 'localhost',
  imageFolderPath: '.bg/',
  pageSize: 30,
  language: 'zh',
};

export const VALID_PORT_RANGE = { min: 1024, max: 65535 } as const;
export const MAX_PORT_ATTEMPTS = 10;

const IMAGE_EXTS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.svg',
  '.webp', '.bmp', '.ico', '.tiff', '.tif',
]);

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',
};

export function getMimeType(ext: string): string {
  return MIME_TYPES[ext.toLowerCase()] || 'application/octet-stream';
}

export function isImageFile(filename: string): boolean {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return IMAGE_EXTS.has(ext);
}
