'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import {
  FolderOpen,
  Plus,
  Edit,
  Trash2,
  X,
  Video
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  videos_count: number;
  created_at: string;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const data = await apiClient.get<{ categories: Category[] }>(
        '/v1/admin/categories',
        token || ''
      );
      setCategories(data.categories);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formName.trim()) return;
    try {
      const token = localStorage.getItem('auth_token');
      await apiClient.post(
        '/v1/admin/categories',
        { name: formName, description: formDescription },
        token || ''
      );
      setShowCreateModal(false);
      setFormName('');
      setFormDescription('');
      fetchCategories();
    } catch (err) {
      console.error('Error creating category:', err);
      alert('Error al crear categoría');
    }
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setFormName(category.name);
    setFormDescription(category.description || '');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedCategory || !formName.trim()) return;
    try {
      const token = localStorage.getItem('auth_token');
      await apiClient.put(
        `/v1/admin/categories/${selectedCategory.id}`,
        { name: formName, description: formDescription },
        token || ''
      );
      setShowEditModal(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch (err) {
      console.error('Error updating category:', err);
      alert('Error al actualizar categoría');
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      await apiClient.delete(`/v1/admin/categories/${categoryId}`, token || '');
      fetchCategories();
    } catch (err: unknown) {
      console.error('Error deleting category:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error unknown';
      alert(errorMessage || 'Error al eliminar categoría');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Categorías</h1>
          <p className="text-text-secondary">Gestiona las categorías de videos</p>
        </div>
        <button
          onClick={() => {
            setFormName('');
            setFormDescription('');
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
        >
          <Plus size={20} />
          Nueva Categoría
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center h-32">
            <p className="text-text-secondary">Cargando...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center h-32 gap-2">
            <FolderOpen size={48} className="text-text-secondary" />
            <p className="text-text-secondary">No hay categorías</p>
          </div>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className="bg-surface border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <FolderOpen size={24} className="text-primary" />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-text-secondary hover:text-primary"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-text-secondary hover:text-red-400"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-1">{category.name}</h3>
              <p className="text-text-secondary text-sm mb-3 line-clamp-2">
                {category.description || 'Sin descripción'}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">{category.videos_count} videos</span>
                {category.is_active ? (
                  <span className="text-green-400">Activa</span>
                ) : (
                  <span className="text-red-400">Inactiva</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-text-primary">Nueva Categoría</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-text-secondary text-sm mb-1">Nombre</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Ciencia Ficción"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-text-secondary text-sm mb-1">Descripción</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Descripción opcional..."
                  rows={3}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary resize-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-text-secondary hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80"
                >
                  Crear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-text-primary">Editar Categoría</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-text-secondary text-sm mb-1">Nombre</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-text-secondary text-sm mb-1">Descripción</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary resize-none"
                />
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
