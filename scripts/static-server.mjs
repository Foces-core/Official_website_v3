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

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  let normalized = reqPath.replace(/^\/+/, '');
  let filePath = path.join(process.cwd(), 'dist', normalized === '' ? 'index.html' : normalized);

  console.log('SERVER REQ:', req.url, 'EXISTS:', fs.existsSync(filePath));

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(process.cwd(), 'dist', 'index.html');
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
  } catch (err) {
    res.writeHead(500);
    res.end(String(err));
  }
});

const PORT = Number(process.env.PLAYWRIGHT_PORT) || 5174;

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Test static server listening on http://127.0.0.1:${PORT}`);
});
