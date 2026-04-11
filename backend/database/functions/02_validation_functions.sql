-- ============================================================================
-- StreamFlow - Funciones de Validación
-- Archivo: 02_validation_functions.sql
-- Descripción: Funciones para validar datos antes de insertar/actualizar
-- ============================================================================

-- ============================================================================
-- FUNCIÓN: validate_video_data
-- Descripción: Valida datos de video antes de INSERT/UPDATE
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_video_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar título no vacío
    IF NEW.title IS NULL OR LENGTH(TRIM(NEW.title)) = 0 THEN
        RAISE EXCEPTION 'El título del video no puede estar vacío';
    END IF;
    
    -- Validar longitud del título
    IF LENGTH(NEW.title) > 255 THEN
        RAISE EXCEPTION 'El título del video no puede exceder 255 caracteres';
    END IF;
    
    -- Validar ruta HLS
    IF NEW.hls_path IS NULL OR LENGTH(TRIM(NEW.hls_path)) = 0 THEN
        RAISE EXCEPTION 'La ruta HLS del video es obligatoria';
    END IF;
    
    -- Validar formato de ruta HLS (debe terminar en .m3u8)
    IF NEW.hls_path !~ '\.m3u8$' THEN
        RAISE EXCEPTION 'La ruta HLS debe terminar en .m3u8';
    END IF;
    
    -- Validar duración si está presente
    IF NEW.duration IS NOT NULL AND NEW.duration <= 0 THEN
        RAISE EXCEPTION 'La duración del video debe ser mayor a 0 segundos';
    END IF;
    
    -- Validar tamaño de archivo si está presente
    IF NEW.file_size IS NOT NULL AND NEW.file_size <= 0 THEN
        RAISE EXCEPTION 'El tamaño del archivo debe ser mayor a 0 bytes';
    END IF;
    
    -- Validar que updated_at no sea anterior a created_at
    IF NEW.updated_at < NEW.created_at THEN
        RAISE EXCEPTION 'La fecha de actualización no puede ser anterior a la fecha de creación';
    END IF;
    
    -- Si el video está publicado, debe estar procesado
    IF NEW.is_published = TRUE AND NEW.is_processed = FALSE THEN
        RAISE EXCEPTION 'No se puede publicar un video que no ha sido procesado';
    END IF;
    
    -- Validar que la categoría existe si se proporciona
    IF NEW.category_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM categories WHERE id = NEW.category_id) THEN
            RAISE EXCEPTION 'La categoría especificada no existe';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_video_data() IS 'Valida datos de videos antes de inserción o actualización';

-- ============================================================================
-- FUNCIÓN: validate_user_data
-- Descripción: Valida datos de usuario antes de INSERT/UPDATE
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_user_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar email no vacío
    IF NEW.email IS NULL OR LENGTH(TRIM(NEW.email)) = 0 THEN
        RAISE EXCEPTION 'El email del usuario no puede estar vacío';
    END IF;
    
    -- Validar formato de email
    IF NEW.email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'El formato del email es inválido: %', NEW.email;
    END IF;
    
    -- Validar nombre no vacío
    IF NEW.name IS NULL OR LENGTH(TRIM(NEW.name)) = 0 THEN
        RAISE EXCEPTION 'El nombre del usuario no puede estar vacío';
    END IF;
    
    -- Validar google_id no vacío
    IF NEW.google_id IS NULL OR LENGTH(TRIM(NEW.google_id)) = 0 THEN
        RAISE EXCEPTION 'El Google ID del usuario no puede estar vacío';
    END IF;
    
    -- Validar rol válido
    IF NEW.role NOT IN ('viewer', 'editor', 'admin', 'superadmin') THEN
        RAISE EXCEPTION 'Rol inválido: %. Los roles válidos son: viewer, editor, admin, superadmin', NEW.role;
    END IF;
    
    -- Prevenir que el último superadmin sea degradado o desactivado
    IF (TG_OP = 'UPDATE') THEN
        IF OLD.role = 'superadmin' AND (NEW.role != 'superadmin' OR NEW.is_active = FALSE) THEN
            IF (SELECT COUNT(*) FROM users WHERE role = 'superadmin' AND is_active = TRUE) <= 1 THEN
                RAISE EXCEPTION 'No se puede degradar o desactivar al último superadmin del sistema';
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_user_data() IS 'Valida datos de usuarios antes de inserción o actualización';

