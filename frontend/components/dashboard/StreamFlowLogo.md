# StreamFlowLogo Component

Componente individual para el logo de StreamFlow usado en el dashboard.

## 📍 Ubicación
`/components/dashboard/StreamFlowLogo.tsx`

## 🎯 Propósito
Logo clickeable que redirige al usuario al dashboard desde cualquier página.

## 🎨 Diseño
- **Estilo:** Texto con gradiente (primary → secondary)
- **Tipografía:** Font bold, 2xl
- **Colores:** Gradiente de #A855F7 (Electric Purple) a #D946EF (Magenta Glow)
- **Interacción:** Efecto hover con opacity-80

## 🔗 Funcionalidad
- Siempre redirige a `/dashboard`
- Funciona desde cualquier página del dashboard
- Mantiene el mismo diseño que la landing page

## 💡 Uso

```tsx
import { StreamFlowLogo } from '@/components/dashboard/StreamFlowLogo';

export function MyComponent() {
  return (
    <nav>
      <StreamFlowLogo />
      {/* resto del navbar */}
    </nav>
  );
}
```

## ✅ Características
- ✅ Componente reutilizable
- ✅ Consistente con la identidad visual
- ✅ Totalmente clickeable
- ✅ Efecto hover suave
- ✅ Sin dependencias adicionales
