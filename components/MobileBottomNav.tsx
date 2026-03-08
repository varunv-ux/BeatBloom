import React from 'react';
import { AppView } from '../types';

interface MobileBottomNavProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeView, onViewChange }) => {
  return (
    <div className="flex-shrink-0 bg-background border-t border-border">
      <div className="flex items-end justify-center">
        <button
          onClick={() => onViewChange('create')}
          className="flex-1 flex flex-col items-center gap-1.5 px-10 pt-6 pb-1"
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
          className="flex-1 flex flex-col items-center gap-1.5 px-10 pt-6 pb-1"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={activeView === 'my-songs' ? 'text-foreground' : 'text-muted-foreground'}>
            <path d="M9 18V5L21 3V16M9 18C9 19.6569 7.65685 21 6 21C4.34315 21 3 19.6569 3 18C3 16.3431 4.34315 15 6 15C7.65685 15 9 16.3431 9 18ZM21 16C21 17.6569 19.6569 19 18 19C16.3431 19 15 17.6569 15 16C15 14.3431 16.3431 13 18 13C19.6569 13 21 14.3431 21 16ZM9 10L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className={`text-[10px] font-medium ${activeView === 'my-songs' ? 'text-foreground' : 'text-muted-foreground'}`}>
            My songs
          </span>
        </button>

        <button
          className="flex-1 flex flex-col items-center gap-1.5 px-10 pt-6 pb-1"
        >
          <img src="/assets/Profile.png" alt="Profile" className="w-6 h-6 rounded-full object-cover" />
          <span className="text-[10px] font-medium text-muted-foreground">
            Profile
          </span>
        </button>

        <button
          className="flex-1 flex flex-col items-center gap-1.5 px-10 pt-6 pb-1"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[10px] font-medium text-muted-foreground">
            Upgrade
          </span>
        </button>
      </div>

      {/* Home Indicator */}
      <div className="h-10 flex items-start justify-center pt-2">
        <div className="w-[120px] h-1 bg-muted-foreground rounded-full" />
      </div>
    </div>
  );
};

export default MobileBottomNav;
