import React, { useState, useEffect } from 'react';
import type { GeneratedSong, MusicDescription } from '../types';
import { MusicModel } from '../services/musicModels';
import {
  GENRE_OPTIONS, MOOD_OPTIONS, ARRANGEMENT_OPTIONS, VOCAL_OPTIONS,
  buildTagsString, formatLyricsForModel,
} from '../lib/musicConstants';
import MusicGenerationProgress from './MusicGenerationProgress';

interface GeneratedSongDisplayProps {
  song: GeneratedSong;
  onReset: () => void;
  onGenerateMusic: (lyrics: string, tags: string, description: MusicDescription, duration?: number) => void;
  onCancelGeneration: () => void;
  isGeneratingMusic: boolean;
  songUrl: string | null;
  musicError: string | null;
  selectedModel: MusicModel;
  songId?: number | null;
}

const GeneratedSongDisplay: React.FC<GeneratedSongDisplayProps> = ({ 
  song, 
  onGenerateMusic,
  onCancelGeneration,
  isGeneratingMusic,
  songUrl,
  musicError,
  selectedModel,
  songId,
}) => {
  const [editableLyrics, setEditableLyrics] = useState(song.lyrics);
  const [editableDesc, setEditableDesc] = useState<MusicDescription>(song.musicDescription);
  const [duration, setDuration] = useState(selectedModel.durationOptions[1] || 60);

  useEffect(() => {
    setEditableLyrics(song.lyrics);
    setEditableDesc(song.musicDescription);
  }, [song]);

  const handleDescChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditableDesc(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCreateSongClick = () => {
    const { genre, mood, arrangement, vocals } = editableDesc;
    const finalLyrics = formatLyricsForModel(editableLyrics);
    const finalTagsString = buildTagsString(genre, mood, arrangement, vocals);
    onGenerateMusic(finalLyrics, finalTagsString, editableDesc, duration);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 px-4 py-3 pb-3 flex gap-4 overflow-hidden min-h-0">
        {/* Album Cover Column - FIRST */}
        <div className="bg-secondary rounded-[24px] p-5 flex flex-col overflow-hidden min-h-0" style={{ minWidth: '360px', maxWidth: '360px' }}>
          <div className="flex-1 flex flex-col justify-between min-h-0">
            <div className="space-y-4 flex-shrink-0">
              {/* Song Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-foreground">{song.title}</h3>
              </div>

              {/* Album Art */}
              <div className="aspect-square bg-center bg-cover bg-no-repeat rounded-2xl" style={{ backgroundImage: `url('${song.albumArtUrl}')` }} />

              {/* Song Details */}
              <p className="text-sm font-normal text-muted-foreground leading-5">
                {editableDesc.genre}・{editableDesc.mood}・{editableDesc.arrangement}・{editableDesc.vocals} vocals
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 flex-shrink-0 mt-4">
              {isGeneratingMusic ? (
                <MusicGenerationProgress isGenerating={isGeneratingMusic} onCancel={onCancelGeneration} />
              ) : !songUrl ? (
                <button
                  onClick={handleCreateSongClick}
                  className="w-full h-12 bg-primary text-primary-foreground font-medium text-lg rounded-2xl hover:opacity-90 transition-colors"
                >
                  Create song
                </button>
              ) : null}

              {songUrl && (
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateSongClick}
                    className="flex-1 h-12 bg-background text-foreground font-medium text-base rounded-full hover:bg-accent active:scale-[0.97] transition-all"
                  >
                    Recreate song
                  </button>
                  <button
                    onClick={() => {
                      const shareUrl = songId
                        ? `${window.location.origin}?song=${songId}`
                        : window.location.href;
                      if (navigator.share) {
                        navigator.share({ title: song.title, text: `Check out "${song.title}" - made with BeatBloom!`, url: shareUrl });
                      } else {
                        navigator.clipboard.writeText(shareUrl);
                      }
                    }}
                    className="flex-1 h-12 bg-background text-foreground font-medium text-base rounded-full hover:bg-accent active:scale-[0.97] transition-all"
                  >
                    Share
                  </button>
                </div>
              )}

              {musicError && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-2 rounded-lg text-center text-sm">
                  <p className="font-semibold">Music Generation Failed</p>
                  <p>{musicError}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lyrics Column - SECOND */}
        <div className="flex-1 bg-secondary rounded-[24px] p-5 flex flex-col overflow-hidden min-h-0" style={{ minWidth: '340px' }}>
          <h3 className="text-lg font-medium text-foreground mb-4">Lyrics</h3>
          <div className="flex-1 min-h-0">
            <textarea 
              value={editableLyrics}
              onChange={(e) => setEditableLyrics(e.target.value)}
              className="w-full h-full p-0 bg-transparent text-foreground text-sm leading-6 resize-none focus:outline-none font-normal"
              aria-label="Editable lyrics text area"
            />
          </div>
        </div>

        {/* Musical Style Column - THIRD */}
        <div className="bg-secondary rounded-[24px] p-5 flex flex-col overflow-hidden min-h-0" style={{ minWidth: '320px', maxWidth: '340px' }}>
          <h3 className="text-lg font-medium text-foreground mb-4">Musical style</h3>
          <div className="flex-1 space-y-4 overflow-y-auto">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Genre</label>
              <div className="relative">
                <select 
                  name="genre" 
                  value={editableDesc.genre} 
                  onChange={handleDescChange}
                  className="w-full h-10 bg-background border border-border rounded-xl px-3 text-sm text-foreground focus:outline-none focus:border-foreground/30 transition-colors appearance-none"
                >
                  {GENRE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg width="21" height="21" viewBox="0 0 21 21" fill="none" className="text-muted-foreground">
                    <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Mood</label>
              <div className="relative">
                <select 
                  name="mood" 
                  value={editableDesc.mood} 
                  onChange={handleDescChange}
                  className="w-full h-10 bg-background border border-border rounded-xl px-3 text-sm text-foreground focus:outline-none focus:border-foreground/30 transition-colors appearance-none"
                >
                  {MOOD_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg width="21" height="21" viewBox="0 0 21 21" fill="none" className="text-muted-foreground">
                    <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Arrangement</label>
              <div className="relative">
                <select 
                  name="arrangement" 
                  value={editableDesc.arrangement} 
                  onChange={handleDescChange}
                  className="w-full h-10 bg-background border border-border rounded-xl px-3 text-sm text-foreground focus:outline-none focus:border-foreground/30 transition-colors appearance-none"
                >
                  {ARRANGEMENT_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg width="21" height="21" viewBox="0 0 21 21" fill="none" className="text-muted-foreground">
                    <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Vocals</label>
              <div className="relative">
                <select 
                  name="vocals" 
                  value={editableDesc.vocals} 
                  onChange={handleDescChange}
                  className="w-full h-10 bg-background border border-border rounded-xl px-3 text-sm text-foreground focus:outline-none focus:border-foreground/30 transition-colors appearance-none"
                >
                  {VOCAL_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg width="21" height="21" viewBox="0 0 21 21" fill="none" className="text-muted-foreground">
                    <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Duration</label>
              <div className="relative">
                <select 
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full h-10 bg-background border border-border rounded-xl px-3 text-sm text-foreground focus:outline-none focus:border-foreground/30 transition-colors appearance-none"
                  disabled={!selectedModel.supports.duration}
                >
                  {selectedModel.durationOptions.map(dur => (
                    <option key={dur} value={dur}>{dur} seconds</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg width="21" height="21" viewBox="0 0 21 21" fill="none" className="text-muted-foreground">
                    <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              {!selectedModel.supports.duration && (
                <p className="text-xs text-muted-foreground">
                  Duration is auto-determined by {selectedModel.name}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratedSongDisplay;