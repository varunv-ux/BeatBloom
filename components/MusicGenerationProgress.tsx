import React, { useState, useEffect } from 'react';
import { Loader as PromptKitLoader } from './ui/loader';

interface MusicGenerationProgressProps {
  isGenerating: boolean;
  onCancel: () => void;
}

const STAGES = [
  { label: 'Warming up the instruments...', minTime: 0 },
  { label: 'Composing the melody...', minTime: 12 },
  { label: 'Layering harmonies...', minTime: 30 },
  { label: 'Mixing the tracks...', minTime: 60 },
  { label: 'Adding final touches...', minTime: 120 },
  { label: 'Almost there, hang tight...', minTime: 180 },
];

function getStageLabel(elapsed: number): string {
  let label = STAGES[0].label;
  for (const stage of STAGES) {
    if (elapsed >= stage.minTime) label = stage.label;
  }
  return label;
}

function formatElapsed(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

const MusicGenerationProgress: React.FC<MusicGenerationProgressProps> = ({ isGenerating, onCancel }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      setElapsed(0);
      return;
    }
    const interval = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  if (!isGenerating) return null;

  const stageLabel = getStageLabel(elapsed);

  return (
    <div className="flex flex-col items-center gap-4 p-5 bg-stone-100 dark:bg-stone-800 rounded-2xl">
      <PromptKitLoader variant="wave" size="lg" />

      <div className="text-center space-y-1">
        <PromptKitLoader variant="text-shimmer" size="md" text={stageLabel} />
        <p className="text-xs text-muted-foreground tabular-nums">
          Elapsed: {formatElapsed(elapsed)} · Usually takes 1–3 minutes
        </p>
      </div>

      <button
        onClick={onCancel}
        className="px-4 py-2 text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-xl transition-colors"
      >
        Cancel
      </button>
    </div>
  );
};

export default MusicGenerationProgress;
