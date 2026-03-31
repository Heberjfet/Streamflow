# StreamFlow - Diagrama de Base de Datos

## Diagrama ER (Entity-Relationship)

```mermaid
erDiagram
    users ||--o{ videos : "uploads"
    users ||--o{ audit_log : "performs"
    users ||--o{ change_history : "changes"
    categories ||--o{ videos : "contains"
    app_roles ||--o{ app_role_permissions : "has"
    app_permissions ||--o{ app_role_permissions : "belongs_to"
    
    users {
        uuid id PK
        varchar google_id UK "NOT NULL"
        varchar email UK "NOT NULL"
        varchar name "NOT NULL"
        text avatar_url
        varchar role "NOT NULL, DEFAULT viewer"
        boolean is_active "NOT NULL, DEFAULT TRUE"
        timestamp created_at "NOT NULL, DEFAULT NOW()"
        timestamp last_login
    }
    
    categories {
        uuid id PK
        varchar name UK "NOT NULL"
        varchar slug UK "NOT NULL"
        text description
        timestamp created_at "NOT NULL, DEFAULT NOW()"
    }
    
    videos {
        uuid id PK
        varchar title "NOT NULL"
        text description
        uuid category_id FK
        text hls_path "NOT NULL"
        text poster_path
        integer duration
        bigint file_size
        boolean is_processed "NOT NULL, DEFAULT FALSE"
        boolean is_published "NOT NULL, DEFAULT FALSE"
        timestamp created_at "NOT NULL, DEFAULT NOW()"
        timestamp updated_at "NOT NULL, DEFAULT NOW()"
        uuid uploaded_by FK
    }
    
    audit_log {
        bigserial id PK
        varchar operation_type "NOT NULL"
        varchar table_name "NOT NULL"
        uuid record_id
        uuid user_id FK
        varchar user_email
        varchar user_role
        jsonb old_data
        jsonb new_data
        text_array changed_fields
        timestamp operation_timestamp "NOT NULL, DEFAULT NOW()"
        inet ip_address
        text user_agent
        boolean is_critical "NOT NULL, DEFAULT FALSE"
        text critical_message
        text query_executed
        text error_message
    }
    
    change_history {
        bigserial id PK
        varchar table_name "NOT NULL"
        uuid record_id "NOT NULL"
        timestamp changed_at "NOT NULL, DEFAULT NOW()"
        uuid changed_by FK
        varchar change_type "NOT NULL"
        jsonb data_snapshot "NOT NULL"
        text change_reason
        integer version_number "NOT NULL, DEFAULT 1"
    }
    
    app_roles {
        uuid id PK
        varchar role_name UK "NOT NULL"
        varchar display_name "NOT NULL"
        text description
        boolean is_system_role "NOT NULL, DEFAULT FALSE"
        timestamp created_at "NOT NULL, DEFAULT NOW()"
    }
    
    app_permissions {
        uuid id PK
        varchar permission_name UK "NOT NULL"
        varchar resource "NOT NULL"
        varchar action "NOT NULL"
        text description
        timestamp created_at "NOT NULL, DEFAULT NOW()"
    }
    
    app_role_permissions {
        uuid role_id PK,FK
        uuid permission_id PK,FK
        timestamp granted_at "NOT NULL, DEFAULT NOW()"
    }
```

## Diagrama de Seguridad y Auditoría

```mermaid
flowchart TB
    subgraph "Tablas Principales"
        USERS[users]
        VIDEOS[videos]
        CATEGORIES[categories]
    end
    
    subgraph "Sistema de Auditoría"
        AUDIT[audit_log]
        HISTORY[change_history]
    end
    
    subgraph "Sistema de Roles"
        ROLES[app_roles]
        PERMS[app_permissions]
        ROLE_PERMS[app_role_permissions]
    end
    
    subgraph "Triggers de Auditoría"
        T1[audit_trigger_function]
        T2[change_history_trigger_function]
    end
    
    subgraph "Triggers de Validación"
        V1[validate_user_data]
        V2[validate_video_data]
        V3[validate_category_data]
        V4[prevent_critical_delete]
        V5[notify_critical_change]
    end
    
    USERS -->|INSERT/UPDATE/DELETE| T1
    VIDEOS -->|INSERT/UPDATE/DELETE| T1
    CATEGORIES -->|INSERT/UPDATE/DELETE| T1
    
    USERS -->|INSERT/UPDATE/DELETE| T2
    VIDEOS -->|INSERT/UPDATE/DELETE| T2
    CATEGORIES -->|INSERT/UPDATE/DELETE| T2
    
    T1 -->|Registra| AUDIT
    T2 -->|Versiona| HISTORY
    
    USERS -->|BEFORE INSERT/UPDATE| V1
    VIDEOS -->|BEFORE INSERT/UPDATE| V2
    CATEGORIES -->|BEFORE INSERT/UPDATE| V3
    
    USERS -->|BEFORE DELETE| V4
    VIDEOS -->|BEFORE DELETE| V4
    CATEGORIES -->|BEFORE DELETE| V4
    
    USERS -->|AFTER UPDATE/DELETE| V5
    VIDEOS -->|AFTER UPDATE/DELETE| V5
    CATEGORIES -->|AFTER DELETE| V5
    
    ROLES -->|many-to-many| ROLE_PERMS
    PERMS -->|many-to-many| ROLE_PERMS
```

## Índices Principales

### Tabla: users
- `idx_users_google_id` - Índice en google_id
- `idx_users_email` - Índice en email
- `idx_users_role` - Índice en role
- `idx_users_is_active` - Índice en is_active

