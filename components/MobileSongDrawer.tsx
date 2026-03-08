import React, { useState } from 'react';
import { GeneratedSong, MusicDescription } from '../types';
import { MusicModel } from '../services/musicModels';
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
} from './ui/Drawer';
import {
  GENRE_OPTIONS, MOOD_OPTIONS, ARRANGEMENT_OPTIONS, VOCAL_OPTIONS,
  buildTagsString, formatLyricsForModel,
} from '../lib/musicConstants';
import MusicGenerationProgress from './MusicGenerationProgress';

interface MobileSongDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  song: GeneratedSong | null;
  isGenerating: boolean;
  onGenerateMusic: (lyrics: string, tags: string, description: MusicDescription, duration?: number) => void;
  onCancelGeneration: () => void;
  selectedModel: MusicModel;
}

const MobileSongDrawer: React.FC<MobileSongDrawerProps> = ({
  open,
  onOpenChange,
  song,
  isGenerating,
  onGenerateMusic,
  onCancelGeneration,
  selectedModel,
}) => {
  const [editableLyrics, setEditableLyrics] = useState(song?.lyrics || '');
  const [editableDesc, setEditableDesc] = useState<MusicDescription>(
    song?.musicDescription || { genre: 'Pop', mood: 'Happy', arrangement: 'Full Band', vocals: 'Female' }
  );
  const [duration, setDuration] = useState(selectedModel.durationOptions[1] || 60);
  const [activeTab, setActiveTab] = useState<'lyrics' | 'style'>('lyrics');

  React.useEffect(() => {
    if (song) {
      setEditableLyrics(song.lyrics);
      setEditableDesc(song.musicDescription);
    }
  }, [song]);

  if (!song) return null;

  const handleDescChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditableDesc(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSong = () => {
    const { genre, mood, arrangement, vocals } = editableDesc;
    const finalLyrics = formatLyricsForModel(editableLyrics);
    const finalTagsString = buildTagsString(genre, mood, arrangement, vocals);
    onGenerateMusic(finalLyrics, finalTagsString, editableDesc, duration);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] overflow-hidden">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Drag Handle */}
          <div className="flex-shrink-0 h-[42px]" />

          {/* Song Info */}
          <div className="flex-shrink-0 px-3 pb-3">
            <div className="bg-secondary/80 rounded-[24px] p-2">
              <div className="flex items-center gap-4">
                <img 
                  src={song.albumArtUrl} 
                  alt={`${song.title} album art`}
                  className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-base text-foreground truncate">
                    {song.title}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {editableDesc.genre} • {editableDesc.mood} • {editableDesc.arrangement} • {editableDesc.vocals} vocals
                  </p>
                </div>
                <button className="p-2.5 flex-shrink-0">
                  <img src="/assets/More.svg" alt="More" className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex-shrink-0 px-3 pb-3">
            <div className="flex gap-3">
              <button
                onClick={() => setActiveTab('lyrics')}
                className={`flex-1 h-12 rounded-2xl font-medium text-base transition-colors ${
                  activeTab === 'lyrics'
                    ? 'bg-secondary/80 text-foreground'
                    : 'bg-secondary/80 text-muted-foreground'
                }`}
              >
                Lyrics
              </button>
              <button
                onClick={() => setActiveTab('style')}
                className={`flex-1 h-12 rounded-2xl font-medium text-base transition-colors ${
                  activeTab === 'style'
                    ? 'bg-secondary/80 text-foreground'
                    : 'bg-secondary/80 text-muted-foreground'
                }`}
              >
                Style
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 px-3 overflow-hidden min-h-0">
            <div className="bg-secondary/80 rounded-[24px] p-5 h-full overflow-y-auto">
              {activeTab === 'lyrics' ? (
                <textarea 
                  value={editableLyrics}
                  onChange={(e) => setEditableLyrics(e.target.value)}
                  className="w-full h-full p-0 bg-transparent text-foreground text-base leading-6 resize-none focus:outline-none font-normal"
                  placeholder="Enter lyrics..."
                />
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Genre</label>
                    <select 
                      name="genre" 
                      value={editableDesc.genre} 
                      onChange={handleDescChange}
                      className="w-full h-10 bg-background border border-border rounded-xl px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {GENRE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Mood</label>
                    <select 
                      name="mood" 
                      value={editableDesc.mood} 
                      onChange={handleDescChange}
                      className="w-full h-10 bg-background border border-border rounded-xl px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {MOOD_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Arrangement</label>
                    <select 
                      name="arrangement" 
                      value={editableDesc.arrangement} 
                      onChange={handleDescChange}
                      className="w-full h-10 bg-background border border-border rounded-xl px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {ARRANGEMENT_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Vocals</label>
                    <select 
                      name="vocals" 
                      value={editableDesc.vocals} 
                      onChange={handleDescChange}
                      className="w-full h-10 bg-background border border-border rounded-xl px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {VOCAL_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Duration</label>
                    <select 
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full h-10 bg-background border border-border rounded-xl px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      disabled={!selectedModel.supports.duration}
                    >
                      {selectedModel.durationOptions.map(dur => (
                        <option key={dur} value={dur}>{dur} seconds</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Button */}
          <DrawerFooter className="flex-shrink-0 pb-3">
            {isGenerating ? (
              <MusicGenerationProgress isGenerating={isGenerating} onCancel={onCancelGeneration} />
            ) : (
              <button
                onClick={handleCreateSong}
                disabled={isGenerating}
                className="w-full h-14 bg-primary text-primary-foreground font-medium text-base rounded-3xl hover:opacity-90 transition-colors disabled:opacity-50"
              >
                Create song
              </button>
            )}
          </DrawerFooter>

          {/* Bottom Safe Area */}
          <div className="h-10 flex-shrink-0" />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileSongDrawer;
