// Radio-style block scheduler with 30-minute segments

import type { AudioBlock, CalendarEvent, UserPreferences } from './types';
import { getUpcomingEvents } from './calendar';
import { getTopHeadlines } from './news';
import { analyzeBlock, generateMultipleSpeechSegments } from './openai';
import { getTracksForMood } from './spotify';

const BLOCK_DURATION_MINUTES = 30;
const PRELOAD_HOURS = 12;
const BLOCKS_TO_GENERATE = (PRELOAD_HOURS * 60) / BLOCK_DURATION_MINUTES; // 24 blocks

/**
 * Generate 12 hours worth of 30-minute blocks
 */
export async function generateBlockSchedule(
  spotifyToken: string,
  googleToken: string,
  preferences: UserPreferences
): Promise<AudioBlock[]> {
  const blocks: AudioBlock[] = [];
  const now = new Date();

  console.log(`🎙️ Generating ${BLOCKS_TO_GENERATE} blocks (${PRELOAD_HOURS} hours)...`);

  for (let i = 0; i < BLOCKS_TO_GENERATE; i++) {
    const blockStart = new Date(now);
    blockStart.setMinutes(Math.floor(blockStart.getMinutes() / 30) * 30, 0, 0);
    blockStart.setMinutes(blockStart.getMinutes() + (i * BLOCK_DURATION_MINUTES));

    const blockEnd = new Date(blockStart);
    blockEnd.setMinutes(blockEnd.getMinutes() + BLOCK_DURATION_MINUTES);

    try {
      const block = await generateRadioBlock(
        blockStart,
        blockEnd,
        spotifyToken,
        googleToken,
        preferences,
        i
      );
      blocks.push(block);
    } catch (error) {
      console.error(`Failed to generate block ${i}:`, error);
      // Use fallback block
      blocks.push(createFallbackBlock(blockStart, blockEnd, i));
    }
  }

  console.log(`✅ Generated ${blocks.length} blocks successfully`);
  return blocks;
}

/**
 * Generate a single radio-style 30-minute block
 */
