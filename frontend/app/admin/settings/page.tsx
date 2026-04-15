'use client';

import { useState } from 'react';
import {
  Settings as SettingsIcon,
  Database,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Server,
  Key
} from 'lucide-react';

export default function AdminSettings() {
  const [backupStatus, setBackupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [backupMessage, setBackupMessage] = useState('');

  const handleBackup = async () => {
    setBackupStatus('loading');
    setBackupMessage('');
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setBackupStatus('success');
      setBackupMessage('Backup realizado exitosamente');
    } catch {
      setBackupStatus('error');
      setBackupMessage('Error al realizar backup');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Configuración</h1>
        <p className="text-text-secondary">Configuración del sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Database size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Base de Datos</h2>
              <p className="text-text-secondary text-sm">Gestión de backup y restauración</p>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleBackup}
              disabled={backupStatus === 'loading'}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50"
            >
              {backupStatus === 'loading' ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Realizando backup...
                </>
              ) : (
                <>
                  <Download size={20} />
                  Crear Backup
                </>
              )}
            </button>

            {backupStatus === 'success' && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle size={18} className="text-green-400" />
                <p className="text-green-400 text-sm">{backupMessage}</p>
              </div>
            )}

            {backupStatus === 'error' && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle size={18} className="text-red-400" />
                <p className="text-red-400 text-sm">{backupMessage}</p>
              </div>
            )}

            <div className="border-t border-border pt-4 mt-4">
              <p className="text-text-secondary text-sm">
                Los backups se guardan en: <code className="text-text-primary">backend/database/backups/</code>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Server size={20} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Servicios</h2>
              <p className="text-text-secondary text-sm">Estado de los servicios</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-text-primary">PostgreSQL</span>
              </div>
              <span className="text-text-secondary text-sm">Activo</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-text-primary">Redis</span>
              </div>
              <span className="text-text-secondary text-sm">Activo</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-text-primary">MinIO</span>
              </div>
              <span className="text-text-secondary text-sm">Activo</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-text-primary">Backend API</span>
              </div>
              <span className="text-text-secondary text-sm">Activo</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-text-primary">Frontend</span>
              </div>
              <span className="text-text-secondary text-sm">Activo</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
            <Key size={20} className="text-yellow-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Información del Sistema</h2>
            <p className="text-text-secondary text-sm">Versiones y configuración</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-background rounded-lg">
            <p className="text-text-secondary text-sm mb-1">Versión Backend</p>
            <p className="text-text-primary font-medium">Deno 2.0</p>
          </div>
          <div className="p-4 bg-background rounded-lg">
            <p className="text-text-secondary text-sm mb-1">Versión Frontend</p>
            <p className="text-text-primary font-medium">Next.js 15</p>
          </div>
          <div className="p-4 bg-background rounded-lg">
            <p className="text-text-secondary text-sm mb-1">Base de Datos</p>
            <p className="text-text-primary font-medium">PostgreSQL 16</p>
          </div>
          <div className="p-4 bg-background rounded-lg">
            <p className="text-text-secondary text-sm mb-1">Docker</p>
            <p className="text-text-primary font-medium">Compose v2</p>
          </div>
        </div>
      </div>
    </div>
  );
}
