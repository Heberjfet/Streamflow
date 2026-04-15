'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import {
  Video,
  Users,
  FolderOpen,
  Activity,
  Eye,
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react';

interface Stats {
  videos: {
    total: number;
    published: number;
    processing: number;
    failed: number;
    totalViews: number;
  };
  users: {
    total: number;
    active: number;
    admins: number;
    uploaders: number;
    viewers: number;
    activeLast7Days: number;
  };
  categories: number;
  recentActivity: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const data = await apiClient.get<Stats>('/v1/admin/stats', token || '');
      setStats(data);
    } catch (err) {
      setError('Error al cargar estadísticas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-primary">Cargando...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400">
        <AlertCircle size={20} className="mr-2" />
        {error || 'Error al cargar'}
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Videos',
      value: stats.videos.total,
      icon: Video,
      color: 'from-primary to-purple-600',
      subtext: `${stats.videos.published} publicados`,
    },
    {
      label: 'Total Usuarios',
      value: stats.users.total,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      subtext: `${stats.users.active} activos`,
    },
    {
      label: 'Categorías',
      value: stats.categories,
      icon: FolderOpen,
      color: 'from-green-500 to-emerald-500',
      subtext: 'Activas',
    },
    {
      label: 'Vistas Totales',
      value: stats.videos.totalViews.toLocaleString(),
      icon: Eye,
      color: 'from-orange-500 to-amber-500',
      subtext: 'Reproducciones',
    },
  ];

  const processingVideos = stats.videos.processing + stats.videos.failed;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary">Resumen del sistema StreamFlow</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-surface border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}
                >
                  <Icon size={24} className="text-white" />
                </div>
                <TrendingUp size={20} className="text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-text-primary">{card.value}</h3>
              <p className="text-text-secondary text-sm">{card.label}</p>
              <p className="text-text-secondary/60 text-xs mt-1">{card.subtext}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Activity size={20} className="text-primary" />
            Estado de Videos
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-text-secondary">Publicados</span>
              </div>
              <span className="text-text-primary font-medium">{stats.videos.published}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-text-secondary">Procesando</span>
              </div>
              <span className="text-text-primary font-medium">{stats.videos.processing}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-text-secondary">Fallidos</span>
              </div>
              <span className="text-text-primary font-medium">{stats.videos.failed}</span>
            </div>
          </div>
          {processingVideos > 0 && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-400 text-sm">
                {processingVideos} video(s) requieren atención
              </p>
            </div>
          )}
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Users size={20} className="text-primary" />
            Distribución de Usuarios
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-text-secondary">Administradores</span>
              </div>
              <span className="text-text-primary font-medium">{stats.users.admins}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-text-secondary">Subidores</span>
              </div>
              <span className="text-text-primary font-medium">{stats.users.uploaders}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
                <span className="text-text-secondary">Espectadores</span>
              </div>
              <span className="text-text-primary font-medium">{stats.users.viewers}</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 text-primary text-sm">
              <Clock size={16} />
              <span>{stats.users.activeLast7Days} usuarios activos esta semana</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Actividad Reciente</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Activity size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-text-primary font-medium">{stats.recentActivity}</p>
              <p className="text-text-secondary text-sm">Eventos en 24 horas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
