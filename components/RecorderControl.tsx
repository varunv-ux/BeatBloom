import React, { useState, useEffect, useCallback } from 'react';
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

  // Initialize the voice visualizer with callbacks
  const recorderControls = useVoiceVisualizer({
    onStartRecording: () => {
      setRecordingStatus('recording');
      // Start timer
      const interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
      setTimerInterval(interval);
    },
    onStopRecording: () => {
      setRecordingStatus('stopped');
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
    stopAudioPlayback,
    isAvailableRecordedAudio,
    isPausedRecordedAudio,
    currentAudioTime,
    duration,
  } = recorderControls;

  // Handle recorded blob
  useEffect(() => {
    if (recordedBlob) {
      setAudioBlob(recordedBlob);
      const url = URL.createObjectURL(recordedBlob);
      setAudioURL(url);
    }
  }, [recordedBlob, setAudioBlob, setAudioURL]);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('Voice visualizer error:', error);
      alert('Could not access microphone. Please ensure permissions are granted.');
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
      <div className="flex flex-col items-center gap-10">
        <h3 className="text-5xl font-medium text-black text-center leading-none">
          Recording complete
        </h3>
        <div className="h-[200px] flex items-center gap-8">
          {/* Play/Pause button */}
          <button 
            onClick={handlePlayPauseClick}
            className="w-20 h-20 border-2 border-stone-300 rounded-full flex items-center justify-center hover:border-stone-400 hover:bg-stone-50 transition-all cursor-pointer group"
          >
            {isPausedRecordedAudio || currentAudioTime === 0 ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-stone-600 ml-1 group-hover:text-stone-700 transition-colors">
                <path d="M8 5v14l11-7z" fill="currentColor" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-stone-600 group-hover:text-stone-700 transition-colors">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill="currentColor" />
              </svg>
            )}
          </button>
          
          {/* Voice visualizer for completed recording */}
          <div className="w-[600px] h-20 rounded-lg overflow-hidden">
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
          <div className="text-stone-500 font-medium text-2xl min-w-[60px] text-center">
            {currentAudioTime > 0 ? formatTime(Math.floor(currentAudioTime)) : formatTime(timer)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-10">
      {/* Voice Visualizer */}
      <div className="h-[200px] flex items-center justify-center w-[600px]">
        {recordingStatus === 'idle' ? (
          // Static waveform when idle - more elegant and matching design
          <div className="flex items-center justify-center gap-1 h-20 w-[577px]">
            {Array.from({ length: 60 }).map((_, i) => (
              <div
                key={i}
                className="bg-stone-300 rounded-full transition-all duration-500"
                style={{
                  width: '3px',
                  height: `${12 + Math.sin(i * 0.3) * 8}px`,
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        ) : recordingStatus === 'paused' ? (
          // Paused state - static but different from idle
          <div className="flex items-center justify-center gap-1 h-20 w-[577px]">
            {Array.from({ length: 60 }).map((_, i) => (
              <div
                key={i}
                className="bg-amber-400 rounded-full transition-all duration-500"
                style={{
                  width: '3px',
                  height: `${12 + Math.sin(i * 0.3) * 8}px`,
                  opacity: 0.7,
                }}
              />
            ))}
          </div>
        ) : (
          // Dynamic visualizer when recording with enhanced styling
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
              audioDistanceToCenter={2}
              smoothingTimeConstant={0.8}
            />
          </div>
        )}
      </div>
      
      {/* Recording Controls */}
      <div className="flex gap-4 items-center">
        <button
          onClick={handleButtonClick}
          className={`w-[200px] h-14 font-medium text-xl rounded-3xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg ${
            isRecordingInProgress || isPausedRecording
              ? 'bg-stone-950 text-white hover:bg-stone-800 shadow-stone-400/30'
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
      <div className="text-stone-500 text-2xl font-normal tabular-nums">
        {isRecordingInProgress ? formattedRecordingTime || formatTime(timer) : formatTime(timer)}
      </div>
    </div>
  );
};

export default RecorderControl;
