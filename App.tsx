import React, { useState, useCallback, useEffect } from 'react';
import { GeneratedSong, RecordingStatus, AppView, SavedSong, MusicDescription } from './types';
import { generateSongFromHum } from './services/geminiService';
import { generateMusic } from './services/replicateService';
import { MusicModelId, MUSIC_MODELS, DEFAULT_MODEL } from './services/musicModels';
import * as dbService from './services/vercelDbService';
import RecorderControl from './components/RecorderControl';
import GeneratedSongDisplay from './components/GeneratedSongDisplay';
import Loader from './components/Loader';
import MySongsView from './components/MySongsView';
import { SparklesIcon } from './components/icons/SparklesIcon';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('create');
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [generatedSong, setGeneratedSong] = useState<GeneratedSong | null>(null);
  const [songUrl, setSongUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [musicError, setMusicError] = useState<string | null>(null);
  const [savedSongs, setSavedSongs] = useState<SavedSong[]>([]);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [selectedMusicModel, setSelectedMusicModel] = useState<MusicModelId>(DEFAULT_MODEL);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  useEffect(() => {
    console.log('🚀 App starting - initializing database...');
    dbService.initDatabase().then((success) => {
      console.log('📊 Database init result:', success);
      loadSongs();
    }).catch((error) => {
      console.error('❌ Database init failed:', error);
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu && !(event.target as Element).closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const loadSongs = async () => {
    console.log('📂 Loading songs from database...');
    try {
      const songs = await dbService.getAllSongs();
      console.log('✅ Loaded', songs.length, 'songs from database');
      setSavedSongs(songs);
    } catch (error) {
      console.error('❌ Error loading songs:', error);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!audioBlob) {
      setError('No recording available to generate from.');
      return;
    }
    handleReset(true); // Soft reset
    setIsLoading(true);

    try {
      const song = await generateSongFromHum(audioBlob);
      setGeneratedSong(song);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during generation.');
    } finally {
      setIsLoading(false);
    }
  }, [audioBlob]);

  const handleGenerateMusic = useCallback(async (lyrics: string, tags: string, description: MusicDescription, duration: number = 60) => {
    if (!generatedSong) return;
    setIsGeneratingMusic(true);
    setMusicError(null);
    setSongUrl(null);

    console.log('🎵 App.tsx - Generating music with model:', selectedMusicModel, 'duration:', duration, 'seconds');

    try {
      const { audioUrl, audioBlob: generatedAudioBlob } = await generateMusic(lyrics, tags, duration, selectedMusicModel);
      setSongUrl(audioUrl);
      
      // Save the complete song to database
      await dbService.addSong({
        title: generatedSong.title, // Keep original title for now, could make it editable later
        lyrics,
        musicDescription: description,
        albumArtUrl: generatedSong.albumArtUrl,
        generatedSongBlob: generatedAudioBlob, // Store the generated song
      });
      await loadSongs(); // Refresh list

    } catch (err) {
      console.error(err);
      setMusicError(err instanceof Error ? err.message : 'An unknown error occurred while creating the song.');
    } finally {
      setIsGeneratingMusic(false);
    }
  }, [generatedSong, audioBlob]);

  const handleReset = (soft: boolean = false) => {
    setGeneratedSong(null);
    setSongUrl(null);
    setError(null);
    setMusicError(null);
    setIsLoading(false);
    setIsGeneratingMusic(false);
    if (!soft) {
      setRecordingStatus('idle');
      setAudioBlob(null);
      setAudioURL(null);
      setView('create');
    }
  };

  const handleDeleteSong = async (id: number) => {
    await dbService.deleteSong(id);
    await loadSongs();
  };

  const handleViewSong = async (song: SavedSong) => {
    const { audioBlob, ...restOfSong } = song;
    setGeneratedSong(restOfSong);
    
    // Use the audio blob directly (it's already stored as a blob in the database)
    if (audioBlob && audioBlob.size > 0) {
      const url = URL.createObjectURL(audioBlob);
      setSongUrl(url);
    }
    
    setView('create');
    // Clean up other states
    setRecordingStatus('idle');
    setAudioBlob(null);
    setAudioURL(null);
    setError(null);
    setMusicError(null);
  };
  
  const NavButton: React.FC<{
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }> = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-sm font-medium rounded-xl transition-colors duration-200 ${
        active
          ? 'bg-stone-950 text-white'
          : 'text-stone-400 hover:text-stone-600'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div 
      className="min-h-screen relative overflow-hidden font-sans"
      style={{
        backgroundImage: `url('/assets/Background01.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="flex items-center justify-center min-h-screen p-[60px_200px]">
        <div className="w-full max-w-[1280px] h-[960px] bg-white rounded-[32px] shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <header className="h-[66px] flex items-center justify-between px-6 py-3 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <img src="/assets/BeatBloomLogo.png" alt="BeatBloom" className="w-10 h-10 rounded-xl" />
              <h1 className="text-2xl font-bold text-stone-950">BeatBloom</h1>
            </div>
            
            <nav className="border border-stone-200 rounded-2xl p-[3px]">
              <div className="flex">
                <NavButton active={view === 'create'} onClick={() => setView('create')}>
                  Create
                </NavButton>
                <NavButton active={view === 'my-songs'} onClick={() => setView('my-songs')}>
                  My songs
                </NavButton>
              </div>
            </nav>

            <div className="flex items-center gap-4">
              <button className="bg-stone-100 h-10 px-3 py-1 rounded-2xl flex items-center gap-1 text-stone-600 text-xs font-medium">
                <img src="/assets/Crown.png" alt="Crown" className="w-4 h-4" />
                Upgrade
              </button>
              
              {/* Settings Button */}
              <button 
                onClick={() => setShowSettings(true)}
                className="w-10 h-10 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors flex items-center justify-center"
                title="Settings"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-stone-600">
                  <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              <div className="relative user-menu-container">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-10 h-10 bg-stone-300 rounded-full hover:bg-stone-400 transition-colors"
                >
                  <img 
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face" 
                    alt="User avatar" 
                    className="w-full h-full rounded-full object-cover"
                  />
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-lg border border-stone-200 py-4 z-50">
                    {/* User Info */}
                    <div className="px-4 pb-4 border-b border-stone-100">
                      <h3 className="font-semibold text-stone-950">Varun Varshney</h3>
                      <p className="text-sm text-stone-500">varunv.ux@gmail.com</p>
                    </div>
                    
                    {/* Upgrade Section */}
                    <div className="px-4 py-4 border-b border-stone-100">
                      <button className="w-full bg-stone-950 text-white font-medium py-2.5 px-4 rounded-xl hover:bg-stone-800 transition-colors">
                        Upgrade to Pro
                      </button>
                      <p className="text-xs text-stone-500 mt-2">Free Plan • 2 songs left</p>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="py-2">
                      <button className="w-full px-4 py-2.5 text-left text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-3">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="currentColor"/>
                        </svg>
                        Share
                      </button>
                      <button className="w-full px-4 py-2.5 text-left text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-3">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                        </svg>
                        About
                      </button>
                      <button className="w-full px-4 py-2.5 text-left text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-3">
                        <img src="/assets/Signout.svg" alt="Sign out" className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                    
                    {/* Footer Links */}
                    <div className="px-4 pt-4 border-t border-stone-100">
                      <div className="flex gap-4 text-xs text-stone-500">
                        <button className="hover:text-stone-700 transition-colors">Privacy</button>
                        <button className="hover:text-stone-700 transition-colors">Terms</button>
                        <button className="hover:text-stone-700 transition-colors">Feedback</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 flex flex-col">
            {view === 'my-songs' ? (
              <div className="w-full p-5">
                <MySongsView songs={savedSongs} onView={handleViewSong} onDelete={handleDeleteSong} />
              </div>
            ) : isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader />
              </div>
            ) : generatedSong ? (
              <GeneratedSongDisplay
                song={generatedSong}
                onReset={() => handleReset(false)}
                onGenerateMusic={handleGenerateMusic}
                isGeneratingMusic={isGeneratingMusic}
                songUrl={songUrl}
                musicError={musicError}
                selectedModel={MUSIC_MODELS[selectedMusicModel]}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center px-[411px] py-[180px]">
                <div className="flex flex-col items-center gap-10 w-[600px]">
                  {recordingStatus !== 'stopped' && (
                    <h2 className="text-5xl font-medium text-black text-center leading-none">
                      Hum a tune, say a few words, and get a masterpiece
                    </h2>
                  )}
                  
                  <RecorderControl
                    recordingStatus={recordingStatus}
                    setRecordingStatus={setRecordingStatus}
                    setAudioBlob={setAudioBlob}
                    setAudioURL={setAudioURL}
                    audioURL={audioURL}
                  />
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
                      <p className="font-semibold">Generation Failed</p>
                      <p className="text-sm">{error}</p>
                    </div>
                  )}
                  
                  {recordingStatus === 'stopped' && !error && (
                    <div className="w-full flex flex-col items-center gap-4">
                      <button
                        onClick={handleGenerate}
                        disabled={!audioBlob || isLoading}
                        className="w-[300px] h-14 bg-stone-950 text-white font-medium text-xl rounded-3xl hover:bg-stone-800 transition-colors disabled:bg-stone-400 disabled:cursor-not-allowed"
                      >
                        Generate lyrics & song art
                      </button>
                      <button
                        onClick={() => handleReset(false)}
                        className="w-[300px] h-14 bg-stone-100 text-stone-500 font-medium text-xl rounded-3xl hover:bg-stone-200 transition-colors"
                      >
                        Record again
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-stone-950">Settings</h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 transition-colors flex items-center justify-center"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-stone-600">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Music Model Selection */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-3">
                  Music Generation Model
                </label>
                <div className="space-y-3">
                  {Object.values(MUSIC_MODELS).map((model) => (
                    <button
                      key={model.id}
                      onClick={() => setSelectedMusicModel(model.id)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        selectedMusicModel === model.id
                          ? 'border-stone-950 bg-stone-50'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-stone-950">{model.name}</h3>
                            {model.id === DEFAULT_MODEL && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-stone-600">{model.description}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="text-xs text-stone-500">
                              Max: {model.maxDuration}s
                            </span>
                            {model.supports.lyrics && (
                              <span className="text-xs text-stone-500">• Lyrics</span>
                            )}
                            {model.supports.tags && (
                              <span className="text-xs text-stone-500">• Tags</span>
                            )}
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedMusicModel === model.id
                            ? 'border-stone-950 bg-stone-950'
                            : 'border-stone-300'
                        }`}>
                          {selectedMusicModel === model.id && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200">
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full h-12 bg-stone-950 text-white font-medium rounded-2xl hover:bg-stone-800 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;