-- ============================================================================
-- StreamFlow - Script de Migración Completo
-- Archivo: 00_complete_migration.sql
-- Descripción: Script maestro que ejecuta todas las migraciones en orden
-- ============================================================================

-- IMPORTANTE: Este script debe ejecutarse en una base de datos nueva o limpia
-- Para ejecutar: psql -h localhost -p 5433 -U postgres -d postgres -f 00_complete_migration.sql

\echo '============================================================================'
\echo ' StreamFlow - Migración Completa de Base de Datos'
\echo '============================================================================'
\echo ''

\echo '[1/8] Creando tablas principales...'
\i ../schemas/01_create_tables.sql

\echo ''
\echo '[2/8] Creando tablas de auditoría...'
\i ../schemas/02_create_audit_table.sql

\echo ''
\echo '[3/8] Creando tablas de roles a nivel aplicación...'
\i ../schemas/03_create_roles_table.sql

\echo ''
\echo '[4/8] Creando funciones de auditoría...'
\i ../functions/01_audit_functions.sql

\echo ''
\echo '[5/8] Creando funciones de validación...'
\i ../functions/02_validation_functions.sql

\echo ''
\echo '[6/8] Creando triggers de auditoría...'
\i ../triggers/01_audit_triggers.sql

\echo ''
\echo '[7/8] Creando triggers de validación...'
\i ../triggers/02_validation_triggers.sql

\echo ''
\echo '[8/8] Creando roles y usuarios de PostgreSQL...'
\i ../security/01_create_roles_and_users.sql

\echo ''
\echo '============================================================================'
\echo ' Migración Completada'
\echo '============================================================================'
\echo ''
\echo 'SIGUIENTE PASO (OPCIONAL):'
\echo 'Para insertar datos de prueba, ejecuta:'
\echo '  psql -h localhost -p 5433 -U postgres -d postgres -f ../seeds/01_insert_test_data.sql'
\echo ''
\echo 'VERIFICACIÓN:'
\echo 'Para verificar que todo se instaló correctamente, ejecuta:'
\echo '  psql -h localhost -p 5433 -U postgres -d postgres -c "\dt"'
\echo ''
