-- ============================================================================
-- StreamFlow - Tabla de Roles y Permisos a Nivel Aplicación
-- Archivo: 03_create_roles_table.sql
-- Descripción: Sistema de roles y permisos a nivel de aplicación
-- ============================================================================

-- ============================================================================
-- TABLA: app_roles
-- Descripción: Catálogo de roles disponibles en la aplicación
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Restricciones
    CONSTRAINT chk_app_roles_name_not_empty CHECK (LENGTH(TRIM(role_name)) > 0),
    CONSTRAINT chk_app_roles_display_name_not_empty CHECK (LENGTH(TRIM(display_name)) > 0)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_app_roles_name ON app_roles(role_name);

COMMENT ON TABLE app_roles IS 'Catálogo de roles disponibles en la aplicación';
COMMENT ON COLUMN app_roles.is_system_role IS 'Indica si es un rol del sistema (no puede eliminarse)';

-- ============================================================================
-- TABLA: app_permissions
-- Descripción: Catálogo de permisos disponibles
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_name VARCHAR(100) NOT NULL UNIQUE,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Restricciones
    CONSTRAINT chk_app_permissions_name_not_empty CHECK (LENGTH(TRIM(permission_name)) > 0),
    CONSTRAINT chk_app_permissions_resource_not_empty CHECK (LENGTH(TRIM(resource)) > 0),
    CONSTRAINT chk_app_permissions_action_valid CHECK (action IN ('create', 'read', 'update', 'delete', 'manage'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_app_permissions_resource ON app_permissions(resource);
CREATE INDEX IF NOT EXISTS idx_app_permissions_action ON app_permissions(action);

COMMENT ON TABLE app_permissions IS 'Catálogo de permisos disponibles en la aplicación';
COMMENT ON COLUMN app_permissions.resource IS 'Recurso al que aplica el permiso (ej: videos, users, categories)';
COMMENT ON COLUMN app_permissions.action IS 'Acción permitida: create, read, update, delete, manage';

-- ============================================================================
-- TABLA: app_role_permissions
-- Descripción: Relación muchos a muchos entre roles y permisos
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_role_permissions (
    role_id UUID NOT NULL REFERENCES app_roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES app_permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (role_id, permission_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_app_role_permissions_role ON app_role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_app_role_permissions_permission ON app_role_permissions(permission_id);

COMMENT ON TABLE app_role_permissions IS 'Relación entre roles y sus permisos asignados';

-- ============================================================================
-- INSERTAR ROLES DEL SISTEMA
-- ============================================================================

INSERT INTO app_roles (role_name, display_name, description, is_system_role) VALUES
('viewer', 'Viewer', 'Usuario con permisos de solo lectura', TRUE),
('editor', 'Editor', 'Usuario con permisos para crear y editar contenido', TRUE),
('admin', 'Administrator', 'Administrador con permisos completos excepto gestión de usuarios', TRUE),
('superadmin', 'Super Administrator', 'Administrador supremo con todos los permisos', TRUE)
ON CONFLICT (role_name) DO NOTHING;

-- ============================================================================
-- INSERTAR PERMISOS DEL SISTEMA
-- ============================================================================

INSERT INTO app_permissions (permission_name, resource, action, description) VALUES
-- Permisos de videos
('videos:read', 'videos', 'read', 'Ver catálogo de videos'),
('videos:create', 'videos', 'create', 'Subir nuevos videos'),
('videos:update', 'videos', 'update', 'Editar información de videos'),
('videos:delete', 'videos', 'delete', 'Eliminar videos'),
('videos:manage', 'videos', 'manage', 'Gestión completa de videos (incluye publicar/despublicar)'),

-- Permisos de categorías
('categories:read', 'categories', 'read', 'Ver categorías'),
('categories:create', 'categories', 'create', 'Crear nuevas categorías'),
('categories:update', 'categories', 'update', 'Editar categorías'),
('categories:delete', 'categories', 'delete', 'Eliminar categorías'),
('categories:manage', 'categories', 'manage', 'Gestión completa de categorías'),

-- Permisos de usuarios
('users:read', 'users', 'read', 'Ver lista de usuarios'),
('users:create', 'users', 'create', 'Crear nuevos usuarios'),
('users:update', 'users', 'update', 'Editar información de usuarios'),
('users:delete', 'users', 'delete', 'Eliminar usuarios'),
('users:manage', 'users', 'manage', 'Gestión completa de usuarios (incluye cambiar roles)'),

-- Permisos de auditoría
('audit:read', 'audit', 'read', 'Ver logs de auditoría'),
('audit:manage', 'audit', 'manage', 'Gestión completa de auditoría')
ON CONFLICT (permission_name) DO NOTHING;

-- ============================================================================
-- ASIGNAR PERMISOS A ROLES
-- ============================================================================

-- Rol: viewer (solo lectura)
INSERT INTO app_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM app_roles r
CROSS JOIN app_permissions p
WHERE r.role_name = 'viewer'
AND p.permission_name IN ('videos:read', 'categories:read')
ON CONFLICT DO NOTHING;

-- Rol: editor (puede crear y editar contenido)
INSERT INTO app_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM app_roles r
CROSS JOIN app_permissions p
WHERE r.role_name = 'editor'
AND p.permission_name IN (
    'videos:read', 'videos:create', 'videos:update',
    'categories:read', 'categories:create', 'categories:update'
)
ON CONFLICT DO NOTHING;

-- Rol: admin (gestión completa excepto usuarios)
INSERT INTO app_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM app_roles r
CROSS JOIN app_permissions p
WHERE r.role_name = 'admin'
AND p.permission_name IN (
    'videos:read', 'videos:create', 'videos:update', 'videos:delete', 'videos:manage',
    'categories:read', 'categories:create', 'categories:update', 'categories:delete', 'categories:manage',
    'users:read',
    'audit:read'
)
ON CONFLICT DO NOTHING;

-- Rol: superadmin (todos los permisos)
INSERT INTO app_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM app_roles r
CROSS JOIN app_permissions p
WHERE r.role_name = 'superadmin'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FUNCIONES AUXILIARES PARA VERIFICACIÓN DE PERMISOS
-- ============================================================================

-- Función para verificar si un usuario tiene un permiso específico
CREATE OR REPLACE FUNCTION user_has_permission(
    p_user_id UUID,
    p_permission_name VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    v_has_permission BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM users u
        JOIN app_roles r ON u.role = r.role_name
        JOIN app_role_permissions rp ON r.id = rp.role_id
        JOIN app_permissions p ON rp.permission_id = p.id
        WHERE u.id = p_user_id
        AND p.permission_name = p_permission_name
        AND u.is_active = TRUE
    ) INTO v_has_permission;
    
    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION user_has_permission IS 'Verifica si un usuario tiene un permiso específico';

-- Función para obtener todos los permisos de un usuario
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE (
    permission_name VARCHAR,
    resource VARCHAR,
    action VARCHAR,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        p.permission_name,
        p.resource,
        p.action,
        p.description
    FROM users u
    JOIN app_roles r ON u.role = r.role_name
    JOIN app_role_permissions rp ON r.id = rp.role_id
    JOIN app_permissions p ON rp.permission_id = p.id
    WHERE u.id = p_user_id
    AND u.is_active = TRUE
    ORDER BY p.resource, p.action;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_permissions IS 'Retorna todos los permisos de un usuario';
