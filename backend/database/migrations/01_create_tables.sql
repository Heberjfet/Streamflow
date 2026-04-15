-- =============================================
-- StreamFlow - Esquema Principal de Base de Datos
-- Versión: 1.0.0
-- Descripción: Tablas principales del sistema
-- =============================================

-- Extensión para generación de UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de usuarios
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
);

-- Tabla de videos (contenido principal)
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
);

-- Índices para optimización de queries
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category_id);
CREATE INDEX IF NOT EXISTS idx_videos_uploader ON videos(uploader_id);
CREATE INDEX IF NOT EXISTS idx_videos_processed ON videos(is_processed);
CREATE INDEX IF NOT EXISTS idx_videos_published ON videos(is_published);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_created ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_google ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