### Tabla: videos
- `idx_videos_category_id` - Índice en category_id
- `idx_videos_is_processed` - Índice en is_processed
- `idx_videos_is_published` - Índice en is_published
- `idx_videos_uploaded_by` - Índice en uploaded_by
- `idx_videos_created_at` - Índice DESC en created_at

### Tabla: categories
- `idx_categories_slug` - Índice en slug

### Tabla: audit_log
- `idx_audit_log_operation_type` - Índice en operation_type
- `idx_audit_log_table_name` - Índice en table_name
- `idx_audit_log_user_id` - Índice en user_id
- `idx_audit_log_timestamp` - Índice DESC en operation_timestamp
- `idx_audit_log_is_critical` - Índice parcial en is_critical
- `idx_audit_log_record_id` - Índice en record_id
- `idx_audit_log_old_data` - Índice GIN en old_data (JSONB)
- `idx_audit_log_new_data` - Índice GIN en new_data (JSONB)

### Tabla: change_history
- `idx_change_history_table_record` - Índice compuesto en (table_name, record_id)
- `idx_change_history_changed_at` - Índice DESC en changed_at
- `idx_change_history_changed_by` - Índice en changed_by
- `idx_change_history_version` - Índice compuesto en (table_name, record_id, version_number)
- `idx_change_history_data_snapshot` - Índice GIN en data_snapshot (JSONB)

## Restricciones (Constraints)

### users
- **NOT NULL**: google_id, email, name, role, is_active, created_at
- **UNIQUE**: google_id, email
- **CHECK**: 
  - Email válido (formato regex)
  - Rol válido (viewer, editor, admin, superadmin)
  - Nombre no vacío
  - Google ID no vacío

### categories
- **NOT NULL**: name, slug, created_at
- **UNIQUE**: name, slug
- **CHECK**:
  - Nombre no vacío
  - Slug no vacío
  - Slug formato válido (lowercase, números, guiones)

### videos
- **NOT NULL**: title, hls_path, is_processed, is_published, created_at, updated_at
- **CHECK**:
  - Título no vacío
  - HLS path no vacío
  - Duración positiva (si existe)
  - File size positivo (si existe)
  - updated_at >= created_at

### audit_log
- **NOT NULL**: operation_type, table_name, operation_timestamp, is_critical
- **CHECK**:
  - operation_type válido (INSERT, UPDATE, DELETE, SELECT, TRUNCATE)
  - table_name no vacío
  - Si is_critical=TRUE, debe tener critical_message

### change_history
- **NOT NULL**: table_name, record_id, changed_at, change_type, data_snapshot, version_number
- **CHECK**:
  - table_name no vacío
  - change_type válido (CREATED, UPDATED, DELETED, RESTORED)
  - version_number > 0

## Llaves Foráneas

- `videos.category_id` → `categories.id` (ON DELETE SET NULL)
- `videos.uploaded_by` → `users.id` (ON DELETE SET NULL)
- `audit_log.user_id` → `users.id` (ON DELETE SET NULL)
- `change_history.changed_by` → `users.id` (ON DELETE SET NULL)
- `app_role_permissions.role_id` → `app_roles.id` (ON DELETE CASCADE)
- `app_role_permissions.permission_id` → `app_permissions.id` (ON DELETE CASCADE)

## Triggers Configurados

### Auditoría (AFTER)
- `trg_audit_users_insert` - AFTER INSERT ON users
- `trg_audit_users_update` - AFTER UPDATE ON users
- `trg_audit_users_delete` - AFTER DELETE ON users
- `trg_audit_categories_insert` - AFTER INSERT ON categories
- `trg_audit_categories_update` - AFTER UPDATE ON categories
- `trg_audit_categories_delete` - AFTER DELETE ON categories
- `trg_audit_videos_insert` - AFTER INSERT ON videos
- `trg_audit_videos_update` - AFTER UPDATE ON videos
- `trg_audit_videos_delete` - AFTER DELETE ON videos

### Historial de Cambios (AFTER)
- `trg_change_history_users_*` - Versionado de usuarios
- `trg_change_history_categories_*` - Versionado de categorías
- `trg_change_history_videos_*` - Versionado de videos

### Validación (BEFORE)
- `trg_validate_user_before_insert/update` - Valida datos de usuarios
- `trg_validate_category_before_insert/update` - Valida datos de categorías
- `trg_validate_video_before_insert/update` - Valida datos de videos
- `trg_prevent_*_critical_delete` - Previene eliminaciones críticas

### Notificaciones (AFTER)
- `trg_notify_users_critical_changes` - Notifica cambios críticos en usuarios
- `trg_notify_videos_critical_changes` - Notifica cambios críticos en videos
- `trg_notify_categories_critical_changes` - Notifica eliminación de categorías

### Actualizaciones Automáticas (BEFORE)
- `trg_update_videos_updated_at` - Actualiza updated_at automáticamente

## Roles de PostgreSQL

### streamflow_readonly
- **Permisos**: SELECT en categories, videos
- **Uso**: Reportes y consultas de solo lectura

### streamflow_app
- **Permisos**: SELECT, INSERT, UPDATE, DELETE en users, categories, videos
- **Permisos**: SELECT, INSERT en audit_log, change_history
- **Uso**: Usuario principal de la aplicación backend

### streamflow_admin
- **Permisos**: ALL PRIVILEGES en todas las tablas
- **Uso**: Tareas administrativas

### streamflow_auditor
- **Permisos**: SELECT en audit_log, change_history, categories
- **Uso**: Auditoría y revisión de logs
