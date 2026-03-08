import React, { useState, useEffect } from 'react';
import { useVoiceVisualizer, VoiceVisualizer } from 'react-voice-visualizer';
import type { RecordingStatus } from '../types';

interface MobileRecorderControlProps {
  recordingStatus: RecordingStatus;
  setRecordingStatus: React.Dispatch<React.SetStateAction<RecordingStatus>>;
  setAudioBlob: (blob: Blob) => void;
  setAudioURL: (url: string) => void;
  audioURL: string | null;
  onGenerate: () => void;
  onReset: () => void;
}

const MobileRecorderControl: React.FC<MobileRecorderControlProps> = ({
  recordingStatus,
  setRecordingStatus,
  setAudioBlob,
  setAudioURL,
  audioURL,
  onGenerate,
  onReset,
}) => {
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  const recorderControls = useVoiceVisualizer({
    onStartRecording: () => {
      setRecordingStatus('recording');
      const interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
      setTimerInterval(interval);
    },
    onStopRecording: () => {
      setRecordingStatus('stopped');
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    },
    onPausedRecording: () => {
      setRecordingStatus('paused');
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    },
    onResumedRecording: () => {
      setRecordingStatus('recording');
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
  } = recorderControls;

  useEffect(() => {
    if (recordedBlob) {
      setAudioBlob(recordedBlob);
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
      const url = URL.createObjectURL(recordedBlob);
      setAudioURL(url);
    }
  }, [recordedBlob]);

  useEffect(() => {
    if (error) {
      setRecordingStatus('idle');
    }
  }, [error, setRecordingStatus]);

  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleButtonClick = () => {
    if (isRecordingInProgress) {
      stopRecording();
    } else {
      setTimer(0);
      startRecording();
    }
  };

  if (recordingStatus === 'stopped' && recordedBlob) {
    return (
      <div className="flex flex-col items-center gap-8 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-muted-foreground">
              <path d="M13.3333 10.0001L26.6666 20.0001L13.3333 30.0001V10.0001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-[28px] font-medium text-foreground leading-8 w-[137px]">
            Recording complete
          </p>
        </div>

        <div className="w-full h-[100px] flex items-center justify-center">
          <div className="w-full h-20">
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
        </div>

        <div className="flex flex-col gap-4 w-full max-w-[300px]">
          <button
            onClick={onGenerate}
            className="w-full h-14 bg-primary text-primary-foreground font-medium text-base rounded-3xl"
          >
            Generate lyrics & song art
          </button>
          <button
            onClick={onReset}
            className="w-full h-14 bg-secondary text-secondary-foreground font-medium text-base rounded-3xl"
          >
            Record again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 px-5 py-5">
      <p className="text-[28px] font-medium text-foreground text-center leading-8 max-w-[300px]">
        Hum a tune, say a few words, and get a masterpiece
      </p>

      <div className="w-full h-[100px] flex items-center justify-center">
        {recordingStatus === 'idle' ? (
          <div className="flex items-center justify-center gap-1 h-20 w-full opacity-20">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="bg-stone-600 rounded-full"
                style={{
                  width: '3px',
                  height: `${12 + Math.sin(i * 0.3) * 8}px`,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="w-full h-20">
            <VoiceVisualizer
              controls={recorderControls}
              height={80}
              width="100%"
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
        )}
      </div>

      <div className="flex flex-col gap-4 items-center">
        {(isRecordingInProgress || isPausedRecording) && (
          <div className="flex gap-5 w-full max-w-[300px]">
            <button
              onClick={handleButtonClick}
              className="flex-1 h-14 bg-primary text-primary-foreground font-medium text-base rounded-3xl"
            >
              Stop
            </button>
            <button
              onClick={() => togglePauseResume()}
              className="flex-1 h-14 bg-secondary text-secondary-foreground font-medium text-base rounded-3xl"
            >
              {isPausedRecording ? 'Resume' : 'Pause'}
            </button>
          </div>
        )}
        
        {!isRecordingInProgress && !isPausedRecording && (
          <button
            onClick={handleButtonClick}
            className="w-full max-w-[300px] h-14 bg-red-600 text-white font-medium text-base rounded-3xl"
          >
            Start recording
          </button>
        )}
        
        <div className="text-muted-foreground text-base">
          {formattedRecordingTime || formatTime(timer)}
        </div>
      </div>
    </div>
  );
};

export default MobileRecorderControl;
