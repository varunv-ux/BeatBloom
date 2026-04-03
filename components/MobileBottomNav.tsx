import React from 'react';
import { AppView } from '../types';

interface MobileBottomNavProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeView, onViewChange }) => {
  return (
    <div className="flex-shrink-0 bg-background border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-end justify-around">
        <button
          onClick={() => onViewChange('create')}
          className="flex-1 flex flex-col items-center gap-1 pt-3 pb-2"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={activeView === 'create' ? 'text-foreground' : 'text-muted-foreground'}>
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className={`text-[10px] font-medium ${activeView === 'create' ? 'text-foreground' : 'text-muted-foreground'}`}>
            Create
          </span>
        </button>

        <button
          onClick={() => onViewChange('my-songs')}
          className="flex-1 flex flex-col items-center gap-1 pt-3 pb-2"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={activeView === 'my-songs' ? 'text-foreground' : 'text-muted-foreground'}>
            <path d="M9 18V5L21 3V16M9 18C9 19.6569 7.65685 21 6 21C4.34315 21 3 19.6569 3 18C3 16.3431 4.34315 15 6 15C7.65685 15 9 16.3431 9 18ZM21 16C21 17.6569 19.6569 19 18 19C16.3431 19 15 17.6569 15 16C15 14.3431 16.3431 13 18 13C19.6569 13 21 14.3431 21 16ZM9 10L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className={`text-[10px] font-medium ${activeView === 'my-songs' ? 'text-foreground' : 'text-muted-foreground'}`}>
            My songs
          </span>
        </button>
      </div>
    </div>
  );
};

export default MobileBottomNav;
