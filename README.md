# StreamFlow

**Proyecto Integrador - Cómputo Distribuido**

Plataforma de streaming de video bajo demanda (VOD) con sistema de seguridad modular basado en feature flags y base de datos distribuida con replicación Master-Slave.

---

## Descripción

StreamFlow es una plataforma VOD diseñada para cumplir con los requisitos académicos de la materia de Cómputo Distribuido, implementando:

- **Base de datos distribuida** con PostgreSQL Master-Slave
- **Sistema de seguridad modular** con feature flags activables/desactivables
- **Detección automática de incidentes** de seguridad
- **Streaming adaptativo** con HLS

### Objetivos Académicos

- Implementar replicación Master-Slave en PostgreSQL (BD Distribuida)
- Crear sistema de feature flags para módulos de seguridad
- Detectar y clasificar incidentes de seguridad automáticamente
- Documentar políticas de seguridad

---

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Frontend** | React 19 + Vite + Tailwind + Radix UI |
| **Backend** | Deno 2.0 + Fastify + Drizzle ORM |
| **Base de Datos** | PostgreSQL 16 (Master-Slave) |
| **Caché** | Redis 7 |
| **Cola de Mensajes** | RabbitMQ |
| **Storage** | MinIO (dev) |
| **Streaming** | HLS con Shaka Player |
| **OAuth** | Google OAuth 2.0 |
| **Monitoreo** | Prometheus + Grafana |

---

## Arquitectura

```
┌────────────────────────────────────────────────────────────────┐
│                         USUARIOS                                │
│                    (Web Browser)                                │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                     Nginx (Reverse Proxy)                        │
│                  Rate Limiting + SSL                            │
└────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
   │  Frontend   │     │   Backend   │     │  MinIO      │
   │  (React)    │     │   (Deno)    │     │  (Videos)   │
   │  :5173      │     │   :8000     │     │  :9000      │
   └─────────────┘     └─────────────┘     └─────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
   │ PostgreSQL  │     │    Redis    │     │  RabbitMQ   │
   │  Master     │◄───►│   (Cache)   │     │  (Jobs)     │
   │   :5432     │     │   :6379     │     │   :5672     │
   └─────────────┘     └─────────────┘     └─────────────┘
          │                                           │
          │         Replicación Streaming            │
          ▼                                           ▼
   ┌─────────────┐                           ┌─────────────┐
   │ PostgreSQL  │                           │   Worker     │
   │  Replica    │                           │  (FFmpeg)    │
   │   :5433     │                           │   :8080      │
   └─────────────┘                           └─────────────┘
```

---

## Estructura del Proyecto

```
streamflow/
├── apps/
│   ├── api/                    # Backend Deno
│   │   ├── src/
│   │   │   ├── routes/        # /auth, /videos, /admin
│   │   │   ├── middleware/    # security, incidents
│   │   │   └── db/            # schema, migrations
│   │   └── deno.json
│   │
│   └── web/                    # Frontend React
│       ├── src/
│       │   ├── pages/         # Login, Register, Dashboard, etc.
│       │   ├── components/
│       │   └── store/         # Zustand
│       └── package.json
│
├── packages/
│   └── shared/                # Flags, types
│
├── infra/
│   ├── docker-compose.yml     # Todos los servicios
│   ├── postgres/              # Config Master-Slave
│   ├── nginx/                 # Reverse proxy
│   └── prometheus/            # Monitoreo
│
└── docs/
    └── PROJECT_PLAN.md       # Plan de implementación
```

---

## Sistema de Feature Flags

Cada módulo de seguridad puede activarse/desactivarse individualmente:

| Flag | Descripción | Default |
|------|-------------|---------|
| `AUTH_RATE_LIMIT` | Rate limiting 100 req/min por IP | ON |
| `AUTH_ACCOUNT_LOCKOUT` | Bloqueo 30 min tras 5 intentos | ON |
| `AUTH_2FA` | 2FA con Google Authenticator | OFF |
| `AUTH_OAUTH_GOOGLE` | Login con Google OAuth | OFF |
| `AUTH_CAPTCHA` | reCAPTCHA v3 | OFF |
| `PROTECTION_CSRF` | Double submit cookie | ON |
| `PROTECTION_XSS` | Sanitización DOMPurify | ON |
| `PROTECTION_SQLI` | Prepared statements | ON |
| `PROTECTION_IDOR` | Verificación de ownership | ON |
| `INCIDENTS_LOGGING` | Registro en BD | ON |
| `INCIDENTS_AUTO_DETECT` | Detección automática | ON |
| `INCIDENTS_ALERTS` | Alertas a admins | OFF |
| `AUDIT_LOG_CHANGES` | Bitácora de cambios | ON |

