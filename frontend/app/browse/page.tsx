'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { VideoCard } from '@/components/VideoCard';
import { useAuth } from '@/hooks/useAuth';
import { api, apiEndpoints } from '@/lib/api';
import type { Video, Category, CatalogResponse } from '@/types';

export default function BrowsePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [catalogData, categoriesData] = await Promise.all([
          api.get<CatalogResponse>(apiEndpoints.catalog, { params: { 
            page: 1, 
            page_size: 20,
            category: selectedCategory || undefined 
          }}),
          api.get<Category[]>(apiEndpoints.categories),
        ]);
        setVideos(catalogData.videos);
        setCategories(categoriesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el catálogo');
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, selectedCategory]);

  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary text-lg">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Explorar
          </h1>
          <p className="text-text-secondary">
            Bienvenido{user?.name ? `, ${user.name}` : ''}. Descubre antologías de video generadas por IA.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === null
                  ? 'bg-primary text-white'
                  : 'bg-surface text-text-secondary hover:text-text-primary border border-border'
              }`}
            >
              Todos
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-primary text-white'
                    : 'bg-surface text-text-secondary hover:text-text-primary border border-border'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-video bg-surface rounded-t-xl" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-surface rounded w-3/4" />
                  <div className="h-3 bg-surface rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary"
            >
              Reintentar
            </button>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary text-lg mb-4">
              No se encontraron videos
            </p>
            {user?.role === 'admin' && (
              <a href="/admin/upload" className="btn-primary inline-block">
                Subir el primer video
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
