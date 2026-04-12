import postgres from 'npm:postgres@^3.4.8';
import { env } from '../utils/env.ts';

const sql = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10,
});

export { sql };

export interface User {
  id: string;
  google_id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: 'viewer' | 'admin';
  created_at: Date;
}

export interface Video {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  hls_path: string;
  poster_path: string | null;
  duration: number | null;
  file_size: number | null;
  is_processed: boolean;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: Date;
}

export async function initDatabase() {
  await sql`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto"
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      google_id VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255),
      password_hash TEXT,
      avatar_url TEXT,
      role VARCHAR(50) DEFAULT 'viewer',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT
  `;
  
  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(50) UNIQUE NOT NULL,
      slug VARCHAR(50) UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS videos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
      hls_path TEXT NOT NULL,
      poster_path TEXT,
      duration INTEGER,
      file_size BIGINT,
      is_processed BOOLEAN DEFAULT FALSE,
      is_published BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category_id)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_videos_processed ON videos(is_processed)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_videos_published ON videos(is_published)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_users_google ON users(google_id)
  `;

  const categoryCount = await sql`SELECT COUNT(*) as count FROM categories`;
  if (Number(categoryCount[0].count) === 0) {
    await sql`
      INSERT INTO categories (name, slug, description) VALUES
        ('Sci-Fi', 'sci-fi', 'Ciencia ficción y futuros distópicos'),
        ('Fantasy', 'fantasy', 'Mundos mágicos y criaturas legendarias'),
        ('Horror', 'horror', 'Historias oscuras y perturbadoras'),
        ('Drama', 'drama', 'Narrativas emocionales y profundas'),
        ('Comedy', 'comedy', 'Contenido humorístico y ligero')
    `;
  }

  console.log('Database initialized successfully');
}
