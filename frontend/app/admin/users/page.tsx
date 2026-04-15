'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  Eye,
  Upload,
  X,
  Check
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: 'viewer' | 'uploader' | 'admin';
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  videos_count: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRole, setEditRole] = useState('');
  const [editActive, setEditActive] = useState(true);

  useEffect(() => {
    fetchUsers(1);
  }, [roleFilter]);

  const fetchUsers = async (page: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);

      const data = await apiClient.get<{ users: User[]; pagination: Pagination }>(
        `/v1/admin/users?${params.toString()}`,
        token || ''
      );
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setEditActive(user.is_active);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    try {
      const token = localStorage.getItem('auth_token');
      await apiClient.put(
        `/v1/admin/users/${selectedUser.id}`,
        { role: editRole, is_active: editActive },
        token || ''
      );
      setShowEditModal(false);
      fetchUsers(pagination?.page || 1);
    } catch (err) {
      console.error('Error updating user:', err);
      alert('Error al actualizar usuario');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      await apiClient.delete(`/v1/admin/users/${userId}`, token || '');
      fetchUsers(pagination?.page || 1);
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Error al eliminar usuario');
    }
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: { bg: 'bg-red-500/20', text: 'text-red-400', icon: Shield },
      uploader: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Upload },
      viewer: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: Eye },
    };
    const badge = badges[role as keyof typeof badges] || badges.viewer;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${badge.bg} ${badge.text}`}>
        <Icon size={12} />
        {role}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Usuarios</h1>
          <p className="text-text-secondary">Gestiona los usuarios del sistema</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
          >
            <option value="">Todos los roles</option>
            <option value="admin">Admin</option>
            <option value="uploader">Uploader</option>
            <option value="viewer">Viewer</option>
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
              <th className="text-left px-6 py-3 text-text-secondary text-sm font-medium">Usuario</th>
              <th className="text-left px-6 py-3 text-text-secondary text-sm font-medium">Rol</th>
              <th className="text-left px-6 py-3 text-text-secondary text-sm font-medium">Estado</th>
              <th className="text-left px-6 py-3 text-text-secondary text-sm font-medium">Videos</th>
              <th className="text-left px-6 py-3 text-text-secondary text-sm font-medium">Último login</th>
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
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-text-secondary">
                  No se encontraron usuarios
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-primary text-sm font-medium">
                            {user.name?.[0] || user.email[0]}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-text-primary font-medium">{user.name || 'Sin nombre'}</p>
                        <p className="text-text-secondary text-sm">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                  <td className="px-6 py-4">
                    {user.is_active ? (
                      <span className="inline-flex items-center gap-1 text-green-400 text-sm">
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-400 text-sm">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">{user.videos_count}</td>
                  <td className="px-6 py-4 text-text-secondary text-sm">
                    {user.last_login
                      ? new Date(user.last_login).toLocaleDateString()
                      : 'Nunca'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-text-secondary hover:text-primary"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
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
              onClick={() => fetchUsers(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-text-primary">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchUsers(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-text-primary">Editar Usuario</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-text-secondary text-sm mb-1">Email</p>
                <p className="text-text-primary">{selectedUser.email}</p>
              </div>

              <div>
                <label className="block text-text-secondary text-sm mb-1">Rol</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                >
                  <option value="viewer">Viewer</option>
                  <option value="uploader">Uploader</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                <label htmlFor="isActive" className="text-text-secondary text-sm">
                  Usuario activo
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
