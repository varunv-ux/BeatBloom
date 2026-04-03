import React from 'react';

interface MobileHeaderProps {
  onSettingsClick: () => void;
  onNewSong?: () => void;
  onModelSelect?: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onSettingsClick, onNewSong, onModelSelect }) => {
  return (
    <header className="flex-shrink-0 bg-background border-b border-border">
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2">
          <img src="/assets/BeatBloomLogo.png" alt="BeatBloom" className="w-8 h-8 rounded-lg" />
          <h1 className="text-lg font-bold text-foreground">BeatBloom</h1>
        </div>

        <div className="flex items-center gap-1">
          {onNewSong && (
            <button onClick={onNewSong} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors" aria-label="New song">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-muted-foreground">
                <path d="M10 4.16666V15.8333M4.16667 10H15.8333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          {onModelSelect && (
            <button onClick={onModelSelect} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors" aria-label="Model selection">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-muted-foreground">
                <path d="M10 1.66666V5.83333M10 14.1667V18.3333M5.83333 10H1.66667M18.3333 10H14.1667M15.8333 15.8333L13.3333 13.3333M15.8333 4.16666L13.3333 6.66666M4.16667 15.8333L6.66667 13.3333M4.16667 4.16666L6.66667 6.66666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          <button onClick={onSettingsClick} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors" aria-label="Settings">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-muted-foreground">
              <path d="M10 10C12.0711 10 13.75 8.32107 13.75 6.25C13.75 4.17893 12.0711 2.5 10 2.5C7.92893 2.5 6.25 4.17893 6.25 6.25C6.25 8.32107 7.92893 10 10 10Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M3.75 17.5C3.75 14.0482 6.54822 11.25 10 11.25C13.4518 11.25 16.25 14.0482 16.25 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
