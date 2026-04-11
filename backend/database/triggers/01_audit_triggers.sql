-- ============================================================================
-- StreamFlow - Triggers de Auditoría
-- Archivo: 01_audit_triggers.sql
-- Descripción: Triggers para auditoría automática de todas las tablas
-- ============================================================================

-- ============================================================================
-- TRIGGERS PARA TABLA: users
-- ============================================================================

-- Trigger de auditoría para users
CREATE TRIGGER trg_audit_users_insert
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER trg_audit_users_update
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER trg_audit_users_delete
    AFTER DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

-- Trigger de historial para users
CREATE TRIGGER trg_change_history_users_insert
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION change_history_trigger_function();

CREATE TRIGGER trg_change_history_users_update
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION change_history_trigger_function();

CREATE TRIGGER trg_change_history_users_delete
    AFTER DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION change_history_trigger_function();

-- ============================================================================
-- TRIGGERS PARA TABLA: categories
-- ============================================================================

-- Trigger de auditoría para categories
CREATE TRIGGER trg_audit_categories_insert
    AFTER INSERT ON categories
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER trg_audit_categories_update
    AFTER UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER trg_audit_categories_delete
    AFTER DELETE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

-- Trigger de historial para categories
CREATE TRIGGER trg_change_history_categories_insert
    AFTER INSERT ON categories
    FOR EACH ROW
    EXECUTE FUNCTION change_history_trigger_function();

CREATE TRIGGER trg_change_history_categories_update
    AFTER UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION change_history_trigger_function();

CREATE TRIGGER trg_change_history_categories_delete
    AFTER DELETE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION change_history_trigger_function();

-- ============================================================================
-- TRIGGERS PARA TABLA: videos
-- ============================================================================

-- Trigger de auditoría para videos
CREATE TRIGGER trg_audit_videos_insert
    AFTER INSERT ON videos
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER trg_audit_videos_update
    AFTER UPDATE ON videos
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER trg_audit_videos_delete
    AFTER DELETE ON videos
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

-- Trigger de historial para videos
CREATE TRIGGER trg_change_history_videos_insert
    AFTER INSERT ON videos
    FOR EACH ROW
    EXECUTE FUNCTION change_history_trigger_function();

CREATE TRIGGER trg_change_history_videos_update
    AFTER UPDATE ON videos
    FOR EACH ROW
    EXECUTE FUNCTION change_history_trigger_function();

CREATE TRIGGER trg_change_history_videos_delete
    AFTER DELETE ON videos
    FOR EACH ROW
    EXECUTE FUNCTION change_history_trigger_function();

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER trg_update_videos_updated_at
    BEFORE UPDATE ON videos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON TRIGGER trg_audit_users_insert ON users IS 'Registra inserciones en la tabla users en audit_log';
COMMENT ON TRIGGER trg_audit_users_update ON users IS 'Registra actualizaciones en la tabla users en audit_log';
COMMENT ON TRIGGER trg_audit_users_delete ON users IS 'Registra eliminaciones en la tabla users en audit_log';

COMMENT ON TRIGGER trg_audit_categories_insert ON categories IS 'Registra inserciones en la tabla categories en audit_log';
COMMENT ON TRIGGER trg_audit_categories_update ON categories IS 'Registra actualizaciones en la tabla categories en audit_log';
COMMENT ON TRIGGER trg_audit_categories_delete ON categories IS 'Registra eliminaciones en la tabla categories en audit_log';

COMMENT ON TRIGGER trg_audit_videos_insert ON videos IS 'Registra inserciones en la tabla videos en audit_log';
COMMENT ON TRIGGER trg_audit_videos_update ON videos IS 'Registra actualizaciones en la tabla videos en audit_log';
COMMENT ON TRIGGER trg_audit_videos_delete ON videos IS 'Registra eliminaciones en la tabla videos en audit_log';

COMMENT ON TRIGGER trg_change_history_users_insert ON users IS 'Guarda versión del registro en change_history al insertar';
COMMENT ON TRIGGER trg_change_history_users_update ON users IS 'Guarda versión del registro en change_history al actualizar';
COMMENT ON TRIGGER trg_change_history_users_delete ON users IS 'Guarda versión del registro en change_history al eliminar';
