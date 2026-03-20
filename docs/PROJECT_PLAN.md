# STREAMFLOW - Plan de Implementación Final

## Proyecto Integrador - Cómputo Distribuido

**Universidad Autónoma de Chiapas**
**Licenciatura en Ingeniería en Desarrollo y Tecnologías de Software**

**Materia:** Cómputo Distribuido

**Fecha:** Marzo 2025

---

## 1. Descripción del Proyecto

**StreamFlow** es una plataforma de streaming de video bajo demanda (VOD) con sistema de seguridad modular basado en feature flags, diseñada para cumplir con los requisitos académicos de la materia de Cómputo Distribuido.

### Características Principales

- Streaming adaptativo HLS con múltiples calidades
- Sistema de seguridad modular (feature flags)
- PostgreSQL con replicación Master-Slave (BD Distribuida)
- Arquitectura de microservicios containerizada
- OAuth con Google

---

## 2. Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|------------|---------------|
| **Frontend** | React 19 + Vite + Tailwind + Radix UI | Experiencia del equipo |
| **Video Player** | Shaka Player | Mejor soporte HLS/DASH nativo |
| **Backend** | Deno 2.0 + Fastify + Drizzle ORM | TypeScript nativo, seguro, rápido |
| **Base de Datos** | PostgreSQL 16 Master-Slave | BD distribuida con replicación |
| **Cache** | Redis 7 | Rate limiting, sesiones |
| **Cola de Mensajes** | RabbitMQ | Jobs de transcoding asíncrono |
| **Storage** | MinIO (dev) / Wasabi (prod) | Almacenamiento S3-compatible |
| **CDN** | Cloudflare | SSL gratis + edge caching |
| **OAuth** | Google OAuth 2.0 | Gratis, fácil de implementar |

---

## 3. Estructura del Proyecto

```
streamflow/
├── apps/
│   ├── api/                         # Backend Deno
│   │   ├── src/
│   │   │   ├── routes/             # /auth, /videos, /admin
│   │   │   ├── services/           # Lógica de negocio
│   │   │   ├── middleware/
│   │   │   │   ├── security/       # XSS, SQLi, IDOR, CSRF
│   │   │   │   └── incidents/      # Detección automática
│   │   │   ├── db/
│   │   │   │   ├── schema.ts       # Drizzle schema
│   │   │   │   └── migrations/      # Migraciones
│   │   │   ├── flags.ts            # Feature flags
│   │   │   └── main.ts             # Entry point
│   │   ├── Dockerfile
│   │   └── deno.json
│   │
│   └── web/                         # Frontend React
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── contexts/
│       │   ├── hooks/
│       │   └── lib/
│       ├── Dockerfile
│       ├── vite.config.ts
│       └── package.json
│
├── packages/
│   └── shared/                       # Types, flags, utils
│       ├── flags.ts
│       └── types.ts
│
├── infra/
│   ├── docker-compose.yml
│   ├── postgres/
│   │   ├── master.conf
│   │   └── replica.conf
│   └── nginx/
│       └── nginx.conf
│
├── docs/
│   ├── arquitectura.md
│   ├── seguridad.md
│   └── politicas.md
│
└── SPEC.md                          # Especificaciones del proyecto
```

---

## 4. División de Roles (4 personas)

| Rol | Responsabilidad Principal |
|-----|--------------------------|
| **Backend Lead 1** | Auth, Security Flags, Incidentes, API core |
| **Backend Lead 2** | Video Processing, Transcoding, HLS, Workers |
| **Frontend Lead 1** | Auth UI, Admin Panel, Incidentes UI |
| **Frontend Lead 2** | Video Player, Catalog, Upload UI |

---

## 5. Sistema de Feature Flags

### Concepto

Cada módulo de seguridad puede activarse o desactivarse individualmente para facilitar pruebas y desarrollo.

### Flags de Seguridad

