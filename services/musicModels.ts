// Music generation models available in the app
export type MusicModelId = 'ace-step' | 'minimax-music-1.5' | 'minimax-music-2.6';

export interface MusicModel {
  id: MusicModelId;
  name: string;
  description: string;
  maxDuration: number; // in seconds
  durationOptions: number[];
  versionId: string;
  supports: {
    lyrics: boolean;
    tags: boolean;
    duration: boolean;
    instrumental: boolean;
    lyricsOptimizer: boolean;
  };
}

export const MUSIC_MODELS: Record<MusicModelId, MusicModel> = {
  'ace-step': {
    id: 'ace-step',
    name: 'ACE-Step',
    description: 'Fast, versatile music generation with good tag adherence',
    maxDuration: 120,
    durationOptions: [30, 60, 120],
    versionId: '280fc4f9ee507577f880a167f639c02622421d8fecf492454320311217b688f1',
    supports: {
      lyrics: true,
      tags: true,
      duration: true,
      instrumental: false,
      lyricsOptimizer: false,
    },
  },
  'minimax-music-1.5': {
    id: 'minimax-music-1.5',
    name: 'MiniMax Music 1.5',
    description: 'High-quality music with natural vocals and better coherence',
    maxDuration: 300, // 5 minutes
    durationOptions: [30, 60, 120, 180, 300],
    versionId: 'latest', // Use latest version
    supports: {
      lyrics: true,
      tags: true,
      duration: false, // MiniMax doesn't have explicit duration parameter
      instrumental: false,
      lyricsOptimizer: false,
    },
  },
  'minimax-music-2.6': {
    id: 'minimax-music-2.6',
    name: 'MiniMax Music 2.6',
    description: 'Latest MiniMax model with BPM/key control, longer songs up to 6 min, and instrumental mode',
    maxDuration: 360, // 6 minutes
    durationOptions: [60, 120, 180, 240, 360],
    versionId: 'latest',
    supports: {
      lyrics: true,
      tags: true,
      duration: false,
      instrumental: true,
      lyricsOptimizer: true,
    },
  },
};

export const DEFAULT_MODEL: MusicModelId = 'minimax-music-2.6';
