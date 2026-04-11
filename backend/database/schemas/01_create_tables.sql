-- ============================================================================
-- StreamFlow - Esquema de Base de Datos
-- Archivo: 01_create_tables.sql
-- Descripción: Creación de tablas principales con restricciones de seguridad
-- ============================================================================

-- Activar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLA: categories
-- Descripción: Catálogo de categorías para clasificación de videos
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Restricciones de integridad
    CONSTRAINT chk_categories_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT chk_categories_slug_not_empty CHECK (LENGTH(TRIM(slug)) > 0),
    CONSTRAINT chk_categories_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Comentarios para documentación
COMMENT ON TABLE categories IS 'Catálogo de categorías para clasificar contenido de video';
COMMENT ON COLUMN categories.slug IS 'Identificador URL-friendly para la categoría';
COMMENT ON COLUMN categories.name IS 'Nombre descriptivo de la categoría (único)';

-- ============================================================================
-- TABLA: users
-- Descripción: Usuarios del sistema con autenticación Google OAuth
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login TIMESTAMP,
    
    -- Restricciones de integridad
    CONSTRAINT chk_users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_users_role_valid CHECK (role IN ('viewer', 'editor', 'admin', 'superadmin')),
    CONSTRAINT chk_users_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT chk_users_google_id_not_empty CHECK (LENGTH(TRIM(google_id)) > 0)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Comentarios para documentación
COMMENT ON TABLE users IS 'Usuarios del sistema con autenticación OAuth';
COMMENT ON COLUMN users.google_id IS 'ID único de Google para el usuario';
COMMENT ON COLUMN users.role IS 'Rol del usuario: viewer, editor, admin, superadmin';
COMMENT ON COLUMN users.is_active IS 'Indica si el usuario está activo en el sistema';

-- ============================================================================
-- TABLA: videos
-- Descripción: Catálogo de videos con metadata y estado de procesamiento
-- ============================================================================
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    hls_path TEXT NOT NULL,
    poster_path TEXT,
    duration INTEGER,
    file_size BIGINT,
    is_processed BOOLEAN NOT NULL DEFAULT FALSE,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Restricciones de integridad
    CONSTRAINT chk_videos_title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
    CONSTRAINT chk_videos_hls_path_not_empty CHECK (LENGTH(TRIM(hls_path)) > 0),
    CONSTRAINT chk_videos_duration_positive CHECK (duration IS NULL OR duration > 0),
    CONSTRAINT chk_videos_file_size_positive CHECK (file_size IS NULL OR file_size > 0),
    CONSTRAINT chk_videos_updated_after_created CHECK (updated_at >= created_at)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_videos_category_id ON videos(category_id);
CREATE INDEX IF NOT EXISTS idx_videos_is_processed ON videos(is_processed);
CREATE INDEX IF NOT EXISTS idx_videos_is_published ON videos(is_published);
CREATE INDEX IF NOT EXISTS idx_videos_uploaded_by ON videos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);

-- Comentarios para documentación
COMMENT ON TABLE videos IS 'Catálogo de videos con metadata y estado de procesamiento';
COMMENT ON COLUMN videos.hls_path IS 'Ruta del archivo manifest HLS (.m3u8)';
COMMENT ON COLUMN videos.is_processed IS 'Indica si el video ha sido transcodificado';
COMMENT ON COLUMN videos.is_published IS 'Indica si el video es visible públicamente';
COMMENT ON COLUMN videos.uploaded_by IS 'Usuario que subió el video';
