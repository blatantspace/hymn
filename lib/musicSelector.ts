// Smart music selection using Spotify's recommendation engine

import { getTracksForMood } from './spotify';
import type { CalendarEvent, UserPreferences } from './types';

export interface MusicContext {
  timeOfDay: Date;
  events: CalendarEvent[];
  preferences: UserPreferences;
  blockIndex: number;
}

/**
 * Intelligently select music based on context
 */
export async function selectMusicForContext(
  spotifyToken: string,
  context: MusicContext
): Promise<{ uri: string; duration: number }[]> {
  const hour = context.timeOfDay.getHours();
  const dayPart = getDayPart(hour);
  const hasEvents = context.events.length > 0;
  const eventTypes = analyzeEventTypes(context.events);

  // Determine mood based on context
  const mood = determineMood(dayPart, hasEvents, eventTypes, context.blockIndex);

  console.log(`🎵 Selecting ${mood} music for ${dayPart}`, {
    events: context.events.length,
    types: eventTypes,
  });

  try {
    // Get varied tracks from Spotify
    const tracks = await getTracksForMood(spotifyToken, mood, 30);
    
    // Return tracks with variety (don't use same track twice in a row)
    const selectedTracks = selectVariedTracks(tracks, context.blockIndex);
    
    return selectedTracks.map(track => ({
      uri: track.uri,
      duration: Math.floor(track.duration_ms / 1000),
    }));
  } catch (error) {
    console.error('Failed to get Spotify recommendations:', error);
    return getFallbackTracks(mood);
  }
}

/**
 * Determine mood based on time, events, and context
 */
function determineMood(
  dayPart: string,
  hasEvents: boolean,
  eventTypes: { meetings: number; focus: number; breaks: number },
  blockIndex: number
): 'ambient' | 'focus' | 'energetic' | 'upbeat' | 'calm' {
  // Meetings = quiet/ambient music
  if (eventTypes.meetings > 0) {
    return 'ambient';
  }

  // Focus blocks = focus music
  if (eventTypes.focus > 0) {
    return 'focus';
  }

  // Break time = upbeat
  if (eventTypes.breaks > 0) {
    return 'upbeat';
  }

  // Time-based defaults
  switch (dayPart) {
    case 'early-morning': // 5-8 AM
      return 'calm';
    case 'morning': // 8-12 PM
      return blockIndex % 2 === 0 ? 'focus' : 'energetic';
    case 'afternoon': // 12-5 PM
      return blockIndex % 3 === 0 ? 'upbeat' : 'focus';
    case 'evening': // 5-9 PM
      return blockIndex % 2 === 0 ? 'ambient' : 'calm';
    case 'night': // 9 PM+
      return 'calm';
    default:
      return 'focus';
  }
}

/**
 * Get day part from hour
 */
