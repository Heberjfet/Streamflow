# StreamFlow - Base de Datos

Sistema completo de gestión de base de datos PostgreSQL para StreamFlow.

## Estructura

```
database/
├── migrations/           # Esquemas de tablas
│   ├── 01_create_tables.sql
│   ├── 02_create_audit_tables.sql
│   └── 03_create_roles.sql
├── functions/            # Funciones PL/pgSQL
│   ├── 01_audit_functions.sql
│   └── 02_validation_functions.sql
├── triggers/             # Triggers de base de datos
│   ├── 01_audit_triggers.sql
│   └── 02_validation_triggers.sql
├── queries/              # Queries predefinidas
│   ├── 01_parameterized_queries.sql
│   └── 02_parameterized_queries_typescript.ts
├── seeds/                # Datos iniciales
│   └── 01_insert_test_data.sql
├── backups/              # Scripts de backup/restore
│   ├── backup_database.sh
│   └── restore_database.sh
└── migrate.sql           # Migración principal
```

## Migración Rápida

```bash
# Conectarse al contenedor de postgres
docker exec -it streamflow_postgres psql -U streamflow -d streamflow

# Ejecutar migración
\i /database/migrate.sql
```

## Backup Manual

```bash
# Ejecutar dentro del contenedor
docker exec -it streamflow_postgres /database/backups/backup_database.sh

# O desde el host
docker exec -it streamflow_postgres pg_dump -U streamflow streamflow > backup.sql
```

## Restore

```bash
# Restaurar desde backup
docker exec -it streamflow_postgres /database/backups/restore_database.sh streamflow_backup_20240115_120000.sql.gz
```

## Tablas Principales

| Tabla | Descripción |
|-------|-------------|
| `users` | Usuarios del sistema con roles |
| `videos` | Contenido de video |
| `categories` | Categorías de videos |
| `audit_log` | Registro de auditoría |
| `user_sessions` | Sesiones activas |
| `login_attempts` | Intentos de login |
| `roles` | Definición de roles |
| `permissions` | Permisos del sistema |
| `user_roles` | Relación usuarios-roles |
| `role_permissions` | Relación roles-permisos |

## Roles del Sistema

| Rol | Descripción |
|-----|-------------|
| `viewer` | Solo lectura de contenido |
| `uploader` | Puede subir videos |
| `admin` | Acceso total al sistema |

## Funciones Principales

- `fn_audit_log()` - Registra cambios en tablas
- `fn_update_timestamp()` - Actualiza timestamp automáticamente
- `fn_check_user_permission()` - Verifica permisos
- `fn_validate_*` - Validaciones de negocio
- `fn_get_*` - Queries predefinidas

## Triggers Automáticos

- Auditoría de INSERT/UPDATE/DELETE en tablas principales
- Validación de email
- Validación de estado de videos
- Prevención de eliminación de último admin
- Generación automática de slugs
