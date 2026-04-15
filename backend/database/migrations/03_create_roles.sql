-- =============================================
-- StreamFlow - Sistema de Roles y Permisos
-- Versión: 1.0.0
-- Descripción: Control de acceso basado en roles
-- =============================================

-- Tabla de roles
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de permisos
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de relación roles-permisos
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Tabla de relación usuarios-roles
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    PRIMARY KEY (user_id, role_id)
);

-- Roles por defecto del sistema
INSERT INTO roles (name, description, permissions) VALUES
    ('viewer', 'Usuario con acceso solo de lectura', '["read:content"]'),
    ('uploader', 'Usuario que puede subir contenido', '["read:content", "create:content", "edit:own_content"]'),
    ('admin', 'Administrador con acceso total', '["read:content", "create:content", "edit:content", "delete:content", "manage:users", "manage:system"]')
ON CONFLICT (name) DO NOTHING;

-- Permisos del sistema
INSERT INTO permissions (name, resource, action, description) VALUES
    ('Ver contenido', 'content', 'read', 'Puede ver videos y contenido'),
    ('Crear contenido', 'content', 'create', 'Puede subir nuevos videos'),
    ('Editar contenido propio', 'content', 'edit:own', 'Puede editar sus propios videos'),
    ('Editar cualquier contenido', 'content', 'edit:any', 'Puede editar cualquier video'),
    ('Eliminar contenido', 'content', 'delete', 'Puede eliminar videos'),
    ('Gestionar usuarios', 'users', 'manage', 'Puede crear, editar y eliminar usuarios'),
    ('Gestionar sistema', 'system', 'manage', 'Acceso a configuración del sistema')
ON CONFLICT (name) DO NOTHING;

-- Asignar permisos a roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'viewer' AND p.name IN ('Ver contenido')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'uploader' AND p.name IN ('Ver contenido', 'Crear contenido', 'Editar contenido propio')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Índices
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);
