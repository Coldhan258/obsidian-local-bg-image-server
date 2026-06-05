import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { MAX_PORT_ATTEMPTS, getMimeType } from './types';

export class ImageServer {
  private server: http.Server | null = null;
  private imageFolder: string = '';
  private bindHostname: string = 'localhost';
  private activePort: number = 0;

  get isRunning(): boolean {
    return this.server !== null;
  }

  get currentPort(): number {
    return this.activePort;
  }

  get baseUrl(): string {
    return this.isRunning
      ? `http://${this.bindHostname}:${this.activePort}`
      : '';
  }

  /**
   * Start the HTTP server on the given port + hostname.
   * If the port is busy, automatically tries subsequent ports
   * (up to MAX_PORT_ATTEMPTS attempts).
   * @returns the actual port the server is listening on.
   */
  start(folder: string, port: number, hostname: string): Promise<number> {
    this.stop();

    this.imageFolder = path.resolve(folder);
    this.bindHostname = hostname;
    this.activePort = 0;

    return new Promise((resolve, reject) => {
      const tryPort = (p: number, attempt: number) => {
        if (attempt > MAX_PORT_ATTEMPTS) {
          reject(
            new Error(
              `Max attempts (${MAX_PORT_ATTEMPTS}) reached, ` +
                `all candidate ports are occupied. Try a different port.`,
            ),
          );
          return;
        }

        const srv = http.createServer((req, res) =>
          this.handleRequest(req, res),
        );

        srv.on('error', (err: NodeJS.ErrnoException) => {
          if (err.code === 'EADDRINUSE') {
            // Port busy – try the next one
            srv.close(() => tryPort(p + 1, attempt + 1));
          } else {
            reject(err);
          }
        });

        srv.listen(p, hostname, () => {
          this.server = srv;
          this.activePort = p;
          resolve(p);
        });
      };

      tryPort(port, 0);
    });
  }

  /** Gracefully stop the server and release the port. */
  stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
      this.activePort = 0;
    }
  }

  // ── request handler ────────────────────────────────────────

  private handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ): void {
    if (req.method !== 'GET') {
      res.writeHead(405);
      res.end('Method Not Allowed');
      return;
    }

    let url: URL;
    try {
      url = new URL(
        req.url || '/',
        `http://${req.headers.host || this.bindHostname}`,
      );
    } catch {
      res.writeHead(400);
      res.end('Bad Request');
      return;
    }

    const decodedPath = decodeURIComponent(url.pathname);

    // Resolve the requested path safely under the image folder
    const safePath = path.resolve(this.imageFolder, '.' + decodedPath);

    if (!safePath.startsWith(this.imageFolder)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.stat(safePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }

      const ext = path.extname(safePath);
      const mime = getMimeType(ext);

      res.writeHead(200, {
        'Content-Type': mime,
        'Content-Length': stats.size,
        'Cache-Control': 'no-cache',
      });

      const stream = fs.createReadStream(safePath);
      stream.pipe(res);
    });
  }
}
