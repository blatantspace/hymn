// Core type definitions for Hymn

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string; // ISO timestamp
  end: string; // ISO timestamp
  location?: string;
  attendees?: string[];
}

export interface AudioBlock {
  id: string;
  startTime: string; // ISO timestamp
  endTime: string; // ISO timestamp
  strategy: BlockStrategy;
  voiceContent: VoiceSegment[];
  musicContent: MusicSegment[];
  generatedAt: string;
}

export interface BlockStrategy {
  musicStyle: 'ambient' | 'focus' | 'energetic' | 'upbeat' | 'calm' | 'silent';
  musicVolume: number; // 0-1
  voiceFrequency: 'none' | 'minimal' | 'moderate' | 'active';
  interruptionLevel: 'none' | 'low' | 'medium' | 'high';
  reasoning: string; // AI's explanation for this strategy
}

export interface VoiceSegment {
  id: string;
  timing: number; // seconds from block start
  content: string;
  duration: number; // seconds
  audioUrl?: string; // TTS generated audio URL
  priority: 'low' | 'medium' | 'high';
}

export interface MusicSegment {
  timing: number; // seconds from block start
  duration: number; // seconds
  spotifyUri?: string;
  playlistId?: string;
  volume: number; // 0-1
  fadeIn?: number; // seconds
  fadeOut?: number; // seconds
}

export interface NewsItem {
  title: string;
  description: string;
  source: string;
  url: string;
  publishedAt: string;
  category: string;
}

export interface UserPreferences {
  newsCategories: string[];
  musicMoods: string[];
  focusHours?: { start: string; end: string }[];
  interruptionLevel: 'minimal' | 'moderate' | 'active';
  voiceType?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  explorationLevel?: 'familiar' | 'balanced' | 'explorative';
}

export interface TimelineItem {
  id: string;
  type: 'track' | 'voice';
  timestamp: Date;
  duration: number;
  locked: boolean;
  
  // Track fields
  spotifyUri?: string;
  trackName?: string;
  artistName?: string;
  albumArt?: string;
  
  // Voice fields
  voiceContent?: string;
  voiceAudioUrl?: string;
  priority?: string;
  
  mood?: string;
  volume: number;
}

export interface RadioTimeline {
  id: string;
  userId: string;
  date: Date;
  startTime: Date;
  currentPosition: Date;
  generatedUntil: Date;
  items: TimelineItem[];
}

export interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface UserSession {
  userId: string;
  spotifyTokens?: SpotifyTokens;
  googleTokens?: GoogleTokens;
  preferences?: UserPreferences;
}

