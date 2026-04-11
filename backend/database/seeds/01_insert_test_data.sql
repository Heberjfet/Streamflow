-- ============================================================================
-- StreamFlow - Datos de Prueba (Seeds)
-- Archivo: 01_insert_test_data.sql
-- Descripción: Inserción de datos de prueba para desarrollo y testing
-- ============================================================================

-- IMPORTANTE: Estos datos son solo para desarrollo/testing
-- NO ejecutar en producción

-- ============================================================================
-- CATEGORÍAS
-- ============================================================================

INSERT INTO categories (name, slug, description) VALUES
('Sci-Fi', 'sci-fi', 'Ciencia ficción y futuros distópicos'),
('Fantasy', 'fantasy', 'Mundos fantásticos y magia'),
('Horror', 'horror', 'Terror psicológico y sobrenatural'),
('Drama', 'drama', 'Historias emotivas y profundas'),
('Comedy', 'comedy', 'Comedia y sátira')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- USUARIOS DE PRUEBA
-- ============================================================================

-- Superadmin de prueba
INSERT INTO users (google_id, email, name, role, avatar_url, is_active) VALUES
('google_superadmin_001', 'admin@streamflow.local', 'Super Admin', 'superadmin', 'https://i.pravatar.cc/150?u=admin', TRUE)
ON CONFLICT (google_id) DO NOTHING;

-- Admin de prueba
INSERT INTO users (google_id, email, name, role, avatar_url, is_active) VALUES
('google_admin_001', 'manager@streamflow.local', 'Content Manager', 'admin', 'https://i.pravatar.cc/150?u=manager', TRUE)
ON CONFLICT (google_id) DO NOTHING;

-- Editor de prueba
INSERT INTO users (google_id, email, name, role, avatar_url, is_active) VALUES
('google_editor_001', 'editor@streamflow.local', 'John Editor', 'editor', 'https://i.pravatar.cc/150?u=editor', TRUE),
('google_editor_002', 'maria@streamflow.local', 'Maria Rodriguez', 'editor', 'https://i.pravatar.cc/150?u=maria', TRUE)
ON CONFLICT (google_id) DO NOTHING;

-- Viewers de prueba
INSERT INTO users (google_id, email, name, role, avatar_url, is_active) VALUES
('google_viewer_001', 'viewer1@streamflow.local', 'Alice Viewer', 'viewer', 'https://i.pravatar.cc/150?u=alice', TRUE),
('google_viewer_002', 'viewer2@streamflow.local', 'Bob Viewer', 'viewer', 'https://i.pravatar.cc/150?u=bob', TRUE),
('google_viewer_003', 'viewer3@streamflow.local', 'Charlie Viewer', 'viewer', 'https://i.pravatar.cc/150?u=charlie', TRUE)
ON CONFLICT (google_id) DO NOTHING;

-- Usuario inactivo de prueba
INSERT INTO users (google_id, email, name, role, avatar_url, is_active) VALUES
('google_inactive_001', 'inactive@streamflow.local', 'Inactive User', 'viewer', 'https://i.pravatar.cc/150?u=inactive', FALSE)
ON CONFLICT (google_id) DO NOTHING;

-- ============================================================================
-- VIDEOS DE PRUEBA
-- ============================================================================

-- Obtener IDs de categorías y usuarios para las relaciones
DO $$
DECLARE
    v_scifi_id UUID;
    v_horror_id UUID;
    v_fantasy_id UUID;
    v_drama_id UUID;
    v_comedy_id UUID;
    v_uploader_id UUID;
