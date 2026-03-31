-- ============================================================================
-- StreamFlow - Funciones de Auditoría
-- Archivo: 01_audit_functions.sql
-- Descripción: Funciones para triggers de auditoría automática
-- ============================================================================

-- ============================================================================
-- FUNCIÓN: audit_trigger_function
-- Descripción: Función genérica para registrar operaciones en audit_log
-- ============================================================================
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB;
    v_new_data JSONB;
    v_changed_fields TEXT[];
    v_user_id UUID;
    v_user_email VARCHAR(255);
    v_user_role VARCHAR(50);
    v_is_critical BOOLEAN := FALSE;
    v_critical_message TEXT;
    v_record_id UUID;
BEGIN
    -- Intentar obtener información del usuario desde la sesión
    -- (esto requiere que la aplicación establezca estos valores)
    BEGIN
        v_user_id := current_setting('app.current_user_id', TRUE)::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;
    
    BEGIN
        v_user_email := current_setting('app.current_user_email', TRUE);
    EXCEPTION WHEN OTHERS THEN
        v_user_email := NULL;
    END;
    
    BEGIN
        v_user_role := current_setting('app.current_user_role', TRUE);
    EXCEPTION WHEN OTHERS THEN
        v_user_role := NULL;
    END;
    
    -- Determinar datos antiguos y nuevos según el tipo de operación
    IF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := NULL;
        v_record_id := (v_old_data->>'id')::UUID;
        
    ELSIF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        v_record_id := (v_new_data->>'id')::UUID;
        
        -- Detectar campos que cambiaron
        SELECT array_agg(key)
        INTO v_changed_fields
        FROM jsonb_each(v_new_data)
        WHERE v_old_data->key IS DISTINCT FROM v_new_data->key;
        
    ELSIF (TG_OP = 'INSERT') THEN
        v_old_data := NULL;
        v_new_data := to_jsonb(NEW);
        v_record_id := (v_new_data->>'id')::UUID;
        
    END IF;
    
    -- Detectar operaciones críticas
    IF (TG_TABLE_NAME = 'users') THEN
        IF (TG_OP = 'DELETE') THEN
            v_is_critical := TRUE;
            v_critical_message := format('Usuario eliminado: %s (%s)', 
                v_old_data->>'name', v_old_data->>'email');
                
        ELSIF (TG_OP = 'UPDATE' AND 'role' = ANY(v_changed_fields)) THEN
            v_is_critical := TRUE;
            v_critical_message := format('Cambio de rol de usuario: %s -> %s para %s', 
                v_old_data->>'role', v_new_data->>'role', v_new_data->>'email');
                
        ELSIF (TG_OP = 'UPDATE' AND 'is_active' = ANY(v_changed_fields)) THEN
            v_is_critical := TRUE;
            v_critical_message := format('Cambio de estado activo: %s -> %s para %s',
                v_old_data->>'is_active', v_new_data->>'is_active', v_new_data->>'email');
        END IF;
        
    ELSIF (TG_TABLE_NAME = 'videos') THEN
        IF (TG_OP = 'DELETE') THEN
            v_is_critical := TRUE;
            v_critical_message := format('Video eliminado: %s (ID: %s)', 
                v_old_data->>'title', v_old_data->>'id');
                
        ELSIF (TG_OP = 'UPDATE' AND 'is_published' = ANY(v_changed_fields)) THEN
            v_is_critical := TRUE;
            v_critical_message := format('Cambio de publicación de video: %s -> %s para "%s"',
                v_old_data->>'is_published', v_new_data->>'is_published', v_new_data->>'title');
        END IF;
        
    ELSIF (TG_TABLE_NAME = 'categories') THEN
        IF (TG_OP = 'DELETE') THEN
            v_is_critical := TRUE;
            v_critical_message := format('Categoría eliminada: %s', v_old_data->>'name');
        END IF;
    END IF;
    
    -- Insertar registro en audit_log
    INSERT INTO audit_log (
        operation_type,
        table_name,
        record_id,
        user_id,
        user_email,
        user_role,
        old_data,
        new_data,
        changed_fields,
        is_critical,
        critical_message,
        ip_address
    ) VALUES (
        TG_OP,
        TG_TABLE_NAME,
        v_record_id,
        v_user_id,
        v_user_email,
        v_user_role,
        v_old_data,
        v_new_data,
        v_changed_fields,
        v_is_critical,
        v_critical_message,
        inet_client_addr()
    );
    
    -- Retornar el registro apropiado
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION audit_trigger_function() IS 'Función automática de auditoría para registrar todas las operaciones DML';

-- ============================================================================
-- FUNCIÓN: change_history_trigger_function
-- Descripción: Función para mantener historial de versiones de registros
-- ============================================================================
CREATE OR REPLACE FUNCTION change_history_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_change_type VARCHAR(20);
    v_version_number INTEGER;
    v_data_snapshot JSONB;
    v_record_id UUID;
BEGIN
    -- Obtener información del usuario
    BEGIN
        v_user_id := current_setting('app.current_user_id', TRUE)::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;
    
    -- Determinar tipo de cambio y datos
    IF (TG_OP = 'DELETE') THEN
        v_change_type := 'DELETED';
        v_data_snapshot := to_jsonb(OLD);
        v_record_id := (v_data_snapshot->>'id')::UUID;
        
    ELSIF (TG_OP = 'UPDATE') THEN
        v_change_type := 'UPDATED';
        v_data_snapshot := to_jsonb(NEW);
        v_record_id := (v_data_snapshot->>'id')::UUID;
        
    ELSIF (TG_OP = 'INSERT') THEN
        v_change_type := 'CREATED';
        v_data_snapshot := to_jsonb(NEW);
        v_record_id := (v_data_snapshot->>'id')::UUID;
    END IF;
    
    -- Obtener el siguiente número de versión
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_version_number
    FROM change_history
    WHERE table_name = TG_TABLE_NAME
    AND record_id = v_record_id;
    
    -- Insertar en historial de cambios
    INSERT INTO change_history (
        table_name,
        record_id,
        changed_by,
        change_type,
        data_snapshot,
        version_number
    ) VALUES (
        TG_TABLE_NAME,
        v_record_id,
        v_user_id,
        v_change_type,
        v_data_snapshot,
        v_version_number
    );
    
    -- Retornar el registro apropiado
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION change_history_trigger_function() IS 'Función para mantener historial versionado de cambios en registros';

-- ============================================================================
-- FUNCIÓN: update_updated_at_column
-- Descripción: Actualiza automáticamente el campo updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Actualiza automáticamente la columna updated_at en cada UPDATE';
