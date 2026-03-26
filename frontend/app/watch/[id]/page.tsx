'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/Navbar';
import { VideoCard } from '@/components/VideoCard';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, apiEndpoints } from '@/lib/api';
import type { Video, CatalogResponse } from '@/types';
import { formatDuration } from '@/lib/utils';

const ShakaPlayer = dynamic(() => import('@/components/ShakaPlayer'), {
  ssr: false,
  loading: () => (
    <div className="aspect-video bg-surface rounded-xl flex items-center justify-center">
      <div className="animate-pulse text-primary">Cargando reproductor...</div>
    </div>
  ),
});

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    async function fetchVideo() {
      try {
        setLoading(true);
        const videoId = params.id as string;
        const token = localStorage.getItem('auth_token') || '';
        
        const [videoData, catalogData] = await Promise.all([
          apiClient.get<Video>(apiEndpoints.catalogById(videoId), token),
          apiClient.get<CatalogResponse>(apiEndpoints.catalog, token, { params: { page_size: 4 }}),
        ]);
        
        setVideo(videoData);
        setRelatedVideos(catalogData.videos.filter((v) => v.id !== videoId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el video');
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated && params.id) {
      fetchVideo();
    }
  }, [isAuthenticated, params.id]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary text-lg">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error || !video) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Video no encontrado'}</p>
          <button onClick={() => router.back()} className="btn-secondary">
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>

          <div className="aspect-video bg-black rounded-xl overflow-hidden">
            {showPlayer && video.is_processed ? (
              <ShakaPlayer src={video.hls_path} poster={video.poster_path || undefined} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-surface">
                {!video.is_processed ? (
                  <>
                    <div className="animate-pulse text-secondary text-lg mb-2">Video en procesamiento</div>
                    <p className="text-text-secondary text-sm">Este video se reproducirá cuando esté listo</p>
                  </>
                ) : (
                  <button
                    onClick={() => setShowPlayer(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Reproducir
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h1 className="text-2xl font-bold text-text-primary mb-2">{video.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-text-secondary">
              {video.duration && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatDuration(video.duration)}
                </span>
              )}
              {video.category && (
                <span className="px-2 py-1 rounded bg-primary/20 text-primary">
                  {video.category.name}
                </span>
              )}
              <span>
                {new Date(video.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>

            {video.description && (
              <div className="bg-surface rounded-xl p-6 border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-2">Descripción</h3>
                <p className="text-text-secondary whitespace-pre-wrap">{video.description}</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Más videos</h3>
            <div className="space-y-4">
              {relatedVideos.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
