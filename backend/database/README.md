# StreamFlow - Base de Datos con Seguridad y Auditoría

Este directorio contiene todos los scripts SQL y documentación para implementar la base de datos de StreamFlow con características avanzadas de seguridad, auditoría y respaldo.

## Estructura de Archivos

```
database/
├── schemas/          # Scripts de creación de tablas
│   ├── 01_create_tables.sql
│   ├── 02_create_audit_table.sql
│   └── 03_create_roles_table.sql
├── functions/        # Funciones y procedimientos almacenados
│   ├── 01_audit_functions.sql
│   └── 02_validation_functions.sql
├── triggers/         # Triggers de auditoría y validación
│   ├── 01_audit_triggers.sql
│   └── 02_validation_triggers.sql
├── security/         # Roles y permisos de PostgreSQL
│   └── 01_create_roles_and_users.sql
├── seeds/            # Datos de prueba
│   └── 01_insert_test_data.sql
├── queries/          # Ejemplos de consultas seguras
│   ├── 01_parameterized_queries_sql.sql
│   └── 02_parameterized_queries_typescript.ts
├── backups/          # Scripts de backup y restauración
│   ├── backup_database.sh
│   └── restore_database.sh
├── migrations/       # Scripts de migración completa
│   └── 00_complete_migration.sql
├── DIAGRAM.md        # Diagrama de base de datos
└── README.md         # Este archivo
```

## Características Implementadas

### 1. Estructura de Base de Datos

#### Tablas Principales
- `users` - Usuarios del sistema con autenticación OAuth
- `categories` - Categorías para clasificar videos
- `videos` - Catálogo de videos con metadata

#### Tablas de Auditoría
- `audit_log` - Bitácora completa de todas las operaciones
- `change_history` - Historial versionado para recuperación de datos

#### Sistema de Roles y Permisos
- `app_roles` - Catálogo de roles de aplicación
- `app_permissions` - Permisos disponibles
- `app_role_permissions` - Relación muchos-a-muchos

### 2. Restricciones de Seguridad Implementadas

#### Campos Obligatorios (NOT NULL)
Todas las tablas tienen campos obligatorios apropiados:
- users: google_id, email, name, role, is_active, created_at
- categories: name, slug, created_at
- videos: title, hls_path, is_processed, is_published, created_at, updated_at

#### Restricciones de Integridad
- **UNIQUE**: Emails, google_id, slugs de categorías
- **CHECK**: 
  - Formatos de email válidos
  - Roles válidos (viewer, editor, admin, superadmin)
  - Slugs en formato correcto (lowercase, números, guiones)
  - Duración y tamaño de archivos positivos
  - Fechas lógicas (updated_at >= created_at)

#### Llaves Foráneas
- videos → categories (ON DELETE SET NULL)
- videos → users (uploaded_by)
- audit_log → users
- change_history → users

### 3. Control de Usuarios, Roles y Permisos

#### Roles de PostgreSQL

##### streamflow_readonly
- **Permisos**: Solo lectura en categories, videos
- **Uso**: Para reportes y consultas

##### streamflow_app
- **Permisos**: CRUD completo en tablas principales
- **Uso**: Usuario principal del backend

##### streamflow_admin
- **Permisos**: Acceso completo a toda la base de datos
- **Uso**: Administración y mantenimiento

##### streamflow_auditor
- **Permisos**: Solo lectura de logs de auditoría
- **Uso**: Auditoría y compliance

#### Usuarios Creados
- `streamflow_app_user` - Para la aplicación
- `streamflow_admin_user` - Para administración
- `streamflow_readonly_user` - Para reportes
- `streamflow_auditor_user` - Para auditoría

### 4. Sistema de Auditoría (Bitácora)

La tabla `audit_log` registra automáticamente:
- **Usuario que realiza la acción**: user_id, user_email, user_role
- **Fecha y hora**: operation_timestamp
- **Tipo de operación**: INSERT, UPDATE, DELETE
- **Tabla afectada**: table_name
- **Datos antiguos y nuevos**: old_data, new_data (JSONB)
- **Campos modificados**: changed_fields (array)
- **Mensajes críticos**: is_critical, critical_message
- **IP y User-Agent**: Para trazabilidad completa

### 5. Validación de Datos

#### Triggers BEFORE INSERT/UPDATE
- `validate_user_data()` - Valida formato de email, roles, etc.
- `validate_video_data()` - Valida títulos, rutas HLS, duraciones
- `validate_category_data()` - Valida nombres y slugs

#### Triggers BEFORE DELETE
- `prevent_critical_delete()` - Previene:
  - Eliminar el último superadmin
  - Eliminar categorías con videos asociados
  - Eliminar videos publicados sin confirmación

### 6. Notificación de Cambios Críticos

