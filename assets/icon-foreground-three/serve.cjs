// Local-only server; serves this preview and the original reference image.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const port = Number(process.env.PORT || 4310);
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.json': 'application/json',
};
const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }
  const file =
    pathname === '/icon-foreground.png'
      ? path.resolve(root, '../icon-foreground.png')
      : path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (pathname !== '/icon-foreground.png' && !file.startsWith(root + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  fs.readFile(file, (error, data) => {
    if (error) {
      res.writeHead(404).end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type':
        (mime[path.extname(file)] || 'application/octet-stream') +
        (path.extname(file) === '.png' ? '' : '; charset=utf-8'),
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
});
server.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () =>
  console.log(`MehrChain 3D preview: http://127.0.0.1:${port}`),
);
