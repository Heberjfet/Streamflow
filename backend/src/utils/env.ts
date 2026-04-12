import '@std/dotenv/load';

export const env = {
  PORT: parseInt(Deno.env.get('PORT') || '8000'),
  NODE_ENV: Deno.env.get('NODE_ENV') || 'development',

  DATABASE_URL: Deno.env.get('DATABASE_URL') || 'postgresql://streamflow:streamflow@localhost:5434/streamflow',
  
  REDIS_URL: Deno.env.get('REDIS_URL') || 'redis://localhost:6379',

  MINIO_ENDPOINT: Deno.env.get('MINIO_ENDPOINT') || 'localhost:9000',
  MINIO_USER: Deno.env.get('MINIO_USER') || 'streamflow',
  MINIO_PASSWORD: Deno.env.get('MINIO_PASSWORD') || 'streamflow',
  MINIO_BUCKET_RAW: Deno.env.get('MINIO_BUCKET_RAW') || 'raw-uploads',
  MINIO_BUCKET_VOD: Deno.env.get('MINIO_BUCKET_VOD') || 'production-vod',
  MINIO_BUCKET_THUMBS: Deno.env.get('MINIO_BUCKET_THUMBS') || 'thumbnails',

  GOOGLE_CLIENT_ID: Deno.env.get('GOOGLE_CLIENT_ID') || '',
  GOOGLE_CLIENT_SECRET: Deno.env.get('GOOGLE_CLIENT_SECRET') || '',

  JWT_SECRET: Deno.env.get('JWT_SECRET') || 'your-super-secret-jwt-key-change-in-production',
  JWT_EXPIRES_IN: Deno.env.get('JWT_EXPIRES_IN') || '7d',

  FRONTEND_URL: Deno.env.get('FRONTEND_URL') || 'http://localhost:3000',
};
