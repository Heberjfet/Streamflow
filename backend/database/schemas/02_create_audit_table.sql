-- ============================================================================
-- StreamFlow - Sistema de Auditoría
-- Archivo: 02_create_audit_table.sql
-- Descripción: Tabla de auditoría (bitácora) para registrar todas las operaciones
-- ============================================================================

-- ============================================================================
-- TABLA: audit_log
-- Descripción: Bitácora de todas las operaciones (INSERT, UPDATE, DELETE)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    
    -- Información de la operación
    operation_type VARCHAR(10) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    
    -- Información del usuario
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    user_role VARCHAR(50),
    
    -- Datos de cambios
    old_data JSONB,
    new_data JSONB,
    changed_fields TEXT[],
    
    -- Metadata temporal
    operation_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    
    -- Clasificación de criticidad
    is_critical BOOLEAN NOT NULL DEFAULT FALSE,
    critical_message TEXT,
    
    -- Información adicional
    query_executed TEXT,
    error_message TEXT,
    
    -- Restricciones de integridad
    CONSTRAINT chk_audit_operation_type CHECK (operation_type IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT', 'TRUNCATE')),
    CONSTRAINT chk_audit_table_name_not_empty CHECK (LENGTH(TRIM(table_name)) > 0),
    CONSTRAINT chk_audit_critical_has_message CHECK (
        (is_critical = FALSE) OR 
        (is_critical = TRUE AND critical_message IS NOT NULL)
    )
);

-- Índices para optimización de consultas
CREATE INDEX IF NOT EXISTS idx_audit_log_operation_type ON audit_log(operation_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(operation_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_is_critical ON audit_log(is_critical) WHERE is_critical = TRUE;
CREATE INDEX IF NOT EXISTS idx_audit_log_record_id ON audit_log(record_id);

-- Índices GIN para búsquedas en JSONB
CREATE INDEX IF NOT EXISTS idx_audit_log_old_data ON audit_log USING GIN (old_data);
CREATE INDEX IF NOT EXISTS idx_audit_log_new_data ON audit_log USING GIN (new_data);

-- Comentarios para documentación
COMMENT ON TABLE audit_log IS 'Bitácora completa de todas las operaciones realizadas en la base de datos';
COMMENT ON COLUMN audit_log.operation_type IS 'Tipo de operación: INSERT, UPDATE, DELETE, SELECT, TRUNCATE';
COMMENT ON COLUMN audit_log.table_name IS 'Nombre de la tabla afectada por la operación';
COMMENT ON COLUMN audit_log.record_id IS 'ID del registro afectado (si aplica)';
COMMENT ON COLUMN audit_log.user_id IS 'ID del usuario que realizó la operación';
COMMENT ON COLUMN audit_log.old_data IS 'Datos antiguos antes del cambio (formato JSON)';
COMMENT ON COLUMN audit_log.new_data IS 'Datos nuevos después del cambio (formato JSON)';
COMMENT ON COLUMN audit_log.changed_fields IS 'Array de nombres de campos que cambiaron';
COMMENT ON COLUMN audit_log.is_critical IS 'Indica si la operación es crítica y requiere atención';
COMMENT ON COLUMN audit_log.critical_message IS 'Mensaje explicativo para operaciones críticas';
COMMENT ON COLUMN audit_log.ip_address IS 'Dirección IP del cliente que realizó la operación';
COMMENT ON COLUMN audit_log.user_agent IS 'User-Agent del cliente (browser/app)';

-- ============================================================================
-- TABLA: change_history
-- Descripción: Historial de cambios importantes para recuperación de datos
-- ============================================================================
CREATE TABLE IF NOT EXISTS change_history (
    id BIGSERIAL PRIMARY KEY,
    
    -- Información del registro
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    
    -- Información del cambio
    changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    change_type VARCHAR(20) NOT NULL,
    
    -- Snapshot completo del registro
    data_snapshot JSONB NOT NULL,
    
    -- Información adicional
    change_reason TEXT,
    version_number INTEGER NOT NULL DEFAULT 1,
    
    -- Restricciones
    CONSTRAINT chk_change_history_table_name CHECK (LENGTH(TRIM(table_name)) > 0),
    CONSTRAINT chk_change_history_change_type CHECK (change_type IN ('CREATED', 'UPDATED', 'DELETED', 'RESTORED')),
    CONSTRAINT chk_change_history_version_positive CHECK (version_number > 0)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_change_history_table_record ON change_history(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_change_history_changed_at ON change_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_change_history_changed_by ON change_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_change_history_version ON change_history(table_name, record_id, version_number);

-- Índice GIN para búsquedas en snapshot
CREATE INDEX IF NOT EXISTS idx_change_history_data_snapshot ON change_history USING GIN (data_snapshot);

-- Comentarios para documentación
COMMENT ON TABLE change_history IS 'Historial de versiones de registros para recuperación de datos';
COMMENT ON COLUMN change_history.data_snapshot IS 'Snapshot completo del registro en formato JSON';
COMMENT ON COLUMN change_history.version_number IS 'Número de versión incremental del registro';
COMMENT ON COLUMN change_history.change_reason IS 'Razón o descripción del cambio realizado';