BEGIN
    -- Obtener IDs de categorías
    SELECT id INTO v_scifi_id FROM categories WHERE slug = 'sci-fi';
    SELECT id INTO v_horror_id FROM categories WHERE slug = 'horror';
    SELECT id INTO v_fantasy_id FROM categories WHERE slug = 'fantasy';
    SELECT id INTO v_drama_id FROM categories WHERE slug = 'drama';
    SELECT id INTO v_comedy_id FROM categories WHERE slug = 'comedy';
    
    -- Obtener ID del uploader (admin)
    SELECT id INTO v_uploader_id FROM users WHERE email = 'admin@streamflow.local';
    
    -- Videos publicados y procesados
    INSERT INTO videos (
        title, 
        description, 
        category_id, 
        hls_path, 
        poster_path, 
        duration, 
        file_size, 
        is_processed, 
        is_published,
        uploaded_by
    ) VALUES
    (
        'The Last Algorithm',
        'En un futuro donde la IA controla toda la sociedad, un programador descubre un algoritmo que podría liberarnos o destruirnos.',
        v_scifi_id,
        'production-vod/the-last-algorithm/master.m3u8',
        'thumbnails/the-last-algorithm.jpg',
        847, -- 14 minutos 7 segundos
        524288000, -- ~500MB
        TRUE,
        TRUE,
        v_uploader_id
    ),
    (
        'Digital Ghosts',
        'Una serie de eventos paranormales en un data center revela que las almas pueden quedar atrapadas en servidores.',
        v_horror_id,
        'production-vod/digital-ghosts/master.m3u8',
        'thumbnails/digital-ghosts.jpg',
        623,
        450000000,
        TRUE,
        TRUE,
        v_uploader_id
    ),
    (
        'The Rendering',
        'Un artista 3D descubre que sus creaciones digitales están cobrando vida en una dimensión paralela.',
        v_fantasy_id,
        'production-vod/the-rendering/master.m3u8',
        'thumbnails/the-rendering.jpg',
        955,
        680000000,
        TRUE,
        TRUE,
        v_uploader_id
    ),
    (
        'Syntax Error',
        'La historia de un desarrollador que pierde su trabajo por un bug, pero descubre que el error salvó millones de vidas.',
        v_drama_id,
        'production-vod/syntax-error/master.m3u8',
        'thumbnails/syntax-error.jpg',
        1205,
        890000000,
        TRUE,
        TRUE,
        v_uploader_id
    ),
    (
        'Stack Overflow',
        'Comedia sobre un equipo de desarrollo que literalmente queda atrapado en un loop infinito.',
        v_comedy_id,
        'production-vod/stack-overflow/master.m3u8',
        'thumbnails/stack-overflow.jpg',
        715,
        520000000,
        TRUE,
        TRUE,
        v_uploader_id
    ),
    
    -- Video procesado pero no publicado
    (
        'Beta Test',
        'Contenido experimental aún no listo para publicación.',
        v_scifi_id,
        'production-vod/beta-test/master.m3u8',
        'thumbnails/beta-test.jpg',
        450,
        320000000,
        TRUE,
        FALSE,
        v_uploader_id
    ),
    
    -- Video en proceso (no procesado ni publicado)
    (
        'Work in Progress',
        'Video recién subido, aún en proceso de transcodificación.',
        v_horror_id,
        'raw-uploads/work-in-progress.mp4',
        NULL,
        NULL,
        1200000000,
        FALSE,
        FALSE,
        v_uploader_id
    )
    ON CONFLICT DO NOTHING;
    
END $$;

-- ============================================================================
-- MENSAJE DE CONFIRMACIÓN
-- ============================================================================

DO $$
DECLARE
    v_category_count INTEGER;
    v_user_count INTEGER;
    v_video_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_category_count FROM categories;
    SELECT COUNT(*) INTO v_user_count FROM users;
    SELECT COUNT(*) INTO v_video_count FROM videos;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Datos de prueba insertados exitosamente';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Categorías: %', v_category_count;
    RAISE NOTICE 'Usuarios: %', v_user_count;
    RAISE NOTICE 'Videos: %', v_video_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Credenciales de prueba:';
    RAISE NOTICE '  Superadmin: admin@streamflow.local';
    RAISE NOTICE '  Admin: manager@streamflow.local';
    RAISE NOTICE '  Editor: editor@streamflow.local';
    RAISE NOTICE '  Viewer: viewer1@streamflow.local';
    RAISE NOTICE '========================================';
END $$;
