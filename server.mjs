import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve('dist');
const port = Number(process.env.PORT || 5181);
const host = process.env.HOST || '127.0.0.1';
const upstream = 'https://api-testnet.qore.host';
const nodeInfoPath = '/cosmos/base/tendermint/v1beta1/node_info';
const txPath = /^\/cosmos\/tx\/v1beta1\/txs\/[0-9a-fA-F]{64}$/;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/lcd/')) {
      if (req.method !== 'GET') {
        res.writeHead(405, { Allow: 'GET' }).end();
        return;
      }
      const path = url.pathname.slice('/lcd'.length);
      if (url.search || (path !== nodeInfoPath && !txPath.test(path))) {
        res.writeHead(404).end();
        return;
      }
      const response = await fetch(upstream + path, {
        headers: { 'User-Agent': 'Mozilla/5.0 SealCheck/0.1' },
        redirect: 'error',
        signal: AbortSignal.timeout(15_000),
      });
      res.writeHead(response.status, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(await response.text());
      return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    const path = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!path.startsWith(root + sep)) {
      res.writeHead(403).end();
      return;
    }
    const file = await readFile(path);
    res.writeHead(200, {
      'Content-Type': types[extname(path)] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(req.method === 'HEAD' ? undefined : file);
  } catch (error) {
    const status = error.code === 'ENOENT' ? 404 : 502;
    if (!res.headersSent) res.writeHead(status, { 'Content-Type': 'text/plain' });
    res.end(status === 404 ? 'Not found' : 'Service unavailable');
  }
}).listen(port, host, () => console.log('SealCheck running at ' + host + ':' + port));
