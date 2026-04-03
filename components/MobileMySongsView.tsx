import React from 'react';
import { SavedSong } from '../types';
import { shareSong } from '../lib/utils';

interface MobileMySongsViewProps {
  songs: SavedSong[];
  onView: (song: SavedSong) => Promise<void>;
  onViewDetails: (song: SavedSong) => Promise<void>;
  onDelete: (id: number) => void;
  playingSongId?: number | null;
}

const MobileMySongsView: React.FC<MobileMySongsViewProps> = ({ songs, onView, onViewDetails, onDelete, playingSongId }) => {
  if (songs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-5">
        <h2 className="text-2xl font-medium text-foreground mb-3 text-center">No Saved Songs Yet</h2>
        <p className="text-muted-foreground text-base text-center">Go create your first masterpiece!</p>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  return (
    <div className="flex flex-col gap-3 w-full px-3 py-5 overflow-y-auto">
      {songs.map(song => (
        <div 
          key={song.id} 
          className="bg-secondary rounded-[24px] p-2 cursor-pointer active:bg-accent/50 transition-colors"
          onClick={() => onViewDetails(song)}
        >
          <div className="flex items-center gap-3">
            <img 
              src={song.albumArtUrl} 
              alt={`${song.title} album art`}
              className="w-16 h-16 rounded-xl object-cover flex-shrink-0" 
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-medium text-sm text-foreground truncate">
                  {song.title}
                </h3>
                {song.versionNumber && song.versionNumber > 1 && (
                  <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded-full leading-none flex-shrink-0">
                    v{song.versionNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {song.musicDescription.genre} • {song.musicDescription.mood} • {song.musicDescription.vocals}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(song.createdAt)}
              </p>
            </div>
            
            <div className="flex items-center gap-1 opacity-80">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onView(song);
                }}
                className="p-2"
                aria-label={playingSongId === song.id ? 'Pause song' : 'Play song'}
              >
                {playingSongId === song.id ? (
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-muted-foreground">
                    <path d="M5 3.333H8.333V16.667H5V3.333ZM11.667 3.333H15V16.667H11.667V3.333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-muted-foreground">
                    <path d="M3.33333 2.5L16.6667 10L3.33333 17.5V2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(song.id);
                }}
                className="p-2"
                aria-label="Delete song"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-muted-foreground">
                  <path d="M2.5 5H17.5M6.667 5V3.333C6.667 2.5 7.5 1.667 8.333 1.667H11.667C12.5 1.667 13.333 2.5 13.333 3.333V5M15.833 5V16.667C15.833 17.5 15 18.333 14.167 18.333H5.833C5 18.333 4.167 17.5 4.167 16.667V5H15.833Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileMySongsView;
