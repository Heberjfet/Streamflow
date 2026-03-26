# StreamFlow

> Plataforma de streaming autohospedada para antologías de video corto generadas por IA, inspirada en el estilo de series como **Love, Death & Robots**.

![StreamFlow Banner](https://img.shields.io/badge/StreamFlow-Streaming-AA60FF?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![Deno](https://img.shields.io/badge/Deno-2.0-70ff85?style=flat-square&logo=deno)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis)
![License](https://img.shields.io/badge/License-MIT-8B5CF6?style=flat-square)

---

## Tabla de Contenidos

- [Descripción](#descripción)
- [Identidad Visual](#identidad-visual)
- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
  - [Frontend](#frontend)
  - [Backend](#backend)
- [Esquema de Base de Datos](#esquema-de-base-de-datos)
- [Pipeline de Procesamiento de Video](#pipeline-de-procesamiento-de-video)
- [Infraestructura](#infraestructura)
- [Primeros Pasos](#primeros-pasos)
  - [Requisitos Previos](#requisitos-previos)
  - [Instalación](#instalación)
- [Contribución](#contribución)
- [Licencia](#licencia)

---

## Descripción

**StreamFlow** es una plataforma de streaming diseñada específicamente para distribuir y gestionar antologías de video corto generados por inteligencia artificial. El proyecto está inspirado en el estilo narrativo y visual de series como *Love, Death & Robots*, donde cada episodio o video es una pieza independiente con su propia identidad visual y historia.

### Características Principales

- **Streaming HLS Adaptativo**: Entrega de video eficiente mediante HTTP Live Streaming con calidad adaptativa
- **Autoalojamiento Completo**: Control total sobre el contenido y la infraestructura
- **Procesamiento Automatizado**: Pipeline de transcodificación que convierte videos crudos a HLS listo para streaming
- **Gestión de Categorías**: Organización flexible de contenido por colecciones o temas
- **Autenticación Segura**: Integración con Google OAuth 2.0 para acceso seguro

### Caso de Uso

Esta plataforma es ideal para:

- Distribuidores de contenido AI-generated que buscan independencia de plataformas comerciales
- Estudios de producción digital que necesitan una solución de streaming privada
- Creadores de antologías visuales con requisitos específicos de infraestructura

---

## Identidad Visual

El proyecto utiliza una paleta de colores cyberpunk/dark con acentos neón morados, reflejando la estética futurista del contenido que distribuye.

### Paleta de Colores (Tailwind CSS)

| Token | Nombre | Hex | Uso |
|-------|--------|-----|-----|
| `background` | Deep Black | `#050505` | Fondo principal de la aplicación |
| `primary` | Electric Purple | `#A855F7` | Elementos interactivos principales, botones CTA |
| `secondary` | Magenta Glow | `#D946EF` | Acentos, estados hover, énfasis visual |
| `surface` | Dark Gray | `#121212` | Tarjetas, paneles, modales |
| `border` | Dark Border | `#262626` | Bordes de inputs, separadores |
| `text-primary` | White | `#FFFFFF` | Texto principal, headings |
| `text-secondary` | Gray | `#A1A1AA` | Texto secundario, labels, placeholders |

### Aplicación en Gradientes

```css
/* Gradiente radial para fondos de login */
background: radial-gradient(circle at center, rgba(168, 85, 247, 0.1) 0%, transparent 70%);

/* Gradiente sutil para botones primary */
background: linear-gradient(135deg, #A855F7 0%, #D946EF 100%);
```

---

## Stack Tecnológico

La arquitectura está construida sobre tecnologías modernas seleccionadas por su rendimiento, escalabilidad y compatibilidad.

### Vista General

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│                  React 19 + Next.js 15                      │
│                    (App Router)                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         API                                 │
│                  Deno 2.0 + Hono                           │
│              (Auth + Video Engine)                          │
└─────────────────────────────────────────────────────────────┘
         │              │                    │
         ▼              ▼                    ▼
┌─────────────┐  ┌─────────────┐    ┌─────────────────┐
│ PostgreSQL  │  │    Redis    │    │     MinIO       │
│    16       │  │     7       │    │  (S3 Compatible) │
└─────────────┘  └─────────────┘    └─────────────────┘
```

### Detalle por Componente

| Componente | Tecnología | Versión | Propósito |
|------------|------------|---------|-----------|
| **Frontend** | React + Next.js | React 19, Next.js 15 | UI/UX con App Router |
| **Backend** | Deno + Hono | Deno 2.0 | API RESTful ligera y rápida |
| **Base de Datos** | PostgreSQL | 16 | Almacenamiento relational |
| **Caché** | Redis | 7 | Sessiones, cache de queries |
| **Colas** | Redis | 7 | Jobs de procesamiento async |
| **Object Storage** | MinIO | - | Videos, segmentos HLS, thumbnails |
| **Player** | Shaka Player | - | Reproducción HLS en browser |
| **Transcoding** | FFmpeg | Latest | Conversión a HLS |
| **Auth** | Google OAuth | 2.0 | Autenticación de usuarios |
| **Reverse Proxy** | Nginx | - | SSL termination, caching |

---

## Arquitectura del Sistema

### Frontend

Estructura de rutas basada en Next.js App Router:

```
/login              → Pantalla de autenticación (Google OAuth)
/browse             → Feed principal con grid de videos
/watch/[id]         → Reproductor fullscreen
/admin/upload       → Panel de administración para upload
```

#### Diseño de Páginas

**`/login`**
- Botón "Sign in with Google"
- Fondo con gradiente radial `rgba(168, 85, 247, 0.1)`
- Centrado vertical y horizontal

**`/browse`**
- Grid responsive de cards de video
- Efecto hover con previsualización del video
- Filtros por categoría
- Búsqueda por título

**`/watch/[id]`**
- Reproductor Shaka Player a pantalla completa
- Controls nativos del player
- Información del video (título, descripción)
- Videos relacionados al final

**`/admin/upload`**
- Drag & drop para archivos MP4
- Selector de categoría
- Progreso de upload
- Estado de transcodificación

### Backend

API RESTful construida con Hono sobre Deno 2.0.

#### Endpoints

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/v1/health` | Health check del servicio | No |
| `GET` | `/v1/catalog` | Lista videos con URLs firmadas | Sí |
| `GET` | `/v1/catalog/:id` | Detalle de un video | Sí |
| `POST` | `/v1/admin/ingest` | Upload e inicio de transcodificación | Admin |
| `GET` | `/v1/categories` | Lista de categorías | Sí |
| `POST` | `/v1/auth/callback` | Callback Google OAuth | No |

#### Flujo de Autenticación

```
1. Usuario clickea "Sign in with Google"
2. Redirect a Google OAuth consent screen
3. Google retorna authorization code
4. Backend intercambia code por access token
5. Backend genera JWT para sesiones
6. Frontend almacena JWT en httpOnly cookie
7. Requests subsiguientes incluyen JWT
8. Auth middleware valida JWT en cada request
```

#### Video Engine

El motor de video se encarga de:
1. Recibir el video crudo en MinIO (bucket `raw-uploads`)
2. Ejecutar FFmpeg para transcodificar a HLS
3. Guardar segmentos y playlists en MinIO (bucket `production-vod`)
4. Generar miniatura del video
5. Actualizar registro en PostgreSQL
6. Limpiar archivos originales

---

## Esquema de Base de Datos

PostgreSQL 16 con configuración master-slave para alta disponibilidad.

```sql
-- Extensión para generación de UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla de categorías
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de videos (contenido principal)
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    hls_path TEXT NOT NULL,
    poster_path TEXT,
    duration INTEGER,
    file_size BIGINT,
    is_processed BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de usuarios (para control de acceso admin)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para optimización de queries
CREATE INDEX idx_videos_category ON videos(category_id);
CREATE INDEX idx_videos_processed ON videos(is_processed);
CREATE INDEX idx_videos_published ON videos(is_published);
CREATE INDEX idx_users_google ON users(google_id);
```

---

## Pipeline de Procesamiento de Video

Flujo completo desde que un usuario sube un video hasta que está disponible para streaming:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Upload     │ ──▶ │    MinIO     │ ──▶ │    Worker    │
│   (Frontend)  │     │ raw-uploads  │     │   (Deno)     │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                                                  ▼
                                         ┌──────────────┐
                                         │    FFmpeg    │
                                         │ Transcoding  │
                                         └──────────────┘
                                                  │
                     ┌──────────────┐     ┌──────────────┐
                     │    MinIO     │ ◀── │   Segments   │
                     │production-vod│     │   (.ts)      │
                     └──────────────┘     └──────────────┘
```

### Comando de Transcodificación

```bash
ffmpeg -i input.mp4 \
  -codec:v libx264 \
  -codec:a aac \
  -preset medium \
  -crf 23 \
  -hls_time 6 \
  -hls_playlist_type vod \
  -hls_segment_filename 'segment_%03d.ts' \
  -f hls \
  output.m3u8
```

### Buckets MinIO

| Bucket | Visibilidad | Contenido |
|--------|-------------|-----------|
| `raw-uploads` | Private | Videos originales recién subidos |
| `production-vod` | Public | Segmentos HLS y playlists .m3u8 |
| `thumbnails` | Public | Miniaturas de videos |

---

## Infraestructura

### Docker Compose

Un archivo `docker-compose.yml` en la raíz del proyecto levanta todos los servicios:

```bash
docker compose up -d
```

**Servicios:**
- **PostgreSQL 16** - Puerto 5432
- **Redis 7** - Puerto 6379
- **MinIO** - Puertos 9000 (API), 9001 (Console)

El servicio `minio-init` crea automáticamente los buckets necesarios:
- `raw-uploads` (privado)
- `production-vod` (público)
- `thumbnails` (público)

### Accesos MinIO
- **Console:** http://localhost:9001
- **Usuario:** streamflow
- **Contraseña:** streamflow123

---

## Primeros Pasos

### Requisitos Previos

| Requisito | Versión Mínima | Notas |
|-----------|----------------|-------|
| Node.js | 20+ | Para Next.js |
| Deno | 2.0 | Runtime del backend |
| Docker | 24+ | Contenedores |
| Docker Compose | 2.20+ | Orquestación |
| Cuenta Google Cloud | - | Para OAuth 2.0 |

### Instalación

1. **Clonar el repositorio**

```bash
git clone https://github.com/Heberjfet/StreamFlow.git
cd StreamFlow
```

2. **Iniciar servicios de infraestructura**

```bash
docker compose up -d
```

3. **Instalar dependencias frontend**

```bash
cd frontend && npm install
```

4. **Iniciar desarrollo frontend**

```bash
npm run dev
```

5. **En otra terminal, iniciar backend**

```bash
cd backend && deno install && deno task start
```

6. **Configurar Google OAuth (opcional)**

Crea un proyecto en [Google Cloud Console](https://console.cloud.google.com/) y añade las credenciales en `backend/.env`

---

## Contribución

Las contribuciones son bienvenidas. Por favor, lee las guías de contribución antes de enviar un pull request.

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

---

## Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más información.

---

**StreamFlow** — Tu plataforma de streaming, tu control.

*Construido con ❤️ para creadores de contenido AI-generated*