```typescript
// packages/shared/flags.ts
export const SECURITY_FLAGS = {
  // Auth
  AUTH_RATE_LIMIT: true,         // Rate limiting por IP (100 req/min)
  AUTH_ACCOUNT_LOCKOUT: true,   // Bloqueo 30 min tras 5 intentos fallidos
  AUTH_2FA: false,              // 2FA TOTP con Google Authenticator
  AUTH_OAUTH_GOOGLE: false,     // Login con Google OAuth 2.0
  AUTH_CAPTCHA: false,           // reCAPTCHA v3 en login

  // Protection
  PROTECTION_CSRF: true,        // Double submit cookie
  PROTECTION_XSS: true,          // DOMPurify sanitization
  PROTECTION_SQLI: true,        // Prepared statements + validation
  PROTECTION_IDOR: true,        // Ownership verification

  // Incidents
  INCIDENTS_LOGGING: true,      // Registro de eventos en BD
  INCIDENTS_AUTO_DETECT: true,   // Detección automática de ataques
  INCIDENTS_ALERTS: false,       // Email/webhook a admins

  // Audit
  AUDIT_LOG_CHANGES: true,       // Bitácora de cambios
  AUDIT_FULL: false,             // Logging exhaustivo
} as const;
```

### API de Flags

```
GET  /api/v1/admin/flags           # Listar todos los flags
PUT  /api/v1/admin/flags/:name     # Activar/Desactivar flag
```

### UI de Flags (Panel Admin)

```
┌─────────────────────────────────────────────────┐
│ 🔐 Security Flags                    [Admin]    │
├─────────────────────────────────────────────────┤
│ ✓ AUTH_RATE_LIMIT          [ Desactivar ]      │
│ ✓ AUTH_ACCOUNT_LOCKOUT     [ Desactivar ]      │
│ ✗ AUTH_2FA                [ Activar ]         │
│ ✗ AUTH_OAUTH_GOOGLE       [ Activar ]         │
│ ✓ PROTECTION_CSRF         [ Desactivar ]      │
│ ✓ PROTECTION_XSS          [ Desactivar ]      │
│ ✓ PROTECTION_SQLI         [ Desactivar ]      │
│ ✓ PROTECTION_IDOR         [ Desactivar ]      │
│ ✓ INCIDENTS_LOGGING       [ Desactivar ]      │
│ ✓ INCIDENTS_AUTO_DETECT   [ Desactivar ]      │
│ ✗ INCIDENTS_ALERTS        [ Activar ]         │
│ ✓ AUDIT_LOG_CHANGES       [ Desactivar ]      │
└─────────────────────────────────────────────────┘
```

---

## 6. Modelo de Base de Datos Distribuida

### Topología Master-Slave

```
┌─────────────────┐     Streaming      ┌─────────────────┐
│   MASTER :5432  │ ──── Replication ────>  REPLICA :5433  │
│   (Escrituras)  │                    │   (Lecturas)     │
└─────────────────┘                    └─────────────────┘
```

### Justificación de Distribución

| Entidad | Tipo | Justificación |
|---------|------|---------------|
| users | Centralizada | Autenticación requiere consistencia inmediata |
| videos | Distribuida | Contenido puede replicarse por región |
| incidents | Centralizada | Logs de seguridad centralizados para análisis |
| audit_logs | Distribuida | Por componente para evitar cuello de botella |
| sessions | Centralizada | Control de sesiones debe ser consistente |

### Estrategia de Sincronización

- **Master → Replica:** Streaming replication en tiempo real
- **Lecturas:** Queries SELECT van a replica
- **Escrituras:** INSERT/UPDATE/DELETE van a master

---

## 7. Módulos de Seguridad

