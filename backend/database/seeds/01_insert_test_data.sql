-- =============================================
-- StreamFlow - Datos de Prueba (Seeds)
-- Versión: 1.0.0
-- Descripción: Datos iniciales para desarrollo y pruebas
-- =============================================

-- Categorías del sistema
INSERT INTO categories (name, slug, description) VALUES
    ('Sci-Fi', 'sci-fi', 'Ciencia ficción y futuros distópicos'),
    ('Fantasy', 'fantasy', 'Mundos mágicos y criaturas legendarias'),
    ('Horror', 'horror', 'Historias oscuras y perturbadoras'),
    ('Drama', 'drama', 'Narrativas emocionales y profundas'),
    ('Comedy', 'comedy', 'Contenido humorístico y ligero'),
    ('Thriller', 'thriller', 'Suspenso y tensión narrativa'),
    ('Documentary', 'documentary', 'Contenido factual y educativo'),
    ('Animation', 'animation', 'Arte animado y creativo')
ON CONFLICT (name) DO NOTHING;

-- Usuarios de prueba
INSERT INTO users (google_id, email, name, avatar_url, role) VALUES
    ('admin_google_001', 'admin@streamflow.local', 'Admin Principal', NULL, 'admin'),
    ('uploader_google_001', 'uploader@streamflow.local', 'Creador de Contenido', NULL, 'uploader'),
    ('viewer_google_001', 'viewer@streamflow.local', 'Espectador Demo', NULL, 'viewer')
ON CONFLICT (google_id) DO NOTHING;

-- Asignar roles a usuarios
INSERT INTO user_roles (user_id, role_id, assigned_by)
SELECT u.id, r.id, (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
FROM users u, roles r
WHERE u.email = 'admin@streamflow.local' AND r.name = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id, assigned_by)
SELECT u.id, r.id, (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
FROM users u, roles r
WHERE u.email = 'uploader@streamflow.local' AND r.name = 'uploader'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id, assigned_by)
SELECT u.id, r.id, (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
FROM users u, roles r
WHERE u.email = 'viewer@streamflow.local' AND r.name = 'viewer'
ON CONFLICT DO NOTHING;

-- Videos de prueba
INSERT INTO videos (title, description, category_id, uploader_id, hls_path, poster_path, duration, file_size, status, is_processed, is_published, view_count) VALUES
    (
        'Neon Genesis',
        'En un futuro distópico donde la humanidad lucha por sobrevivir, un joven piloto descubre su destino.',
        (SELECT id FROM categories WHERE slug = 'sci-fi'),
        (SELECT id FROM users WHERE email = 'uploader@streamflow.local'),
        'production-vod/neon-genesis/playlist.m3u8',
        'thumbnails/neon-genesis.jpg',
        720,
        1073741824,
        'published',
        TRUE,
        TRUE,
        1250
    ),
    (
        'El Último Unicornio',
        'Una aventura mágica para salvar a las últimas criaturas legendarias de un mundo moderno.',
        (SELECT id FROM categories WHERE slug = 'fantasy'),
        (SELECT id FROM users WHERE email = 'uploader@streamflow.local'),
        'production-vod/ultimo-unicornio/playlist.m3u8',
        'thumbnails/ultimo-unicornio.jpg',
        840,
        2147483648,
        'published',
        TRUE,
        TRUE,
        892
    ),
    (
        'Sombras en la Oscuridad',
        'Un grupo de investigadores descubre que lo que encontraron en las ruinas no debería haber sido despertado.',
        (SELECT id FROM categories WHERE slug = 'horror'),
        (SELECT id FROM users WHERE email = 'uploader@streamflow.local'),
        'production-vod/sombras-oscuridad/playlist.m3u8',
        'thumbnails/sombras-oscuridad.jpg',
        660,
        1610612736,
        'published',
        TRUE,
        TRUE,
        2103
    ),
    (
        'Fragmentos de Vida',
        'Historias entrelazadas de personas comunes enfrentando momentos extraordinarios en su vida diaria.',
        (SELECT id FROM categories WHERE slug = 'drama'),
        (SELECT id FROM users WHERE email = 'uploader@streamflow.local'),
        'production-vod/fragmentos-vida/playlist.m3u8',
        'thumbnails/fragmentos-vida.jpg',
        900,
        1879048192,
        'published',
        TRUE,
        TRUE,
        567
    ),
    (
        'Caos Controlado',
        'Las aventuras de un grupo de comediantes intentando hacer un show en el apocalipsis.',
        (SELECT id FROM categories WHERE slug = 'comedy'),
        (SELECT id FROM users WHERE email = 'uploader@streamflow.local'),
        'production-vod/caos-controlado/playlist.m3u8',
        'thumbnails/caos-controlado.jpg',
        600,
        1342177280,
        'published',
        TRUE,
        TRUE,
        3401
    ),
    (
        'En Proceso',
        'Este video aún está siendo procesado y no está disponible.',
        (SELECT id FROM categories WHERE slug = 'sci-fi'),
        (SELECT id FROM users WHERE email = 'uploader@streamflow.local'),
        'production-vod/proceso/playlist.m3u8',
        'thumbnails/proceso.jpg',
        NULL,
        524288000,
        'processing',
        FALSE,
        FALSE,
        0
    )
ON CONFLICT DO NOTHING;

-- Registrar en auditoría que se insertaron seeds
DO $$
DECLARE
    admin_id UUID;
BEGIN
    SELECT id INTO admin_id FROM users WHERE role = 'admin' LIMIT 1;

    INSERT INTO audit_log (table_name, action, record_id, new_data, user_id, user_email)
    SELECT 'categories', 'INSERT', id, row_to_json(c), admin_id, 'system@streamflow.local'
    FROM categories WHERE description LIKE '%StreamFlow%';

    INSERT INTO audit_log (table_name, action, record_id, new_data, user_id, user_email)
    SELECT 'users', 'INSERT', id, row_to_json(u), admin_id, 'system@streamflow.local'
    FROM users WHERE email LIKE '%@streamflow.local';

    INSERT INTO audit_log (table_name, action, record_id, new_data, user_id, user_email)
    SELECT 'videos', 'INSERT', id, row_to_json(v), admin_id, 'system@streamflow.local'
    FROM videos WHERE title IN ('Neon Genesis', 'El Último Unicornio', 'Sombras en la Oscuridad');
END $$;
