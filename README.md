# StreamFlow

Plataforma de streaming de video bajo demanda (VOD) con Inteligencia Artificial Generativa.

---

## Descripción

StreamFlow es una plataforma de streaming VOD basada en contenido generado mediante IA generativa de código abierto. El proyecto busca determinar la viabilidad técnica, económica y operativa de implementar una plataforma de streaming escalable utilizando infraestructura cloud-native y modelos de IA generativa.

### Objetivos del Proyecto

- Desarrollar un prototipo funcional de plataforma de streaming adaptativo
- Evaluar la viabilidad técnica de integrar modelos de IA generativa de video
- Analizar la escalabilidad y costos operativos en infraestructura cloud
- Implementar mecanismos de protección de contenido (DRM)
- Medir calidad de experiencia (QoE) del usuario

---

## Características

- Streaming adaptativo (HLS/DASH) con múltiples calidades
- Generación de video con IA (Stable Video Diffusion, Text-to-Video)
- Arquitectura de microservicios cloud-native
- Transcodificación con FFmpeg multiresolución
- Almacenamiento escalable (MinIO/S3 compatible)
- Autenticación JWT con tokens de corta duración
- CDN integrado (Cloudflare/Azure Front Door/AWS CloudFront)
- Monitoreo con Prometheus y Grafana
- Message Queue para procesamiento asíncrono (RabbitMQ/Kafka)

---

## Stack Tecnológico

### Backend

| Componente | Tecnología | Justificación |
|------------|------------|---------------|
| Lenguaje | Python 3.11+ / Node.js 20+ | Excelente soporte para IA, gran ecosistema |
| Framework API | FastAPI (Python) / Express (Node) | Alto rendimiento, documentación automática |
| Orquestación | Docker + Kubernetes | Estándar de la industria para cloud-native |
| Message Queue | RabbitMQ / Apache Kafka | Procesamiento asíncrono de videos |
| Caché | Redis | Sesiones, caché de respuestas, rate limiting |

### Frontend

| Componente | Tecnología | Justificación |
|------------|------------|---------------|
| Framework | React 18+ / Next.js 14+ | SSR para SEO, gran ecosistema |
| Video Player | Video.js / Shaka Player | Soporte HLS/DASH, DRM |
| Estado | Zustand / Redux Toolkit | Gestión de estado simple y escalable |
| Estilos | Tailwind CSS | Desarrollo rápido, consistencia |
| UI Components | Radix UI / Headless UI | Accesibles, personalizables |

### Base de Datos

| Tipo | Tecnología | Uso |
|------|------------|-----|
| Relacional | PostgreSQL 15+ | Usuarios, catálogos, metadatos |
| Documentos | MongoDB (opcional) | Logs, analytics, metadata flexible |
| Caché | Redis 7+ | Sesiones, caché, colas |
| Object Storage | MinIO / Wasabi / Backblaze B2 | Almacenamiento de videos |

### IA Generativa

| Modelo | Proveedor/Repo | Uso |
|--------|----------------|-----|
| Stable Video Diffusion (SVD) | Stability AI | Generación de video desde imágenes |
| Text-to-Video | ModelScope / RunDiffusion | Generación de video desde texto |
| SVD-XT | Stability AI (extendido) | Videos de mayor duración |
| LLaVA / MiniGPT-V | ModelScope | Análisis y descripción de video |

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USUARIOS FINALES                                │
│                    (Web, Móvil, Smart TV, Desktop)                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CDN (Content Delivery Network)                    │
│                    Cloudflare / Azure Front Door / AWS CloudFront           │
│                    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│                    │   Edge 1    │  │   Edge 2    │  │   Edge N    │       │
│                    │   (Caché)  │  │   (aché)  │  │   (Caché)  │       │
│                    └─────────────┘  └─────────────┘  └─────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY / LOAD BALANCER                         │
│                            (Nginx / Traefik)                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
         ┌───────────────┬───────────────┬───────────────┬───────────────┐
         ▼               ▼               ▼               ▼               ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│   Auth Svc    │ │  Catalog Svc  │ │  Player Svc   │ │  Billing Svc  │
│  (JWT/Auth)   │ │  (Videos)     │ │  (HLS/DASH)   │ │   (Opcional)  │
└───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘
         │               │               │               │
         └───────────────┴───────────────┴───────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MESSAGE QUEUE (RabbitMQ / Kafka)                     │
