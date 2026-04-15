'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import {
  Shield,
  RefreshCw,
  Trash2,
  AlertTriangle,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface LoginAttempt {
  id: string;
  email: string | null;
  ip_address: string;
  success: boolean;
  failure_reason: string | null;
  created_at: string;
}

interface Session {
  id: string;
  user_id: string;
  email: string;
  user_name: string | null;
  ip_address: string;
  created_at: string;
  expires_at: string;
}

interface BlockedIp {
  ip_address: string;
  attempts: number;
  last_attempt: string;
}

export default function AdminSecurity() {
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [blockedIps, setBlockedIps] = useState<BlockedIp[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'attempts' | 'sessions' | 'blocked'>('attempts');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      const [attemptsRes, sessionsRes, blockedRes] = await Promise.all([
        apiClient.get<{ attempts: LoginAttempt[] }>('/v1/admin/security/login-attempts', token || ''),
        apiClient.get<{ sessions: Session[] }>('/v1/admin/security/sessions', token || ''),
        apiClient.get<{ blockedIps: BlockedIp[] }>('/v1/admin/security/blocked-ips', token || ''),
      ]);

      setAttempts(attemptsRes.attempts);
      setSessions(sessionsRes.sessions);
      setBlockedIps(blockedRes.blockedIps);
    } catch (err) {
      console.error('Error fetching security data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      await apiClient.delete(`/v1/admin/security/sessions/${sessionId}`, token || '');
      fetchData();
    } catch (err) {
      console.error('Error revoking session:', err);
      alert('Error al revocar sesión');
    }
  };

  const handleRevokeAllUserSessions = async (userId: string) => {
    if (!confirm('¿Revocar todas las sesiones de este usuario?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      await apiClient.delete(`/v1/admin/security/sessions/user/${userId}`, token || '');
      fetchData();
    } catch (err) {
      console.error('Error revoking user sessions:', err);
      alert('Error al revocar sesiones');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Seguridad</h1>
        <p className="text-text-secondary">Intentos de login y sesiones activas</p>
      </div>

      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('attempts')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'attempts'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-white'
          }`}
        >
          Intentos de Login
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'sessions'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-white'
          }`}
        >
          Sesiones Activas
        </button>
        <button
          onClick={() => setActiveTab('blocked')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'blocked'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-white'
          }`}
        >
          IPs Bloqueadas
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-primary">Cargando...</div>
        </div>
      ) : (
        <>
          {activeTab === 'attempts' && (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="text-left px-6 py-3 text-text-secondary text-sm font-medium">Fecha</th>
                    <th className="text-left px-6 py-3 text-text-secondary text-sm font-medium">Email</th>
                    <th className="text-left px-6 py-3 text-text-secondary text-sm font-medium">IP</th>
                    <th className="text-left px-6 py-3 text-text-secondary text-sm font-medium">Estado</th>
                    <th className="text-left px-6 py-3 text-text-secondary text-sm font-medium">Razón</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {attempts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-text-secondary">
                        No hay intentos de login
                      </td>
                    </tr>
                  ) : (
                    attempts.slice(0, 50).map((attempt) => (
                      <tr key={attempt.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-text-secondary text-sm">
                          {new Date(attempt.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-text-primary">{attempt.email || '-'}</td>
                        <td className="px-6 py-4 text-text-secondary font-mono text-sm">
                          {attempt.ip_address}
                        </td>
                        <td className="px-6 py-4">
                          {attempt.success ? (
                            <span className="inline-flex items-center gap-1 text-green-400 text-sm">
                              <span className="w-2 h-2 rounded-full bg-green-400" />
                              Éxito
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-400 text-sm">
                              <span className="w-2 h-2 rounded-full bg-red-400" />
                              Fallido
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-text-secondary text-sm">
                          {attempt.failure_reason || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="text-left px-6 py-3 text-text-secondary text-sm font-medium">Usuario</th>
                    <th className="text-left px-6 py-3 text-text-secondary text-sm font-medium">IP</th>
                    <th className="text-left px-6 py-3 text-text-secondary text-sm font-medium">Iniciada</th>
                    <th className="text-left px-6 py-3 text-text-secondary text-sm font-medium">Expira</th>
                    <th className="text-right px-6 py-3 text-text-secondary text-sm font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-text-secondary">
                        No hay sesiones activas
                      </td>
                    </tr>
                  ) : (
                    sessions.map((session) => (
                      <tr key={session.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-text-primary">{session.user_name || session.email}</p>
                            <p className="text-text-secondary text-sm">{session.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-text-secondary font-mono text-sm">
                          {session.ip_address}
                        </td>
                        <td className="px-6 py-4 text-text-secondary text-sm">
                          {new Date(session.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-text-secondary text-sm">
                          {new Date(session.expires_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleRevokeAllUserSessions(session.user_id)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-text-secondary hover:text-yellow-400"
                              title="Revocar todas las sesiones"
                            >
                              <LogOut size={18} />
                            </button>
                            <button
                              onClick={() => handleRevokeSession(session.id)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-text-secondary hover:text-red-400"
                              title="Revocar esta sesión"
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
          )}

          {activeTab === 'blocked' && (
            <div className="space-y-4">
              {blockedIps.length === 0 ? (
                <div className="bg-surface border border-border rounded-xl p-8 text-center">
                  <Shield size={48} className="mx-auto text-green-400 mb-4" />
                  <p className="text-text-primary">No hay IPs bloqueadas</p>
                  <p className="text-text-secondary text-sm">Todas las IPs tienen intentos de login normales</p>
                </div>
              ) : (
                blockedIps.map((blocked) => (
                  <div
                    key={blocked.ip_address}
                    className="bg-surface border border-red-500/30 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                        <AlertTriangle size={24} className="text-red-400" />
                      </div>
                      <div>
                        <p className="text-text-primary font-mono font-medium">{blocked.ip_address}</p>
                        <p className="text-text-secondary text-sm">
                          {blocked.attempts} intentos fallidos · Último:{' '}
                          {new Date(blocked.last_attempt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      <button
        onClick={fetchData}
        className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-text-secondary hover:bg-white/5 transition-colors"
      >
        <RefreshCw size={18} />
        Actualizar
      </button>
    </div>
  );
}