| Módulo | Flag | Descripción |
|--------|------|-------------|
| Rate Limiting | `AUTH_RATE_LIMIT` | Límite 100 requests/minuto por IP |
| Account Lockout | `AUTH_ACCOUNT_LOCKOUT` | Bloqueo 30 minutos tras 5 intentos fallidos |
| 2FA TOTP | `AUTH_2FA` | Verificación con Google Authenticator |
| OAuth Google | `AUTH_OAUTH_GOOGLE` | Login con cuenta Google |
| CAPTCHA | `AUTH_CAPTCHA` | reCAPTCHA v3 invisible |
| CSRF Protection | `PROTECTION_CSRF` | Double submit cookie pattern |
| XSS Protection | `PROTECTION_XSS` | Sanitización con DOMPurify |
| SQLi Protection | `PROTECTION_SQLI` | Prepared statements + validación |
| IDOR Protection | `PROTECTION_IDOR` | Verificación de ownership |
| Incident Logging | `INCIDENTS_LOGGING` | Registro de eventos en BD |
| Auto-detect | `INCIDENTS_AUTO_DETECT` | Detecta ataques automáticamente |
| Alerts | `INCIDENTS_ALERTS` | Notifica admins por email/webhook |
| Audit Log | `AUDIT_LOG_CHANGES` | Bitácora de cambios en registros |

---

## 8. Detección Automática de Incidentes

### Eventos Monitoreados

| Evento | Flag | Descripción |
|--------|------|-------------|
| Login fallido | `INCIDENTS_AUTO_DETECT` | 3+ intentos fallidos |
| Acceso fuera de horario | `INCIDENTS_AUTO_DETECT` | Acceso fuera de 8am-10pm |
| XSS attempt | `INCIDENTS_AUTO_DETECT` | Patterns maliciosos en inputs |
| SQL injection attempt | `INCIDENTS_AUTO_DETECT` | SQL keywords en inputs |
| IDOR attempt | `INCIDENTS_AUTO_DETECT` | Acceso a recurso de otro usuario |
| Cambio no autorizado | `INCIDENTS_AUTO_DETECT` | Modificación de registro ajeno |

### Niveles de Severidad

| Nivel | Color | Descripción |
|-------|-------|-------------|
| Bajo | 🔵 | Intentos menores, errores de usuario |
| Medio | 🟡 | Posible ataque en progreso |
| Alto | 🟠 | Ataque confirmado |
| Crítico | 🔴 | Compromiso de seguridad |

### Estados de Incidente

```
Abierto → En Proceso → Resuelto → Cerrado
```

---

## 9. Cronograma Semanal

| Semana | Fechas | Backend Lead 1 | Backend Lead 2 | Frontend Lead 1 | Frontend Lead 2 |
|--------|--------|-----------------|----------------|-----------------|------------------|
| 1 | 24-28 Mar | Repo + Docker + Auth base | Postgres MS + Redis + MinIO | Login/Register UI | - |
| 2 | 31 Mar-4 Abr | Security flags core | FFmpeg setup | Profile + 2FA UI | - |
| 3 | 7-11 Abr | Incidentes API | Upload + MinIO | Admin incidents | Video catalog |
| 4 | 14-18 Abr | Audit logging | Transcoding + HLS | Dashboard stats | Shaka Player |
| 5 | 21-25 Abr | Google OAuth + Backup | Quality selector | Docs + polish | Player polish |
| 6 | 28 Abr-2 May | Fix + Deploy VPS | - | - | - |

---

## 10. Entregables por Fecha

| Fecha | Entregable | Flags |
|-------|------------|-------|
| 28 Mar | Auth con JWT + Rate limiting + Account lockout | `AUTH_RATE_LIMIT`, `AUTH_ACCOUNT_LOCKOUT` |
| 4 Abr | Protección XSS, SQLi, IDOR, CSRF activos | `PROTECTION_CSRF`, `PROTECTION_XSS`, `PROTECTION_SQLI`, `PROTECTION_IDOR` |
| 11 Abr | Sistema de incidentes con detección automática | `INCIDENTS_*` |
| 18 Abr | Video player con HLS + transcoding | - |
| 25 Abr | Google OAuth + documentación completa | `AUTH_OAUTH_GOOGLE` |
| 2 May | Sistema funcionando en VPS Hostinger | Todos activos |

