'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import {
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface AuditLog {
  id: string;
  table_name: string;
  action: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  user_id: string | null;
  user_email: string | null;
  ip_address: string | null;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminAudit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableFilter, setTableFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchLogs(1);
  }, [tableFilter, actionFilter]);

  const fetchLogs = async (page: number) => {
    try {
      setLoading(true);
      const token = localStorage.get_item('auth_token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (tableFilter) params.append('table', tableFilter);
      if (actionFilter) params.append('action', actionFilter);

      const data = await apiClient.get<{ logs: AuditLog[]; pagination: Pagination }>(
        `/v1/admin/audit?${params.toString()}`,
        token || ''
      );
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    if (!confirm('¿Estás seguro de limpiar logs antiguos (más de 90 días)?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      await apiClient.delete('/v1/admin/audit/cleanup?days=90', token || '');
      alert('Logs antiguos eliminados');
      fetchLogs(1);
    } catch (err) {
      console.error('Error cleaning up logs:', err);
      alert('Error al limpiar logs');
    }
  };

  const getActionBadge = (action: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      INSERT: { bg: 'bg-green-500/20', text: 'text-green-400' },
      UPDATE: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
      DELETE: { bg: 'bg-red-500/20', text: 'text-red-400' },
      SELECT: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
      LOGIN: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
      LOGOUT: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
    };
    const badge = badges[action] || { bg: 'bg-gray-500/20', text: 'text-gray-400' };
    return (
      <span className={`inline-flex px-2 py-1 rounded-full text-xs ${badge.bg} ${badge.text}`}>
        {action}
      </span>
    );
  };

  const formatJson = (data: Record<string, unknown> | null) => {
    if (!data) return 'N/A';
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Auditoría</h1>
          <p className="text-text-secondary">Registro de actividades del sistema</p>
        </div>
        <button
          onClick={handleCleanup}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-text-secondary hover:bg-white/5 transition-colors"
        >
          <Trash2 size={20} />
          Limpiar Logs Antiguos
        </button>
      </div>

      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex flex-wrap gap-4">
          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
          >
            <option value="">Todas las tablas</option>
            <option value="users">Users</option>
            <option value="videos">Videos</option>
            <option value="categories">Categories</option>
            <option value="roles">Roles</option>
          </select>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
          >
            <option value="">Todas las acciones</option>
            <option value="INSERT">Insert</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
          </select>
          <button
            onClick={() => fetchLogs(1)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
          >
            <RefreshCw size={18} />
            Actualizar
          </button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-background border-b border-border">
            <tr>
              <th className="text-left px-6 py-3 text-text-secondary text-sm font-medium">Fecha</th>
              <th className="text-left px-6 py-3 text-text-secondary text-sm font-medium">Usuario</th>
              <th className="text-left px-6 py-3 text-text-secondary text-sm font-medium">Tabla</th>
              <th className="text-left px-6 py-3 text-text-secondary text-sm font-medium">Acción</th>
              <th className="text-left px-6 py-3 text-text-secondary text-sm font-medium">Registro ID</th>
              <th className="text-left px-6 py-3 text-text-secondary text-sm font-medium">IP</th>
              <th className="text-right px-6 py-3 text-text-secondary text-sm font-medium">Detalles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-text-secondary">
                  Cargando...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-text-secondary">
                  No hay registros de auditoría
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-text-secondary text-sm">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-text-primary text-sm">
                    {log.user_email || 'Sistema'}
                  </td>
                  <td className="px-6 py-4 text-text-primary">{log.table_name}</td>
                  <td className="px-6 py-4">{getActionBadge(log.action)}</td>
                  <td className="px-6 py-4 text-text-secondary text-xs font-mono">
                    {log.record_id?.slice(0, 8) || 'N/A'}...
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-sm">{log.ip_address || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-text-secondary hover:text-primary"
                    >
                      <FileText size={18} />
                    </button>
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
              onClick={() => fetchLogs(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-text-primary">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchLogs(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-text-primary">Detalles del Log</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-text-secondary text-sm">ID</p>
                  <p className="text-text-primary font-mono text-sm">{selectedLog.id}</p>
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Fecha</p>
                  <p className="text-text-primary">{new Date(selectedLog.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Usuario</p>
                  <p className="text-text-primary">{selectedLog.user_email || 'Sistema'}</p>
                </div>
                <div>
                  <p className="text-text-secondary text-sm">IP</p>
                  <p className="text-text-primary">{selectedLog.ip_address || '-'}</p>
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Tabla</p>
                  <p className="text-text-primary">{selectedLog.table_name}</p>
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Acción</p>
                  <p className="text-text-primary">{selectedLog.action}</p>
                </div>
              </div>

              <div>
                <p className="text-text-secondary text-sm mb-2">Datos Anteriores</p>
                <pre className="bg-background p-3 rounded-lg text-xs text-text-primary overflow-auto max-h-32">
                  {formatJson(selectedLog.old_data)}
                </pre>
              </div>

              <div>
                <p className="text-text-secondary text-sm mb-2">Datos Nuevos</p>
                <pre className="bg-background p-3 rounded-lg text-xs text-text-primary overflow-auto max-h-32">
                  {formatJson(selectedLog.new_data)}
                </pre>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setSelectedLog(null)}
                className="w-full px-4 py-2 border border-border rounded-lg text-text-secondary hover:bg-white/5"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
