import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, AlertTriangle, CheckCircle, Clock, Loader2 } from "lucide-react";

async function fetchFlags() {
  const res = await fetch("/api/v1/admin/flags");
  if (!res.ok) throw new Error("Failed to fetch flags");
  return res.json();
}

async function fetchIncidents() {
  const res = await fetch("/api/v1/admin/incidents?limit=20");
  if (!res.ok) throw new Error("Failed to fetch incidents");
  return res.json();
}

async function updateFlag(name: string, is_enabled: boolean) {
  const res = await fetch(`/api/v1/admin/flags/${name}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_enabled }),
  });
  if (!res.ok) throw new Error("Failed to update flag");
  return res.json();
}

const severityColors = {
  low: "text-blue-400 bg-blue-500/10",
  medium: "text-yellow-400 bg-yellow-500/10",
  high: "text-orange-400 bg-orange-500/10",
  critical: "text-red-400 bg-red-500/10",
};

const severityIcons = {
  low: <Clock className="w-4 h-4" />,
  medium: <AlertTriangle className="w-4 h-4" />,
  high: <AlertTriangle className="w-4 h-4" />,
  critical: <Shield className="w-4 h-4" />,
};

export function AdminPage() {
  const queryClient = useQueryClient();
  const { data: flagsData, isLoading: flagsLoading } = useQuery({
    queryKey: ["admin-flags"],
    queryFn: fetchFlags,
  });

  const { data: incidentsData, isLoading: incidentsLoading } = useQuery({
    queryKey: ["admin-incidents"],
    queryFn: fetchIncidents,
  });

  const updateMutation = useMutation({
    mutationFn: ({ name, is_enabled }: { name: string; is_enabled: boolean }) =>
      updateFlag(name, is_enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-flags"] });
    },
  });

  const toggleFlag = (name: string, currentEnabled: boolean) => {
    updateMutation.mutate({ name, is_enabled: !currentEnabled });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-emerald-400" />
          Panel de Administración
        </h1>
        <p className="text-gray-400 mt-1">Gestiona la seguridad del sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="font-semibold">Feature Flags de Seguridad</h2>
            <p className="text-sm text-gray-400">Activa o desactiva módulos de seguridad</p>
          </div>

          {flagsLoading ? (
            <div className="p-6 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {flagsData?.data?.map((flag: any) => (
                <div key={flag.name} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{flag.name}</div>
                    <div className="text-xs text-gray-500">{flag.description}</div>
                  </div>
                  <button
                    onClick={() => toggleFlag(flag.name, flag.is_enabled)}
                    disabled={updateMutation.isPending}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      flag.is_enabled ? "bg-emerald-500" : "bg-gray-700"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        flag.is_enabled ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="font-semibold">Incidentes Recientes</h2>
            <p className="text-sm text-gray-400">Eventos de seguridad detectados</p>
          </div>

          {incidentsLoading ? (
            <div className="p-6 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
          ) : incidentsData?.data?.length > 0 ? (
            <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
              {incidentsData.data.map((incident: any) => (
                <div key={incident.id} className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${severityColors[incident.severity]}`}>
                      {severityIcons[incident.severity]}
                      <span className="ml-1 uppercase">{incident.severity}</span>
                    </span>
                    <span className="text-sm text-gray-300">{incident.type}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{incident.description}</p>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(incident.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-gray-400">No hay incidentes recientes</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="font-semibold">Estadísticas de Seguridad</h2>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-emerald-400">0</div>
            <div className="text-sm text-gray-400">Login exitosos (24h)</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-400">0</div>
            <div className="text-sm text-gray-400">Intentos fallidos (24h)</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400">0</div>
            <div className="text-sm text-gray-400">Cuentas bloqueadas</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">0</div>
            <div className="text-sm text-gray-400">Sesiones activas</div>
          </div>
        </div>
      </div>
    </div>
  );
}
