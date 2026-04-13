'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, apiEndpoints } from '@/lib/api';
import { UserNavbar } from '@/components/dashboard/UserNavbar';
import { UserSidebar } from '@/components/dashboard/UserSidebar';
import { Mail, Calendar, Shield, Camera, Save, Loader2 } from 'lucide-react';
import type { User } from '@/types';

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated, checkAuth } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [stats] = useState({
    videosWatched: 0,
    favorites: 0,
    watchHistory: 0,
  });

  useEffect(() => {
    if (user) {
      setName(user.name || '');
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'El archivo debe ser menor a 5MB' });
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'El nombre es requerido' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('auth_token');
      
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        await apiClient.postFormData(apiEndpoints.users.meAvatar, formData, token || undefined);
      }

      await apiClient.put(apiEndpoints.users.me, { name: name.trim() }, token || undefined);
      
      await checkAuth();
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Error al guardar' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    setIsChangingPassword(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('auth_token');
      await apiClient.put(apiEndpoints.users.mePassword, {
        currentPassword,
        newPassword,
      }, token || undefined);

      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Contraseña cambiada correctamente' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Error al cambiar contraseña' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary text-lg">Cargando perfil...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Debes iniciar sesión para ver tu perfil</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <UserNavbar />
      <UserSidebar />
      
      <main className="ml-64 mt-16 p-8">
        {message && (
          <div className={`mb-6 p-4 rounded-xl border ${
            message.type === 'success' 
              ? 'bg-green-500/10 border-green-500/50 text-green-400' 
              : 'bg-red-500/10 border-red-500/50 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        <div className="glass-surface rounded-3xl p-8 mb-8 border border-white/5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative">
              {avatarPreview || user.avatar_url ? (
                <img 
                  src={avatarPreview || user.avatar_url || ''} 
                  alt={user.name || 'User'} 
                  className="w-32 h-32 rounded-2xl object-cover border-2 border-primary/50 shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center border-2 border-primary/50 shadow-lg">
                  <span className="text-4xl font-bold text-white">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              {isEditing && (
                <label className="absolute bottom-2 right-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/80 transition-colors shadow-lg">
                  <Camera className="w-5 h-5 text-white" />
                  <input 
                    type="file" 
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              )}
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-4 mb-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-3xl font-bold bg-surface border border-white/10 rounded-xl px-4 py-2 text-text-primary focus:outline-none focus:border-primary"
                  />
                ) : (
                  <h1 className="text-3xl font-bold text-text-primary">
                    {user.name || 'Usuario sin nombre'}
                  </h1>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-text-secondary">
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </span>
                {user.created_at && (
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Desde {new Date(user.created_at).toLocaleDateString('es-ES', { 
                      year: 'numeric', 
                      month: 'long' 
                    })}
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-center justify-center sm:justify-start gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${
                  user.role === 'admin' 
                    ? 'bg-secondary/20 text-secondary' 
                    : 'bg-primary/20 text-primary'
                }`}>
                  <Shield className="w-4 h-4" />
                  {user.role === 'admin' ? 'Administrador' : 'Espectador'}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => { setIsEditing(false); setAvatarFile(null); setAvatarPreview(null); }}
                    className="px-4 py-2 bg-surface border border-white/10 rounded-xl text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="px-4 py-2 bg-gradient-to-r from-primary to-secondary rounded-xl text-white font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Guardar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-gradient-to-r from-primary to-secondary rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
                >
                  Editar perfil
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="glass-surface rounded-2xl p-6 border border-white/5 text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              {stats.videosWatched}
            </div>
            <div className="text-text-secondary">Videos vistos</div>
          </div>
          <div className="glass-surface rounded-2xl p-6 border border-white/5 text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              {stats.favorites}
            </div>
            <div className="text-text-secondary">Favoritos</div>
          </div>
          <div className="glass-surface rounded-2xl p-6 border border-white/5 text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              {stats.watchHistory}
            </div>
            <div className="text-text-secondary">En tu historial</div>
          </div>
        </div>

        <div className="glass-surface rounded-3xl p-8 border border-white/5">
          <h2 className="text-xl font-semibold text-text-primary mb-6">Configuración de cuenta</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-surface/50 rounded-xl border border-white/5">
              <div>
                <div className="font-medium text-text-primary">Correo electrónico</div>
                <div className="text-sm text-text-secondary">{user.email}</div>
              </div>
              <span className="text-sm text-text-secondary">No editable</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-surface/50 rounded-xl border border-white/5">
              <div>
                <div className="font-medium text-text-primary">Contraseña</div>
                <div className="text-sm text-text-secondary">••••••••••••</div>
              </div>
              <button 
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 bg-surface border border-primary/50 rounded-xl text-primary hover:bg-primary/10 transition-colors text-sm"
              >
                Cambiar
              </button>
            </div>
          </div>
        </div>
      </main>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass-surface rounded-2xl p-6 w-full max-w-md border border-white/10">
            <h3 className="text-xl font-semibold text-text-primary mb-6">Cambiar contraseña</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">Contraseña actual</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm text-text-secondary mb-2">Nueva contraseña</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm text-text-secondary mb-2">Confirmar nueva contraseña</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-white/10 rounded-xl text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowPasswordModal(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}
                className="flex-1 px-4 py-3 bg-surface border border-white/10 rounded-xl text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-secondary rounded-xl text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}