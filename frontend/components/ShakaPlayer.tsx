'use client';

import { useRef, useEffect } from 'react';
import Player from '@shaka-player/react';

interface ShakaPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
}

export default function ShakaPlayer({ src, poster, autoplay = false }: ShakaPlayerProps) {
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  const onPlayerReady = (player: Player) => {
    playerRef.current = player;
  };

  return (
    <div className="w-full h-full bg-black">
      <Player
        src={src}
        poster={poster}
        autoplay={autoplay}
        onPlayerReady={onPlayerReady}
        style={{
          width: '100%',
          height: '100%',
        }}
        shakaConfig={{
          streaming: {
            bufferingGoal: 60,
            rebufferingGoal: 2,
            bufferBehind: 30,
          },
          preferNativeHLS: true,
        }}
      />
    </div>
  );
}
