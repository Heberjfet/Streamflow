# StreamFlow - Especificaciones Técnicas

## Overview

StreamFlow es una plataforma de streaming VOD con sistema de seguridad modular basado en feature flags, diseñada para cumplir con los requisitos académicos de la materia de Cómputo Distribuido.

## Stack Tecnológico

### Frontend
- **Framework:** React 19 + Vite
- **Estilos:** Tailwind CSS v4
- **Componentes:** Radix UI
- **Video Player:** Shaka Player
- **Estado:** Zustand
- **Data Fetching:** TanStack Query
- **Formularios:** React Hook Form + Zod

### Backend
- **Runtime:** Deno 2.0
- **Framework:** Fastify
- **ORM:** Drizzle ORM
- **Base de Datos:** PostgreSQL 16 (Master-Slave)
- **Cache:** Redis 7
- **Cola:** RabbitMQ
- **Storage:** MinIO (dev) / Wasabi (prod)

### Infraestructura
- **Contenedores:** Docker + Docker Compose
- **Proxy:** Nginx
- **Monitoreo:** Prometheus + Grafana
- **CDN:** Cloudflare

## Arquitectura de BD Distribuida

### Topología Master-Slave

```
┌─────────────────┐     Streaming      ┌─────────────────┐
│   MASTER :5432  │ ──── Replication ────>  REPLICA :5433  │
│   (Escrituras)  │                    │   (Lecturas)     │
└─────────────────┘                    └─────────────────┘
```

### Entidades y Justificación

| Entidad | Tipo | Justificación |
|---------|------|---------------|
| users | Centralizada | Consistencia inmediata en auth |
| videos | Distribuida | Replicación por región |
| incidents | Centralizada | Logs centralizados |
| sessions | Centralizada | Consistencia de sesiones |
| audit_logs | Distribuida | Por componente |

## Feature Flags de Seguridad

### Flags Implementados

```typescript
AUTH_RATE_LIMIT: boolean       // Rate limiting
AUTH_ACCOUNT_LOCKOUT: boolean  // Bloqueo por intentos
AUTH_2FA: boolean              // TOTP
AUTH_OAUTH_GOOGLE: boolean     // Google OAuth
AUTH_CAPTCHA: boolean          // reCAPTCHA
PROTECTION_CSRF: boolean       // CSRF tokens
PROTECTION_XSS: boolean        // Sanitization
PROTECTION_SQLI: boolean       // SQL injection protection
PROTECTION_IDOR: boolean       // Ownership check
INCIDENTS_LOGGING: boolean     // Event logging
INCIDENTS_AUTO_DETECT: boolean // Auto detection
INCIDENTS_ALERTS: boolean      // Notifications
AUDIT_LOG_CHANGES: boolean      // Change logging
AUDIT_FULL: boolean             // Full audit
```

## API Endpoints

### Autenticación
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/2fa/setup`
- `POST /api/v1/auth/2fa/verify`
- `GET /api/v1/auth/oauth/google`

### Videos
- `GET /api/v1/videos`
- `GET /api/v1/videos/:id`
- `POST /api/v1/videos`
- `PUT /api/v1/videos/:id`
- `DELETE /api/v1/videos/:id`

### Admin
- `GET /api/v1/admin/flags`
- `PUT /api/v1/admin/flags/:name`
- `GET /api/v1/admin/incidents`
- `GET /api/v1/admin/incidents/:id`
- `PATCH /api/v1/admin/incidents/:id`
- `GET /api/v1/admin/security/stats`

## Niveles de Incidentes

| Nivel | Color | Descripción |
|-------|-------|-------------|
| low | 🔵 | Intentos menores |
| medium | 🟡 | Posible ataque |
| high | 🟠 | Ataque confirmado |
| critical | 🔴 | Compromiso |

## Estados de Incidente

```
Abierto → En Proceso → Resuelto → Cerrado
```

## Métricas QoE

| Métrica | Objetivo |
|---------|----------|
| Startup Time | < 2s |
| Buffering Ratio | < 5% |
| Bitrate Promedio | > 720p |
| Error Rate | < 0.1% |

## Cronograma

| Semana | Fecha | Entregable |
|-------|-------|------------|
| 1 | 24-28 Mar | Auth + Docker Compose |
| 2 | 31 Mar-4 Abr | Security Flags |
| 3 | 7-11 Abr | Incidentes + Upload |
| 4 | 14-18 Abr | Transcoding + Player |
| 5 | 21-25 Abr | OAuth + Docs |
| 6 | 28 Abr-2 May | Deploy VPS |

## Deployment

### Pasos
1. Crear VPS en Hostinger
2. Instalar Docker
3. Clonar repo
4. Configurar `.env`
5. `docker-compose up -d`
6. Configurar Cloudflare DNS
