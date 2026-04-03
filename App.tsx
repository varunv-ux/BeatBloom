import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GeneratedSong, RecordingStatus, AppView, SavedSong, MusicDescription } from './types';
import { generateSongFromHum } from './services/geminiService';
import { generateMusic } from './services/replicateService';
import { MusicModelId, MUSIC_MODELS, DEFAULT_MODEL } from './services/musicModels';
import * as dbService from './services/vercelDbService';
import * as cacheService from './services/cacheService';
import RecorderControl from './components/RecorderControl';
import GeneratedSongDisplay from './components/GeneratedSongDisplay';
import Loader from './components/Loader';
import MySongsView from './components/MySongsView';
import MobileSongDrawer from './components/MobileSongDrawer';
import MobileHeader from './components/MobileHeader';
import MobileBottomNav from './components/MobileBottomNav';
import MobileRecorderControl from './components/MobileRecorderControl';
import MobileMySongsView from './components/MobileMySongsView';
import MiniPlayer from './components/MiniPlayer';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';

// Extracted outside App to avoid remount on every render (Rule 5.4)
const NavButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 text-sm font-medium rounded-xl transition-colors duration-200 ${
      active
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-foreground'
    }`}
  >
    {children}
  </button>
);

const App: React.FC = () => {
  // Guard for one-time init (Rule 8.2: init app once, not per mount)
  const didInitRef = useRef(false);
  const [view, setView] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('beatbloom-view');
      if (saved === 'my-songs') return 'my-songs';
    }
    return 'create';
  });
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
  const [isMobile, setIsMobile] = useState<boolean>(() => 
    typeof window !== 'undefined' && window.innerWidth < 768
  );
  const [songsLoading, setSongsLoading] = useState<boolean>(true);
  const [songsError, setSongsError] = useState<string | null>(null);
  const [previousObjectUrl, setPreviousObjectUrl] = useState<string | null>(null);
  const [miniPlayerSong, setMiniPlayerSong] = useState<{ url: string; title: string; albumArtUrl: string; subtitle: string; autoPlay?: boolean; songId?: number } | null>(null);
  const [isMiniPlayerPlaying, setIsMiniPlayerPlaying] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('beatbloom-dark-mode') === 'true';
    }
    return false;
  });
  const abortControllerRef = useRef<AbortController | null>(null);
  const [editingSongId, setEditingSongId] = useState<number | null>(null);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    // Load cached songs immediately, then refresh from API
    cacheService.getCachedSongs().then((cached) => {
      if (cached.length > 0) {
        setSavedSongs(cached);
        setSongsLoading(false);
      }
    });
    dbService.initDatabase().then(() => {
      loadSongs();
    });

    // Handle shared song URL (?song=123)
    const params = new URLSearchParams(window.location.search);
    const sharedSongId = params.get('song');
    if (sharedSongId) {
      const songId = parseInt(sharedSongId);
      if (!isNaN(songId)) {
        fetch(`/api/share?id=${songId}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.song) {
              const s = data.song;
              setGeneratedSong({
                title: s.title,
                lyrics: s.lyrics,
                musicDescription: s.music_description,
                albumArtUrl: s.album_art_url,
              });
              if (s.audio_url) {
                setSongUrl(s.audio_url);
                setMiniPlayerSong({
                  url: s.audio_url,
                  title: s.title,
                  albumArtUrl: s.album_art_url,
                  subtitle: `${s.music_description.genre} \u2022 ${s.music_description.mood} \u2022 ${s.music_description.vocals} vocals`,
                  songId: s.id,
                });
              }
              setEditingSongId(s.id);
              setView('create');
              // Clean the URL without reloading
              window.history.replaceState({}, '', window.location.pathname);
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  // Persist view
  useEffect(() => {
    sessionStorage.setItem('beatbloom-view', view);
  }, [view]);

  // Dark mode effect
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('beatbloom-dark-mode', String(darkMode));
  }, [darkMode]);

  // Close settings on outside click (uses ref to avoid re-registering listener)
  const showSettingsRef = useRef(showSettings);
  showSettingsRef.current = showSettings;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSettingsRef.current && !(event.target as Element).closest('.user-menu-container') && !(event.target as Element).closest('.settings-dropdown')) {
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadSongs = async () => {
    setSongsLoading(true);
    setSongsError(null);
    try {
      const { songs } = await dbService.getAllSongs();
      setSavedSongs(songs);
      // Update cache and start background audio caching
      cacheService.setCachedSongs(songs);
      cacheService.cacheAllSongAudio(songs);
    } catch {
      setSongsError('Failed to load songs. Please try again.');
    } finally {
      setSongsLoading(false);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!audioBlob) {
      toast.error('No recording available. Please record something first.');
      return;
    }
    handleReset(true);
    setIsLoading(true);

    try {
      const song = await generateSongFromHum(audioBlob);
      setGeneratedSong(song);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unknown error occurred during generation.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [audioBlob]);

  const handleCancelMusicGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const handleGenerateMusic = useCallback(async (lyrics: string, tags: string, description: MusicDescription, duration: number = 60) => {
    if (!generatedSong) return;

    // Cancel any ongoing generation
    handleCancelMusicGeneration();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsGeneratingMusic(true);
    setMusicError(null);
    setSongUrl(null);

    try {
      const { audioUrl } = await generateMusic(lyrics, tags, duration, selectedMusicModel, controller.signal);
      setSongUrl(audioUrl);

      // Open mini player
      setMiniPlayerSong({
        url: audioUrl,
        title: generatedSong.title,
        albumArtUrl: generatedSong.albumArtUrl,
        subtitle: `${description.genre} \u2022 ${description.mood} \u2022 ${description.vocals} vocals`,
      });

      toast.success('Your song is ready!');
      
      const savedId = await dbService.addSong({
        title: generatedSong.title,
        lyrics,
        musicDescription: description,
        albumArtUrl: generatedSong.albumArtUrl,
        audioUrl,
        parentId: editingSongId,
      });

      // Track the new song ID for future versioning
      if (savedId) {
        setEditingSongId(savedId);
        setMiniPlayerSong(prev => prev ? { ...prev, songId: savedId } : prev);
      }

      await loadSongs();

    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        toast.info('Music generation cancelled.');
      } else {
        const msg = err instanceof Error ? err.message : 'An unknown error occurred while creating the song.';
        setMusicError(msg);
        toast.error(msg);
      }
    } finally {
      setIsGeneratingMusic(false);
      abortControllerRef.current = null;
    }
  }, [generatedSong, selectedMusicModel, handleCancelMusicGeneration]);

  const handleReset = (soft: boolean = false) => {
    setGeneratedSong(null);
    setSongUrl(null);
    setError(null);
    setMusicError(null);
    setIsLoading(false);
    setIsGeneratingMusic(false);
    handleCancelMusicGeneration();
    if (!soft) {
      setRecordingStatus('idle');
      setAudioBlob(null);
      setAudioURL(null);
      setView('create');
      setMiniPlayerSong(null);
      setEditingSongId(null);
    }
  };

  const handleDeleteSong = async (id: number) => {
    // Remove from UI immediately
    const deletedSong = savedSongs.find(s => s.id === id);
    setSavedSongs(prev => prev.filter(s => s.id !== id));
    if (miniPlayerSong?.songId === id) {
      setMiniPlayerSong(null);
    }

    // Show undo toast — delay actual deletion
    let undone = false;
    toast('Song deleted', {
      action: {
        label: 'Undo',
        onClick: () => {
          undone = true;
          if (deletedSong) {
            setSavedSongs(prev => [deletedSong, ...prev].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
          }
        },
      },
      duration: 5000,
    });

    // Wait for the toast to expire, then delete for real
    setTimeout(async () => {
      if (!undone) {
        await dbService.deleteSong(id);
        await cacheService.removeCachedSong(id);
        cacheService.setCachedSongs(savedSongs.filter(s => s.id !== id));
      }
    }, 5000);
  };

  const handleViewSong = async (song: SavedSong) => {
    // If same song is playing, close the player (toggle off)
    if (miniPlayerSong?.songId === song.id) {
      setMiniPlayerSong(null);
      return;
    }

    // Revoke previous object URL to prevent memory leak
    if (previousObjectUrl) {
      URL.revokeObjectURL(previousObjectUrl);
      setPreviousObjectUrl(null);
    }

    // Try to use cached audio first, fall back to network URL
    if (song.audioUrl) {
      const cachedUrl = await cacheService.getCachedAudioUrl(song.id);
      const playUrl = cachedUrl || song.audioUrl;
      if (cachedUrl) setPreviousObjectUrl(cachedUrl);

      setMiniPlayerSong({
        url: playUrl,
        title: song.title,
        albumArtUrl: song.albumArtUrl,
        subtitle: `${song.musicDescription.genre} \u2022 ${song.musicDescription.mood} \u2022 ${song.musicDescription.vocals} vocals`,
        songId: song.id,
      });
    }
  };

  const handleViewSongDetails = async (song: SavedSong) => {
    // Switch view immediately with what we have, fetch lyrics in background
    setGeneratedSong({
      title: song.title,
      lyrics: song.lyrics || '',
      musicDescription: song.musicDescription,
      albumArtUrl: song.albumArtUrl,
    });
    setEditingSongId(song.parentId || song.id);
    setView('create');
    setRecordingStatus('idle');
    setAudioBlob(null);
    setAudioURL(null);
    setError(null);
    setMusicError(null);

    if (song.audioUrl) {
      setSongUrl(song.audioUrl);
      const cachedUrl = await cacheService.getCachedAudioUrl(song.id);
      const playUrl = cachedUrl || song.audioUrl;
      if (cachedUrl) setPreviousObjectUrl(cachedUrl);
      setMiniPlayerSong({
        url: playUrl,
        title: song.title,
        albumArtUrl: song.albumArtUrl,
        subtitle: `${song.musicDescription.genre} \u2022 ${song.musicDescription.mood} \u2022 ${song.musicDescription.vocals} vocals`,
        autoPlay: false,
        songId: song.id,
      });
    }

    // Fetch lyrics lazily and update once available
    if (!song.lyrics) {
      const fullSong = await dbService.getSong(song.id);
      if (fullSong?.lyrics) {
        setGeneratedSong(prev => prev ? { ...prev, lyrics: fullSong.lyrics! } : prev);
      }
    }
  };

  return (
    <>
      {/* Toast notifications */}
      <Toaster position="top-right" richColors closeButton />

      {/* Mobile View */}
      {isMobile ? (
        <div className="h-screen w-screen overflow-hidden font-sans bg-background text-foreground flex flex-col">
          <MobileHeader onSettingsClick={() => setShowSettings(!showSettings)} />

          {/* Main Content */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {view === 'my-songs' ? (
              songsLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-t-transparent border-foreground/60 rounded-full animate-spin"></div>
                </div>
              ) : songsError ? (
                <div className="flex-1 flex flex-col items-center justify-center px-5">
                  <p className="text-destructive mb-3">{songsError}</p>
                  <button onClick={loadSongs} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl">Retry</button>
                </div>
              ) : (
                <MobileMySongsView songs={savedSongs} onView={handleViewSong} onViewDetails={handleViewSongDetails} onDelete={handleDeleteSong} />
              )
            ) : isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader />
              </div>
            ) : generatedSong ? (
              <>
                <MobileSongDrawer 
                  open={true}
                  onOpenChange={(open) => {
                    if (!open) {
                      setGeneratedSong(null);
                      setSongUrl(null);
                    }
                  }}
                  song={generatedSong}
                  isGenerating={isGeneratingMusic}
                  onGenerateMusic={handleGenerateMusic}
                  onCancelGeneration={handleCancelMusicGeneration}
                  selectedModel={MUSIC_MODELS[selectedMusicModel]}
                />
              </>
            ) : (
              <MobileRecorderControl
                recordingStatus={recordingStatus}
                setRecordingStatus={setRecordingStatus}
                setAudioBlob={setAudioBlob}
                setAudioURL={setAudioURL}
                audioURL={audioURL}
                onGenerate={handleGenerate}
                onReset={() => handleReset(false)}
              />
            )}
          </main>

          <MobileBottomNav activeView={view} onViewChange={setView} />

          {/* Mini Player - spacer + player for mobile */}
          {miniPlayerSong && (
            <>
              <div className="h-[84px] flex-shrink-0" />
              <MiniPlayer
                songUrl={miniPlayerSong.url}
                title={miniPlayerSong.title}
                albumArtUrl={miniPlayerSong.albumArtUrl}
                subtitle={miniPlayerSong.subtitle}
                autoPlay={miniPlayerSong.autoPlay !== false}
                songId={miniPlayerSong.songId}
                onClose={() => setMiniPlayerSong(null)}
                onPlayingChange={setIsMiniPlayerPlaying}
              />
            </>
          )}
        </div>
      ) : (
        <>
        {/* Desktop View */}
        <div className="h-screen w-screen overflow-hidden font-sans bg-background text-foreground">
          <div className="h-full w-full flex flex-col overflow-hidden">
          {/* Header */}
          <header className="h-[66px] flex items-center justify-between px-6 py-3 border-b border-border">
            <button onClick={() => { handleReset(false); setView('create'); }} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <img src="/assets/BeatBloomLogo.png" alt="BeatBloom" className="w-10 h-10 rounded-xl" />
              <h1 className="text-2xl font-bold text-foreground">BeatBloom</h1>
            </button>
            
            <nav className="border border-border rounded-2xl p-[3px]">
              <div className="flex">
                <NavButton active={view === 'create'} onClick={() => setView('create')}>
                  Create
                </NavButton>
                <NavButton active={view === 'my-songs'} onClick={() => setView('my-songs')}>
                  My songs
                </NavButton>
              </div>
            </nav>

            <div className="flex items-center gap-2">
              {/* New Song button */}
              <button 
                onClick={() => {
                  handleReset(false);
                  setView('create');
                }}
                className="w-10 h-10 rounded-full hover:bg-muted transition-colors flex items-center justify-center"
                aria-label="New song"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-muted-foreground">
                  <path d="M10 4.16666V15.8333M4.16667 10H15.8333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              <button 
                onClick={() => setShowModelSelection(!showModelSelection)}
                className="w-10 h-10 rounded-full hover:bg-muted transition-colors flex items-center justify-center"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-muted-foreground">
                  <path d="M10 1.66666V5.83333M10 14.1667V18.3333M5.83333 10H1.66667M18.3333 10H14.1667M15.8333 15.8333L13.3333 13.3333M15.8333 4.16666L13.3333 6.66666M4.16667 15.8333L6.66667 13.3333M4.16667 4.16666L6.66667 6.66666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              <div className="relative user-menu-container">
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className="w-10 h-10 bg-muted rounded-full hover:bg-accent transition-colors overflow-hidden flex items-center justify-center"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-muted-foreground">
                    <path d="M10 10C12.0711 10 13.75 8.32107 13.75 6.25C13.75 4.17893 12.0711 2.5 10 2.5C7.92893 2.5 6.25 4.17893 6.25 6.25C6.25 8.32107 7.92893 10 10 10Z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M3.75 17.5C3.75 14.0482 6.54822 11.25 10 11.25C13.4518 11.25 16.25 14.0482 16.25 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 flex flex-col overflow-y-auto min-h-0">
            {view === 'my-songs' ? (
              <div className="w-full p-5 flex-1 overflow-y-auto">
                {songsLoading ? (
                  <div className="flex items-center justify-center py-32">
                    <div className="w-6 h-6 border-2 border-t-transparent border-foreground/60 rounded-full animate-spin"></div>
                  </div>
                ) : songsError ? (
                  <div className="flex flex-col items-center justify-center py-32">
                    <p className="text-destructive mb-3">{songsError}</p>
                    <button onClick={loadSongs} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl">Retry</button>
                  </div>
                ) : (
                  <MySongsView songs={savedSongs} onView={handleViewSong} onViewDetails={handleViewSongDetails} onDelete={handleDeleteSong} playingSongId={isMiniPlayerPlaying ? miniPlayerSong?.songId : undefined} />
                )}
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
                onCancelGeneration={handleCancelMusicGeneration}
                isGeneratingMusic={isGeneratingMusic}
                songUrl={songUrl}
                musicError={musicError}
                selectedModel={MUSIC_MODELS[selectedMusicModel]}
                songId={editingSongId}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 xl:px-[411px] xl:py-[120px]">
                <div className="flex flex-col items-center gap-6 w-full max-w-[600px]">
                  <h2 className="text-5xl font-medium text-foreground text-center leading-none">
                    {recordingStatus === 'stopped' ? 'Recording complete' : 'Hum a tune, say a few words, and get a masterpiece'}
                  </h2>
                  
                  <RecorderControl
                    recordingStatus={recordingStatus}
                    setRecordingStatus={setRecordingStatus}
                    setAudioBlob={setAudioBlob}
                    setAudioURL={setAudioURL}
                    audioURL={audioURL}
                  />
                  
                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-center">
                      <p className="font-semibold">Generation Failed</p>
                      <p className="text-sm">{error}</p>
                    </div>
                  )}
                  
                  {recordingStatus === 'stopped' && !error && (
                    <div className="w-full flex flex-col items-center gap-3">
                      <button
                        onClick={handleGenerate}
                        disabled={!audioBlob || isLoading}
                        className="w-[300px] h-14 bg-primary text-primary-foreground font-medium text-xl rounded-3xl hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Generate lyrics & song art
                      </button>
                      <button
                        onClick={() => handleReset(false)}
                        className="w-[300px] h-14 bg-secondary text-secondary-foreground font-medium text-xl rounded-3xl hover:bg-accent transition-colors"
                      >
                        Record again
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>

          {/* Mini Player - Desktop (inside flex layout, not fixed) */}
          {miniPlayerSong && (
            <div className="flex-shrink-0">
              <MiniPlayer
                songUrl={miniPlayerSong.url}
                title={miniPlayerSong.title}
                albumArtUrl={miniPlayerSong.albumArtUrl}
                subtitle={miniPlayerSong.subtitle}
                autoPlay={miniPlayerSong.autoPlay !== false}
                onClose={() => setMiniPlayerSong(null)}
                onPlayingChange={setIsMiniPlayerPlaying}
                songId={miniPlayerSong.songId}
                inline
              />
            </div>
          )}
        </div>
      </div>

      {/* Settings Menu Dropdown */}
      {showSettings && (
        <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)}>
          <div 
            className="absolute right-4 top-20 bg-popover border border-border rounded-[24px] w-[320px] shadow-2xl overflow-hidden settings-dropdown"
            onClick={(e) => e.stopPropagation()}
          >
            {/* User Info Section */}
            <div className="p-3 space-y-2.5">
              {/* User Details */}
              <div className="bg-muted rounded p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-muted-foreground">
                      <path d="M10 10C12.0711 10 13.75 8.32107 13.75 6.25C13.75 4.17893 12.0711 2.5 10 2.5C7.92893 2.5 6.25 4.17893 6.25 6.25C6.25 8.32107 7.92893 10 10 10Z" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M3.75 17.5C3.75 14.0482 6.54822 11.25 10 11.25C13.4518 11.25 16.25 14.0482 16.25 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground leading-5">Guest User</p>
                    <p className="font-normal text-sm text-muted-foreground leading-5">Sign in for full features</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dividers */}
            <div className="h-px bg-border"></div>

            {/* Menu Items */}
            <div className="px-2 py-3 space-y-px">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="w-full flex items-center gap-3 pl-2 pr-2 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                {darkMode ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
                    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                <span className="font-medium text-sm text-muted-foreground leading-5">{darkMode ? 'Light mode' : 'Dark mode'}</span>
              </button>

              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 pl-2 pr-0 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-muted-foreground">
                  <circle cx="10" cy="10" r="8.33333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 13.3333V10M10 6.66667H10.0083" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="font-medium text-sm text-muted-foreground leading-5">About</span>
              </a>
            </div>

            {/* Bottom Divider */}
            <div className="h-px bg-border"></div>

            {/* Footer Links */}
            <div className="px-2 py-4 flex items-center justify-center gap-4 text-xs text-muted-foreground leading-4">
              <button className="hover:text-foreground transition-colors">Privacy</button>
              <button className="hover:text-foreground transition-colors">Terms</button>
              <button className="hover:text-foreground transition-colors">Feedback</button>
            </div>
          </div>
        </div>
      )}

      {/* Model Selection Modal */}
      {showModelSelection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setShowModelSelection(false)}>
          <div className="bg-popover rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Music Model</h2>
              <button 
                onClick={() => setShowModelSelection(false)}
                className="w-8 h-8 rounded-full hover:bg-muted transition-colors flex items-center justify-center"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Music Model Selection */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-3">
                  Select Music Generation Model
                </label>
                <div className="space-y-3">
                  {Object.values(MUSIC_MODELS).map((model) => (
                    <button
                      key={model.id}
                      onClick={() => setSelectedMusicModel(model.id)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        selectedMusicModel === model.id
                          ? 'border-primary bg-muted'
                          : 'border-border hover:border-accent'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{model.name}</h3>
                            {model.id === DEFAULT_MODEL && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{model.description}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="text-xs text-muted-foreground">
                              Max: {model.maxDuration}s
                            </span>
                            {model.supports.lyrics && (
                              <span className="text-xs text-muted-foreground">• Lyrics</span>
                            )}
                            {model.supports.tags && (
                              <span className="text-xs text-muted-foreground">• Tags</span>
                            )}
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedMusicModel === model.id
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground/30'
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

              <div className="pt-4 border-t border-border">
                <button
                  onClick={() => setShowModelSelection(false)}
                  className="w-full h-12 bg-primary text-primary-foreground font-medium rounded-2xl hover:opacity-90 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
    )}

    {/* No external mini player for desktop — it's inline now */}
    </>
  );
};

export default App;