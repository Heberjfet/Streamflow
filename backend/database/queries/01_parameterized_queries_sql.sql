-- ============================================================================
-- StreamFlow - Ejemplos de Consultas Parametrizadas en SQL
-- Archivo: 01_parameterized_queries_examples.sql
-- Descripción: Ejemplos de consultas seguras usando parámetros
-- ============================================================================

-- IMPORTANTE: Las consultas parametrizadas previenen inyección SQL
-- NUNCA concatenar strings directamente en las queries

-- ============================================================================
-- CONSULTAS DE USUARIOS
-- ============================================================================

-- Ejemplo 1: Buscar usuario por email (SEGURO)
-- Usar: PREPARE get_user_by_email AS ...
PREPARE get_user_by_email (VARCHAR) AS
    SELECT id, email, name, role, is_active, created_at
    FROM users
    WHERE email = $1
    AND is_active = TRUE;

-- Ejecutar:
-- EXECUTE get_user_by_email('admin@streamflow.local');

-- Ejemplo 2: Buscar usuarios por rol (SEGURO)
PREPARE get_users_by_role (VARCHAR) AS
    SELECT id, email, name, role, created_at, last_login
    FROM users
    WHERE role = $1
    AND is_active = TRUE
    ORDER BY created_at DESC;

-- Ejecutar:
-- EXECUTE get_users_by_role('admin');

-- Ejemplo 3: Actualizar última fecha de login (SEGURO)
PREPARE update_last_login (UUID) AS
    UPDATE users
    SET last_login = NOW()
    WHERE id = $1
    RETURNING id, email, last_login;

-- Ejecutar:
-- EXECUTE update_last_login('uuid-del-usuario');

