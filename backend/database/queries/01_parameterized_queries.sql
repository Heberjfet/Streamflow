-- =============================================
-- StreamFlow - Queries Parametrizadas
-- Versión: 1.0.0
-- Descripción: Queries comunes para uso en la aplicación
-- =============================================

-- Obtener videos con información de categoría y usuario
CREATE OR REPLACE FUNCTION fn_get_videos(
    p_category_slug VARCHAR DEFAULT NULL,
    p_status VARCHAR DEFAULT 'published',
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    description TEXT,
    hls_path TEXT,
    poster_path TEXT,
    duration INTEGER,
    file_size BIGINT,
    is_processed BOOLEAN,
    is_published BOOLEAN,
    view_count INTEGER,
    created_at TIMESTAMP,
    category_name VARCHAR,
    category_slug VARCHAR,
    uploader_name VARCHAR,
    uploader_avatar TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.id, v.title, v.description, v.hls_path, v.poster_path,
        v.duration, v.file_size, v.is_processed, v.is_published,
        v.view_count, v.created_at,
        c.name as category_name, c.slug as category_slug,
        u.name as uploader_name, u.avatar_url as uploader_avatar
    FROM videos v
    LEFT JOIN categories c ON c.id = v.category_id
    LEFT JOIN users u ON u.id = v.uploader_id
    WHERE (p_category_slug IS NULL OR c.slug = p_category_slug)
      AND (p_status IS NULL OR v.status = p_status)
      AND v.is_published = TRUE
    ORDER BY v.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Obtener un video por ID con detalles completos
CREATE OR REPLACE FUNCTION fn_get_video_by_id(p_video_id UUID)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    description TEXT,
    hls_path TEXT,
    poster_path TEXT,
    duration INTEGER,
    file_size BIGINT,
    status VARCHAR,
    is_processed BOOLEAN,
    is_published BOOLEAN,
    view_count INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    category_id UUID,
    category_name VARCHAR,
    category_slug VARCHAR,
    uploader_id UUID,
    uploader_name VARCHAR,
    uploader_avatar TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.id, v.title, v.description, v.hls_path, v.poster_path,
        v.duration, v.file_size, v.status, v.is_processed, v.is_published,
        v.view_count, v.created_at, v.updated_at,
        c.id as category_id, c.name as category_name, c.slug as category_slug,
        u.id as uploader_id, u.name as uploader_name, u.avatar_url as uploader_avatar
    FROM videos v
    LEFT JOIN categories c ON c.id = v.category_id
    LEFT JOIN users u ON u.id = v.uploader_id
    WHERE v.id = p_video_id;
END;
$$ LANGUAGE plpgsql;

-- Buscar videos por título
CREATE OR REPLACE FUNCTION fn_search_videos(p_query VARCHAR, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    description TEXT,
    poster_path TEXT,
    duration INTEGER,
    category_name VARCHAR,
    view_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.id, v.title, v.description, v.poster_path,
        v.duration, c.name as category_name, v.view_count
    FROM videos v
    LEFT JOIN categories c ON c.id = v.category_id
    WHERE v.is_published = TRUE
      AND (v.title ILIKE '%' || p_query || '%'
           OR v.description ILIKE '%' || p_query || '%')
    ORDER BY v.view_count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Obtener videos relacionados
CREATE OR REPLACE FUNCTION fn_get_related_videos(p_video_id UUID, p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    poster_path TEXT,
    duration INTEGER,
    view_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.id, v.title, v.poster_path, v.duration, v.view_count
    FROM videos v
    WHERE v.id != p_video_id
      AND v.is_published = TRUE
      AND v.category_id = (SELECT category_id FROM videos WHERE id = p_video_id)
    ORDER BY v.view_count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Obtener estadísticas del dashboard
CREATE OR REPLACE FUNCTION fn_get_dashboard_stats()
RETURNS TABLE (
    total_videos INTEGER,
    published_videos INTEGER,
    processing_videos INTEGER,
    total_users INTEGER,
    active_users INTEGER,
    total_views BIGINT,
    categories_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total_videos,
        COUNT(*) FILTER (WHERE v.is_published = TRUE)::INTEGER as published_videos,
        COUNT(*) FILTER (WHERE v.status = 'processing')::INTEGER as processing_videos,
        (SELECT COUNT(*) FROM users WHERE is_active = TRUE)::INTEGER as total_users,
        (SELECT COUNT(*) FROM users WHERE last_login > NOW() - INTERVAL '7 days')::INTEGER as active_users,
        COALESCE(SUM(v.view_count), 0)::BIGINT as total_views,
        (SELECT COUNT(*) FROM categories WHERE is_active = TRUE)::INTEGER as categories_count
    FROM videos v;
END;
$$ LANGUAGE plpgsql;

-- Videos por categoría
CREATE OR REPLACE FUNCTION fn_get_videos_by_category(p_category_slug VARCHAR, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    poster_path TEXT,
    duration INTEGER,
    view_count INTEGER,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.id, v.title, v.poster_path, v.duration, v.view_count, v.created_at
    FROM videos v
    JOIN categories c ON c.id = v.category_id
    WHERE c.slug = p_category_slug
      AND v.is_published = TRUE
    ORDER BY v.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Registrar vista de video
CREATE OR REPLACE FUNCTION fn_register_video_view(p_video_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE videos SET view_count = view_count + 1 WHERE id = p_video_id;

    INSERT INTO audit_log (table_name, action, record_id, new_data)
    SELECT 'videos', 'UPDATE', p_video_id, json_build_object('view_count', view_count + 1)
    FROM videos WHERE id = p_video_id;
END;
$$ LANGUAGE plpgsql;

-- Obtener historial de auditoría de un usuario
CREATE OR REPLACE FUNCTION fn_get_user_activity(p_user_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
    id UUID,
    table_name VARCHAR,
    action VARCHAR,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id, a.table_name, a.action, a.record_id, a.old_data, a.new_data, a.created_at
    FROM audit_log a
    WHERE a.user_id = p_user_id
    ORDER BY a.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
