import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Play, Pause, Volume2, VolumeX, Settings, Maximize } from "lucide-react";

async function fetchVideo(id: string) {
  const res = await fetch(`/api/v1/videos/${id}`);
  if (!res.ok) throw new Error("Failed to fetch video");
  return res.json();
}

export function VideoPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["video", id],
    queryFn: () => fetchVideo(id!),
    enabled: !!id,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const value = parseFloat(e.target.value);
    video.volume = value;
    setVolume(value);
    setIsMuted(value === 0);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Cargando video...</div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-red-400">Error al cargar el video</div>
      </div>
    );
  }

  const video = data.data;

  return (
    <div className="space-y-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-black rounded-lg overflow-hidden relative aspect-video">
          <video
            ref={videoRef}
            src={video.hls_path ? `http://localhost:8000${video.hls_path}` : undefined}
            poster={video.thumbnail_url}
            className="w-full h-full"
            playsInline
          />

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center gap-4">
              <button onClick={togglePlay} className="text-white hover:text-emerald-400 transition-colors">
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>

              <div className="flex items-center gap-2 flex-1">
                <button onClick={toggleMute} className="text-white hover:text-emerald-400 transition-colors">
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 accent-emerald-500"
                />
              </div>

              <div className="text-sm text-white">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>

              <button className="text-white hover:text-emerald-400 transition-colors">
                <Settings className="w-5 h-5" />
              </button>

              <button className="text-white hover:text-emerald-400 transition-colors">
                <Maximize className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-2">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => {
                  const video = videoRef.current;
                  if (video) {
                    video.currentTime = parseFloat(e.target.value);
                  }
                }}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h1 className="text-2xl font-bold">{video.title}</h1>
          <p className="text-gray-400 mt-2">{video.description || "Sin descripción"}</p>
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
            <span>{video.view_count || 0} reproducciones</span>
            <span>{new Date(video.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
