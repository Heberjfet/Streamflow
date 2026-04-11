# Actividad: Diseño e Implementación de Base de Datos con Seguridad y Auditoría

## Descripción del Proyecto

**StreamFlow** es una plataforma de streaming de video autohospedada que permite a los usuarios administrar y visualizar contenido multimedia. El sistema requiere una base de datos robusta que garantice la integridad, seguridad y trazabilidad de todas las operaciones realizadas.

Este documento presenta la implementación completa de la base de datos PostgreSQL para StreamFlow, incluyendo mecanismos avanzados de seguridad, control de acceso y auditoría.

---

## 1. Estructura de la Base de Datos

### 1.1 Diagrama Entidad-Relación

El sistema está compuesto por tres tablas principales:

**[PLACEHOLDER: Captura del diagrama ER desde DIAGRAM.md]**

### 1.2 Descripción de las Tablas

#### Tabla `users`
Almacena la información de los usuarios del sistema.

**Campos principales:**
- `id`: Identificador único (UUID)
- `username`: Nombre de usuario (único, obligatorio)
- `email`: Correo electrónico (único, obligatorio, con validación de formato)
- `password_hash`: Contraseña encriptada
- `role`: Rol del usuario en la aplicación
- `is_active`: Estado del usuario
- `created_at`, `updated_at`: Timestamps de auditoría

#### Tabla `categories`
Gestiona las categorías de contenido.

**Campos principales:**
- `id`: Identificador único (UUID)
- `name`: Nombre de la categoría (único, obligatorio)
- `slug`: Identificador URL-friendly (único)
- `description`: Descripción de la categoría
- `created_at`, `updated_at`: Timestamps de auditoría

#### Tabla `videos`
Almacena la información de los videos.

**Campos principales:**
- `id`: Identificador único (UUID)
- `title`: Título del video (obligatorio)
- `description`: Descripción del contenido
- `category_id`: Referencia a la categoría (FK)
- `hls_path`: Ruta al archivo HLS (obligatorio)
- `thumbnail_path`: Ruta a la miniatura
- `duration`: Duración en segundos
- `file_size`: Tamaño del archivo en bytes
- `is_published`: Estado de publicación
- `published_at`: Fecha de publicación
- `created_at`, `updated_at`: Timestamps de auditoría

---

## 2. Creación de Catálogos y Tablas

### Script de Creación

El archivo `backend/database/schemas/01_create_tables.sql` contiene la definición completa de las tablas:

```sql
[CÓDIGO COMPLETO DEL ARCHIVO 01_create_tables.sql]
```

**Explicación:**
- Se utiliza el tipo `UUID` para identificadores únicos generados automáticamente
- Los campos `created_at` tienen valor por defecto `CURRENT_TIMESTAMP`
- Los campos `updated_at` se actualizan automáticamente mediante triggers

**[PLACEHOLDER: Captura de la ejecución del script de creación de tablas]**

---

## 2.1 Aplicación de Llaves Foráneas

### Implementación de Relaciones

La tabla `videos` tiene una relación con `categories`:

```sql
-- Llave foránea en videos
CONSTRAINT fk_videos_category
    FOREIGN KEY (category_id) 
    REFERENCES categories(id) 
    ON DELETE RESTRICT
```

**Explicación:**
- `ON DELETE RESTRICT`: Previene la eliminación de categorías que tienen videos asociados
- Garantiza la integridad referencial
- Evita registros huérfanos en la base de datos

**[PLACEHOLDER: Captura mostrando la restricción FK con \d videos]**

---

## 2.2 Aplicación de Restricciones de Seguridad

### 2.2.1 Campos Obligatorios (NOT NULL)

Todos los campos críticos están marcados como obligatorios:

