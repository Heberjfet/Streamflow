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
  role: 'viewer' | 'uploader' | 'admin';
  is_active: boolean;
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Video {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  uploader_id: string | null;
  hls_path: string;
  poster_path: string | null;
  duration: number | null;
  file_size: number | null;
  status: 'processing' | 'ready' | 'published' | 'failed' | 'deleted';
  is_processed: boolean;
  is_published: boolean;
  view_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AuditLog {
  id: string;
  table_name: string;
  action: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  user_id: string | null;
  user_email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  created_at: Date;
}

export async function initDatabase() {
  console.log('Iniciando configuración de base de datos...');

  await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;

  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(50) UNIQUE NOT NULL,
      slug VARCHAR(50) UNIQUE NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      google_id VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255),
      avatar_url TEXT,
      role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('viewer', 'admin', 'uploader')),
      is_active BOOLEAN DEFAULT TRUE,
      last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS videos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
      uploader_id UUID REFERENCES users(id) ON DELETE SET NULL,
      hls_path TEXT NOT NULL,
      poster_path TEXT,
      duration INTEGER,
      file_size BIGINT,
      status VARCHAR(50) DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'published', 'failed', 'deleted')),
      is_processed BOOLEAN DEFAULT FALSE,
      is_published BOOLEAN DEFAULT FALSE,
      view_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS audit_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      table_name VARCHAR(100) NOT NULL,
      action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT', 'LOGIN', 'LOGOUT')),
      record_id UUID,
      old_data JSONB,
      new_data JSONB,
      user_id UUID,
      user_email VARCHAR(255),
      ip_address INET,
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash VARCHAR(255) NOT NULL,
      ip_address INET,
      user_agent TEXT,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      revoked_at TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS login_attempts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255),
      ip_address INET NOT NULL,
      success BOOLEAN DEFAULT FALSE,
      failure_reason VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS roles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(50) UNIQUE NOT NULL,
      description TEXT,
      permissions JSONB DEFAULT '[]',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS permissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) UNIQUE NOT NULL,
      resource VARCHAR(100) NOT NULL,
      action VARCHAR(50) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
      permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
      PRIMARY KEY (role_id, permission_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
      assigned_at TIMESTAMP DEFAULT NOW(),
      assigned_by UUID REFERENCES users(id),
      PRIMARY KEY (user_id, role_id)
    )
  `;

  const indexes = [
    { name: 'idx_videos_category', sql: 'CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category_id)' },
    { name: 'idx_videos_uploader', sql: 'CREATE INDEX IF NOT EXISTS idx_videos_uploader ON videos(uploader_id)' },
    { name: 'idx_videos_processed', sql: 'CREATE INDEX IF NOT EXISTS idx_videos_processed ON videos(is_processed)' },
    { name: 'idx_videos_published', sql: 'CREATE INDEX IF NOT EXISTS idx_videos_published ON videos(is_published)' },
    { name: 'idx_videos_status', sql: 'CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status)' },
    { name: 'idx_videos_created', sql: 'CREATE INDEX IF NOT EXISTS idx_videos_created ON videos(created_at DESC)' },
    { name: 'idx_users_google', sql: 'CREATE INDEX IF NOT EXISTS idx_users_google ON users(google_id)' },
    { name: 'idx_users_email', sql: 'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)' },
    { name: 'idx_categories_slug', sql: 'CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug)' },
    { name: 'idx_audit_table', sql: 'CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_log(table_name)' },
    { name: 'idx_audit_action', sql: 'CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action)' },
    { name: 'idx_audit_user', sql: 'CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id)' },
    { name: 'idx_audit_record', sql: 'CREATE INDEX IF NOT EXISTS idx_audit_record ON audit_log(record_id)' },
    { name: 'idx_audit_created', sql: 'CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC)' },
    { name: 'idx_sessions_user', sql: 'CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id)' },
    { name: 'idx_sessions_token', sql: 'CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token_hash)' },
    { name: 'idx_login_attempts_email', sql: 'CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email)' },
    { name: 'idx_login_attempts_ip', sql: 'CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address)' },
  ];

  for (const idx of indexes) {
    try {
      await sql`${idx.sql}`;
    } catch (e) {
      console.warn(`Índice ${idx.name} ya existe o error:`, e);
    }
  }

  const rolesData = [
    { name: 'viewer', description: 'Usuario con acceso solo de lectura', permissions: ['read:content'] },
    { name: 'uploader', description: 'Usuario que puede subir contenido', permissions: ['read:content', 'create:content', 'edit:own_content'] },
    { name: 'admin', description: 'Administrador con acceso total', permissions: ['read:content', 'create:content', 'edit:content', 'delete:content', 'manage:users', 'manage:system'] },
  ];

  for (const role of rolesData) {
    await sql`
      INSERT INTO roles (name, description, permissions)
      VALUES (${role.name}, ${role.description}, ${JSON.stringify(role.permissions)})
      ON CONFLICT (name) DO NOTHING
    `;
  }

  const permissionsData = [
    { name: 'Ver contenido', resource: 'content', action: 'read', description: 'Puede ver videos y contenido' },
    { name: 'Crear contenido', resource: 'content', action: 'create', description: 'Puede subir nuevos videos' },
    { name: 'Editar contenido propio', resource: 'content', action: 'edit:own', description: 'Puede editar sus propios videos' },
    { name: 'Editar cualquier contenido', resource: 'content', action: 'edit:any', description: 'Puede editar cualquier video' },
    { name: 'Eliminar contenido', resource: 'content', action: 'delete', description: 'Puede eliminar videos' },
    { name: 'Gestionar usuarios', resource: 'users', action: 'manage', description: 'Puede crear, editar y eliminar usuarios' },
    { name: 'Gestionar sistema', resource: 'system', action: 'manage', description: 'Acceso a configuración del sistema' },
  ];

  for (const perm of permissionsData) {
    await sql`
      INSERT INTO permissions (name, resource, action, description)
      VALUES (${perm.name}, ${perm.resource}, ${perm.action}, ${perm.description})
      ON CONFLICT (name) DO NOTHING
    `;
  }

  const categoryCount = await sql`SELECT COUNT(*) as count FROM categories`;
  if (Number(categoryCount[0].count) === 0) {
    await sql`
      INSERT INTO categories (name, slug, description) VALUES
        ('Sci-Fi', 'sci-fi', 'Ciencia ficción y futuros distópicos'),
        ('Fantasy', 'fantasy', 'Mundos mágicos y criaturas legendarias'),
        ('Horror', 'horror', 'Historias oscuras y perturbadoras'),
        ('Drama', 'drama', 'Narrativas emocionales y profundas'),
        ('Comedy', 'comedy', 'Contenido humorístico y ligero'),
        ('Thriller', 'thriller', 'Suspenso y tensión narrativa'),
        ('Documentary', 'documentary', 'Contenido factual y educativo'),
        ('Animation', 'animation', 'Arte animado y creativo')
    `;
  }

  console.log('Base de datos configurada exitosamente');
}

export async function closeDatabase() {
  await sql.end();
}

export default {
  sql,
  initDatabase,
  closeDatabase,
};
