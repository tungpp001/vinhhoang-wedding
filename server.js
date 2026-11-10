const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 8080;
const ROOT_DIR = __dirname;
const CONFIG_FILE = path.join(ROOT_DIR, 'site-config.json');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.ico': 'image/x-icon'
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlPath = req.url.split('?')[0];

  // API: Get saved config
  if (urlPath === '/api/config' && req.method === 'GET') {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(data);
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end('{}');
    }
    return;
  }

  // API: Save config (and auto-push to GitHub in background!)
  if (urlPath === '/api/config' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const normalizedBody = body.replace(/"\/uploads\//g, '"uploads/');
      const parsed = JSON.parse(normalizedBody);
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(parsed, null, 2), 'utf8');

      // Sync OpenGraph meta tags in index.html for Zalo/Facebook link previews
      const indexFile = path.join(ROOT_DIR, 'index.html');
      if (fs.existsSync(indexFile) && parsed.meta) {
        let html = fs.readFileSync(indexFile, 'utf8');
        const pageTitle = parsed.meta.pageTitle || 'Vĩnh Hoàng💕Xoan Xoan | Thiệp Cưới Online';
        const coverThumb = parsed.meta.coverThumb || 'uploads/1794324127512-x21ut2.jpg';
        const absImg = coverThumb.startsWith('http')
          ? coverThumb
          : `https://tungpp001.github.io/vinhhoang-wedding/${coverThumb.replace(/^\//, '')}`;
        html = html.replace(/<title>[^<]*<\/title>/, `<title>${pageTitle}</title>`);
        html = html.replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${pageTitle}" />`);
        html = html.replace(/<meta property="og:image" content="[^"]*"\s*\/>/, `<meta property="og:image" content="${absImg}" />`);
        html = html.replace(/<meta property="og:image:secure_url" content="[^"]*"\s*\/>/, `<meta property="og:image:secure_url" content="${absImg}" />`);
        html = html.replace(/<meta name="twitter:image" content="[^"]*"\s*\/>/, `<meta name="twitter:image" content="${absImg}" />`);
        fs.writeFileSync(indexFile, html, 'utf8');
        fs.writeFileSync(path.join(ROOT_DIR, 'thiep.html'), html, 'utf8');
      }

      exec('git add -A && git commit -m "Update wedding config from Admin Studio" && git push origin main', { cwd: ROOT_DIR }, () => {});
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // API: Upload base64 image or audio file to uploads/ (relative path for GitHub Pages compatibility)
  if (urlPath === '/api/upload' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const { filename, dataUrl } = JSON.parse(body);
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) throw new Error('Invalid dataUrl');
      const ext = path.extname(filename || '') || '.png';
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      const filePath = path.join(UPLOADS_DIR, safeName);
      fs.writeFileSync(filePath, Buffer.from(match[2], 'base64'));
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, url: `uploads/${safeName}` }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // Static routing
  let relPath = urlPath;
  if (relPath === '/') relPath = '/index.html';
  if (relPath === '/admin' || relPath === '/admin/') relPath = '/admin.html';

  const filePath = path.join(ROOT_DIR, decodeURIComponent(relPath));
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Admin dashboard at http://localhost:${PORT}/admin`);
});
