import { serve } from '@hono/node-server';
import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => c.json({ message: 'StreamFlow API', version: '0.1.0' }));

app.get('/v1/health', (c) => c.json({ status: 'ok' }));

const port = 8000;

console.log(`Server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
