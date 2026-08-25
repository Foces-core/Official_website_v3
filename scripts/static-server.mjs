import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain',
};

const DIST_ROOT = fs.realpathSync(path.resolve(process.cwd(), 'dist'));

// Resolve a request path to a file inside DIST_ROOT, or null when the
// request escapes the served directory.
function resolveWithinDist(requestPath) {
  const cleaned = decodeURIComponent(requestPath.split('?')[0]).replace(/^\/+/, '');
  const candidate = path.resolve(DIST_ROOT, cleaned === '' ? 'index.html' : cleaned);
  let real;
  try {
    // Symlink-aware containment check - a link inside dist must not be
    // able to serve files from outside it.
    real = fs.realpathSync(candidate);
  } catch {
    return null;
  }
  if (real !== DIST_ROOT && !real.startsWith(DIST_ROOT + path.sep)) {
    return null;
  }
  return real;
}

const server = http.createServer((req, res) => {
  let filePath = resolveWithinDist(req.url);

  if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_ROOT, 'index.html');
  }

  const ext = path.extname(filePath);
  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': mime[ext] || 'application/octet-stream',
      'Content-Length': data.length,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      Connection: 'close',
    });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

const PORT = Number(process.env.PLAYWRIGHT_PORT) || 5174;

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Test static server listening on http://127.0.0.1:${PORT}`);
});
