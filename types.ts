export type VocalStyle = 'Male' | 'Female';

export interface MusicDescription {
  genre: string;
  mood: string;
  arrangement: string;
  vocals: VocalStyle;
}

export interface GeneratedSong {
  title: string;
  lyrics: string;
  musicDescription: MusicDescription;
  albumArtUrl: string;
}

export interface SavedSong extends GeneratedSong {
  id: number;
  createdAt: Date;
  audioBlob: Blob;
}

export interface StyleSuggestion {
  name: string;
  description: MusicDescription;
}


export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped';
export type AppView = 'create' | 'my-songs';