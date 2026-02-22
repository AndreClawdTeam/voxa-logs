import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;
const TOKEN = process.env.LOG_VIEWER_TOKEN;

if (!TOKEN) {
  console.error('ERROR: LOG_VIEWER_TOKEN env var is required');
  process.exit(1);
}

function validateToken(req) {
  const url = new URL(req.url, `http://localhost`);
  const queryToken = url.searchParams.get('token');
  const authHeader = req.headers['authorization'];
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  return queryToken === TOKEN || bearerToken === TOKEN;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost`);

  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok' }));
  }

  if (url.pathname === '/' || url.pathname === '/index.html') {
    const html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }

  if (url.pathname === '/events') {
    if (!validateToken(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Unauthorized' }));
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    // Send initial connection event
    res.write('data: {"type":"connected","msg":"Connected to Voxa API logs"}\n\n');

    const journal = spawn('journalctl', ['-u', 'voxa-api', '-f', '-n', '100', '--output=cat']);

    journal.stdout.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        res.write(`data: ${line}\n\n`);
      }
    });

    journal.stderr.on('data', (chunk) => {
      console.error('[journalctl stderr]', chunk.toString());
    });

    journal.on('error', (err) => {
      console.error('[journalctl error]', err.message);
    });

    req.on('close', () => {
      journal.kill();
    });

    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`voxa-logs running on http://0.0.0.0:${PORT}`);
});
