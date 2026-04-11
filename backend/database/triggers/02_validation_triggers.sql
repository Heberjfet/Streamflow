-- ============================================================================
-- StreamFlow - Triggers de Validación y Notificación
-- Archivo: 02_validation_triggers.sql
-- Descripción: Triggers para validación de datos y notificaciones críticas
-- ============================================================================

-- ============================================================================
-- TRIGGERS DE VALIDACIÓN PARA: users
-- ============================================================================

CREATE TRIGGER trg_validate_user_before_insert
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION validate_user_data();

CREATE TRIGGER trg_validate_user_before_update
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION validate_user_data();

CREATE TRIGGER trg_prevent_user_critical_delete
    BEFORE DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION prevent_critical_delete();

-- ============================================================================
-- TRIGGERS DE VALIDACIÓN PARA: categories
-- ============================================================================

CREATE TRIGGER trg_validate_category_before_insert
    BEFORE INSERT ON categories
    FOR EACH ROW
    EXECUTE FUNCTION validate_category_data();

CREATE TRIGGER trg_validate_category_before_update
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION validate_category_data();

CREATE TRIGGER trg_prevent_category_critical_delete
    BEFORE DELETE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION prevent_critical_delete();

-- ============================================================================
-- TRIGGERS DE VALIDACIÓN PARA: videos
-- ============================================================================

CREATE TRIGGER trg_validate_video_before_insert
    BEFORE INSERT ON videos
    FOR EACH ROW
    EXECUTE FUNCTION validate_video_data();

CREATE TRIGGER trg_validate_video_before_update
    BEFORE UPDATE ON videos
    FOR EACH ROW
    EXECUTE FUNCTION validate_video_data();

CREATE TRIGGER trg_prevent_video_critical_delete
    BEFORE DELETE ON videos
    FOR EACH ROW
    EXECUTE FUNCTION prevent_critical_delete();

-- ============================================================================
-- TRIGGERS DE NOTIFICACIÓN CRÍTICA
-- ============================================================================

-- Notificaciones para cambios críticos en users
CREATE TRIGGER trg_notify_users_critical_changes
    AFTER UPDATE OR DELETE ON users
    FOR EACH ROW
    WHEN (
        (TG_OP = 'DELETE') OR
        (TG_OP = 'UPDATE' AND (OLD.role != NEW.role OR OLD.is_active != NEW.is_active))
    )
    EXECUTE FUNCTION notify_critical_change();

-- Notificaciones para cambios críticos en videos
CREATE TRIGGER trg_notify_videos_critical_changes
    AFTER UPDATE OR DELETE ON videos
    FOR EACH ROW
    WHEN (
        (TG_OP = 'DELETE') OR
        (TG_OP = 'UPDATE' AND OLD.is_published != NEW.is_published)
    )
    EXECUTE FUNCTION notify_critical_change();

-- Notificaciones para eliminación de categorías
CREATE TRIGGER trg_notify_categories_critical_changes
    AFTER DELETE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION notify_critical_change();

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON TRIGGER trg_validate_user_before_insert ON users IS 'Valida datos de usuario antes de inserción';
COMMENT ON TRIGGER trg_validate_user_before_update ON users IS 'Valida datos de usuario antes de actualización';
COMMENT ON TRIGGER trg_prevent_user_critical_delete ON users IS 'Previene eliminación de usuarios críticos (último superadmin)';

COMMENT ON TRIGGER trg_validate_category_before_insert ON categories IS 'Valida datos de categoría antes de inserción';
COMMENT ON TRIGGER trg_validate_category_before_update ON categories IS 'Valida datos de categoría antes de actualización';
COMMENT ON TRIGGER trg_prevent_category_critical_delete ON categories IS 'Previene eliminación de categorías con videos asociados';

COMMENT ON TRIGGER trg_validate_video_before_insert ON videos IS 'Valida datos de video antes de inserción';
COMMENT ON TRIGGER trg_validate_video_before_update ON videos IS 'Valida datos de video antes de actualización';
COMMENT ON TRIGGER trg_prevent_video_critical_delete ON videos IS 'Previene eliminación de videos publicados sin confirmación';

COMMENT ON TRIGGER trg_notify_users_critical_changes ON users IS 'Envía notificaciones para cambios críticos en usuarios';
COMMENT ON TRIGGER trg_notify_videos_critical_changes ON videos IS 'Envía notificaciones para cambios críticos en videos';
COMMENT ON TRIGGER trg_notify_categories_critical_changes ON categories IS 'Envía notificaciones para eliminación de categorías';
