'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import {
  Video,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Eye,
  X,
  Check,
  AlertCircle,
  Play
} from 'lucide-react';

interface Video {
  id: string;
  title: string;
  description: string | null;
  hls_path: string;
  poster_path: string | null;
  duration: number | null;
  status: string;
  is_processed: boolean;
  is_published: boolean;
  view_count: number;
  created_at: string;
  category_name: string | null;
  uploader_name: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editPublished, setEditPublished] = useState(false);

  useEffect(() => {
    fetchVideos(1);
  }, [statusFilter]);

  const fetchVideos = async (page: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const data = await apiClient.get<{ videos: Video[]; pagination: Pagination }>(
        `/v1/admin/videos?${params.toString()}`,
        token || ''
      );
      setVideos(data.videos);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVideos(1);
  };

  const handleEdit = (video: Video) => {
    setSelectedVideo(video);
    setEditStatus(video.status);
    setEditPublished(video.is_published);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedVideo) return;
    try {
      const token = localStorage.getItem('auth_token');
      await apiClient.put(
        `/v1/admin/videos/${selectedVideo.id}`,
        { status: editStatus, is_published: editPublished },
        token || ''
      );
      setShowEditModal(false);
      fetchVideos(pagination?.page || 1);
    } catch (err) {
      console.error('Error updating video:', err);
      alert('Error al actualizar video');
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm('¿Estás seguro de eliminar este video?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      await apiClient.delete(`/v1/admin/videos/${videoId}`, token || '');
      fetchVideos(pagination?.page || 1);
    } catch (err) {
      console.error('Error deleting video:', err);
      alert('Error al eliminar video');
    }
  };

  const getStatusBadge = (status: string, isPublished: boolean) => {
    if (status === 'published' || isPublished) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
          <Check size={12} /> Publicado
        </span>
      );
    }
    const statusConfig: Record<string, { bg: string; text: string }> = {
      processing: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
      ready: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
      failed: { bg: 'bg-red-500/20', text: 'text-red-400' },
      deleted: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
    };
    const config = statusConfig[status] || statusConfig.processing;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${config.bg} ${config.text}`}>
        {status}
      </span>
    );
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Videos</h1>
        <p className="text-text-secondary">Gestiona los videos del sistema</p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="Buscar por título..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
          >
            <option value="">Todos los estados</option>
            <option value="published">Publicados</option>
            <option value="ready">Listos</option>
            <option value="processing">Procesando</option>
            <option value="failed">Fallidos</option>
            <option value="deleted">Eliminados</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
          >
            Buscar
          </button>
        </form>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-background border-b border-border">
            <tr>
              <th className="text-left px-6 py-3 text-text-secondary text-sm font-medium">Video</th>
              <th className="text-left px-6 py-3 text-text-secondary text-sm font-medium">Estado</th>
              <th className="text-left px-6 py-3 text-text-secondary text-sm font-medium">Duración</th>
              <th className="text-left px-6 py-3 text-text-secondary text-sm font-medium">Vistas</th>
              <th className="text-left px-6 py-3 text-text-secondary text-sm font-medium">Categoría</th>
              <th className="text-right px-6 py-3 text-text-secondary text-sm font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-text-secondary">
                  Cargando...
                </td>
              </tr>
            ) : videos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-text-secondary">
                  No se encontraron videos
                </td>
              </tr>
            ) : (
              videos.map((video) => (
                <tr key={video.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {video.poster_path ? (
                        <img
                          src={video.poster_path}
                          alt={video.title}
                          className="w-16 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-16 h-10 rounded bg-primary/20 flex items-center justify-center">
                          <Video size={20} className="text-primary" />
                        </div>
                      )}
                      <div>
                        <p className="text-text-primary font-medium line-clamp-1">{video.title}</p>
                        <p className="text-text-secondary text-xs">{video.uploader_name || 'Sin subir'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(video.status, video.is_published)}</td>
                  <td className="px-6 py-4 text-text-secondary">{formatDuration(video.duration)}</td>
                  <td className="px-6 py-4 text-text-secondary">{video.view_count.toLocaleString()}</td>
                  <td className="px-6 py-4 text-text-secondary">{video.category_name || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(video)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-text-secondary hover:text-primary"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(video.id)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-text-secondary hover:text-red-400"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-text-secondary text-sm">
            Mostrando {(pagination.page - 1) * pagination.limit + 1} a{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchVideos(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-text-primary">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchVideos(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {showEditModal && selectedVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-text-primary">Editar Video</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-text-secondary text-sm mb-1">Título</p>
                <p className="text-text-primary">{selectedVideo.title}</p>
              </div>

              <div>
                <label className="block text-text-secondary text-sm mb-1">Estado</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                >
                  <option value="processing">Procesando</option>
                  <option value="ready">Listo</option>
                  <option value="published">Publicado</option>
                  <option value="failed">Fallido</option>
                  <option value="deleted">Eliminado</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={editPublished}
                  onChange={(e) => setEditPublished(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                <label htmlFor="isPublished" className="text-text-secondary text-sm">
                  Publicar video
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-text-secondary hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
