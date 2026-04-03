import React, { useState, useRef, useEffect, useCallback } from 'react';
import { shareSong } from '../lib/utils';

interface MiniPlayerProps {
  songUrl: string;
  title: string;
  albumArtUrl: string;
  subtitle?: string;
  autoPlay?: boolean;
  inline?: boolean;
  songId?: number;
  onClose: () => void;
  onPlayingChange?: (playing: boolean) => void;
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({
  songUrl,
  title,
  albumArtUrl,
  subtitle,
  autoPlay = true,
  inline = false,
  songId,
  onClose,
  onPlayingChange,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Load and optionally auto-play when songUrl changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Reset state for new track
    setCurrentTime(0);
    setDuration(0);

    // Explicitly load the new source — changing src alone doesn't
    // guarantee the browser will start loading before play() is called.
    audio.load();

    if (autoPlay) {
      audio.play().catch(() => {});
    }
  }, [songUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, []);

  const handleTimeUpdate = () => {
    if (!isDragging && audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const seekTo = (clientX: number) => {
    const bar = progressRef.current;
    const audio = audioRef.current;
    if (!bar || !audio || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = ratio * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleProgressClick = (e: React.MouseEvent) => {
    seekTo(e.clientX);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    seekTo(e.clientX);
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => seekTo(e.clientX);
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, duration]);

  // Touch support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    seekTo(e.touches[0].clientX);
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleTouchMove = (e: TouchEvent) => seekTo(e.touches[0].clientX);
    const handleTouchEnd = () => setIsDragging(false);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, duration]);

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
  };

  const formatTime = (s: number) => {
    if (!isFinite(s)) return '0:00';
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={inline ? '' : 'fixed bottom-0 left-0 right-0 z-50'}>
      <div className="bg-background border-t border-border">
        <div className="w-full px-5 py-3 flex items-center gap-4">
          {/* Left: Album art + Song info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <img
              src={albumArtUrl}
              alt={title}
              className="w-14 h-14 rounded-lg object-cover flex-shrink-0 shadow-sm"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{title}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Center: Controls + Timeline */}
          <div className="flex flex-col items-center gap-1 flex-1 max-w-[480px]">
            {/* Playback controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => skip(-10)}
                className="w-8 h-8 rounded-full hover:bg-muted transition-colors flex items-center justify-center"
                aria-label="Rewind 10 seconds"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
                  <path d="M12.5 8.14v-4l-5 5 5 5v-4c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" fill="currentColor"/>
                </svg>
              </button>

              <button
                onClick={togglePlay}
                className="w-9 h-9 bg-primary rounded-full hover:opacity-90 hover:scale-105 transition-all flex items-center justify-center"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-primary-foreground">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill="currentColor" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-primary-foreground ml-0.5">
                    <path d="M8 5v14l11-7z" fill="currentColor" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => skip(10)}
                className="w-8 h-8 rounded-full hover:bg-muted transition-colors flex items-center justify-center"
                aria-label="Forward 10 seconds"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
                  <path d="M11.5 8.14v-4l5 5-5 5v-4c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" fill="currentColor"/>
                </svg>
              </button>
            </div>

            {/* Timeline bar */}
            <div className="w-full flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground tabular-nums w-8 text-right">{formatTime(currentTime)}</span>
              <div
                ref={progressRef}
                className="flex-1 h-1 bg-muted rounded-full cursor-pointer group relative"
                onClick={handleProgressClick}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
              >
                <div
                  className="h-full bg-primary rounded-full transition-[width] duration-100 relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm" />
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground tabular-nums w-8">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Share, Close */}
          <div className="flex-1 flex justify-end gap-1">
            <button
              onClick={() => {
                const shareUrl = songId
                  ? `${window.location.origin}?song=${songId}`
                  : window.location.href;
                shareSong(shareUrl, title);
              }}
              className="w-8 h-8 rounded-full hover:bg-muted transition-colors flex items-center justify-center"
              aria-label="Share song"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-muted-foreground" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>
            <button
              onClick={() => {
                const audio = audioRef.current;
                if (audio) {
                  audio.pause();
                  audio.currentTime = 0;
                }
                setIsPlaying(false);
                onClose();
              }}
              className="w-8 h-8 rounded-full hover:bg-muted transition-colors flex items-center justify-center"
              aria-label="Close player"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={songUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => { setIsPlaying(true); onPlayingChange?.(true); }}
        onPause={() => { setIsPlaying(false); onPlayingChange?.(false); }}
      />
    </div>
  );
};

export default MiniPlayer;
