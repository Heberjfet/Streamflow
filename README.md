# StreamFlow

Plataforma de streaming de video bajo demanda (VOD) con Inteligencia Artificial Generativa.

## Descripción

StreamFlow es una plataforma de streaming VOD basada en contenido generado mediante IA generativa de código abierto. El proyecto busca determinar la viabilidad técnica de implementar una plataforma de streaming escalable utilizando infraestructura cloud-native y modelos de IA generativa.

## Características

- Streaming adaptativo (HLS/DASH)
- Generación de video con IA (Stable Video Diffusion, Text-to-Video)
- Arquitectura de microservicios
- Transcodificación con FFmpeg
- Almacenamiento escalable (MinIO/S3 compatible)
- Autenticación JWT
- Monitoreo con Prometheus y Grafana

## Stack Tecnológico

### Backend
- **Lenguaje**: Python 3.11+ / Node.js 20+
- **Framework**: FastAPI (Python) / Express (Node)
- **Base de datos**: PostgreSQL 15+
- **Caché**: Redis 7+
- **Cola de mensajes**: RabbitMQ / Apache Kafka
- **Orquestación**: Docker + Kubernetes

### Frontend
- **Framework**: React 18+ / Next.js 14+
- **Video Player**: Video.js / Shaka Player
- **Estado**: Zustand / Redux Toolkit
- **Estilos**: Tailwind CSS

### IA Generativa
- Stable Video Diffusion (SVD)
- ModelScope Text-to-Video
- LLaVA / MiniGPT-V

## Arquitectura

```
Usuarios → CDN → API Gateway → Microservicios
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
            Video Processing     AI Generation     Storage
```

## Requisitos

- Docker y Docker Compose
- Kubernetes (para producción)
- PostgreSQL 15+
- Redis 7+
- RabbitMQ 3.12+
- MinIO (desarrollo) / S3 compatible (producción)

## Instalación

### Desarrollo Local

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/streamflow.git
cd streamflow
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

## Servicios

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| API | 8000 | API principal |
| Auth Service | 8001 | Autenticación JWT |
| Catalog Service | 8002 | Catálogo de videos |
| Video Processor | 8003 | Transcodificación FFmpeg |
| AI Generator | 8004 | Generación con IA |
| MinIO Console | 9001 | Consola de almacenamiento |
| Prometheus | 9090 | Monitoreo |
| Grafana | 3000 | Dashboards |

## API Endpoints

### Autenticación
- `POST /api/v1/auth/register` - Registrar usuario
- `POST /api/v1/auth/login` - Iniciar sesión
- `POST /api/v1/auth/refresh` - Refrescar token

### Catálogo
- `GET /api/v1/catalog/videos` - Listar videos
- `GET /api/v1/catalog/videos/:id` - Ver detalles
- `POST /api/v1/catalog/videos` - Subir video

### Streaming
- `GET /streams/:id/playlist.m3u8` - Playlist HLS

## Scripts Disponibles

```bash
# Desarrollo
docker-compose up -d              # Iniciar servicios
docker-compose logs -f           # Ver logs
docker-compose down              # Detener servicios

# Escalado
docker-compose up -d --scale video-processor=3

# Producción
kubectl apply -f k8s/            # Desplegar a K8s
kubectl get pods -n streamflow   # Ver pods
kubectl logs -f deployment/api   # Ver logs
```

## Costos Estimados

| Escenario | Usuarios | Costo/Mes |
|-----------|----------|-----------|
| Desarrollo | 10 | $20-30 |
| Pruebas | 100 | $50-80 |
| Producción pequeña | 1,000 | $150-250 |

## Métricas QoE

- **Startup Time**: < 2 segundos
- **Buffering Ratio**: < 5%
- **Latencia API**: < 200ms

## Contribución

1. Fork del repositorio
2. Crear branch (`git checkout -b feature/amazing-feature`)
3. Commit cambios (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Abrir Pull Request

## Licencia

MIT License - Ver LICENSE para más detalles.

---

Universidad Autónoma de Chiapas - Facultad de Contaduría y Administración - Licenciatura en Ingeniería en Desarrollo y Tecnologías de Software - 2026