Sistema de notificaciones usando PostgreSQL LISTEN/NOTIFY:
- Cambios de rol de usuarios
- Activación/desactivación de usuarios
- Publicación/despublicación de videos
- Eliminación de categorías

### 7. Historial de Cambios

La tabla `change_history` mantiene:
- Snapshot completo de cada versión del registro
- Número de versión incremental
- Usuario que realizó el cambio
- Razón del cambio (opcional)
- Permite recuperación de datos antiguos

## Instalación

### Opción 1: Migración Completa (Recomendado)

```bash
# 1. Asegúrate de que PostgreSQL esté corriendo
docker compose up -d

# 2. Ejecuta el script de migración completa
cd backend/database/migrations
psql -h localhost -p 5433 -U postgres -d postgres -f 00_complete_migration.sql

# 3. (Opcional) Inserta datos de prueba
cd ../seeds
psql -h localhost -p 5433 -U postgres -d postgres -f 01_insert_test_data.sql
```

### Opción 2: Instalación Manual (Paso a Paso)

```bash
# 1. Tablas principales
psql -h localhost -p 5433 -U postgres -d postgres -f schemas/01_create_tables.sql

# 2. Tablas de auditoría
psql -h localhost -p 5433 -U postgres -d postgres -f schemas/02_create_audit_table.sql

# 3. Tablas de roles
psql -h localhost -p 5433 -U postgres -d postgres -f schemas/03_create_roles_table.sql

# 4. Funciones de auditoría
psql -h localhost -p 5433 -U postgres -d postgres -f functions/01_audit_functions.sql

# 5. Funciones de validación
psql -h localhost -p 5433 -U postgres -d postgres -f functions/02_validation_functions.sql

# 6. Triggers de auditoría
psql -h localhost -p 5433 -U postgres -d postgres -f triggers/01_audit_triggers.sql

# 7. Triggers de validación
psql -h localhost -p 5433 -U postgres -d postgres -f triggers/02_validation_triggers.sql

# 8. Roles y usuarios
psql -h localhost -p 5433 -U postgres -d postgres -f security/01_create_roles_and_users.sql
```

## Uso

### Consultas Seguras Parametrizadas

Ver ejemplos completos en:
- SQL: `queries/01_parameterized_queries_sql.sql`
- TypeScript: `queries/02_parameterized_queries_typescript.ts`

#### Ejemplo SQL:
```sql
PREPARE get_user_by_email (VARCHAR) AS
    SELECT * FROM users WHERE email = $1;

EXECUTE get_user_by_email('user@example.com');
```

#### Ejemplo TypeScript:
```typescript
const result = await client.queryObject({
  text: "SELECT * FROM users WHERE email = $1",
  args: [email]
});
```

### Establecer Contexto de Usuario para Auditoría

```typescript
// En transacciones, establece el contexto del usuario
await transaction.queryObject({
  text: `
    SELECT 
      set_config('app.current_user_id', $1, true),
      set_config('app.current_user_email', $2, true),
      set_config('app.current_user_role', $3, true)
  `,
  args: [userId, userEmail, userRole]
});

// Ahora cualquier operación registrará el usuario en audit_log
await transaction.queryObject({
  text: "UPDATE videos SET title = $1 WHERE id = $2",
  args: [newTitle, videoId]
});
```

### Consultar Logs de Auditoría

```sql
-- Ver todas las operaciones críticas del último mes
SELECT 
    operation_type, table_name, user_email,
    operation_timestamp, critical_message
FROM audit_log
WHERE is_critical = TRUE
AND operation_timestamp >= NOW() - INTERVAL '1 month'
ORDER BY operation_timestamp DESC;

-- Ver historial de un video específico
SELECT 
    version_number, change_type, changed_at,
    data_snapshot->>'title' as title,
    data_snapshot->>'is_published' as published
FROM change_history
WHERE table_name = 'videos'
AND record_id = 'uuid-del-video'
ORDER BY version_number DESC;
```

### Recuperar Datos Antiguos

```sql
-- Obtener versión anterior de un registro
SELECT data_snapshot
FROM change_history
WHERE table_name = 'videos'
AND record_id = 'uuid-del-video'
AND version_number = 2;  -- Versión específica

-- O la última versión antes de cierta fecha
SELECT data_snapshot
FROM change_history
WHERE table_name = 'videos'
AND record_id = 'uuid-del-video'
AND changed_at < '2024-01-01'
ORDER BY version_number DESC
LIMIT 1;
```

## Backup y Restauración

### Crear Backup

```bash
cd backend/database/backups
./backup_database.sh
```

Esto genera:
- `streamflow_backup_YYYYMMDD_HHMMSS.sql.gz` - Backup completo
- `streamflow_data_only_YYYYMMDD_HHMMSS.sql.gz` - Solo datos
- `streamflow_schema_only_YYYYMMDD_HHMMSS.sql.gz` - Solo esquema

Los backups antiguos (>7 días) se eliminan automáticamente.

