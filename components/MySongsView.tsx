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
    <div className="flex flex-col gap-3 w-full max-w-[800px] mx-auto">
      {songs.map(song => (
        <div 
          key={song.id} 
          className="bg-stone-100 rounded-[24px] pl-2 pr-5 py-2 flex items-center justify-between"
        >
          {/* Left section: Album art + Song details */}
          <div className="flex items-center gap-4">
            {/* Album Art */}
            <img 
              src={song.albumArtUrl} 
              alt="Album Art" 
              className="w-[100px] h-[100px] rounded-2xl object-cover flex-shrink-0" 
            />
            
            {/* Song Details */}
            <div className="flex flex-col gap-1 w-[360px]">
              <h3 className="font-medium text-base text-black leading-5">
                {song.title}
              </h3>
              <div className="text-xs text-stone-500 leading-4">
                <p className="truncate">
                  {song.musicDescription.genre} • {song.musicDescription.mood} • {song.musicDescription.vocals}
                </p>
                <p className="mt-0.5">
                  {formatDuration(245)} • {formatDate(song.createdAt)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Right section: Action buttons */}
          <div className="flex items-center gap-3 opacity-80">
            {/* Edit button */}
            <button 
              className="bg-stone-100 p-2.5 rounded-xl hover:bg-stone-200 transition-colors"
              aria-label="Edit song"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.1667 2.5C14.3856 2.28113 14.6454 2.10752 14.9314 1.98906C15.2173 1.87061 15.5238 1.80969 15.8333 1.80969C16.1429 1.80969 16.4493 1.87061 16.7353 1.98906C17.0213 2.10752 17.281 2.28113 17.5 2.5C17.7189 2.71887 17.8925 2.97862 18.0109 3.26458C18.1294 3.55055 18.1903 3.85702 18.1903 4.16667C18.1903 4.47631 18.1294 4.78278 18.0109 5.06875C17.8925 5.35471 17.7189 5.61446 17.5 5.83333L6.25 17.0833L1.66667 18.3333L2.91667 13.75L14.1667 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            {/* Play button */}
            <button 
              onClick={() => onView(song)}
              className="bg-stone-100 p-2.5 rounded-xl hover:bg-stone-200 transition-colors"
              aria-label="Play song"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.33333 2.5L16.6667 10L3.33333 17.5V2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            {/* Heart button */}
            <button 
              className="bg-stone-100 p-2.5 rounded-xl hover:bg-stone-200 transition-colors"
              aria-label="Like song"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.3667 3.8417C16.9412 3.41589 16.4369 3.07764 15.8795 2.84582C15.3221 2.61399 14.7224 2.49316 14.1167 2.49316C13.511 2.49316 12.9113 2.61399 12.3539 2.84582C11.7965 3.07764 11.2921 3.41589 10.8667 3.8417L10 4.7084L9.13333 3.8417C8.27391 2.98228 7.10928 2.49348 5.89167 2.49348C4.67406 2.49348 3.50943 2.98228 2.65 3.8417C1.79058 4.70113 1.30178 5.86576 1.30178 7.08337C1.30178 8.30098 1.79058 9.46561 2.65 10.325L3.51667 11.1917L10 17.675L16.4833 11.1917L17.35 10.325C17.7758 9.89957 18.1141 9.39525 18.3459 8.83783C18.5777 8.28041 18.6986 7.68073 18.6986 7.07503C18.6986 6.46934 18.5777 5.86966 18.3459 5.31224C18.1141 4.75482 17.7758 4.2505 17.35 3.82503L17.3667 3.8417Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            {/* More button with dropdown */}
            <div className="relative group/menu">
              <button 
                className="bg-stone-100 p-2.5 rounded-xl hover:bg-stone-200 transition-colors"
                aria-label="More options"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 10.8333C10.4602 10.8333 10.8333 10.4602 10.8333 10C10.8333 9.53976 10.4602 9.16666 10 9.16666C9.53976 9.16666 9.16666 9.53976 9.16666 10C9.16666 10.4602 9.53976 10.8333 10 10.8333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 4.99999C10.4602 4.99999 10.8333 4.62689 10.8333 4.16666C10.8333 3.70642 10.4602 3.33332 10 3.33332C9.53976 3.33332 9.16666 3.70642 9.16666 4.16666C9.16666 4.62689 9.53976 4.99999 10 4.99999Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 16.6667C10.4602 16.6667 10.8333 16.2936 10.8333 15.8333C10.8333 15.3731 10.4602 15 10 15C9.53976 15 9.16666 15.3731 9.16666 15.8333C9.16666 16.2936 9.53976 16.6667 10 16.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              {/* Dropdown menu */}
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-stone-200 py-1 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-10 min-w-[150px]">
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