---

## 11. Especificaciones VPS Hostinger

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| CPU | 4 cores | 6 cores |
| RAM | 8 GB | 16 GB |
| SSD | 100 GB | 200 GB |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| Costo | ~$20/mes | ~$40/mes |

### Pasos de Deployment

1. Crear VPS en Hostinger
2. Instalar Docker + Docker Compose
3. Clonar repositorio
4. Configurar variables de entorno
5. `docker-compose up -d`
6. Configurar Cloudflare DNS
7. Configurar SSL

---

## 12. API Endpoints

### Autenticación

```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
GET  /api/v1/auth/me
POST /api/v1/auth/2fa/setup      (flag: AUTH_2FA)
POST /api/v1/auth/2fa/verify     (flag: AUTH_2FA)
GET  /api/v1/auth/oauth/google   (flag: AUTH_OAUTH_GOOGLE)
```

### Videos

```
GET  /api/v1/videos
GET  /api/v1/videos/:id
POST /api/v1/videos              (flag: PROTECTION_IDOR)
PUT  /api/v1/videos/:id          (flag: PROTECTION_IDOR)
DELETE /api/v1/videos/:id        (flag: PROTECTION_IDOR)
```

### Streaming

```
GET /streams/:id/playlist.m3u8
GET /streams/:id/:resolution/segment_*.ts
```

### Admin - Incidentes

```
GET  /api/v1/admin/incidents
GET  /api/v1/admin/incidents/:id
PATCH /api/v1/admin/incidents/:id
GET  /api/v1/admin/incidents/stats
```

### Admin - Flags

```
GET  /api/v1/admin/flags
PUT  /api/v1/admin/flags/:name
```

### Admin - Security

```
GET  /api/v1/admin/security/logs
GET  /api/v1/admin/security/stats
```

---

## 13. Métricas de Calidad (QoE)

| Métrica | Objetivo |
|---------|----------|
| Startup Time | < 2 segundos |
| Buffering Ratio | < 5% |
| Bitrate Promedio | > 720p |
| Rebuffer Events | < 1 por sesión |
| Latencia API | < 200ms |
| Error Rate | < 0.1% |

---

## 14. Documentos a Generar

| Documento | Descripción |
|-----------|-------------|
| `docs/arquitectura.md` | Diagrama de arquitectura + justificación |
| `docs/seguridad.md` | Sistema de seguridad + feature flags |
| `docs/politicas.md` | Políticas de uso, contraseñas, personal |

---

## 15. Tecnologías Justificadas

### Frontend: React 19 + Vite

- Experiencia previa del equipo
- Gran ecosistema de librerías
- Hot Module Replacement rápido
- Comunidad activa

### Backend: Deno 2.0 + Fastify

- TypeScript nativo sin config
- Seguridad built-in (permissions)
- Mejor performance que Node para APIs
- Fastify: 2-3x más rápido que Express

### Base de Datos: PostgreSQL 16

- Soporte nativo a replicación streaming
- Extensión foreign data wrappers
- JSONB para flexibilidad
- Dividido en maestro y réplica

### Seguridad: JWT + Feature Flags

- Tokens de corta duración (4 horas)
- Firma criptográfica HMAC-SHA256
- Flags para activar/desactivar módulos

---

## 16. Contacto

| Rol | Nombre |
|-----|--------|
| Desarrollador Principal | Heber Jfet |
| Universidad | Universidad Autónoma de Chiapas |
| Facultad | Contaduría y Administración |
| Carrera | Ingeniería en Desarrollo y Tecnologías de Software |
| Año | 2025 |

---

**Documento generado:** Marzo 2025
**Versión:** 1.0
