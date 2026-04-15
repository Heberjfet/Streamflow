-- =============================================
-- StreamFlow - Triggers de Auditoría
-- Versión: 1.0.0
-- Descripción: Triggers para registrar cambios automáticamente
-- =============================================

-- Triggers para tabla users
DROP TRIGGER IF EXISTS trg_users_audit ON users;
CREATE TRIGGER trg_users_audit
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

DROP TRIGGER IF EXISTS trg_users_timestamp ON users;
CREATE TRIGGER trg_users_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

DROP TRIGGER IF EXISTS trg_users_validate_admin ON users;
CREATE TRIGGER trg_users_validate_admin
    BEFORE DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_validate_last_admin();

-- Triggers para tabla videos
DROP TRIGGER IF EXISTS trg_videos_audit ON videos;
CREATE TRIGGER trg_videos_audit
    AFTER INSERT OR UPDATE OR DELETE ON videos
    FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

DROP TRIGGER IF EXISTS trg_videos_timestamp ON videos;
CREATE TRIGGER trg_videos_timestamp
    BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

DROP TRIGGER IF EXISTS trg_videos_validate_status ON videos;
CREATE TRIGGER trg_videos_validate_status
    BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION fn_validate_video_status_change();

DROP TRIGGER IF EXISTS trg_videos_validate_size ON videos;
CREATE TRIGGER trg_videos_validate_size
    BEFORE INSERT ON videos
    FOR EACH ROW EXECUTE FUNCTION fn_validate_file_size();

-- Triggers para tabla categories
DROP TRIGGER IF EXISTS trg_categories_audit ON categories;
CREATE TRIGGER trg_categories_audit
    AFTER INSERT OR UPDATE OR DELETE ON categories
    FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

DROP TRIGGER IF EXISTS trg_categories_timestamp ON categories;
CREATE TRIGGER trg_categories_timestamp
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

DROP TRIGGER IF EXISTS trg_categories_validate_slug ON categories;
CREATE TRIGGER trg_categories_validate_slug
    BEFORE INSERT OR UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION fn_validate_category_slug();

-- Triggers para tabla roles
DROP TRIGGER IF EXISTS trg_roles_audit ON roles;
CREATE TRIGGER trg_roles_audit
    AFTER INSERT OR UPDATE OR DELETE ON roles
    FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

DROP TRIGGER IF EXISTS trg_roles_timestamp ON roles;
CREATE TRIGGER trg_roles_timestamp
    BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- Triggers para tabla user_roles
DROP TRIGGER IF EXISTS trg_user_roles_audit ON user_roles;
CREATE TRIGGER trg_user_roles_audit
    AFTER INSERT ON user_roles
    FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

DROP TRIGGER IF EXISTS trg_user_roles_validate ON user_roles;
CREATE TRIGGER trg_user_roles_validate
    BEFORE INSERT ON user_roles
    FOR EACH ROW EXECUTE FUNCTION fn_validate_unique_user_role();
