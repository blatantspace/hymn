// Core Block Engine - Orchestrates audio block generation and playback

import type {
  AudioBlock,
  CalendarEvent,
  MusicSegment,
  UserPreferences,
  VoiceSegment,
  BlockStrategy,
} from './types';
import { getUpcomingEvents } from './calendar';
import { getTopHeadlines } from './news';
import { analyzeBlock, generateMultipleSpeechSegments } from './openai';
import { getTracksForMood } from './spotify';
import { buildMusicProfile, getPersonalizedRecommendations } from './musicTaste';

/**
 * Generate a complete audio block for a specific time period
 */
export async function generateAudioBlock(
  startTime: Date,
  endTime: Date,
  spotifyAccessToken: string,
  googleAccessToken: string,
  preferences: UserPreferences
): Promise<AudioBlock> {
  // 1. Build user's music profile from Spotify
  console.log('🎵 Building music profile...');
  const musicProfile = await buildMusicProfile(spotifyAccessToken);

  // 2. Fetch calendar events for this time period
  const events = await getUpcomingEvents(googleAccessToken, 1);

  // 3. Fetch relevant news
  const news = await getTopHeadlines(preferences.newsCategories, 5);

  // 4. Use AI to analyze and create strategy (including music taste)
  const { strategy, voiceContent, musicRecommendation } = await analyzeBlock(
    events,
    news,
    preferences,
    startTime,
    musicProfile
  );

  // 5. Generate TTS audio for voice segments
  const voiceSegmentsWithAudio = await generateMultipleSpeechSegments(voiceContent);

  // 6. Create personalized music segments based on strategy and taste
  const musicSegments = await generatePersonalizedMusicSegments(
    strategy,
    spotifyAccessToken,
    musicProfile,
    3600 // 1 hour in seconds
  );

  console.log('✅ Generated block with', musicSegments.length, 'tracks based on AI recommendation');

  // 6. Assemble the block
  const block: AudioBlock = {
    id: `block-${startTime.getTime()}`,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    strategy,
    voiceContent: voiceSegmentsWithAudio,
    musicContent: musicSegments,
    generatedAt: new Date().toISOString(),
  };

  return block;
}

/**
 * Generate music segments for the block based on strategy and user's taste
 */
async function generatePersonalizedMusicSegments(
  strategy: BlockStrategy,
  spotifyAccessToken: string,
  musicProfile: any,
  durationSeconds: number
): Promise<MusicSegment[]> {
  if (strategy.musicStyle === 'silent') {
    return [];
  }

  // Get personalized recommendations based on mood and taste
  const tracks = await getPersonalizedRecommendations(
    spotifyAccessToken,
    musicProfile,
    strategy.musicStyle,
    'balanced', // Start with balanced exploration
    30
  );

  if (tracks.length === 0) {
    console.warn('No tracks found, falling back to generic recommendations');
    // Fallback to generic mood-based tracks
    const fallbackTracks = await getTracksForMood(spotifyAccessToken, strategy.musicStyle, 30);
    return createMusicSegments(fallbackTracks, strategy, durationSeconds);
  }

  return createMusicSegments(tracks, strategy, durationSeconds);
}

/**
 * Helper to create music segments from tracks
 */
function createMusicSegments(
  tracks: any[],
  strategy: BlockStrategy,
  durationSeconds: number
): MusicSegment[] {
  const segments: MusicSegment[] = [];
  let currentTime = 0;

  for (const track of tracks) {
    if (currentTime >= durationSeconds) break;

    const trackDuration = Math.floor(track.duration_ms / 1000);

    segments.push({
      timing: currentTime,
      duration: trackDuration,
      spotifyUri: track.uri,
      volume: strategy.musicVolume,
      fadeIn: currentTime === 0 ? 2 : 0,
      fadeOut: 2,
    });

    currentTime += trackDuration;
  }

  return segments;
}

/**
 * Check if a block needs regeneration
 */
export function shouldRegenerateBlock(
  block: AudioBlock,
  currentEvents: CalendarEvent[]
): boolean {
  // Regenerate if block is more than 10 minutes old
  const blockAge = Date.now() - new Date(block.generatedAt).getTime();
  if (blockAge > 10 * 60 * 1000) {
    return true;
  }

  // Regenerate if calendar events have changed
  // This is a simple check - in production you'd compare event details
  const blockStart = new Date(block.startTime);
  const blockEnd = new Date(block.endTime);

  const eventsInBlockTime = currentEvents.filter((event) => {
    const eventStart = new Date(event.start);
    return eventStart >= blockStart && eventStart < blockEnd;
  });

  // Compare by count for now (could be more sophisticated)
  const originalEventCount = block.voiceContent.filter((v) => {
    const content = v.content.toLowerCase();
    return content.includes('meeting') || content.includes('event') || content.includes('calendar');
  }).length;

  return eventsInBlockTime.length !== originalEventCount;
}

/**
 * Get the current block index based on time
 */
export function getCurrentBlockIndex(currentTime: Date = new Date()): number {
  return currentTime.getHours();
}

/**
 * Get start and end times for a specific block
 */
export function getBlockTimeRange(blockIndex: number): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  start.setHours(blockIndex, 0, 0, 0);

  const end = new Date(start);
  end.setHours(blockIndex + 1, 0, 0, 0);

  return { start, end };
}

/**
 * Calculate when to preload the next block (5 minutes before)
 */
export function getNextBlockPreloadTime(currentBlockIndex: number): Date {
  const nextBlock = getBlockTimeRange(currentBlockIndex + 1);
  const preloadTime = new Date(nextBlock.start);
  preloadTime.setMinutes(preloadTime.getMinutes() - 5);
  return preloadTime;
}

/**
 * Create a simplified block for testing/demo purposes
 */
export function createDemoBlock(): AudioBlock {
  const now = new Date();
  const start = new Date(now);
  start.setMinutes(0, 0, 0);
  const end = new Date(start);
  end.setHours(start.getHours() + 1);

  return {
    id: `demo-block-${Date.now()}`,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    strategy: {
      musicStyle: 'focus',
      musicVolume: 0.6,
      voiceFrequency: 'moderate',
      interruptionLevel: 'low',
      reasoning: 'Demo block for testing',
    },
    voiceContent: [
      {
        id: 'voice-demo-1',
        timing: 0,
        content: 'Welcome to Hymn! Your personal AI DJ is ready to guide your day.',
        duration: 5,
        priority: 'high',
      },
      {
        id: 'voice-demo-2',
        timing: 300,
        content: 'You have a focused hour ahead. I will keep the music ambient and interruptions minimal.',
        duration: 4,
        priority: 'medium',
      },
    ],
    musicContent: [],
    generatedAt: new Date().toISOString(),
  };
}