```sql
-- En tabla users
username VARCHAR(50) NOT NULL,
email VARCHAR(100) NOT NULL,
password_hash VARCHAR(255) NOT NULL,
role VARCHAR(20) NOT NULL DEFAULT 'viewer',

-- En tabla categories
name VARCHAR(100) NOT NULL,

-- En tabla videos
title VARCHAR(200) NOT NULL,
hls_path VARCHAR(500) NOT NULL,
```

**Explicación:**
- Previene la inserción de datos incompletos
- Asegura que campos esenciales siempre tengan valor
- Mejora la calidad de los datos

### 2.2.2 Restricciones de Integridad

#### UNIQUE - Evitar Duplicados

```sql
-- En users
CONSTRAINT uk_users_username UNIQUE (username),
CONSTRAINT uk_users_email UNIQUE (email),

-- En categories
CONSTRAINT uk_categories_name UNIQUE (name),
CONSTRAINT uk_categories_slug UNIQUE (slug),
```

#### CHECK - Validar Valores

```sql
-- En users
CONSTRAINT chk_users_email_format 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
CONSTRAINT chk_users_role 
    CHECK (role IN ('viewer', 'editor', 'admin', 'superadmin')),

-- En videos
CONSTRAINT chk_videos_duration 
    CHECK (duration > 0),
CONSTRAINT chk_videos_file_size 
    CHECK (file_size > 0),
CONSTRAINT chk_videos_published_logic 
    CHECK (
        (is_published = true AND published_at IS NOT NULL) OR
        (is_published = false)
    ),
```

**Explicación:**
- `CHECK` con regex valida formato de email
- `CHECK` con IN valida roles permitidos
- `CHECK` con lógica condicional asegura consistencia entre campos relacionados

**[PLACEHOLDER: Captura mostrando las constraints con \d+ users]**

---

## 3. Control de Usuarios, Roles y Permisos

### 3.1 Roles a Nivel de PostgreSQL

Se implementaron 4 roles con diferentes niveles de acceso:

```sql
[CÓDIGO COMPLETO DEL ARCHIVO security/01_create_roles_and_users.sql]
```

#### Roles Creados

1. **streamflow_readonly**: Solo lectura (SELECT)
2. **streamflow_app**: Operaciones CRUD completas
3. **streamflow_admin**: Administración de esquema
4. **streamflow_auditor**: Acceso exclusivo a logs de auditoría

#### Usuarios Asignados

- `sf_reader` → streamflow_readonly
- `sf_application` → streamflow_app
- `sf_admin` → streamflow_admin  
- `sf_auditor` → streamflow_auditor

**[PLACEHOLDER: Captura mostrando roles con \du]**

**[PLACEHOLDER: Captura mostrando permisos con \dp]**

### 3.2 Roles a Nivel de Aplicación

Se crearon tablas para gestionar permisos granulares:

```sql
[CÓDIGO DEL ARCHIVO schemas/03_create_roles_table.sql]
```

#### Tabla `app_roles`
Define roles de aplicación: viewer, editor, admin, superadmin

#### Tabla `app_permissions`
Define permisos por recurso y acción (ej: users:create, videos:update)

#### Tabla `app_role_permissions`
Relaciona roles con sus permisos (many-to-many)

#### Funciones Helper

```sql
-- Verificar si un usuario tiene un permiso específico
user_has_permission(user_id UUID, permission_name VARCHAR)

-- Obtener todos los permisos de un usuario
get_user_permissions(user_id UUID)
```

**[PLACEHOLDER: Captura mostrando app_roles, app_permissions con datos]**

---

## 4. Tabla de Auditoría (Bitácora)

### 4.1 Estructura de la Tabla `audit_log`

```sql
[CÓDIGO DEL ARCHIVO schemas/02_create_audit_table.sql - tabla audit_log]
```

#### Campos de Auditoría

- **user_id**: Usuario que realiza la acción
- **timestamp**: Fecha y hora de la operación (generada automáticamente)
- **operation**: Tipo de operación (INSERT, UPDATE, DELETE)
- **table_name**: Nombre de la tabla afectada
- **old_data**: Datos antes del cambio (JSONB)
- **new_data**: Datos después del cambio (JSONB)
- **changed_fields**: Array de campos modificados
- **is_critical**: Marcador para operaciones críticas
- **ip_address**: IP del usuario
- **user_agent**: Agente del navegador

