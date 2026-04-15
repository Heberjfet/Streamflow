-- =============================================
-- StreamFlow - Triggers de Validación Adicionales
-- Versión: 1.0.0
-- Descripción: Triggers para validaciones de negocio
-- =============================================

-- Trigger para validar email en users
DROP TRIGGER IF EXISTS trg_users_validate_email ON users;
CREATE TRIGGER trg_users_validate_email
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_validate_email();

-- Trigger para actualizar last_login en users
DROP TRIGGER IF EXISTS trg_users_last_login ON users;
CREATE TRIGGER trg_users_last_login
    AFTER UPDATE OF last_login ON users
    FOR EACH ROW
    WHEN (OLD.last_login IS DISTINCT FROM NEW.last_login)
    EXECUTE FUNCTION fn_audit_log();

-- Trigger para registrar eliminación de videos en auditoría
DROP TRIGGER IF EXISTS trg_videos_delete_audit ON videos;
CREATE TRIGGER trg_videos_delete_audit
    BEFORE DELETE ON videos
    FOR EACH ROW
    WHEN (OLD.is_published = TRUE)
    EXECUTE FUNCTION fn_audit_log();