async function generateRadioBlock(
  startTime: Date,
  endTime: Date,
  spotifyToken: string,
  googleToken: string,
  preferences: UserPreferences,
  blockIndex: number
): Promise<AudioBlock> {
  // Fetch calendar events for this block
  const events = await getUpcomingEvents(googleToken, 0.5); // 30 minutes

  // Fetch news (cached, only update every few hours)
  const news = await getTopHeadlines(preferences.newsCategories, 5);

  // Use AI to analyze and create strategy
  const { strategy, voiceContent } = await analyzeBlock(
    events,
    news,
    preferences,
    startTime
  );

  // Structure like radio: Music → Voice → Music → Voice
  const radioSegments = createRadioSegments(strategy, voiceContent);

  // Generate TTS for voice segments
  const voiceWithAudio = await generateMultipleSpeechSegments(radioSegments.voice);

  // Get music for the block
  const musicSegments = await generateMusicForBlock(
    spotifyToken,
    strategy.musicStyle,
    radioSegments.musicDurations
  );

  return {
    id: `block-${startTime.getTime()}`,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    strategy,
    voiceContent: voiceWithAudio,
    musicContent: musicSegments,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Create radio-style segment timing (like a real radio station)
 */
function createRadioSegments(strategy: any, voiceContent: any[]) {
  const BLOCK_SECONDS = BLOCK_DURATION_MINUTES * 60; // 1800 seconds

  // Radio format: 
  // - 13 min music (780s)
  // - 1 min voice update (60s)
  // - 15 min music (900s)
  // - 1 min voice update (60s)
  
  const segments = {
    voice: [
      {
        ...voiceContent[0],
        timing: 780, // 13 minutes in
        duration: 60,
      },
      {
        ...voiceContent[1],
        timing: 1740, // 29 minutes in
        duration: 60,
      },
    ].filter(v => v.content),
    musicDurations: [
      { start: 0, duration: 780 },      // First music segment
      { start: 840, duration: 900 },    // Second music segment
    ],
  };

  return segments;
}

/**
 * Generate music segments to fill specific durations
 */
async function generateMusicForBlock(
  spotifyToken: string,
  musicStyle: string,
  durations: Array<{ start: number; duration: number }>
): Promise<any[]> {
  const tracks = await getTracksForMood(spotifyToken, musicStyle, 20);
  const segments: any[] = [];

  for (const { start, duration } of durations) {
    let currentTime = start;
    let tracksNeeded = Math.ceil(duration / 180); // Assume ~3 min per track

    for (let i = 0; i < tracksNeeded && i < tracks.length; i++) {
      const track = tracks[i];
      const trackDuration = Math.min(
        Math.floor(track.duration_ms / 1000),
        start + duration - currentTime
      );

      segments.push({
        timing: currentTime,
        duration: trackDuration,
        spotifyUri: track.uri,
        volume: 0.7,
        fadeIn: currentTime === start ? 2 : 0,
        fadeOut: 1,
      });

      currentTime += trackDuration;

      if (currentTime >= start + duration) break;
    }
  }

  return segments;
}

/**
 * Create a fallback block when AI generation fails
 */
function createFallbackBlock(
  startTime: Date,
  endTime: Date,
  blockIndex: number
): AudioBlock {
  const demoTracks = [
    'spotify:track:3n3Ppam7vgaVa1iaRUc9Lp',
    'spotify:track:5HCyWlXZPP0y6Gqq8TgA20',
    'spotify:track:0VjIjW4GlUZAMYd2vXMi3b',
    'spotify:track:6DCZcSspjsKoFjzjrWoCdn',
  ];

  return {
    id: `fallback-block-${startTime.getTime()}`,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    strategy: {
      musicStyle: ['focus', 'ambient', 'energetic', 'upbeat'][blockIndex % 4] as any,
      musicVolume: 0.7,
      voiceFrequency: 'moderate',
      interruptionLevel: 'low',
      reasoning: 'Demo mode - AI unavailable',
    },
    voiceContent: [],
    musicContent: [
      {
        timing: 0,
        duration: 1800, // Full 30 minutes
        spotifyUri: demoTracks[blockIndex % demoTracks.length],
        volume: 0.7,
      },
    ],
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Check if calendar has changed since blocks were generated
 */
export async function hasCalendarChanged(
  googleToken: string,
  blocks: AudioBlock[],
  hoursToCheck: number = 12
): Promise<boolean> {
  try {
    const currentEvents = await getUpcomingEvents(googleToken, hoursToCheck);
    
    // Simple check: count events in the time range
    // In production, you'd do deep comparison of event IDs
    const blockTimeRange = {
      start: new Date(blocks[0].startTime),
      end: new Date(blocks[blocks.length - 1].endTime),
    };

    const eventsInRange = currentEvents.filter(event => {
      const eventStart = new Date(event.start);
      return eventStart >= blockTimeRange.start && eventStart <= blockTimeRange.end;
    });

    // Count voice segments that mention calendar/meetings
    const calendarMentions = blocks.reduce((count, block) => {
      return count + block.voiceContent.filter(v => 
        v.content.toLowerCase().includes('meeting') ||
        v.content.toLowerCase().includes('event') ||
        v.content.toLowerCase().includes('calendar')
      ).length;
    }, 0);

    const hasChanged = eventsInRange.length !== calendarMentions;
    
    if (hasChanged) {
      console.log('📅 Calendar changed! Events:', eventsInRange.length, 'Expected:', calendarMentions);
    }

    return hasChanged;
  } catch (error) {
    console.error('Error checking calendar changes:', error);
    return false;
  }
}

/**
 * Get current block index based on 30-minute segments
 */
export function getCurrentBlockIndex(): number {
  const now = new Date();
  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
  return Math.floor(minutesSinceMidnight / BLOCK_DURATION_MINUTES);
}

/**
 * Calculate when to regenerate blocks (every 30 minutes)
 */
export function getNextRegenerationTime(): Date {
  const now = new Date();
  const currentMinutes = now.getMinutes();
  const nextSlot = Math.ceil((currentMinutes + 1) / 30) * 30;
  
  const nextTime = new Date(now);
  if (nextSlot >= 60) {
    nextTime.setHours(now.getHours() + 1, nextSlot - 60, 0, 0);
  } else {
    nextTime.setMinutes(nextSlot, 0, 0);
  }
  
  return nextTime;
}