-- ============================================================================
-- FUNCIÓN: validate_category_data
-- Descripción: Valida datos de categoría antes de INSERT/UPDATE
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_category_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar nombre no vacío
    IF NEW.name IS NULL OR LENGTH(TRIM(NEW.name)) = 0 THEN
        RAISE EXCEPTION 'El nombre de la categoría no puede estar vacío';
    END IF;
    
    -- Validar slug no vacío
    IF NEW.slug IS NULL OR LENGTH(TRIM(NEW.slug)) = 0 THEN
        RAISE EXCEPTION 'El slug de la categoría no puede estar vacío';
    END IF;
    
    -- Validar formato de slug (solo minúsculas, números y guiones)
    IF NEW.slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' THEN
        RAISE EXCEPTION 'El slug solo puede contener letras minúsculas, números y guiones: %', NEW.slug;
    END IF;
    
    -- Convertir nombre a slug si no se proporcionó
    IF TG_OP = 'INSERT' AND (NEW.slug IS NULL OR NEW.slug = '') THEN
        NEW.slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_category_data() IS 'Valida datos de categorías antes de inserción o actualización';

-- ============================================================================
-- FUNCIÓN: prevent_critical_delete
-- Descripción: Previene eliminación de registros críticos
-- ============================================================================
CREATE OR REPLACE FUNCTION prevent_critical_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevenir eliminación del último superadmin
    IF TG_TABLE_NAME = 'users' THEN
        IF OLD.role = 'superadmin' THEN
            IF (SELECT COUNT(*) FROM users WHERE role = 'superadmin' AND is_active = TRUE) <= 1 THEN
                RAISE EXCEPTION 'No se puede eliminar al último superadmin del sistema';
            END IF;
        END IF;
    END IF;
    
    -- Prevenir eliminación de categorías con videos asociados
    IF TG_TABLE_NAME = 'categories' THEN
        IF EXISTS (SELECT 1 FROM videos WHERE category_id = OLD.id) THEN
            RAISE EXCEPTION 'No se puede eliminar una categoría que tiene videos asociados. Categoría: %', OLD.name;
        END IF;
    END IF;
    
    -- Prevenir eliminación de videos publicados sin confirmación
    IF TG_TABLE_NAME = 'videos' THEN
        IF OLD.is_published = TRUE THEN
            -- Verificar si se estableció una variable de sesión para confirmar
            BEGIN
                IF current_setting('app.confirm_delete_published', TRUE) != 'true' THEN
                    RAISE EXCEPTION 'No se puede eliminar un video publicado sin confirmación explícita';
                END IF;
            EXCEPTION WHEN OTHERS THEN
                RAISE EXCEPTION 'No se puede eliminar un video publicado sin confirmación explícita';
            END;
        END IF;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION prevent_critical_delete() IS 'Previene la eliminación de registros críticos del sistema';

-- ============================================================================
-- FUNCIÓN: notify_critical_change
-- Descripción: Envía notificaciones para cambios críticos
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_critical_change()
RETURNS TRIGGER AS $$
DECLARE
    v_payload JSON;
    v_notification_channel TEXT := 'critical_changes';
BEGIN
    -- Construir payload de notificación
    v_payload := json_build_object(
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'timestamp', NOW(),
        'user_id', current_setting('app.current_user_id', TRUE),
        'record_id', CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        'message', CASE
            WHEN TG_TABLE_NAME = 'users' AND TG_OP = 'UPDATE' THEN
                format('Cambio en usuario: %s', NEW.email)
            WHEN TG_TABLE_NAME = 'videos' AND TG_OP = 'DELETE' THEN
                format('Video eliminado: %s', OLD.title)
            WHEN TG_TABLE_NAME = 'videos' AND TG_OP = 'UPDATE' AND OLD.is_published != NEW.is_published THEN
                format('Cambio de publicación: %s', NEW.title)
            ELSE
                format('Cambio crítico en %s', TG_TABLE_NAME)
        END
    );
    
    -- Enviar notificación
    PERFORM pg_notify(v_notification_channel, v_payload::text);
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION notify_critical_change() IS 'Envía notificaciones LISTEN/NOTIFY para cambios críticos';