└─────────────────────────────────────────────────────────────────────────────┘
                     ┌─────────────────┼─────────────────┐
                     ▼                 ▼                 ▼
┌─────────────────────────┐ ┌─────────────────────────┐ ┌─────────────────────────┐
│   Video Processing      │ │   AI Generation         │ │   Storage               │
│   (Transcoding)         │ │   Service               │ │   (Object Storage)     │
│   ┌─────────────┐       │ │   ┌─────────────┐       │ │   ┌───────────┐         │
│   │   FFmpeg   │       │ │   │   SVD /     │       │ │   │  MinIO    │         │
│   │   Workers  │       │ │   │   Model     │       │ │   │  / Wasabi │         │
│   └─────────────┘       │ │   └─────────────┘       │ │   └───────────┘         │
└─────────────────────────┘ └─────────────────────────┘ └─────────────────────────┘
```

---

## Requisitos

- Docker y Docker Compose
- Kubernetes (para producción)
- PostgreSQL 15+
- Redis 7+
- RabbitMQ 3.12+
- MinIO (desarrollo) / S3 compatible (producción)
- GPU con CUDA 12.1+ (para servicio de IA)

---

## Instalación

### Desarrollo Local

1. Clonar el repositorio:
```bash
git clone https://github.com/Heberjfet/Streamflow.git
cd Streamflow
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

3. Iniciar servicios con Docker Compose:
```bash
docker-compose up -d
```

4. Verificar servicios:
```bash
docker-compose ps
docker-compose logs -f api
```

### Producción con Kubernetes

```bash
kubectl apply -f k8s/
kubectl scale deployment api-deployment --replicas=5
```

---

## Variables de Entorno

```bash
# .env.example

# Base de datos
DB_PASSWORD=your_secure_password_here
DATABASE_URL=postgresql://streamflow:password@postgres:5432/streamflow

# Redis
REDIS_URL=redis://redis:6379

# RabbitMQ
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=your_rabbitmq_password

# MinIO / Object Storage
MINIO_USER=minioadmin
MINIO_PASSWORD=minioadmin
MINIO_ENDPOINT=localhost:9000

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRATION_HOURS=4

# Cloud (opcional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1

# Grafana
GRAFANA_PASSWORD=admin123
```

---

## Servicios

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| API | 8000 | API principal |
| Auth Service | 8001 | Autenticación JWT |
| Catalog Service | 8002 | Catálogo de videos |
| Video Processor | 8003 | Transcodificación FFmpeg |
| AI Generator | 8004 | Generación con IA |
| PostgreSQL | 5432 | Base de datos principal |
| RabbitMQ | 5672 | Cola de mensajes |
| RabbitMQ Manager | 15672 | Interfaz de gestión |
| MinIO API | 9000 | API de almacenamiento |
| MinIO Console | 9001 | Consola de almacenamiento |
| Prometheus | 9090 | Monitoreo |
| Grafana | 3000 | Dashboards |

---

## API Endpoints

### Autenticación
- `POST /api/v1/auth/register` - Registrar usuario
- `POST /api/v1/auth/login` - Iniciar sesión
- `POST /api/v1/auth/refresh` - Refrescar token
- `GET /api/v1/auth/me` - Obtener usuario actual

### Catálogo
- `GET /api/v1/catalog/videos` - Listar videos
- `GET /api/v1/catalog/videos/:id` - Ver detalles
- `POST /api/v1/catalog/videos` - Subir video
- `DELETE /api/v1/catalog/videos/:id` - Eliminar video

### Streaming
- `GET /streams/:id/playlist.m3u8` - Playlist HLS
- `GET /streams/:id/:resolution/segment_*.ts` - Segmentos de video

### Generación IA
- `POST /api/v1/ai/generate/image-to-video` - Generar video desde imagen
- `POST /api/v1/ai/generate/text-to-video` - Generar video desde texto
- `GET /api/v1/ai/generate/status/:job_id` - Ver estado de generación

---

## Plan de Implementación