### Restaurar Backup

```bash
cd backend/database/backups
./restore_database.sh ./streamflow_backup_20240101_120000.sql.gz
```

**ADVERTENCIA**: La restauración elimina TODOS los datos actuales. Requiere confirmación explícita.

## Verificación de Implementación

### 1. Verificar Tablas Creadas

```sql
-- Listar todas las tablas
\dt

-- Debería mostrar:
-- users, categories, videos, audit_log, change_history,
-- app_roles, app_permissions, app_role_permissions
```

### 2. Verificar Triggers

```sql
-- Ver triggers de una tabla
SELECT tgname, tgtype, tgenabled 
FROM pg_trigger 
WHERE tgrelid = 'videos'::regclass;
```

### 3. Verificar Funciones

```sql
-- Listar funciones creadas
\df
```

### 4. Verificar Roles

```sql
-- Ver roles de PostgreSQL
\du
```

### 5. Probar Auditoría

```sql
-- Insertar un registro de prueba
INSERT INTO categories (name, slug, description)
VALUES ('Test', 'test', 'Categoría de prueba');

-- Verificar que se registró en audit_log
SELECT * FROM audit_log WHERE table_name = 'categories' ORDER BY id DESC LIMIT 1;

-- Verificar que se creó versión en change_history
SELECT * FROM change_history WHERE table_name = 'categories' ORDER BY id DESC LIMIT 1;
```

## Seguridad

### Mejores Prácticas

1. **Cambiar Contraseñas**: Las contraseñas en `security/01_create_roles_and_users.sql` son de ejemplo. Cámbialas en producción.

2. **Usar Conexión SSL**: En producción, configura PostgreSQL para requerir SSL.

3. **Principio de Mínimo Privilegio**: Usa el rol apropiado:
   - `streamflow_app_user` para la aplicación
   - `streamflow_readonly_user` solo para reportes
   - `streamflow_auditor_user` solo para auditoría

4. **Nunca Concatenar SQL**: Siempre usa consultas parametrizadas (ver ejemplos en `queries/`).

5. **Monitorear Logs**: Revisa periódicamente `audit_log` para detectar actividades sospechosas.

6. **Backups Regulares**: Configura backups automáticos diarios.

### Passwords por Defecto (CAMBIAR EN PRODUCCIÓN)

```
streamflow_app_user:       change_this_password_in_production
streamflow_admin_user:     change_this_admin_password
streamflow_readonly_user:  change_this_readonly_password
streamflow_auditor_user:   change_this_auditor_password
```

## Diagrama ER

Ver diagrama completo en `DIAGRAM.md` que incluye:
- Diagrama entidad-relación con Mermaid
- Diagrama de flujo de auditoría
- Lista de índices
- Lista de restricciones
- Lista de triggers

## Troubleshooting

### Error: "relation already exists"

Si ya tienes tablas creadas, puedes eliminarlas:

```sql
DROP TABLE IF EXISTS audit_log, change_history, videos, users, categories CASCADE;
```

O usar el script completo que incluye `IF EXISTS`.

### Error: "permission denied"

Asegúrate de conectarte con un usuario que tenga permisos de creación:

```bash
psql -h localhost -p 5433 -U postgres -d postgres
```

### Los triggers no se ejecutan

Verifica que las funciones existan primero:

```sql
\df audit_trigger_function
```

### Auditoría no registra el usuario

Establece las variables de sesión antes de las operaciones:

```sql
SET LOCAL app.current_user_id = 'uuid-del-usuario';
SET LOCAL app.current_user_email = 'email@usuario.com';
SET LOCAL app.current_user_role = 'admin';
```

## Evidencias para PDF (Tarea)

Para generar el PDF de tu tarea, toma capturas de pantalla de:

1. **Diagrama**: Renderiza `DIAGRAM.md` en GitHub o un visor de Markdown
2. **Scripts de creación**: Archivos en `schemas/`, `functions/`, `triggers/`
3. **Scripts de auditoría**: Archivos en `triggers/01_audit_triggers.sql`
4. **Scripts de seguridad**: Archivo en `security/01_create_roles_and_users.sql`
5. **Scripts de datos**: Archivo en `seeds/01_insert_test_data.sql`
6. **Consultas seguras**: Archivos en `queries/`
7. **Scripts de backup**: Archivos en `backups/`
8. **Ejecución exitosa**: 
   ```bash
   psql -h localhost -p 5433 -U postgres -d postgres -f migrations/00_complete_migration.sql
   ```
9. **Verificación de tablas**: `\dt` en psql
10. **Datos insertados**: `SELECT * FROM audit_log LIMIT 5;`

## Licencia

MIT - Ver archivo LICENSE en la raíz del proyecto.

## Contribuir

Este proyecto es parte de StreamFlow. Ver el README principal en la raíz del repositorio.
