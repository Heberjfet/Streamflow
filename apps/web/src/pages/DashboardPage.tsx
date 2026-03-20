import { useQuery } from "@tanstack/react-query";

async function fetchVideos() {
  const res = await fetch("/api/v1/videos");
  if (!res.ok) throw new Error("Failed to fetch videos");
  return res.json();
}

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["videos"],
    queryFn: fetchVideos,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Bienvenido a StreamFlow</h1>
        <p className="text-gray-400 mt-2">Tu plataforma de streaming personal</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-4xl font-bold text-emerald-400">0</h3>
          <p className="text-gray-400 mt-1">Videos totales</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-4xl font-bold text-blue-400">0</h3>
          <p className="text-gray-400 mt-1">Reproducciones</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-4xl font-bold text-purple-400">0</h3>
          <p className="text-gray-400 mt-1">Incidentes detectados</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Videos recientes</h2>
        {isLoading ? (
          <p className="text-gray-400">Cargando...</p>
        ) : data?.data?.videos?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.data.videos.map((video: any) => (
              <div key={video.id} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                <div className="aspect-video bg-gray-800 relative">
                  {video.thumbnail_url ? (
                    <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-600">
                      Sin miniatura
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium truncate">{video.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{video.status}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400">No hay videos todavía</p>
            <a href="/catalog" className="text-emerald-400 hover:text-emerald-300 mt-2 inline-block">
              Explorar catálogo
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