| Fase | Duración | Entregables |
|------|----------|-------------|
| **Fase 1: Fundamentos** | 2 semanas | Docker Compose, DB, API básica |
| **Fase 2: Video Processing** | 3 semanas | Pipeline transcodificación, HLS |
| **Fase 3: IA Generativa** | 3 semanas | Integración modelo SVD |
| **Fase 4: Streaming** | 2 semanas | Player, DRM, CDN |
| **Fase 5: Monitoreo** | 1 semana | Prometheus, Grafana |
| **Fase 6: Pruebas** | 2 semanas | Pruebas de carga, QoE |

---

## Scripts Disponibles

```bash
# Desarrollo
docker-compose up -d              # Iniciar servicios
docker-compose logs -f           # Ver logs
docker-compose down              # Detener servicios
docker-compose ps                # Ver estado

# Escalado
docker-compose up -d --scale video-processor=3

# Producción
kubectl apply -f k8s/            # Desplegar a K8s
kubectl get pods -n streamflow   # Ver pods
kubectl logs -f deployment/api   # Ver logs
kubectl scale deployment api-deployment --replicas=5
```

---

## Proveedores Cloud Recomendados

| Servicio | Proveedor | Costo Estimado/Mes | Notas |
|----------|-----------|-------------------|-------|
| **Compute (API)** | DigitalOcean | $20-40/mes | Droplet 2GB |
| **Kubernetes** | AWS EKS / Azure AKS | $70-150/mes | 3 nodos |
| **Object Storage** | Wasabi | $5.99/TB/mes | Sin egress |
| **Object Storage** | Backblaze B2 | $6.00/TB/mes | Sin egress |
| **Object Storage** | AWS S3 | ~$23/TB/mes | Con egress |
| **CDN** | Cloudflare | $0-20/mes | Gratuito hasta 1TB |
| **Base de Datos** | Supabase | $0-25/mes | Plan free + Pro |
| **GPU (Inference)** | RunPod / Paperspace | $0.50-2.00/hora | On-demand |
| **Dominio** | Namecheap/Cloudflare | $10-15/año | .com |

---

## Costos Estimados

| Escenario | Usuarios | Costo/Mes | Costo/Usuario |
|-----------|----------|-----------|---------------|
| **Desarrollo** | 10 | $20-30 | $2.00-3.00 |
| **Pruebas** | 100 | $50-80 | $0.50-0.80 |
| **Producción pequeña** | 1,000 | $150-250 | $0.15-0.25 |
| **Producción media** | 10,000 | $500-800 | $0.05-0.08 |
| **Producción grande** | 100,000 | $2,000-3,000 | $0.02-0.03 |

### Optimización de Costos

1. **Uso de Serverless**: Solo pagar por uso real
2. **Spot Instances**: Hasta 90% descuento en instancias GPU
3. **Caché CDN**: Reducir costos de egress
4. **Almacenamiento frío**: Mover videos antiguos a storage de bajo costo
5. **Auto-scaling**: Escalar a cero cuando no hay demanda

---

## Métricas QoE (Quality of Experience)

| Métrica | Objetivo | Descripción |
|---------|----------|-------------|
| **Startup Time** | < 2 segundos | Tiempo hasta primer frame |
| **Buffering Ratio** | < 5% | Porcentaje de tiempo en buffering |
| **Bitrate Promedio** | > 720p | Calidad visual media |
| **Rebuffer Events** | < 1 por sesión | Interrupciones de reproducción |
| **Latencia API** | < 200ms | Tiempo de respuesta del backend |
| **Error Rate** | < 0.1% | Tasa de errores en streaming |

---

## Consideraciones de Seguridad

- Implementar JWT con expiración corta (4 horas)
- Usar HTTPS en todas las comunicaciones
- Implementar rate limiting para prevenir ataques
- Encriptar contenido sensible con DRM
- Rotar claves y secretos regularmente
- Validación de entrada en todos los endpoints
- Logging de auditoria para acciones sensibles

---

## Contribución

1. Fork del repositorio
2. Crear branch (`git checkout -b feature/amazing-feature`)
3. Commit cambios (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Abrir Pull Request

---

## Licencia

MIT License - Ver LICENSE para más detalles.

---

##Contacto

- **Desarrollador**: Heber Jfet
- **Universidad**: Universidad Autónoma de Chiapas
- **Facultad**: Contaduría y Administración
- **Carrera**: Ingeniería en Desarrollo y Tecnologías de Software
- **Año**: 2026