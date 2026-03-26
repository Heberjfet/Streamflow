'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { Video } from '@/types';
import { formatDuration, getMinioUrl, cn } from '@/lib/utils';

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isHovered && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    } else if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isHovered]);

  const posterUrl = video.poster_path 
    ? getMinioUrl(video.poster_path) 
    : 'https://via.placeholder.com/640x360/121212/666666?text=No+Preview';

  return (
    <Link href={`/watch/${video.id}`}>
      <div
        className="card group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-video overflow-hidden rounded-t-xl">
          {!thumbnailError ? (
            <>
              <img
                src={posterUrl}
                alt={video.title}
                className={cn(
                  'w-full h-full object-cover transition-opacity duration-300',
                  isHovered ? 'opacity-0' : 'opacity-100'
                )}
                onError={() => setThumbnailError(true)}
              />
              {isHovered && (
                <video
                  ref={videoRef}
                  src={video.hls_path.replace('.m3u8', '-preview.mp4')}
                  className="absolute inset-0 w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                />
              )}
            </>
          ) : (
            <div className="w-full h-full bg-surface flex items-center justify-center">
              <span className="text-text-secondary text-sm">Vista previa no disponible</span>
            </div>
          )}

          {video.duration && (
            <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/80 text-xs font-medium">
              {formatDuration(video.duration)}
            </div>
          )}

          {!video.is_processed && (
            <div className="absolute top-2 left-2 px-2 py-1 rounded bg-secondary/80 text-xs font-medium">
              Procesando...
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors line-clamp-1">
            {video.title}
          </h3>
          {video.description && (
            <p className="mt-1 text-sm text-text-secondary line-clamp-2">
              {video.description}
            </p>
          )}
          {video.category && (
            <span className="inline-block mt-2 px-2 py-1 rounded text-xs bg-primary/20 text-primary">
              {video.category.name}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
