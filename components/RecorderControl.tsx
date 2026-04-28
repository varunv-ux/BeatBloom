import React, { useState, useEffect, useRef } from 'react';
import { useVoiceVisualizer, VoiceVisualizer } from 'react-voice-visualizer';
import type { RecordingStatus } from '../types';

interface RecorderControlProps {
  recordingStatus: RecordingStatus;
  setRecordingStatus: React.Dispatch<React.SetStateAction<RecordingStatus>>;
  setAudioBlob: (blob: Blob) => void;
  setAudioURL: (url: string) => void;
  audioURL: string | null;
}

const RecorderControl: React.FC<RecorderControlProps> = ({
  recordingStatus,
  setRecordingStatus,
  setAudioBlob,
  setAudioURL,
  audioURL,
}) => {
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  // Track whether we're waiting for the blob after stopping
  const [pendingStop, setPendingStop] = useState(false);

  // Delay overlay fade until visualizer has real audio data
  const [visualizerReady, setVisualizerReady] = useState(false);
  const readyTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize the voice visualizer with callbacks
  const recorderControls = useVoiceVisualizer({
    onStartRecording: () => {
      setRecordingStatus('recording');
      setPendingStop(false);
      // Delay overlay fade so visualizer has time to produce bars
      readyTimerRef.current = setTimeout(() => setVisualizerReady(true), 800);
      // Start timer
      const interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
      setTimerInterval(interval);
    },
    onStopRecording: () => {
      // Don't set 'stopped' yet — wait for recordedBlob to arrive
      setPendingStop(true);
      setVisualizerReady(false);
      if (readyTimerRef.current) { clearTimeout(readyTimerRef.current); readyTimerRef.current = null; }
      // Stop timer
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    },
    onPausedRecording: () => {
      setRecordingStatus('paused');
      // Pause timer
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    },
    onResumedRecording: () => {
      setRecordingStatus('recording');
      // Resume timer
      const interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
      setTimerInterval(interval);
    },
  });

  const {
    startRecording,
    stopRecording,
    togglePauseResume,
    recordedBlob,
    isRecordingInProgress,
    isPausedRecording,
    formattedRecordingTime,
    error,
    startAudioPlayback,
    isAvailableRecordedAudio,
    isPausedRecordedAudio,
    currentAudioTime,
  } = recorderControls;

  // Handle recorded blob — only transition to 'stopped' once blob is ready
  useEffect(() => {
    if (recordedBlob && pendingStop) {
      setAudioBlob(recordedBlob);
      // Revoke previous URL before creating new one
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
      const url = URL.createObjectURL(recordedBlob);
      setAudioURL(url);
      setRecordingStatus('stopped');
      setPendingStop(false);
    }
  }, [recordedBlob, pendingStop]);

  // Handle errors
  useEffect(() => {
    if (error) {
      setRecordingStatus('idle');
    }
  }, [error, setRecordingStatus]);

  // Reset timer when component unmounts or recording stops
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleButtonClick = () => {
    if (isRecordingInProgress) {
      stopRecording();
    } else {
      setTimer(0);
      startRecording();
    }
  };

  const handlePlayPauseClick = () => {
    if (isAvailableRecordedAudio) {
      if (isPausedRecordedAudio || currentAudioTime === 0) {
        // Start or resume playback
        startAudioPlayback();
      } else {
        // Pause playback using togglePauseResume for recorded audio
        togglePauseResume();
      }
    }
  };

  if (recordingStatus === 'stopped' && recordedBlob) {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="h-[120px] flex items-center gap-8">
          {/* Play/Pause button */}
          <button 
            onClick={handlePlayPauseClick}
            className="w-20 h-20 border-2 border-border rounded-full flex items-center justify-center hover:border-muted-foreground hover:bg-muted transition-all cursor-pointer group"
          >
            {isPausedRecordedAudio || currentAudioTime === 0 ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-muted-foreground ml-1 group-hover:text-foreground transition-colors">
                <path d="M8 5v14l11-7z" fill="currentColor" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-muted-foreground group-hover:text-foreground transition-colors">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill="currentColor" />
              </svg>
            )}
          </button>
          
          {/* Voice visualizer for completed recording */}
          <div className="w-full max-w-[600px] h-20 rounded-lg overflow-hidden">
            <VoiceVisualizer
              controls={recorderControls}
              height={80}
              width="100%"
              backgroundColor="transparent"
              mainBarColor="#79716b"
              secondaryBarColor="#e7e5e4"
              barWidth={4}
              gap={1}
              rounded={5}
              isControlPanelShown={false}
              isDefaultUIShown={false}
              onlyRecording={false}
              animateCurrentPick={true}
              fullscreen={false}
              speed={1}
            />
          </div>
          
          {/* Duration display */}
          <div className="text-muted-foreground font-medium text-2xl min-w-[60px] text-center">
            {currentAudioTime > 0 ? formatTime(Math.floor(currentAudioTime)) : formatTime(timer)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Voice Visualizer */}
      <div className="h-[120px] flex items-center justify-center w-full max-w-[600px] relative">
        {/* Static waveform overlay - fades out when recording */}
        <div
          className="absolute inset-0 z-10 flex items-center justify-center gap-1 h-full w-full bg-background transition-opacity duration-700 ease-in-out pointer-events-none"
          style={{ opacity: (recordingStatus === 'recording' && visualizerReady) ? 0 : 1 }}
        >
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: '3px',
                height: `${12 + Math.sin(i * 0.3) * 8}px`,
                opacity: recordingStatus === 'paused' ? 0.7 : 0.6,
                backgroundColor: recordingStatus === 'paused' ? 'hsl(var(--muted-foreground) / 0.5)' : 'hsl(var(--muted-foreground) / 0.3)',
              }}
            />
          ))}
        </div>
        {/* Always-mounted visualizer underneath */}
        <div className="rounded-lg overflow-hidden w-full flex justify-center">
          <VoiceVisualizer
            controls={recorderControls}
            height={120}
            width="600px"
            backgroundColor="transparent"
            mainBarColor="#79716b"
            secondaryBarColor="#e7e5e4"
            speed={1}
            barWidth={4}
            gap={1}
            rounded={5}
            isControlPanelShown={false}
            isDefaultUIShown={false}
            onlyRecording={true}
            animateCurrentPick={true}
            fullscreen={false}
          />
        </div>
      </div>
      
      {/* Recording Controls */}
      <div className="flex gap-4 items-center">
        <button
          onClick={handleButtonClick}
          className={`w-[200px] h-14 font-medium text-xl rounded-3xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg ${
            isRecordingInProgress || isPausedRecording
              ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-primary/30'
              : 'bg-red-600 text-white hover:bg-red-700 shadow-red-300/30'
          }`}
          disabled={!!error}
        >
          {isRecordingInProgress || isPausedRecording ? 'Stop recording' : 'Start recording'}
        </button>
        
        {/* Pause/Resume Button - only show when recording or paused */}
        {(isRecordingInProgress || isPausedRecording) && (
          <button
            onClick={() => togglePauseResume()}
            className="w-[120px] h-14 font-medium text-xl rounded-3xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg bg-amber-600 text-white hover:bg-amber-700 shadow-amber-300/30"
            disabled={!!error}
          >
            {isPausedRecording ? 'Resume' : 'Pause'}
          </button>
        )}
      </div>
      
      {/* Timer Display */}
      <div className="text-muted-foreground text-2xl font-normal tabular-nums">
        {isRecordingInProgress ? formattedRecordingTime || formatTime(timer) : formatTime(timer)}
      </div>
    </div>
  );
};

export default RecorderControl;
