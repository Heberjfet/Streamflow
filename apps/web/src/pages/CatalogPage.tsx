import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Search, Play, Loader2 } from "lucide-react";

async function fetchVideos(search?: string) {
  const url = search ? `/api/v1/videos?search=${encodeURIComponent(search)}` : "/api/v1/videos";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch videos");
  return res.json();
}

export function CatalogPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["videos", search],
    queryFn: () => fetchVideos(search || undefined),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Catálogo de Videos</h1>
        <a
          href="/upload"
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded transition-colors"
        >
          Subir video
        </a>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar videos..."
          className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {isLoading || isFetching ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      ) : data?.data?.videos?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.data.videos.map((video: any) => (
            <Link
              key={video.id}
              to={`/watch/${video.id}`}
              className="group bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-emerald-500/50 transition-colors"
            >
              <div className="aspect-video bg-gray-800 relative">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-600">
                    Sin miniatura
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Play className="w-12 h-12 text-white" />
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/75 text-xs text-white rounded">
                  {video.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, "0")}` : "--:--"}
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-medium truncate">{video.title}</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {video.view_count || 0} reproducciones
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
          <Play className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300">No hay videos disponibles</h3>
          <p className="text-gray-500 mt-1">Sé el primero en subir un video</p>
        </div>
      )}
    </div>
  );
}
