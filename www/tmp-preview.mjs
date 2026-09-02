import http from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const root = process.cwd();
const distRoot = normalize(join(root, 'dist'));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8',
  '.list': 'text/plain; charset=utf-8',
  '.ini': 'text/plain; charset=utf-8',
  '.yaml': 'text/plain; charset=utf-8',
  '.yml': 'text/plain; charset=utf-8',
};

function resolveFile(pathname) {
  if (pathname.endsWith('/')) pathname += 'index.html';
  if (pathname === '/') pathname = '/index.html';
  let file = normalize(join(distRoot, pathname));
  if (!file.startsWith(distRoot)) return null;
  try {
    const st = statSync(file);
    if (st.isFile()) return file;
    // directory -> try index.html
    const idx = join(file, 'index.html');
    statSync(idx);
    return idx;
  } catch {
    // fall back to "<name>.html"
    if (extname(file) === '.html') return null;
    const alt = file + '.html';
    try {
      statSync(alt);
      return alt;
    } catch {
      return null;
    }
  }
}

http
  .createServer((req, res) => {
    let file;
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      file = resolveFile(pathname);
    } catch {
      file = null;
    }
    if (!file) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
    createReadStream(file).pipe(res);
  })
  .listen(8099, () => console.log('preview on http://localhost:8099'));
