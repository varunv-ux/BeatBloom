import React, { useState, useEffect } from 'react';
import { useVoiceVisualizer, VoiceVisualizer } from 'react-voice-visualizer';
import type { GeneratedSong, MusicDescription, StyleSuggestion, VocalStyle } from '../types';
import { MusicModel } from '../services/musicModels';
import { SparklesIcon } from './icons/SparklesIcon';

// Define the options for the dropdowns, matching the AI's constraints
const GENRE_OPTIONS = ["Pop", "Rock", "Hip Hop", "Electronic", "Folk / Country", "R&B / Soul", "Jazz", "Orchestral", "Kids / Nursery Rhyme", "Ambient", "Classical", "Reggae"];
const MOOD_OPTIONS = ["Happy", "Sad", "Energetic", "Relaxing", "Romantic", "Epic", "Nostalgic", "Sentimental", "Playful", "Mysterious", "Hopeful"];
const ARRANGEMENT_OPTIONS = ["Full Band", "Acoustic", "Electronic", "Orchestral", "Simple Acoustic", "Synth & Drums"];
const VOCAL_OPTIONS: VocalStyle[] = ["Male", "Female"];

// Update suggestions to use values from the dropdown options
const styleSuggestions: StyleSuggestion[] = [
    { name: 'Synth Pop', description: { genre: 'Electronic', mood: 'Nostalgic', arrangement: 'Synth & Drums', vocals: 'Female' } },
    { name: 'Acoustic Folk', description: { genre: 'Folk / Country', mood: 'Sentimental', arrangement: 'Acoustic', vocals: 'Male' } },
    { name: 'Epic Cinematic', description: { genre: 'Orchestral', mood: 'Epic', arrangement: 'Orchestral', vocals: 'Male' } },
    { name: 'Chill Ambient', description: { genre: 'Ambient', mood: 'Relaxing', arrangement: 'Electronic', vocals: 'Female' } },
    { name: 'Playful Pop', description: { genre: 'Pop', mood: 'Playful', arrangement: 'Full Band', vocals: 'Female' } },
    { name: 'Mysterious Jazz', description: { genre: 'Jazz', mood: 'Mysterious', arrangement: 'Acoustic', vocals: 'Male' } },
    { name: 'Hopeful Classical', description: { genre: 'Classical', mood: 'Hopeful', arrangement: 'Orchestral', vocals: 'Female' } },
    { name: 'Reggae Vibes', description: { genre: 'Reggae', mood: 'Happy', arrangement: 'Full Band', vocals: 'Male' } }
];

interface GeneratedSongDisplayProps {
  song: GeneratedSong;
  onReset: () => void;
  onGenerateMusic: (lyrics: string, tags: string, description: MusicDescription, duration?: number) => void;
  isGeneratingMusic: boolean;
  songUrl: string | null;
  musicError: string | null;
  selectedModel: MusicModel;
}

