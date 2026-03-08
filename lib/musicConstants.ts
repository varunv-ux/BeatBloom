import type { VocalStyle, StyleSuggestion } from '../types';

export const GENRE_OPTIONS = [
  "Pop", "Rock", "Hip Hop", "Electronic", "Folk / Country",
  "R&B / Soul", "Jazz", "Orchestral", "Kids / Nursery Rhyme",
  "Ambient", "Classical", "Reggae",
];

export const MOOD_OPTIONS = [
  "Happy", "Sad", "Energetic", "Relaxing", "Romantic",
  "Epic", "Nostalgic", "Sentimental", "Playful", "Mysterious", "Hopeful",
];

export const ARRANGEMENT_OPTIONS = [
  "Full Band", "Acoustic", "Electronic", "Orchestral",
  "Simple Acoustic", "Synth & Drums",
];

export const VOCAL_OPTIONS: VocalStyle[] = ["Male", "Female"];

export const GENRE_TAG_MAP: Record<string, string> = {
  'pop': 'pop, catchy, mainstream, upbeat',
  'rock': 'rock, guitar, drums, powerful',
  'hip hop': 'hip-hop, rap, beats, urban',
  'electronic': 'electronic, synthesizer, digital, modern',
  'folk / country': 'folk, country, acoustic, traditional',
  'r&b / soul': 'r&b, soul, smooth, rhythm',
  'jazz': 'jazz, improvisation, saxophone, smooth',
  'orchestral': 'orchestral, classical, symphony, grand',
  'kids / nursery rhyme': 'kids, nursery-rhyme, children, playful',
  'ambient': 'ambient, atmospheric, ethereal, calm',
  'classical': 'classical, piano, strings, elegant',
  'reggae': 'reggae, caribbean, relaxed, rhythmic',
};

export const MOOD_TAG_MAP: Record<string, string> = {
  'happy': 'happy, uplifting, cheerful, bright',
  'sad': 'sad, melancholic, emotional, slow',
  'energetic': 'energetic, high-energy, fast, dynamic',
  'relaxing': 'relaxing, calm, peaceful, soothing',
  'romantic': 'romantic, love, intimate, tender',
  'epic': 'epic, cinematic, grand, powerful',
  'nostalgic': 'nostalgic, memories, wistful, reflective',
  'sentimental': 'sentimental, touching, emotional, heartfelt',
  'playful': 'playful, fun, light-hearted, bouncy',
  'mysterious': 'mysterious, dark, enigmatic, suspenseful',
  'hopeful': 'hopeful, optimistic, inspiring, uplifting',
};

export const STYLE_SUGGESTIONS: StyleSuggestion[] = [
  { name: 'Synth Pop', description: { genre: 'Electronic', mood: 'Nostalgic', arrangement: 'Synth & Drums', vocals: 'Female' } },
  { name: 'Acoustic Folk', description: { genre: 'Folk / Country', mood: 'Sentimental', arrangement: 'Acoustic', vocals: 'Male' } },
  { name: 'Epic Cinematic', description: { genre: 'Orchestral', mood: 'Epic', arrangement: 'Orchestral', vocals: 'Male' } },
  { name: 'Chill Ambient', description: { genre: 'Ambient', mood: 'Relaxing', arrangement: 'Electronic', vocals: 'Female' } },
  { name: 'Playful Pop', description: { genre: 'Pop', mood: 'Playful', arrangement: 'Full Band', vocals: 'Female' } },
  { name: 'Mysterious Jazz', description: { genre: 'Jazz', mood: 'Mysterious', arrangement: 'Acoustic', vocals: 'Male' } },
  { name: 'Hopeful Classical', description: { genre: 'Classical', mood: 'Hopeful', arrangement: 'Orchestral', vocals: 'Female' } },
  { name: 'Reggae Vibes', description: { genre: 'Reggae', mood: 'Happy', arrangement: 'Full Band', vocals: 'Male' } },
];

/**
 * Build the tags string from a music description for the music generation API.
 */
export function buildTagsString(genre: string, mood: string, arrangement: string, vocals: string): string {
  const expandedGenre = GENRE_TAG_MAP[genre.toLowerCase()] || genre.toLowerCase();
  const expandedMood = MOOD_TAG_MAP[mood.toLowerCase()] || mood.toLowerCase();
  return `${expandedGenre}, ${expandedMood}, ${arrangement.toLowerCase()}, ${vocals.toLowerCase()} vocals`;
}

/**
 * Format lyrics with verse/chorus structure for the music model if not already structured.
 */
export function formatLyricsForModel(lyrics: string): string {
  if (lyrics.includes('[verse]') || lyrics.includes('[chorus]') || lyrics.includes('[Verse')) {
    return lyrics;
  }
  const lines = lyrics.split('\n').filter(line => line.trim());
  if (lines.length > 0) {
    return `[verse]\n${lines.join('\n')}\n\n[chorus]\n${lines.join('\n')}`;
  }
  return lyrics;
}
