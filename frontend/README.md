# Frontend - StreamFlow

## Stack

- **React 19** con **Next.js 15** (App Router)
- **TypeScript** para tipado estático
- **Tailwind CSS** para estilos (configurado con la paleta de colores de StreamFlow)
- **Shaka Player** para reproducción HLS

## Estructura de Carpetas

```
frontend/
├── app/                    # Next.js App Router
│   ├── login/              # Página de autenticación
│   ├── browse/             # Feed principal de videos
│   ├── watch/[id]/         # Reproductor de video
│   ├── admin/upload/        # Panel de upload (admin)
│   ├── layout.tsx          # Layout raíz
│   ├── page.tsx            # Página de inicio (redirect)
│   └── globals.css         # Estilos globales + Tailwind
├── components/             # Componentes reutilizables
│   ├── Navbar.tsx          # Barra de navegación
│   ├── VideoCard.tsx      # Card de video con hover preview
│   └── ShakaPlayer.tsx    # Wrapper para Shaka Player
├── hooks/                  # Custom React hooks
│   └── useAuth.ts         # Hook de autenticación
├── lib/                    # Utilidades
│   ├── api.ts             # Cliente API
│   └── utils.ts           # Funciones helper
├── types/                  # Definiciones TypeScript
│   └── index.ts           # Tipos principales
└── package.json
```

## Scripts

```bash
npm install          # Instalar dependencias
npm run dev          # Desarrollo
npm run build        # Build de producción
npm run start        # Iniciar servidor de producción
npm run lint         # Verificar código
npm run typecheck    # Verificación de tipos
```

## Variables de Entorno

Ver `.env.example` para las variables requeridas:

- `NEXT_PUBLIC_API_URL` - URL del backend