**Explicación:**
- Uso de JSONB para almacenar datos complejos de forma eficiente
- Índices en `user_id`, `table_name` y `timestamp` para consultas rápidas
- Campo `is_critical` permite filtrar operaciones importantes

### 4.2 Función de Auditoría

```sql
[CÓDIGO COMPLETO de audit_trigger_function() desde functions/01_audit_functions.sql]
```

**Explicación:**
- La función se ejecuta automáticamente con cada INSERT/UPDATE/DELETE
- Captura OLD y NEW data según el tipo de operación
- Identifica automáticamente operaciones críticas (cambios de rol, publicación de videos)
- Calcula campos modificados comparando OLD vs NEW

### 4.3 Triggers de Auditoría

```sql
[CÓDIGO de los triggers desde triggers/01_audit_triggers.sql]
```

**Triggers implementados:**
- `audit_users_changes` en tabla users
- `audit_categories_changes` en tabla categories
- `audit_videos_changes` en tabla videos

**[PLACEHOLDER: Captura mostrando insert/update/delete y registros en audit_log]**

---

## 4.3 Validación de Datos Antes de Insertar o Actualizar

### Funciones de Validación

Se implementaron triggers BEFORE para validar datos antes de ser almacenados:

```sql
[CÓDIGO COMPLETO de validate_user_data() desde functions/02_validation_functions.sql]
```

```sql
[CÓDIGO COMPLETO de validate_video_data() desde functions/02_validation_functions.sql]
```

```sql
[CÓDIGO COMPLETO de validate_category_data() desde functions/02_validation_functions.sql]
```

### Triggers de Validación

```sql
[CÓDIGO de validation triggers desde triggers/02_validation_triggers.sql]
```

**Validaciones implementadas:**

**Para users:**
- Formato de email correcto
- Rol válido
- Previene eliminación del último superadmin

**Para videos:**
- Título no vacío después de trim
- Duración y file_size positivos
- Lógica de publicación consistente

**Para categories:**
- Nombre no vacío
- Slug en formato válido (lowercase, guiones)

**[PLACEHOLDER: Capturas mostrando inserts fallidos por validación - errores]**

---

## 4.4 Notificación de Cambios Críticos

### Sistema NOTIFY/LISTEN de PostgreSQL

```sql
[CÓDIGO de notify_critical_change() desde functions/01_audit_functions.sql]
```

**Eventos que generan notificaciones:**
- Cambios de rol de usuario
- Activación/desactivación de usuarios
- Publicación de nuevos videos

**Implementación:**

```sql
[CÓDIGO de notification triggers desde triggers/01_audit_triggers.sql]
```

**Explicación:**
- PostgreSQL envía notificaciones en tiempo real
- Las aplicaciones pueden suscribirse con `LISTEN critical_changes`
- Útil para actualizar caches, enviar emails, o registrar en sistemas externos

**[PLACEHOLDER: Captura simulando notificación crítica - opcional]**

---

## 4.5 Historial de Cambios

### Tabla `change_history`

Permite la recuperación de datos antiguos mediante versiones:

```sql
[CÓDIGO de change_history desde schemas/02_create_audit_table.sql]
```

### Función de Historial

```sql
[CÓDIGO de change_history_trigger_function() desde functions/01_audit_functions.sql]
```

**Explicación:**
- Mantiene snapshot completo de cada registro en cada cambio
- Incrementa número de versión automáticamente
- Permite recuperar el estado de un registro en cualquier momento

### Triggers de Historial

```sql
[CÓDIGO de history triggers desde triggers/01_audit_triggers.sql]
```

**[PLACEHOLDER: Captura mostrando versiones de un registro en change_history]**

---

## 5. Inserción de Registros

