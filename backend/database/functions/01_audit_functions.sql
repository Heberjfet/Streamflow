-- =============================================
-- StreamFlow - Funciones de Auditoría
-- Versión: 1.0.0
-- Descripción: Funciones para registrar cambios en la base de datos
-- =============================================

-- Función para registrar en audit_log
CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    audit_row audit_log;
    current_user_id UUID;
    current_user_email VARCHAR(255);
BEGIN
    -- Obtener información del usuario actual si está disponible
    BEGIN
        SELECT id::UUID, email INTO current_user_id, current_user_email
        FROM users
        WHERE id = current_setting('app.current_user_id', true)::UUID;
    EXCEPTION WHEN OTHERS THEN
        current_user_id := NULL;
        current_user_email := NULL;
    END;

    audit_row := ROW(
        gen_random_uuid(),
        TG_TABLE_NAME,
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) END,
        current_user_id,
        current_user_email,
        NULLIF(current_setting('app.current_ip', true), '')::INET,
        current_setting('app.current_user_agent', true),
        NOW()
    );

    INSERT INTO audit_log VALUES (audit_row.*);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para incrementar contador de vistas
CREATE OR REPLACE FUNCTION fn_increment_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE videos SET view_count = view_count + 1 WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para buscar en audit_log
CREATE OR REPLACE FUNCTION fn_get_audit_log(
    p_table_name VARCHAR DEFAULT NULL,
    p_action VARCHAR DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_start_date TIMESTAMP DEFAULT NULL,
    p_end_date TIMESTAMP DEFAULT NULL,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    table_name VARCHAR,
    action VARCHAR,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    user_id UUID,
    user_email VARCHAR,
    ip_address INET,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT a.id, a.table_name, a.action, a.record_id, a.old_data, a.new_data,
           a.user_id, a.user_email, a.ip_address, a.created_at
    FROM audit_log a
    WHERE (p_table_name IS NULL OR a.table_name = p_table_name)
      AND (p_action IS NULL OR a.action = p_action)
      AND (p_user_id IS NULL OR a.user_id = p_user_id)
      AND (p_start_date IS NULL OR a.created_at >= p_start_date)
      AND (p_end_date IS NULL OR a.created_at <= p_end_date)
    ORDER BY a.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar logs antiguos
CREATE OR REPLACE FUNCTION fn_cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_log WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar permisos de usuario
CREATE OR REPLACE FUNCTION fn_check_user_permission(
    p_user_id UUID,
    p_resource VARCHAR,
    p_action VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        JOIN role_permissions rp ON rp.role_id = r.id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE ur.user_id = p_user_id
          AND p.resource = p_resource
          AND p.action = p_action
          AND r.is_active = TRUE
    ) INTO has_permission;

    RETURN COALESCE(has_permission, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Función para registrar intento de login
CREATE OR REPLACE FUNCTION fn_record_login_attempt(
    p_email VARCHAR,
    p_ip INET,
    p_success BOOLEAN,
    p_failure_reason VARCHAR DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO login_attempts (email, ip_address, success, failure_reason)
    VALUES (p_email, p_ip, p_success, p_failure_reason);
END;
$$ LANGUAGE plpgsql;