-- Ejemplo 4: Crear nuevo usuario (SEGURO)
PREPARE create_user (VARCHAR, VARCHAR, VARCHAR, VARCHAR) AS
    INSERT INTO users (google_id, email, name, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, email, name, role, created_at;

-- Ejecutar:
-- EXECUTE create_user('google_123', 'nuevo@ejemplo.com', 'Nuevo Usuario', 'viewer');

-- ============================================================================
-- CONSULTAS DE VIDEOS
-- ============================================================================

-- Ejemplo 5: Buscar videos por categoría (SEGURO)
PREPARE get_videos_by_category (UUID, INTEGER, INTEGER) AS
    SELECT v.id, v.title, v.description, v.duration, v.poster_path,
           c.name as category_name, c.slug as category_slug
    FROM videos v
    LEFT JOIN categories c ON v.category_id = c.id
    WHERE v.category_id = $1
    AND v.is_published = TRUE
    ORDER BY v.created_at DESC
    LIMIT $2 OFFSET $3;

-- Ejecutar:
-- EXECUTE get_videos_by_category('uuid-categoria', 10, 0);

-- Ejemplo 6: Buscar videos por título (búsqueda parcial) (SEGURO)
PREPARE search_videos_by_title (VARCHAR) AS
    SELECT id, title, description, poster_path, duration, is_published
    FROM videos
    WHERE title ILIKE '%' || $1 || '%'
    AND is_published = TRUE
    ORDER BY created_at DESC
    LIMIT 20;

-- Ejecutar:
-- EXECUTE search_videos_by_title('Algorithm');

-- Ejemplo 7: Obtener video por ID con información completa (SEGURO)
PREPARE get_video_details (UUID) AS
    SELECT 
        v.id, v.title, v.description, v.hls_path, v.poster_path,
        v.duration, v.file_size, v.is_processed, v.is_published,
        v.created_at, v.updated_at,
        c.id as category_id, c.name as category_name, c.slug as category_slug,
        u.id as uploader_id, u.name as uploader_name, u.email as uploader_email
    FROM videos v
    LEFT JOIN categories c ON v.category_id = c.id
    LEFT JOIN users u ON v.uploaded_by = u.id
    WHERE v.id = $1;

-- Ejecutar:
-- EXECUTE get_video_details('uuid-del-video');

-- Ejemplo 8: Actualizar información de video (SEGURO)
PREPARE update_video_info (VARCHAR, TEXT, UUID, UUID) AS
    UPDATE videos
    SET title = $1,
        description = $2,
        category_id = $3,
        updated_at = NOW()
    WHERE id = $4
    RETURNING id, title, description, updated_at;

-- Ejecutar:
-- EXECUTE update_video_info('Nuevo Título', 'Nueva descripción', 'uuid-categoria', 'uuid-video');

-- Ejemplo 9: Marcar video como procesado (SEGURO)
PREPARE mark_video_processed (TEXT, INTEGER, BIGINT, UUID) AS
    UPDATE videos
    SET hls_path = $1,
        duration = $2,
        file_size = $3,
        is_processed = TRUE,
        updated_at = NOW()
    WHERE id = $4
    RETURNING id, title, is_processed, hls_path;

-- Ejecutar:
-- EXECUTE mark_video_processed('production-vod/video/master.m3u8', 845, 500000000, 'uuid-video');

-- ============================================================================
-- CONSULTAS DE CATEGORÍAS
-- ============================================================================

-- Ejemplo 10: Obtener todas las categorías con contador de videos (SEGURO)
PREPARE get_categories_with_count AS
    SELECT 
        c.id, c.name, c.slug, c.description,
        COUNT(v.id) as video_count
    FROM categories c
    LEFT JOIN videos v ON c.id = v.category_id AND v.is_published = TRUE
    GROUP BY c.id, c.name, c.slug, c.description
    ORDER BY c.name;

-- Ejecutar:
-- EXECUTE get_categories_with_count;

-- Ejemplo 11: Crear nueva categoría (SEGURO)
PREPARE create_category (VARCHAR, VARCHAR, TEXT) AS
    INSERT INTO categories (name, slug, description)
    VALUES ($1, $2, $3)
    RETURNING id, name, slug, created_at;

-- Ejecutar:
-- EXECUTE create_category('Action', 'action', 'Videos de acción y aventura');

-- ============================================================================
-- CONSULTAS DE AUDITORÍA
-- ============================================================================

-- Ejemplo 12: Consultar logs de auditoría por tabla (SEGURO)
PREPARE get_audit_logs_by_table (VARCHAR, INTEGER) AS
    SELECT 
        id, operation_type, table_name, record_id,
        user_email, operation_timestamp, is_critical, critical_message
    FROM audit_log
    WHERE table_name = $1
    ORDER BY operation_timestamp DESC
    LIMIT $2;

-- Ejecutar:
-- EXECUTE get_audit_logs_by_table('videos', 50);

-- Ejemplo 13: Consultar cambios críticos (SEGURO)
PREPARE get_critical_changes (TIMESTAMP, TIMESTAMP) AS
    SELECT 
        id, operation_type, table_name, record_id,
        user_email, user_role, operation_timestamp,
        critical_message, new_data
    FROM audit_log
    WHERE is_critical = TRUE
    AND operation_timestamp BETWEEN $1 AND $2
    ORDER BY operation_timestamp DESC;

-- Ejecutar:
-- EXECUTE get_critical_changes('2024-01-01', '2024-12-31');

-- Ejemplo 14: Obtener historial de un registro específico (SEGURO)
PREPARE get_record_history (VARCHAR, UUID) AS
    SELECT 
        id, change_type, changed_at, version_number,
        data_snapshot, change_reason
    FROM change_history
    WHERE table_name = $1
    AND record_id = $2
    ORDER BY version_number DESC;

-- Ejecutar:
-- EXECUTE get_record_history('videos', 'uuid-del-video');

-- ============================================================================
-- CONSULTAS COMPLEJAS CON MÚLTIPLES PARÁMETROS
-- ============================================================================

-- Ejemplo 15: Búsqueda avanzada de videos con filtros (SEGURO)
PREPARE advanced_video_search (VARCHAR, UUID, BOOLEAN, INTEGER, INTEGER) AS
    SELECT 
        v.id, v.title, v.description, v.poster_path,
        v.duration, v.created_at,
        c.name as category_name
    FROM videos v
    LEFT JOIN categories c ON v.category_id = c.id
    WHERE ($1 IS NULL OR v.title ILIKE '%' || $1 || '%')
    AND ($2 IS NULL OR v.category_id = $2)
    AND ($3 IS NULL OR v.is_published = $3)
    ORDER BY v.created_at DESC
    LIMIT $4 OFFSET $5;

-- Ejecutar (todos los filtros):
-- EXECUTE advanced_video_search('Algorithm', 'uuid-categoria', TRUE, 10, 0);

-- Ejecutar (solo búsqueda por título):
-- EXECUTE advanced_video_search('Algorithm', NULL, NULL, 10, 0);

-- Ejemplo 16: Estadísticas de usuario con parámetros de fecha (SEGURO)
PREPARE get_user_stats (UUID, TIMESTAMP, TIMESTAMP) AS
    SELECT 
        u.id, u.email, u.name, u.role,
        COUNT(DISTINCT v.id) as videos_uploaded,
        COUNT(DISTINCT al.id) as actions_performed
    FROM users u
    LEFT JOIN videos v ON u.id = v.uploaded_by 
        AND v.created_at BETWEEN $2 AND $3
    LEFT JOIN audit_log al ON u.id = al.user_id 
        AND al.operation_timestamp BETWEEN $2 AND $3
    WHERE u.id = $1
    GROUP BY u.id, u.email, u.name, u.role;

-- Ejecutar:
-- EXECUTE get_user_stats('uuid-usuario', '2024-01-01', '2024-12-31');

-- ============================================================================
-- NOTA IMPORTANTE SOBRE SEGURIDAD
-- ============================================================================

/*
EJEMPLOS DE CONSULTAS INSEGURAS (NUNCA HACER ESTO):

-- ❌ MAL - Vulnerable a SQL Injection
SELECT * FROM users WHERE email = 'input_del_usuario';

-- ❌ MAL - Concatenación de strings
SELECT * FROM users WHERE email = '' OR '1'='1';

-- ✅ BIEN - Usando parámetros
PREPARE get_user AS SELECT * FROM users WHERE email = $1;
EXECUTE get_user('input_del_usuario');

SIEMPRE usar parámetros ($1, $2, etc.) para valores dinámicos.
NUNCA concatenar strings directamente en las consultas SQL.
*/

-- ============================================================================
-- LIMPIAR PREPARED STATEMENTS (opcional)
-- ============================================================================

-- Para liberar memoria, se pueden eliminar los prepared statements:
-- DEALLOCATE get_user_by_email;
-- DEALLOCATE get_users_by_role;
-- ... etc
