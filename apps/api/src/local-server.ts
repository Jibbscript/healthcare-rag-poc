import http from 'node:http';
import { handler } from './handlers/chat';

const port = Number(process.env.PORT ?? 8787);
const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/chat') { res.writeHead(404).end('not found'); return; }
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', async () => {
    const response = await handler({ body, requestContext: { http: { method: 'POST', path: '/chat' } } });
    res.writeHead(response.statusCode, response.headers).end(response.body);
  });
});
server.listen(port, '127.0.0.1', () => { process.stdout.write(`local api listening on http://127.0.0.1:${port}/chat\n`); });
