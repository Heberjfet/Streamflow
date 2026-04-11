'use client';

// Mock de datos para videos recientes
const mockRecentVideos = [
  {
    id: '1',
    title: 'El Último Viaje',
    thumbnail: 'https://picsum.photos/seed/video1/400/225',
    duration: '12:45',
    progress: 65,
  },
  {
    id: '2',
    title: 'Neón y Sombras',
    thumbnail: 'https://picsum.photos/seed/video2/400/225',
    duration: '8:30',
    progress: 100,
  },
  {
    id: '3',
    title: 'Código Infinito',
    thumbnail: 'https://picsum.photos/seed/video3/400/225',
    duration: '15:20',
    progress: 32,
  },
];

// Mock de recomendaciones
const mockRecommended = [
  {
    id: '4',
    title: 'Despertar Digital',
    thumbnail: 'https://picsum.photos/seed/rec1/400/225',
    category: 'Ciencia Ficción',
  },
  {
    id: '5',
    title: 'Los Guardianes',
    thumbnail: 'https://picsum.photos/seed/rec2/400/225',
    category: 'Acción',
  },
  {
    id: '6',
    title: 'Ecos del Pasado',
    thumbnail: 'https://picsum.photos/seed/rec3/400/225',
    category: 'Drama',
  },
  {
    id: '7',
    title: 'Realidad Aumentada',
    thumbnail: 'https://picsum.photos/seed/rec4/400/225',
    category: 'Tech',
  },
];

export function DashboardMain() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header de bienvenida */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Bienvenido de vuelta
        </h1>
        <p className="text-text-secondary">
            Continúa donde lo dejaste o descubre algo nuevo
          </p>
        </div>

        {/* Sección: Continuar viendo */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-text-primary">
              Continuar viendo
            </h2>
            <button className="text-sm text-primary hover:text-secondary transition-colors">
              Ver todo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockRecentVideos.map((video) => (
              <div
                key={video.id}
                className="group cursor-pointer"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-surface">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                      <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>

                  {/* Duración */}
                  <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/80 text-xs font-medium text-white">
                    {video.duration}
                  </div>

                  {/* Barra de progreso */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface/50">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${video.progress}%` }}
                    />
                  </div>
                </div>

                <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors">
                  {video.title}
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                  {video.progress}% completado
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Sección: Estadísticas rápidas */}
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-surface rounded-xl p-6 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">24</p>
                  <p className="text-sm text-text-secondary">Videos vistos</p>
                </div>
              </div>
            </div>

            <div className="glass-surface rounded-xl p-6 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">12.5h</p>
                  <p className="text-sm text-text-secondary">Tiempo total</p>
                </div>
              </div>
            </div>

            <div className="glass-surface rounded-xl p-6 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">8</p>
                  <p className="text-sm text-text-secondary">Favoritos</p>
                </div>
              </div>
            </div>

            <div className="glass-surface rounded-xl p-6 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">3</p>
                  <p className="text-sm text-text-secondary">Listas creadas</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sección: Recomendaciones */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-text-primary">
              Recomendado para ti
            </h2>
            <button className="text-sm text-primary hover:text-secondary transition-colors">
              Actualizar
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mockRecommended.map((video) => (
              <div
                key={video.id}
                className="group cursor-pointer"
              >
                <div className="relative aspect-video rounded-lg overflow-hidden mb-2 bg-surface">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                      <svg className="w-5 h-5 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <h3 className="font-medium text-sm text-text-primary group-hover:text-primary transition-colors line-clamp-1">
                  {video.title}
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  {video.category}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Sección: Acciones rápidas */}
        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-6">
            Acciones rápidas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="glass-surface rounded-xl p-6 border border-white/5 hover:border-primary/30 transition-all text-left group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary mb-1 group-hover:text-primary transition-colors">
                    Explorar Catálogo
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Descubre nuevas antologías generadas por IA
                  </p>
                </div>
              </div>
            </button>

            <button className="glass-surface rounded-xl p-6 border border-white/5 hover:border-primary/30 transition-all text-left group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-surface border border-white/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary mb-1 group-hover:text-primary transition-colors">
                    Ajustar Preferencias
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Personaliza tu experiencia de streaming
                  </p>
                </div>
              </div>
            </button>

            <button className="glass-surface rounded-xl p-6 border border-white/5 hover:border-primary/30 transition-all text-left group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-surface border border-white/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary mb-1 group-hover:text-primary transition-colors">
                    Crear Nueva Lista
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Organiza tus videos favoritos
                  </p>
                </div>
              </div>
            </button>
          </div>
        </section>
    </div>
  );
}
