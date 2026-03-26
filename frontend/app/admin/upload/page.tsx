'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, apiEndpoints } from '@/lib/api';
import type { Category, UploadProgress, VideoProcessingStatus } from '@/types';
import { cn } from '@/lib/utils';

export default function UploadPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [processingStatus, setProcessingStatus] = useState<VideoProcessingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/browse');
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const token = localStorage.getItem('auth_token') || '';
        const data = await apiClient.get<Category[]>(apiEndpoints.categories, token);
        setCategories(data);
        if (data.length > 0) {
          setCategoryId(data[0].id);
        }
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    }

    if (isAuthenticated && user?.role === 'admin') {
      fetchCategories();
    }
  }, [isAuthenticated, user]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'video/mp4') {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Por favor, selecciona un archivo MP4 válido');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'video/mp4') {
      setFile(selectedFile);
      setError(null);
    } else if (selectedFile) {
      setError('Por favor, selecciona un archivo MP4 válido');
    }
  }, []);

  const simulateProcessing = useCallback(async (videoId: string) => {
    setProcessingStatus({ video_id: videoId, status: 'processing', progress: 0 });

    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setProcessingStatus({ video_id: videoId, status: 'processing', progress: i });
    }

    setProcessingStatus({ video_id: videoId, status: 'completed' });
  }, []);

  const handleUpload = async () => {
    if (!file || !title || !categoryId) {
      setError('Por favor, completa todos los campos y selecciona un archivo');
      return;
    }

    setError(null);
    setSuccess(false);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category_id', categoryId);
      formData.append('video', file);

      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress({
            loaded: e.loaded,
            total: e.total,
            percentage: Math.round((e.loaded / e.total) * 100),
          });
        }
      };

      const response = await new Promise<VideoProcessingStatus>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result);
            } catch {
              resolve({
                video_id: 'temp-id',
                status: 'processing',
              });
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error'));
        
        xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL}${apiEndpoints.ingest}`);
        const token = localStorage.getItem('auth_token') || '';
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        xhr.send(formData);
      });

      setUploadProgress({ loaded: 100, total: 100, percentage: 100 });
      setUploading(false);

      if (response.status === 'processing') {
        await simulateProcessing(response.video_id);
        setSuccess(true);
        setTimeout(() => {
          router.push('/browse');
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el video');
      setUploading(false);
      setUploadProgress(null);
    }
  };

  if (isLoading || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Subir Video</h1>
          <p className="text-text-secondary">
            Sube un video MP4 para añadirlo al catálogo
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Título del video *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: El Último Amanecer - Capítulo 1"
              className="input"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el contenido del video..."
              rows={4}
              className="input resize-none"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Categoría *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="input"
              disabled={uploading}
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Archivo de video *
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                'border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200',
                dragOver
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50',
                file && 'border-primary bg-primary/5'
              )}
            >
              {file ? (
                <div className="space-y-2">
                  <svg className="w-12 h-12 mx-auto text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-text-primary font-medium">{file.name}</p>
                  <p className="text-text-secondary text-sm">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <button
                    onClick={() => setFile(null)}
                    className="text-sm text-red-400 hover:text-red-300"
                    disabled={uploading}
                  >
                    Eliminar
                  </button>
                </div>
              ) : (
                <>
                  <svg className="w-12 h-12 mx-auto text-text-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-text-primary mb-2">
                    Arrastra tu archivo aquí o{' '}
                    <label className="text-primary cursor-pointer hover:underline">
                      busca en tu computadora
                      <input
                        type="file"
                        accept="video/mp4"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  </p>
                  <p className="text-text-secondary text-sm">
                    Formato: MP4 (máx. 2GB)
                  </p>
                </>
              )}
            </div>
          </div>

          {uploadProgress && uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Subiendo...</span>
                <span className="text-text-primary">{uploadProgress.percentage}%</span>
              </div>
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
                  style={{ width: `${uploadProgress.percentage}%` }}
                />
              </div>
            </div>
          )}

          {processingStatus && processingStatus.status === 'processing' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Procesando video...</span>
                <span className="text-text-primary">{processingStatus.progress}%</span>
              </div>
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary transition-all duration-300"
                  style={{ width: `${processingStatus.progress || 0}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-green-400 text-sm">
                ¡Video subido exitosamente! Redirigiendo...
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => router.back()}
              className="btn-secondary flex-1"
              disabled={uploading}
            >
              Cancelar
            </button>
            <button
              onClick={handleUpload}
              className="btn-primary flex-1"
              disabled={uploading || !file || !title || !categoryId}
            >
              {uploading ? 'Subiendo...' : 'Subir Video'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
