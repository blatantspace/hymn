// Flexible audio segment system - supports multiple audio sources

export type AudioSegmentType = 
  | 'spotify_track'
  | 'audio_file'
  | 'voice'
  | 'live_stream'
  | 'podcast';

export interface AudioSegment {
  id: string;
  type: AudioSegmentType;
  timestamp: Date;
  duration: number;
  locked: boolean;
  
  // Universal fields
  title?: string;
  artist?: string;
  imageUrl?: string;
  
  // Source URIs
  spotifyUri?: string;
  audioFileUrl?: string;
  streamUrl?: string;
  
  // Voice fields
  voiceContent?: string;
  voiceAudioUrl?: string;
  priority?: 'low' | 'medium' | 'high';
  
  // Metadata
  mood?: string;
  volume: number;
  fadeIn?: number;
  fadeOut?: number;
  metadata?: Record<string, any>;
}

/**
 * Get the playback source for a segment
 */
export function getSegmentSource(segment: AudioSegment): {
  type: string;
  url: string;
} | null {
  // Priority order for sources
  if (segment.spotifyUri) {
    return { type: 'spotify', url: segment.spotifyUri };
  }
  
  if (segment.audioFileUrl) {
    return { type: 'file', url: segment.audioFileUrl };
  }
  
  if (segment.streamUrl) {
    return { type: 'stream', url: segment.streamUrl };
  }
  
  if (segment.voiceAudioUrl) {
    return { type: 'voice', url: segment.voiceAudioUrl };
  }
  
  return null;
}

/**
 * Check if segment can be played
 */
export function isPlayable(segment: AudioSegment): boolean {
  const source = getSegmentSource(segment);
  return source !== null;
}

/**
 * Create a Spotify track segment
 */
export function createSpotifySegment(
  timestamp: Date,
  track: any,
  locked: boolean = false
): Omit<AudioSegment, 'id'> {
  return {
    type: 'spotify_track',
    timestamp,
    duration: Math.floor(track.duration_ms / 1000),
    locked,
    title: track.name,
    artist: track.artists?.[0]?.name,
    imageUrl: track.album?.images?.[0]?.url,
    spotifyUri: track.uri,
    volume: 0.7,
    fadeIn: 2,
    fadeOut: 2,
  };
}

/**
 * Create an audio file segment (uploaded MP3, etc.)
 */
export function createAudioFileSegment(
  timestamp: Date,
  fileUrl: string,
  duration: number,
  title: string,
  locked: boolean = false
): Omit<AudioSegment, 'id'> {
  return {
    type: 'audio_file',
    timestamp,
    duration,
    locked,
    title,
    audioFileUrl: fileUrl,
    volume: 0.7,
    fadeIn: 1,
    fadeOut: 1,
  };
}

/**
 * Create a voice segment
 */
export function createVoiceSegment(
  timestamp: Date,
  content: string,
  duration: number,
  locked: boolean = false
): Omit<AudioSegment, 'id'> {
  return {
    type: 'voice',
    timestamp,
    duration,
    locked,
    title: 'DJ Update',
    voiceContent: content,
    volume: 1.0,
  };
}

/**
 * Create a live stream segment (future feature)
 */
export function createLiveStreamSegment(
  timestamp: Date,
  streamUrl: string,
  title: string,
  artist?: string
): Omit<AudioSegment, 'id'> {
  return {
    type: 'live_stream',
    timestamp,
    duration: 0, // Live streams have no fixed duration
    locked: false, // Live streams can't be locked
    title,
    artist,
    streamUrl,
    volume: 0.7,
  };
}

/**
 * Create a podcast episode segment (future feature)
 */
export function createPodcastSegment(
  timestamp: Date,
  audioUrl: string,
  duration: number,
  title: string,
  host: string,
  imageUrl?: string,
  locked: boolean = false
): Omit<AudioSegment, 'id'> {
  return {
    type: 'podcast',
    timestamp,
    duration,
    locked,
    title,
    artist: host,
    imageUrl,
    audioFileUrl: audioUrl,
    volume: 0.7,
    metadata: {
      episodeNumber: null,
      showName: null,
    },
  };
}