### Datos de Prueba

Se insertaron datos realistas para probar el sistema:

```sql
[CÓDIGO COMPLETO del archivo seeds/01_insert_test_data.sql]
```

**Datos insertados:**
- 5 categorías (Sci-Fi, Fantasy, Horror, Drama, Comedy)
- 8 usuarios con diferentes roles
- 7 videos de ejemplo con metadata completa

**[PLACEHOLDER: Captura mostrando SELECT de las 3 tablas con datos]**

---

## 6. Seguridad y Respaldo

### 6.1 Consultas Seguras y Parametrizadas

#### Ejemplos en SQL

```sql
[EXTRACTOS CLAVE del archivo queries/01_parameterized_queries_sql.sql]
```

**Explicación:**
- Se usa `PREPARE` para crear consultas parametrizadas
- Los parámetros se pasan con `EXECUTE` evitando SQL injection
- Mejora el rendimiento al reutilizar planes de ejecución

#### Ejemplos en TypeScript/Deno

```typescript
[EXTRACTOS CLAVE del archivo queries/02_parameterized_queries_typescript.ts]
```

**Explicación:**
- La librería `postgres` escapa automáticamente los parámetros
- Uso de placeholders `$1, $2, ...` previene inyección SQL
- Separación de lógica y datos mejora la seguridad

**[PLACEHOLDER: Captura ejecutando una consulta parametrizada]**

### 6.2 Backup y Restauración

#### Script de Backup

```bash
[CÓDIGO COMPLETO del archivo backups/backup_database.sh]
```

**Funcionalidades:**
- Backup completo (esquema + datos)
- Backup solo de datos
- Backup solo de esquema
- Compresión automática con gzip
- Limpieza de backups antiguos (>7 días)

#### Script de Restauración

```bash
[CÓDIGO COMPLETO del archivo backups/restore_database.sh]
```

**Funcionalidades:**
- Confirmación antes de restaurar
- Verificación de integridad del archivo
- Logs de restauración

**[PLACEHOLDER: Captura mostrando ejecución del backup y archivo .gz generado]**

---

## Conclusión

Se implementó exitosamente una base de datos PostgreSQL para StreamFlow con:

✅ **Estructura robusta**: 3 tablas principales con constraints completos  
✅ **Integridad referencial**: Llaves foráneas con políticas de eliminación  
✅ **Seguridad multi-nivel**: Roles PostgreSQL + roles de aplicación  
✅ **Auditoría completa**: Registro de todas las operaciones  
✅ **Validación de datos**: Triggers que previenen datos inválidos  
✅ **Notificaciones en tiempo real**: Sistema NOTIFY/LISTEN  
✅ **Recuperación de datos**: Historial versionado de cambios  
✅ **Consultas seguras**: Ejemplos parametrizados en SQL y TypeScript  
✅ **Respaldos automatizados**: Scripts de backup/restore

La implementación cumple con todos los requisitos de seguridad, auditoría e integridad necesarios para un sistema de producción.

---

## Anexo: Ubicación de Archivos

Todos los scripts están organizados en: `/home/jfet/Documentos/StreamFlow/backend/database/`

```
database/
├── schemas/
│   ├── 01_create_tables.sql
│   ├── 02_create_audit_table.sql
│   └── 03_create_roles_table.sql
├── functions/
│   ├── 01_audit_functions.sql
│   └── 02_validation_functions.sql
├── triggers/
│   ├── 01_audit_triggers.sql
│   └── 02_validation_triggers.sql
├── security/
│   └── 01_create_roles_and_users.sql
├── seeds/
│   └── 01_insert_test_data.sql
├── queries/
│   ├── 01_parameterized_queries_sql.sql
│   └── 02_parameterized_queries_typescript.ts
├── backups/
│   ├── backup_database.sh
│   └── restore_database.sh
├── migrations/
│   └── 00_complete_migration.sql
├── DIAGRAM.md
└── README.md
```
