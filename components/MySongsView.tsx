import React from 'react';
import { SavedSong } from '../types';
import { shareSong } from '../lib/utils';

interface MySongsViewProps {
  songs: SavedSong[];
  onView: (song: SavedSong) => Promise<void>;
  onViewDetails: (song: SavedSong) => Promise<void>;
  onDelete: (id: number) => void;
  playingSongId?: number | null;
}

const MySongsView: React.FC<MySongsViewProps> = ({ songs, onView, onViewDetails, onDelete, playingSongId }) => {
  if (songs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-32">
        <h2 className="text-3xl font-medium text-foreground mb-4">No Saved Songs Yet</h2>
        <p className="text-muted-foreground text-lg">Go create your first masterpiece!</p>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-[800px] mx-auto">
      {songs.map(song => (
        <div 
          key={song.id} 
          className="bg-secondary rounded-[24px] pl-2 pr-5 py-2 flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => onViewDetails(song)}
        >
          {/* Left section: Album art + Song details */}
          <div className="flex items-center gap-4">
            {/* Album Art */}
            <img 
              src={song.albumArtUrl} 
              alt={`${song.title} album art`}
              className="w-[100px] h-[100px] rounded-2xl object-cover flex-shrink-0" 
            />
            
            {/* Song Details */}
            <div className="flex flex-col gap-1 w-[360px]">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-base text-foreground leading-5">
                  {song.title}
                </h3>
                {song.versionNumber && song.versionNumber > 1 && (
                  <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded-full leading-none">
                    v{song.versionNumber}
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground leading-4">
                <p className="truncate">
                  {song.musicDescription.genre} • {song.musicDescription.mood} • {song.musicDescription.vocals}
                </p>
                <p className="mt-0.5">
                  {formatDate(song.createdAt)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Right section: Action buttons */}
          <div className="flex items-center gap-3 opacity-80">
            {/* Share button */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                const shareUrl = `${window.location.origin}?song=${song.id}`;
                shareSong(shareUrl, song.title);
              }}
              className="bg-secondary p-2.5 rounded-xl hover:bg-accent transition-colors"
              aria-label="Share song"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>

            {/* Play/Pause button */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onView(song);
              }}
              className="bg-secondary p-2.5 rounded-xl hover:bg-accent transition-colors"
              aria-label={playingSongId === song.id ? 'Pause song' : 'Play song'}
            >
              {playingSongId === song.id ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 3.33333H8.33333V16.6667H5V3.33333ZM11.6667 3.33333H15V16.6667H11.6667V3.33333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.33333 2.5L16.6667 10L3.33333 17.5V2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            
            {/* Delete button */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(song.id);
              }}
              className="bg-secondary p-2.5 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"
              aria-label="Delete song"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 5H4.16667H17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6.66667 5V3.33333C6.66667 2.89131 6.84226 2.46738 7.15482 2.15482C7.46738 1.84226 7.89131 1.66667 8.33333 1.66667H11.6667C12.1087 1.66667 12.5326 1.84226 12.8452 2.15482C13.1577 2.46738 13.3333 2.89131 13.3333 3.33333V5M15.8333 5V16.6667C15.8333 17.1087 15.6577 17.5326 15.3452 17.8452C15.0326 18.1577 14.6087 18.3333 14.1667 18.3333H5.83333C5.39131 18.3333 4.96738 18.1577 4.65482 17.8452C4.34226 17.5326 4.16667 17.1087 4.16667 16.6667V5H15.8333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MySongsView;