function getDayPart(hour: number): string {
  if (hour >= 5 && hour < 8) return 'early-morning';
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Analyze calendar event types
 */
function analyzeEventTypes(events: CalendarEvent[]): {
  meetings: number;
  focus: number;
  breaks: number;
} {
  const types = { meetings: 0, focus: 0, breaks: 0 };

  events.forEach(event => {
    const summary = event.summary.toLowerCase();
    const hasAttendees = (event.attendees?.length || 0) > 0;

    if (hasAttendees || summary.includes('meeting') || summary.includes('call')) {
      types.meetings++;
    } else if (summary.includes('focus') || summary.includes('deep work')) {
      types.focus++;
    } else if (summary.includes('break') || summary.includes('lunch')) {
      types.breaks++;
    }
  });

  return types;
}

/**
 * Select varied tracks (avoid repetition)
 */
function selectVariedTracks(
  tracks: any[],
  blockIndex: number,
  count: number = 3
): any[] {
  if (tracks.length === 0) return [];

  // Use blockIndex as seed for variety
  const offset = (blockIndex * 3) % tracks.length;
  const selected: any[] = [];

  for (let i = 0; i < count && i < tracks.length; i++) {
    const trackIndex = (offset + i) % tracks.length;
    selected.push(tracks[trackIndex]);
  }

  return selected;
}

/**
 * Fallback tracks when Spotify API fails
 */
function getFallbackTracks(mood: string): { uri: string; duration: number }[] {
  const tracksByMood: Record<string, string[]> = {
    ambient: [
      'spotify:track:3n3Ppam7vgaVa1iaRUc9Lp',
      'spotify:track:6DCZcSspjsKoFjzjrWoCdn',
      'spotify:track:2374M0fQpWi3dLnB54qaLX',
    ],
    focus: [
      'spotify:track:0VjIjW4GlUZAMYd2vXMi3b',
      'spotify:track:5HCyWlXZPP0y6Gqq8TgA20',
      'spotify:track:3bidbhpOYeV4knp8AIu8Xn',
    ],
    energetic: [
      'spotify:track:0DiWol3AO6WpXZgp0goxAV',
      'spotify:track:5ChkMS8OtdzJeqyybCc9R5',
      'spotify:track:1je1IMUz1HqjHB5cA8aEV',
    ],
    upbeat: [
      'spotify:track:60nZcImufyMA1MKQY3dcCH',
      'spotify:track:2Fxmhks0bxGSBdJ92vM42m',
      'spotify:track:7qiZfU4dY1lWllzX7mPBI',
    ],
    calm: [
      'spotify:track:2ULMHTMUUQrOxP0JsvRjFi',
      'spotify:track:1yxSLGMDHlW21z4YXirZDS',
      'spotify:track:6GyFP1nfCDB8lbD2bG0Hq9',
    ],
  };

  const uris = tracksByMood[mood] || tracksByMood.focus;
  return uris.map(uri => ({ uri, duration: 180 }));
}

/**
 * Create voice content based on context with DJ personality
 */
export function generateVoiceContent(context: MusicContext, artistName?: string): string {
  const hour = context.timeOfDay.getHours();
  const dayPart = getDayPart(hour);
  const { events } = context;

  const djIntros = [
    "Hey there, it's Hymn - your personal DJ!",
    "What's up! Hymn here with your next block.",
    "Alright, tuning into your vibe right now.",
    "Hey! Let's keep this energy going.",
  ];

  const randomIntro = djIntros[context.blockIndex % djIntros.length];

  // Morning with events
  if ((dayPart === 'early-morning' || dayPart === 'morning') && events.length > 0) {
    const nextEvent = events[0];
    const eventTime = new Date(nextEvent.start);
    const timeStr = eventTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    
    if (artistName) {
      return `${randomIntro} You've got ${nextEvent.summary} at ${timeStr}. Before that, here's some ${artistName} to get you in the zone!`;
    }
    return `${randomIntro} Coming up at ${timeStr} - ${nextEvent.summary}. Let's get ready with some good vibes.`;
  }

  // Morning free time
  if (dayPart === 'early-morning' || dayPart === 'morning') {
    if (artistName) {
      return `Good morning! No meetings right now, so let's flow with ${artistName}. Time to make things happen!`;
    }
    return `${randomIntro} You've got some free time this morning. Perfect for deep work. Let's get it!`;
  }

  // Afternoon with events
  if (dayPart === 'afternoon' && events.length > 0) {
    const nextEvent = events[0];
    if (artistName) {
      return `Quick heads up - ${nextEvent.summary} coming soon. But first, jamming out to ${artistName}. Stay focused!`;
    }
    return `Afternoon check-in! You've got ${nextEvent.summary} on deck. Here's some energy to keep you sharp.`;
  }

  // Afternoon free
  if (dayPart === 'afternoon') {
    if (artistName) {
      return `${randomIntro} Afternoon vibes with ${artistName}. You're crushing it today!`;
    }
    return `Afternoon energy! You're in the flow. Keep that momentum going strong!`;
  }

  // Evening wind-down
  if (dayPart === 'evening' || dayPart === 'night') {
    if (events.length > 0) {
      return `Evening mode! Still got ${events[0].summary} on your calendar. Let's finish strong.`;
    }
    if (artistName) {
      return `Evening vibes! Winding down with ${artistName}. You earned this.`;
    }
    return `Evening session! Time to relax and recharge. Great work today!`;
  }

  // Default with variety
  const defaultMessages = [
    artistName ? `Love this track! ${artistName} always delivers. Stay in your flow!` : 'Staying focused. You\'re doing amazing!',
    'Quick check-in - how are you feeling? Keep up the great energy!',
    artistName ? `Here comes ${artistName}! This one's a vibe.` : 'Perfect soundtrack for right now. Let\'s go!',
  ];

  return defaultMessages[context.blockIndex % defaultMessages.length];
}

