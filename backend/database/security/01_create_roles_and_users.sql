-- ============================================================================
-- StreamFlow - Control de Usuarios y Roles PostgreSQL
-- Archivo: 01_create_roles_and_users.sql
-- Descripción: Creación de roles y usuarios con permisos específicos
-- ============================================================================

-- ============================================================================
-- ROLES DE BASE DE DATOS
-- ============================================================================

-- Rol de solo lectura (para reportes y consultas)
CREATE ROLE streamflow_readonly;

-- Rol de aplicación (para el backend de la aplicación)
CREATE ROLE streamflow_app;

-- Rol de administrador (para tareas administrativas)
CREATE ROLE streamflow_admin;

-- Rol de auditor (acceso solo a logs de auditoría)
CREATE ROLE streamflow_auditor;

-- ============================================================================
-- PERMISOS PARA: streamflow_readonly
-- Descripción: Solo puede leer datos, no modificar
-- ============================================================================

-- Permisos de SELECT en tablas principales
GRANT CONNECT ON DATABASE postgres TO streamflow_readonly;
GRANT USAGE ON SCHEMA public TO streamflow_readonly;
GRANT SELECT ON categories, videos TO streamflow_readonly;

-- NO puede leer users (datos sensibles)
-- NO puede modificar datos

COMMENT ON ROLE streamflow_readonly IS 'Rol de solo lectura para consultas y reportes (sin acceso a datos de usuarios)';

-- ============================================================================
-- PERMISOS PARA: streamflow_app
-- Descripción: Rol usado por la aplicación backend
-- ============================================================================

-- Permisos de conexión y uso de esquema
GRANT CONNECT ON DATABASE postgres TO streamflow_app;
GRANT USAGE ON SCHEMA public TO streamflow_app;

-- Permisos completos en tablas principales
GRANT SELECT, INSERT, UPDATE, DELETE ON users, categories, videos TO streamflow_app;

-- Permisos en tablas de auditoría (solo INSERT y SELECT)
GRANT SELECT, INSERT ON audit_log, change_history TO streamflow_app;

-- Permisos en secuencias
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO streamflow_app;

-- Asegurar que los permisos se apliquen a futuras tablas
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO streamflow_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT USAGE, SELECT ON SEQUENCES TO streamflow_app;

COMMENT ON ROLE streamflow_app IS 'Rol principal de la aplicación con permisos CRUD en todas las tablas';

-- ============================================================================
-- PERMISOS PARA: streamflow_admin
-- Descripción: Rol administrativo con permisos completos
-- ============================================================================

-- Permisos de conexión
GRANT CONNECT ON DATABASE postgres TO streamflow_admin;
GRANT USAGE ON SCHEMA public TO streamflow_admin;

-- Permisos completos en todas las tablas
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO streamflow_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO streamflow_admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO streamflow_admin;

-- Puede crear tablas y esquemas
GRANT CREATE ON SCHEMA public TO streamflow_admin;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL PRIVILEGES ON TABLES TO streamflow_admin;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL PRIVILEGES ON SEQUENCES TO streamflow_admin;

COMMENT ON ROLE streamflow_admin IS 'Rol administrativo con permisos completos en toda la base de datos';

-- ============================================================================
-- PERMISOS PARA: streamflow_auditor
-- Descripción: Solo puede ver logs de auditoría
-- ============================================================================

-- Permisos de conexión
GRANT CONNECT ON DATABASE postgres TO streamflow_auditor;
GRANT USAGE ON SCHEMA public TO streamflow_auditor;

-- Solo puede leer tablas de auditoría
GRANT SELECT ON audit_log, change_history TO streamflow_auditor;

-- Puede ver información básica de tablas para contexto
GRANT SELECT ON categories TO streamflow_auditor;

COMMENT ON ROLE streamflow_auditor IS 'Rol de auditoría con acceso solo a logs y bitácoras';

-- ============================================================================
-- USUARIOS DE BASE DE DATOS
-- ============================================================================

-- Usuario de aplicación (usado por el backend)
CREATE USER streamflow_app_user WITH PASSWORD 'change_this_password_in_production';
GRANT streamflow_app TO streamflow_app_user;

-- Usuario administrador
CREATE USER streamflow_admin_user WITH PASSWORD 'change_this_admin_password';
GRANT streamflow_admin TO streamflow_admin_user;

-- Usuario de solo lectura
CREATE USER streamflow_readonly_user WITH PASSWORD 'change_this_readonly_password';
GRANT streamflow_readonly TO streamflow_readonly_user;

-- Usuario auditor
CREATE USER streamflow_auditor_user WITH PASSWORD 'change_this_auditor_password';
GRANT streamflow_auditor TO streamflow_auditor_user;

-- ============================================================================
-- SEGURIDAD ADICIONAL
-- ============================================================================

-- Revocar permisos públicos por defecto
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

-- ============================================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- ============================================================================

COMMENT ON ROLE streamflow_app IS 'Rol de la aplicación backend con permisos CRUD';
COMMENT ON ROLE streamflow_readonly IS 'Rol de solo lectura para reportes';
COMMENT ON ROLE streamflow_admin IS 'Rol administrativo con permisos completos';
COMMENT ON ROLE streamflow_auditor IS 'Rol para auditoría y revisión de logs';
