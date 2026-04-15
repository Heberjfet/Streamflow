-- =============================================
-- StreamFlow - Migración Completa
-- Versión: 1.0.0
-- Descripción: Ejecuta todas las migraciones en orden
-- =============================================

-- Este archivo es el punto de entrada para todas las migraciones
-- Ejecuta los archivos en el siguiente orden:

-- 1. Tablas principales
\i migrations/01_create_tables.sql

-- 2. Tablas de auditoría
\i migrations/02_create_audit_tables.sql

-- 3. Sistema de roles
\i migrations/03_create_roles.sql

-- 4. Funciones de auditoría
\i functions/01_audit_functions.sql

-- 5. Funciones de validación
\i functions/02_validation_functions.sql

-- 6. Triggers de auditoría
\i triggers/01_audit_triggers.sql

-- 7. Triggers de validación
\i triggers/02_validation_triggers.sql

-- 8. Queries parametrizadas
\i queries/01_parameterized_queries.sql

-- 9. Datos iniciales (seeds)
\i seeds/01_insert_test_data.sql

-- =============================================
-- Verificación de instalación
-- =============================================

SELECT 'StreamFlow Database Setup Complete' AS status;
SELECT 'Tables: ' || COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
SELECT 'Functions: ' || COUNT(*) FROM pg_functions WHERE pronamespace = 'public'::regnamespace;
SELECT 'Triggers: ' || COUNT(*) FROM pg_trigger WHERE tgnamespace = 'public'::regnamespace;
