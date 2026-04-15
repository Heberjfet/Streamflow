-- =============================================
-- StreamFlow - Funciones de Validación
-- Versión: 1.0.0
-- Descripción: Funciones para validar datos y reglas de negocio
-- =============================================

-- Función para validar formato de email
CREATE OR REPLACE FUNCTION fn_validate_email(p_email VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    IF p_email IS NULL OR p_email = '' THEN
        RETURN FALSE;
    END IF;
    -- Validación básica de formato email
    RETURN p_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- Función para validar que un usuario no tenga roles duplicados
CREATE OR REPLACE FUNCTION fn_validate_unique_user_role()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = NEW.user_id AND role_id = NEW.role_id
    ) THEN
        RAISE EXCEPTION 'El usuario ya tiene este rol asignado';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para validar que no se elimine el último admin
CREATE OR REPLACE FUNCTION fn_validate_last_admin()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.role = 'admin' THEN
        IF NOT EXISTS (
            SELECT 1 FROM users
            WHERE role = 'admin' AND id != OLD.id AND is_active = TRUE
        ) THEN
            RAISE EXCEPTION 'No se puede eliminar el último administrador del sistema';
        END IF;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Función para validar slug de categoría
CREATE OR REPLACE FUNCTION fn_validate_category_slug()
RETURNS TRIGGER AS $$
BEGIN
    -- Convertir a minúsculas y reemplazar espacios con guiones
    NEW.slug := LOWER(TRIM(NEW.slug));
    NEW.slug := regexp_replace(NEW.slug, '[^a-z0-9]+', '-', 'g');
    NEW.slug := regexp_replace(NEW.slug, '^-|-$', '', 'g');

    IF NEW.slug = '' OR NEW.slug IS NULL THEN
        RAISE EXCEPTION 'El slug no puede estar vacío';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para validar estado de video
CREATE OR REPLACE FUNCTION fn_validate_video_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- No permitir cambiar de published a processing
    IF OLD.status = 'published' AND NEW.status = 'processing' THEN
        RAISE EXCEPTION 'No se puede volver a processing un video publicado';
    END IF;

    -- No permitir eliminar videos publicados directamente (marcar como deleted)
    IF OLD.status = 'published' AND OLD.is_published = TRUE THEN
        RAISE EXCEPTION 'No se puede eliminar un video publicado. Marcarlo como deleted.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para validar tamaño de archivo
CREATE OR REPLACE FUNCTION fn_validate_file_size()
RETURNS TRIGGER AS $$
BEGIN
    -- Límite de 10GB por video
    IF NEW.file_size > 10737418240 THEN
        RAISE EXCEPTION 'El archivo excede el límite máximo de 10GB';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para generar slug desde título
CREATE OR REPLACE FUNCTION fn_generate_video_slug(p_title VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    v_slug VARCHAR;
BEGIN
    v_slug := LOWER(TRIM(p_title));
    v_slug := regexp_replace(v_slug, '[^a-z0-9]+', '-', 'g');
    v_slug := regexp_replace(v_slug, '^-|-$', '', 'g');
    v_slug := v_slug || '-' || substr(md5(random()::TEXT), 1, 6);
    RETURN v_slug;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de uso
CREATE OR REPLACE FUNCTION fn_get_user_stats(p_user_id UUID)
RETURNS TABLE (
    total_videos INTEGER,
    published_videos INTEGER,
    total_views BIGINT,
    last_activity TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(v.id)::INTEGER as total_videos,
        COUNT(v.id) FILTER (WHERE v.is_published = TRUE)::INTEGER as published_videos,
        COALESCE(SUM(v.view_count), 0)::BIGINT as total_views,
        MAX(v.created_at) as last_activity
    FROM videos v
    WHERE v.uploader_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Función para bloquear IPs con demasiados intentos fallidos
CREATE OR REPLACE FUNCTION fn_check_blocked_ip(p_ip INET, p_max_attempts INTEGER DEFAULT 5)
RETURNS BOOLEAN AS $$
DECLARE
    attempts INTEGER;
BEGIN
    SELECT COUNT(*) INTO attempts
    FROM login_attempts
    WHERE ip_address = p_ip
      AND success = FALSE
      AND created_at > NOW() - INTERVAL '15 minutes';

    RETURN attempts >= p_max_attempts;
END;
$$ LANGUAGE plpgsql;
