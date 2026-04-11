# Dashboard del Usuario - StreamFlow

Esta es la página principal dedicada al usuario después de iniciar sesión.

## 📍 Ubicación
**URL:** `/dashboard`

## 🎯 Propósito
Página de inicio personalizada para el usuario que muestra:
- Videos recientes con progreso de visualización
- Estadísticas de actividad (videos vistos, tiempo total, favoritos)
- Recomendaciones personalizadas
- Acciones rápidas

## 🧩 Componentes

### 1. UserNavbar (`/components/dashboard/UserNavbar.tsx`)
Barra de navegación superior con:
- Logo de StreamFlow
- Links de navegación (Inicio, Explorar, Favoritos)
- Búsqueda rápida
- Notificaciones
- Avatar de usuario con dropdown

### 2. UserSidebar (`/components/dashboard/UserSidebar.tsx`)
Sidebar izquierdo con:
- Menú organizado por secciones:
  - **Principal:** Inicio, Explorar, Historial
  - **Mi Contenido:** Favoritos, Mis Listas, Ver Más Tarde
  - **Personalización:** Preferencias, Mi Perfil
- Estadísticas rápidas (videos vistos, horas totales)

### 3. DashboardMain (`/components/dashboard/DashboardMain.tsx`)
Contenido principal con:
- **Continuar viendo:** Videos con barra de progreso
- **Estadísticas:** Cards con métricas del usuario
- **Recomendaciones:** Grid de videos sugeridos
- **Acciones rápidas:** Botones para acciones comunes

## 🔧 Estado Actual: MOCK MODE

### Datos Mockeados
Actualmente la página funciona con datos de prueba (mocks) en:
- `lib/mockData.ts` - Usuario y token de autenticación
- `components/dashboard/DashboardMain.tsx` - Videos y estadísticas

### Para Producción
Cuando el backend esté listo, descomentar el código en:

1. **`app/dashboard/page.tsx`** (líneas 3-25):
```typescript
// ## Descomentar cuando el backend esté listo
// import { useAuth } from '@/hooks/useAuth';
// const { isAuthenticated, isLoading } = useAuth();
// ... validación de autenticación
```

2. **`components/dashboard/UserNavbar.tsx`** (línea 2):
```typescript
// ## Descomentar cuando el backend esté listo
// import { useAuth } from '@/hooks/useAuth';
// const { user, logout } = useAuth();
```

3. **Eliminar mocks:**
- Remover `MockAuthProvider` de `app/layout.tsx`
- Eliminar archivo `lib/mockData.ts`
- Reemplazar datos mock en `DashboardMain.tsx` con llamadas a API

## 🎨 Diseño

Mantiene la identidad visual del proyecto:
- **Colores:** Electric Purple (#A855F7), Magenta Glow (#D946EF)
- **Estética:** Cyberpunk/Dark con efectos glass morphism
- **Fuente:** Outfit (Google Fonts)

## 🚀 Navegación

Después del login, el usuario es redirigido automáticamente a `/dashboard`.

Desde aquí puede acceder a:
- `/browse` - Catálogo completo de videos
- `/watch/[id]` - Reproductor de video
- `/dashboard/*` - Subsecciones (favoritos, historial, etc.)

## ⚠️ Notas Importantes

1. **Todo el código de validación backend está comentado con `##`**
2. **Los mocks solo se activan en modo desarrollo**
3. **No se modificaron las rutas existentes** (browse, watch, login)
4. **La funcionalidad de los botones es visual**, no hay lógica implementada

## 📝 Próximos Pasos

Para integrar con el backend:
1. Implementar endpoints para estadísticas de usuario
2. Crear sistema de historial de visualización
3. Implementar sistema de favoritos y listas
4. Agregar preferencias de usuario
5. Conectar recomendaciones con IA
