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
  const [pendingStop, setPendingStop] = useState(false);

  const recorderControls = useVoiceVisualizer({
    onStartRecording: () => {
      setRecordingStatus('recording');
      setPendingStop(false);
      const interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
      setTimerInterval(interval);
    },
    onStopRecording: () => {
      setPendingStop(true);
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
    if (recordedBlob && pendingStop) {
      setAudioBlob(recordedBlob);
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
      const url = URL.createObjectURL(recordedBlob);
      setAudioURL(url);
      setRecordingStatus('stopped');
      setPendingStop(false);
    }
  }, [recordedBlob, pendingStop]);

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
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
        <h2 className="text-2xl font-semibold text-foreground text-center">
          Recording complete
        </h2>

        <div className="w-full h-16 flex items-center justify-center">
          <div className="w-full h-16">
            <VoiceVisualizer
              controls={recorderControls}
              height={64}
              width="100%"
              backgroundColor="transparent"
              mainBarColor="#79716b"
              secondaryBarColor="#e7e5e4"
              barWidth={3}
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

        <div className="flex flex-col gap-3 w-full px-4">
          <button
            onClick={onGenerate}
            className="w-full h-[52px] bg-primary text-primary-foreground font-medium text-[15px] rounded-2xl active:scale-[0.98] transition-transform"
          >
            Generate lyrics & song art
          </button>
          <button
            onClick={onReset}
            className="w-full h-[52px] bg-secondary text-secondary-foreground font-medium text-[15px] rounded-2xl active:scale-[0.98] transition-transform"
          >
            Record again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
      <h2 className="text-2xl font-semibold text-foreground text-center leading-snug max-w-[280px]">
        Hum a tune, say a few words, and get a masterpiece
      </h2>

      <div className="w-full h-16 flex items-center justify-center">
        {recordingStatus === 'idle' ? (
          <div className="flex items-center justify-center gap-[3px] h-16 w-full">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="bg-muted-foreground/20 rounded-full"
                style={{
                  width: '3px',
                  height: `${10 + Math.sin(i * 0.3) * 8}px`,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="w-full h-16">
            <VoiceVisualizer
              controls={recorderControls}
              height={64}
              width="100%"
              backgroundColor="transparent"
              mainBarColor="#79716b"
              secondaryBarColor="#e7e5e4"
              speed={1}
              barWidth={3}
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

      <div className="flex flex-col gap-3 items-center w-full px-4">
        {(isRecordingInProgress || isPausedRecording) ? (
          <>
            <div className="text-muted-foreground text-lg tabular-nums mb-1">
              {formattedRecordingTime || formatTime(timer)}
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={handleButtonClick}
                className="flex-1 h-[52px] bg-primary text-primary-foreground font-medium text-[15px] rounded-2xl active:scale-[0.98] transition-transform"
              >
                Stop recording
              </button>
              <button
                onClick={() => togglePauseResume()}
                className="h-[52px] px-6 bg-secondary text-secondary-foreground font-medium text-[15px] rounded-2xl active:scale-[0.98] transition-transform"
              >
                {isPausedRecording ? 'Resume' : 'Pause'}
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={handleButtonClick}
              className="w-full h-[52px] bg-primary text-primary-foreground font-medium text-[15px] rounded-2xl active:scale-[0.98] transition-transform"
            >
              Start recording
            </button>
            <div className="text-muted-foreground/60 text-sm tabular-nums">
              {formatTime(timer)}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MobileRecorderControl;