const GeneratedSongDisplay: React.FC<GeneratedSongDisplayProps> = ({ 
  song, 
  onReset,
  onGenerateMusic,
  isGeneratingMusic,
  songUrl,
  musicError,
  selectedModel,
}) => {
  const [editableLyrics, setEditableLyrics] = useState(song.lyrics);
  const [editableDesc, setEditableDesc] = useState<MusicDescription>(song.musicDescription);
  const [duration, setDuration] = useState(selectedModel.durationOptions[1] || 60); // Default to middle option
  const [isPlaying, setIsPlaying] = useState(false);

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
    
    // Format lyrics for ACE-Step model (add structure if not present)
    let finalLyrics = editableLyrics;
    if (!finalLyrics.includes('[verse]') && !finalLyrics.includes('[chorus]')) {
      // Auto-structure the lyrics if they're unstructured
      const lines = finalLyrics.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        finalLyrics = `[verse]\n${lines.join('\n')}\n\n[chorus]\n${lines.join('\n')}`;
      }
    }
    
    // Create more descriptive tags like the working curl example
    const genreMap: Record<string, string> = {
      'pop': 'pop, catchy, mainstream, upbeat',
      'rock': 'rock, guitar, drums, powerful',
      'hip hop': 'hip-hop, rap, beats, urban',
      'electronic': 'electronic, synthesizer, digital, modern',
      'folk / country': 'folk, country, acoustic, traditional',
      'r&b / soul': 'r&b, soul, smooth, rhythm',
      'jazz': 'jazz, improvisation, saxophone, smooth',
      'orchestral': 'orchestral, classical, symphony, grand',
      'kids / nursery rhyme': 'kids, nursery-rhyme, children, playful',
      'ambient': 'ambient, atmospheric, ethereal, calm',
      'classical': 'classical, piano, strings, elegant',
      'reggae': 'reggae, caribbean, relaxed, rhythmic'
    };

    const moodMap: Record<string, string> = {
      'happy': 'happy, uplifting, cheerful, bright',
      'sad': 'sad, melancholic, emotional, slow',
      'energetic': 'energetic, high-energy, fast, dynamic',
      'relaxing': 'relaxing, calm, peaceful, soothing',
      'romantic': 'romantic, love, intimate, tender',
      'epic': 'epic, cinematic, grand, powerful',
      'nostalgic': 'nostalgic, memories, wistful, reflective',
      'sentimental': 'sentimental, touching, emotional, heartfelt',
      'playful': 'playful, fun, light-hearted, bouncy',
      'mysterious': 'mysterious, dark, enigmatic, suspenseful',
      'hopeful': 'hopeful, optimistic, inspiring, uplifting'
    };

    const genreKey = genre.toLowerCase();
    const moodKey = mood.toLowerCase();
    
    const expandedGenre = genreMap[genreKey] || genre.toLowerCase();
    const expandedMood = moodMap[moodKey] || mood.toLowerCase();
    
    const finalTagsString = `${expandedGenre}, ${expandedMood}, ${arrangement.toLowerCase()}, ${vocals.toLowerCase()} vocals`;

    console.log('🎵 Creating song with settings:', { genre, mood, arrangement, vocals, duration });
    console.log('🏷️ Tags string:', finalTagsString);
    console.log('📝 Formatted lyrics:', finalLyrics.substring(0, 100) + '...');

    onGenerateMusic(finalLyrics, finalTagsString, editableDesc, duration);
  };

  // Initialize a voice visualizer for the song playback
  const songVisualizerControls = useVoiceVisualizer({
    onStartRecording: () => {},
    onStopRecording: () => {},
    onPausedRecording: () => {},
    onResumedRecording: () => {},
  });

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 px-6 py-4 flex gap-6 overflow-hidden min-h-0">
        {/* Album Cover Column - FIRST */}
        <div className="bg-stone-100 rounded-[32px] p-6 flex flex-col overflow-hidden min-h-0" style={{ minWidth: '400px', maxWidth: '400px' }}>
          <div className="flex-1 flex flex-col justify-between min-h-0">
            <div className="space-y-5 flex-shrink-0">
              {/* Song Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-xl font-medium text-black">{song.title}</h3>
                  <div className="w-4 h-4 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-stone-400">
                      <path d="M8 4v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  </div>
                </div>
                <div className="flex gap-2 opacity-80">
                  <button className="p-1 rounded-lg opacity-0">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-stone-400">
                      <path d="M10 3v14m7-7l-7-7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button className="p-1 rounded-lg">
                    <img src="/assets/More.svg" alt="More options" className="w-5 h-5 text-stone-400" />
                  </button>
                </div>
              </div>

              {/* Album Art */}
              <div className="aspect-square bg-center bg-cover bg-no-repeat rounded-3xl" style={{ backgroundImage: `url('${song.albumArtUrl}')` }} />

              {/* Song Details */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-normal text-stone-500 leading-5">
                    {editableDesc.genre}・{editableDesc.mood}・{editableDesc.arrangement}・{editableDesc.vocals} vocals
                  </p>
                  <p className="text-sm font-normal text-stone-500 leading-5">
                    2 mins ・ Jun 28
                  </p>
                </div>
                
                {/* Waveform Visualizer */}
                {songUrl && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-stone-400">
                      <span>0:00</span>
                      <span>2:40</span>
                    </div>
                    <div className="w-full h-6 rounded-lg overflow-hidden">
                      <VoiceVisualizer
                        controls={songVisualizerControls}
                        height={24}
                        width="100%"
                        backgroundColor="transparent"
                        mainBarColor="#79716b"
                        secondaryBarColor="#e7e5e4"
                        barWidth={2}
                        gap={1}
                        rounded={2}
                        isControlPanelShown={false}
                        isDefaultUIShown={false}
                        onlyRecording={false}
                        animateCurrentPick={isPlaying}
                        fullscreen={false}
                        speed={1}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 flex-shrink-0">
              {isGeneratingMusic ? (
                <div className="flex flex-col items-center justify-center p-4 bg-stone-200 rounded-3xl h-14">
                  <div className="w-6 h-6 border-2 border-t-transparent border-stone-600 rounded-full animate-spin"></div>
                </div>
              ) : songUrl ? (
                <button
                  onClick={() => {
                    const audio = document.querySelector('audio') as HTMLAudioElement;
                    if (audio) {
                      if (audio.paused) {
                        audio.play();
                        setIsPlaying(true);
                      } else {
                        audio.pause();
                        setIsPlaying(false);
                      }
                    }
                  }}
                  className="w-full h-14 bg-stone-950 text-white font-medium text-xl rounded-3xl hover:bg-stone-800 transition-colors"
                >
                  {isPlaying ? 'Pause song' : 'Play song'}
                </button>
              ) : (
                <button
                  onClick={handleCreateSongClick}
                  className="w-full h-14 bg-stone-950 text-white font-medium text-xl rounded-3xl hover:bg-stone-800 transition-colors"
                >
                  Create song
                </button>
              )}
              
              {songUrl && !isGeneratingMusic && (
                <audio 
                  src={songUrl} 
                  className="hidden"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                >
                  Your browser does not support the audio element.
                </audio>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onReset}
                  className="flex-1 h-14 bg-stone-200 text-stone-500 font-medium text-xl rounded-3xl hover:bg-stone-300 transition-colors"
                >
                  Recreate song
                </button>
                <button
                  onClick={onReset}
                  className="flex-1 h-14 bg-stone-200 text-stone-500 font-medium text-xl rounded-3xl hover:bg-stone-300 transition-colors"
                >
                  New song
                </button>
              </div>

              {musicError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-center text-sm">
                  <p className="font-semibold">Music Generation Failed</p>
                  <p>{musicError}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lyrics Column - SECOND */}
        <div className="flex-1 bg-stone-100 rounded-[32px] p-6 flex flex-col overflow-hidden min-h-0">
          <h3 className="text-xl font-medium text-black mb-6">Lyrics</h3>
          <div className="flex-1 min-h-0">
            <textarea 
              value={editableLyrics}
              onChange={(e) => setEditableLyrics(e.target.value)}
              className="w-full h-full p-0 bg-transparent text-black text-base leading-6 resize-none focus:outline-none font-normal"
              aria-label="Editable lyrics text area"
            />
          </div>
        </div>

        {/* Musical Style Column - THIRD */}
        <div className="bg-stone-100 rounded-[32px] p-6 flex flex-col overflow-hidden min-h-0" style={{ minWidth: '400px', maxWidth: '400px' }}>
          <h3 className="text-xl font-medium text-black mb-6">Musical style</h3>
          <div className="flex-1 space-y-5 overflow-y-auto">
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-600">Genre</label>
              <div className="relative">
                <select 
                  name="genre" 
                  value={editableDesc.genre} 
                  onChange={handleDescChange}
                  className="w-full h-10 bg-white border border-stone-200 rounded-xl px-3 text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-300 appearance-none"
                >
                  {GENRE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg width="21" height="21" viewBox="0 0 21 21" fill="none" className="text-stone-400">
                    <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-600">Mood</label>
              <div className="relative">
                <select 
                  name="mood" 
                  value={editableDesc.mood} 
                  onChange={handleDescChange}
                  className="w-full h-10 bg-white border border-stone-200 rounded-xl px-3 text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-300 appearance-none"
                >
                  {MOOD_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg width="21" height="21" viewBox="0 0 21 21" fill="none" className="text-stone-400">
                    <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-600">Arrangement</label>
              <div className="relative">
                <select 
                  name="arrangement" 
                  value={editableDesc.arrangement} 
                  onChange={handleDescChange}
                  className="w-full h-10 bg-white border border-stone-200 rounded-xl px-3 text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-300 appearance-none"
                >
                  {ARRANGEMENT_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg width="21" height="21" viewBox="0 0 21 21" fill="none" className="text-stone-400">
                    <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-600">Vocals</label>
              <div className="relative">
                <select 
                  name="vocals" 
                  value={editableDesc.vocals} 
                  onChange={handleDescChange}
                  className="w-full h-10 bg-white border border-stone-200 rounded-xl px-3 text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-300 appearance-none"
                >
                  {VOCAL_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg width="21" height="21" viewBox="0 0 21 21" fill="none" className="text-stone-400">
                    <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-600">Duration</label>
              <div className="relative">
                <select 
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full h-10 bg-white border border-stone-200 rounded-xl px-3 text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-300 appearance-none"
                  disabled={!selectedModel.supports.duration}
                >
                  {selectedModel.durationOptions.map(dur => (
                    <option key={dur} value={dur}>{dur} seconds</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg width="21" height="21" viewBox="0 0 21 21" fill="none" className="text-stone-400">
                    <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              {!selectedModel.supports.duration && (
                <p className="text-xs text-stone-500">
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