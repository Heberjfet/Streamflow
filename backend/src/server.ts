import { serve } from '@hono/node-server';
import { Hono } from 'jsr:@hono/hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { env } from './utils/env.ts';
import { initDatabase } from './db/database.ts';
import authRoutes from './routes/auth.ts';
import catalogRoutes from './routes/catalog.ts';
import categoriesRoutes from './routes/categories.ts';
import ingestRoutes from './routes/ingest.ts';
import videoRoutes from './routes/videos.ts';
import userRoutes from './routes/users.ts';

const app = new Hono();

app.use('*', logger());
app.use('*', cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

app.get('/', (c) => c.json({ 
  message: 'StreamFlow API', 
  version: '0.1.0',
  status: 'running'
}));

app.get('/v1/health', (c) => c.json({ status: 'ok' }));

app.route('/v1/auth', authRoutes);
app.route('/v1/users', userRoutes);
app.route('/v1/catalog', catalogRoutes);
app.route('/v1/categories', categoriesRoutes);
app.route('/v1/admin/ingest', ingestRoutes);
app.route('/v1/videos', videoRoutes);

app.notFound((c) => c.json({ error: 'Not Found', message: 'Endpoint not found' }, 404));

app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

async function start() {
  try {
    await initDatabase();
    console.log('Database initialized');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }

  console.log(`Server running on http://localhost:${env.PORT}`);
  
  serve({
    fetch: app.fetch,
    port: env.PORT,
  });
}

start();

export default app;
