import React from 'react';
import { SavedSong } from '../types';

interface MySongsViewProps {
  songs: SavedSong[];
  onView: (song: SavedSong) => Promise<void>;
  onDelete: (id: number) => void;
}

const MySongsView: React.FC<MySongsViewProps> = ({ songs, onView, onDelete }) => {
  if (songs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-32">
        <h2 className="text-3xl font-medium text-stone-950 mb-4">No Saved Songs Yet</h2>
        <p className="text-stone-500 text-lg">Go create your first masterpiece!</p>
      </div>
    );
  }

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')} mins`;
  };

  const formatDate = (date: Date) => {
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  return (
    <div className="space-y-3 max-w-4xl mx-auto">
      {songs.map(song => (
        <div key={song.id} className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl flex items-center gap-4 hover:bg-white/90 transition-all duration-200 group">
          <img 
            src={song.albumArtUrl} 
            alt="Album Art" 
            className="w-16 h-16 rounded-xl object-cover flex-shrink-0" 
          />
          
          <div className="flex-grow overflow-hidden">
            <h3 className="font-semibold text-lg text-stone-950 truncate mb-1">
              {song.title}
            </h3>
            <p className="text-sm text-stone-600 truncate mb-1">
              {song.musicDescription.genre} • {song.musicDescription.mood} • {song.musicDescription.vocals}
            </p>
            <p className="text-xs text-stone-500">
              {formatDuration(245)} • {formatDate(song.createdAt)}
            </p>
          </div>
          
          <div className="flex-shrink-0 flex items-center gap-2">
            <button 
              onClick={() => onView(song)}
              className="p-2 rounded-full hover:bg-stone-100 transition-colors text-stone-600 hover:text-stone-900"
              aria-label="Play song"
            >
              <img src="/assets/Play.svg" alt="Play" className="w-5 h-5" />
            </button>
            
            <button 
              className="p-2 rounded-full hover:bg-stone-100 transition-colors text-stone-600 hover:text-red-500"
              aria-label="Like song"
            >
              <img src="/assets/Heart.svg" alt="Heart" className="w-5 h-5" />
            </button>
            
            <div className="relative group/menu">
              <button 
                className="p-2 rounded-full hover:bg-stone-100 transition-colors text-stone-600 hover:text-stone-900"
                aria-label="More options"
              >
                <img src="/assets/More.svg" alt="More" className="w-5 h-5" />
              </button>
              
              {/* Dropdown menu */}
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-stone-200 py-1 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-10">
                <button 
                  onClick={() => onView(song)}
                  className="w-full px-4 py-2 text-left text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  View Details
                </button>
                <button 
                  onClick={() => onDelete(song.id)}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Delete Song
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MySongsView;