---

## Detección de Incidentes

| Evento | Severidad |
|--------|-----------|
| Login fallido (3+ intentos) | 🟡 Medio |
| Acceso fuera de horario | 🟡 Medio |
| XSS attempt | 🟠 Alto |
| SQL injection attempt | 🟠 Alto |
| IDOR attempt | 🟠 Alto |
| Cambio no autorizado | 🔴 Crítico |

---

## Instalación

### Requisitos

- Docker y Docker Compose
- Deno 2.0+ (para desarrollo backend)
- Node.js 18+ (para desarrollo frontend)

### Desarrollo

```bash
# Clonar
git clone https://github.com/Heberjfet/Streamflow.git
cd Streamflow

# Configurar entorno
cp infra/.env.example .env

# Iniciar servicios
docker compose -f infra/docker-compose.yml up -d

# Backend (desarrollo)
cd apps/api && deno task dev

# Frontend (desarrollo)
cd apps/web && npm install && npm run dev
```

### Servicios

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| API | 8000 | Backend Deno |
| Frontend | 5173 | Vite dev server |
| PostgreSQL Master | 5432 | Base de datos principal |
| PostgreSQL Replica | 5433 | Base de datos réplica |
| Redis | 6379 | Caché y sesiones |
| RabbitMQ | 5672 | Cola de mensajes |
| MinIO | 9000 | Almacenamiento |
| Nginx | 80 | Reverse proxy |
| Prometheus | 9090 | Monitoreo |
| Grafana | 3000 | Dashboards |

---

## API Endpoints

### Autenticación
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
POST /api/v1/auth/2fa/setup
POST /api/v1/auth/2fa/verify
GET  /api/v1/auth/oauth/google
```

### Videos
```
GET    /api/v1/videos
GET    /api/v1/videos/:id
POST   /api/v1/videos
PUT    /api/v1/videos/:id
DELETE /api/v1/videos/:id
```

### Admin
```
GET  /api/v1/admin/flags
PUT  /api/v1/admin/flags/:name
GET  /api/v1/admin/incidents
GET  /api/v1/admin/incidents/stats
```

### Streaming
```
GET /streams/:id/playlist.m3u8
GET /streams/:id/:resolution/segment_*.ts
```

---

## Plan de Implementación (6 Semanas)

| Semana | Fechas | Entregable |
|--------|--------|-------------|
| 1 | 24-28 Mar | Docker + Auth base + Login UI |
| 2 | 31 Mar-4 Abr | Security flags core |
| 3 | 7-11 Abr | Sistema de incidentes + Upload |
| 4 | 14-18 Abr | Transcoding + HLS + Player |
| 5 | 21-25 Abr | Google OAuth + Documentación |
| 6 | 28 Abr-2 May | Deploy VPS + QA |

### Entregables por Fecha

| Fecha | Entregable | Flags |
|-------|------------|-------|
| 28 Mar | Auth JWT + Rate limiting + Lockout | `AUTH_RATE_LIMIT`, `AUTH_ACCOUNT_LOCKOUT` |
| 4 Abr | XSS, SQLi, IDOR, CSRF activos | `PROTECTION_*` |
| 11 Abr | Sistema de incidentes funcional | `INCIDENTS_*` |
| 18 Abr | Video player con HLS | - |
| 25 Abr | Google OAuth + Docs | `AUTH_OAUTH_GOOGLE` |
| 2 May | Deploy en VPS Hostinger | Todos ON |

---

## Métricas QoE

| Métrica | Objetivo |
|---------|----------|
| Startup Time | < 2 segundos |
| Buffering Ratio | < 5% |
| Bitrate Promedio | > 720p |
| Latencia API | < 200ms |
| Error Rate | < 0.1% |

---

## Equipo

| Rol | Responsabilidad |
|-----|-----------------|
| Backend Lead 1 | Auth, Security Flags, Incidentes |
| Backend Lead 2 | Video Processing, Transcoding, Workers |
| Frontend Lead 1 | Auth UI, Admin Panel, Incidentes UI |
| Frontend Lead 2 | Video Player, Catalog, Upload UI |

---

## Documentación

- `docs/PROJECT_PLAN.md` - Plan de implementación completo
- `SPEC.md` - Especificaciones técnicas

---

## Universidad

- **Institución:** Universidad Autónoma de Chiapas
- **Facultad:** Contaduría y Administración
- **Carrera:** Ingeniería en Desarrollo y Tecnologías de Software
- **Materia:** Cómputo Distribuido
- **Proyecto:** Integrador Final
- **Fecha:** Marzo 2025

---

**Estado Actual:** Esqueleto/wireframe - implementación en progreso
