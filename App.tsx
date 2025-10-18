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
  const [selectedMusicModel, setSelectedMusicModel] = useState<MusicModelId>(DEFAULT_MODEL);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showModelSelection, setShowModelSelection] = useState<boolean>(false);

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
      if (showSettings && !(event.target as Element).closest('.user-menu-container')) {
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettings]);

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
      className="h-screen w-screen overflow-hidden font-sans p-5"
      style={{
        backgroundImage: `url('/assets/Background01.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="h-full w-full bg-white rounded-[32px] shadow-2xl flex flex-col overflow-hidden">
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
                <NavButton active={view === 'my-songs'} onClick={() => {
                  setView('my-songs');
                  loadSongs(); // Reload songs when switching to My Songs view
                }}>
                  My songs
                </NavButton>
              </div>
            </nav>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowModelSelection(!showModelSelection)}
                className="w-10 h-10 rounded-full hover:bg-stone-100 transition-colors flex items-center justify-center"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-stone-600">
                  <path d="M10 1.66666V5.83333M10 14.1667V18.3333M5.83333 10H1.66667M18.3333 10H14.1667M15.8333 15.8333L13.3333 13.3333M15.8333 4.16666L13.3333 6.66666M4.16667 15.8333L6.66667 13.3333M4.16667 4.16666L6.66667 6.66666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              <div className="relative user-menu-container">
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className="w-10 h-10 bg-stone-300 rounded-full hover:bg-stone-400 transition-colors overflow-hidden"
                >
                  <img 
                    src="/assets/Profile.png" 
                    alt="User avatar" 
                    className="w-full h-full object-cover"
                  />
                </button>
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

      {/* Settings Menu Dropdown */}
      {showSettings && (
        <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)}>
          <div 
            className="absolute right-4 top-20 bg-white border border-stone-100 rounded-[24px] w-[320px] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* User Info Section */}
            <div className="p-3 space-y-2.5">
              {/* User Details */}
              <div className="bg-stone-50 rounded p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <img 
                    src="/assets/Profile.png" 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-stone-950 leading-5">Varun Varshney</p>
                    <p className="font-normal text-sm text-stone-500 leading-5">varunv.ux@gmail.com</p>
                  </div>
                </div>
              </div>

              {/* Upgrade Section */}
              <div className="bg-stone-50 rounded p-4 pb-3 space-y-3">
                <button className="w-full bg-stone-950 text-stone-100 font-medium text-sm leading-5 px-3 py-2.5 rounded-2xl hover:bg-stone-800 transition-colors">
                  Upgrade to Pro
                </button>
                <div className="flex items-center justify-center gap-1 text-xs text-stone-500 leading-4">
                  <span>Free Plan</span>
                  <span>・</span>
                  <span>2 songs left</span>
                </div>
              </div>
            </div>

            {/* Dividers */}
            <div className="h-px bg-stone-100"></div>
            <div className="h-px bg-stone-100"></div>

            {/* Menu Items */}
            <div className="px-2 py-3 space-y-px">
              <button className="w-full flex items-center gap-3 pl-2 pr-0 py-2 rounded-lg hover:bg-stone-50 transition-colors">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-stone-500">
                  <path d="M13.3333 11.6666C14.6667 12.5 15.8333 13.3333 16.6667 14.1666C17.5 15 18.3333 16.6666 18.3333 16.6666M6.66667 11.6666C5.33333 12.5 4.16667 13.3333 3.33333 14.1666C2.5 15 1.66667 16.6666 1.66667 16.6666M10 11.6666V3.33331M10 3.33331L13.3333 6.66665M10 3.33331L6.66667 6.66665" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="font-medium text-sm text-stone-500 leading-5">Share</span>
              </button>
              
              <button className="w-full flex items-center gap-3 pl-2 pr-0 py-2 rounded-lg hover:bg-stone-50 transition-colors">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-stone-500">
                  <circle cx="10" cy="10" r="8.33333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 13.3333V10M10 6.66667H10.0083" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="font-medium text-sm text-stone-500 leading-5">About</span>
              </button>
              
              <button className="w-full flex items-center gap-3 pl-2 pr-0 py-2 rounded-lg hover:bg-stone-50 transition-colors">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-stone-500">
                  <path d="M7.5 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V4.16667C2.5 3.72464 2.67559 3.30072 2.98816 2.98816C3.30072 2.67559 3.72464 2.5 4.16667 2.5H7.5M13.3333 14.1667L17.5 10M17.5 10L13.3333 5.83333M17.5 10H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="font-medium text-sm text-stone-500 leading-5">Sign out</span>
              </button>
            </div>

            {/* Bottom Divider */}
            <div className="h-px bg-stone-100"></div>

            {/* Footer Links */}
            <div className="px-2 py-4 flex items-center justify-center gap-4 text-xs text-stone-500 leading-4">
              <button className="hover:text-stone-700 transition-colors">Privacy</button>
              <button className="hover:text-stone-700 transition-colors">Terms</button>
              <button className="hover:text-stone-700 transition-colors">Feedback</button>
            </div>
          </div>
        </div>
      )}

      {/* Model Selection Modal */}
      {showModelSelection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setShowModelSelection(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-stone-950">Music Model</h2>
              <button 
                onClick={() => setShowModelSelection(false)}
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
                  Select Music Generation Model
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
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
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
                  onClick={() => setShowModelSelection(false)}
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