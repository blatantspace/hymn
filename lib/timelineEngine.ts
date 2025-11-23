// Radio Timeline Engine - Generates persistent broadcast timeline

import { prisma } from './prisma';
import type { CalendarEvent, UserPreferences } from './types';
import { buildMusicProfile, getPersonalizedRecommendations } from './musicTaste';
import { getUpcomingEvents } from './calendar';
import { analyzeBlock } from './openai';
import { getTopHeadlines } from './news';

/**
 * Get or create today's timeline for a user
 */
export async function getOrCreateTimeline(
  userId: string,
  spotifyToken: string,
  googleToken?: string
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if timeline exists for today
  let timeline = await prisma.timeline.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    include: {
      items: {
        orderBy: { timestamp: 'asc' },
      },
    },
  });

  if (!timeline) {
    console.log('📻 Creating new radio timeline for', userId);
    timeline = await createTimeline(userId, spotifyToken, googleToken);
  } else {
    console.log('📻 Found existing timeline with', timeline.items.length, 'items');
    
    // Lock all past items
    await lockPastItems(timeline.id);
    
    // Regenerate future if needed
    const now = new Date();
    if (timeline.generatedUntil < new Date(now.getTime() + 4 * 60 * 60 * 1000)) {
      console.log('🔄 Regenerating future timeline...');
      await regenerateFuture(timeline.id, userId, spotifyToken, googleToken);
    }
  }

  return timeline;
}

/**
 * Create a new timeline with FOMO history
 * Generates from 8 AM today → now + 4 hours
 * Everything before "now" is marked as "already aired" (locked)
 */
async function createTimeline(
  userId: string,
  spotifyToken: string,
  googleToken?: string
) {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  // Start timeline at 8 AM (when most people start their day)
  const timelineStart = new Date(today);
  timelineStart.setHours(8, 0, 0, 0);
  
  // If it's before 8 AM, use midnight
  const startTime = now < timelineStart ? today : timelineStart;
  
  const fourHoursAhead = new Date(now.getTime() + 4 * 60 * 60 * 1000);

  console.log('📻 Creating FOMO timeline:', {
    from: startTime.toLocaleString(),
    now: now.toLocaleString(),
    until: fourHoursAhead.toLocaleString(),
    missedHours: Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60 * 60)),
  });

  // Create timeline record
  const timeline = await prisma.timeline.create({
    data: {
      userId,
      date: today,
      startTime: startTime,
      currentPosition: now,
      generatedUntil: fourHoursAhead,
    },
  });

  // Generate "past" (8 AM → now) - locked, FOMO content
  await generateTimelineItems(timeline.id, userId, startTime, now, spotifyToken, googleToken, true);
  
  // Generate "future" (now → +4 hours) - unlocked, flexible
  await generateTimelineItems(timeline.id, userId, now, fourHoursAhead, spotifyToken, googleToken, false);

  return prisma.timeline.findUnique({
    where: { id: timeline.id },
    include: { items: { orderBy: { timestamp: 'asc' } } },
  });
}

/**
 * Generate timeline items for a time range
 * @param lockAll - If true, marks all items as locked (for past/FOMO content)
 */
async function generateTimelineItems(
  timelineId: string,
  userId: string,
  startTime: Date,
  endTime: Date,
  spotifyToken: string,
  googleToken?: string,
  lockAll: boolean = false
) {
  // 1. Build user's music profile
  console.log('🎵 Building music profile for timeline...');
  const musicProfile = await buildMusicProfile(spotifyToken);

  // 2. Get user preferences
  const userPrefs = await prisma.userPreferences.findUnique({
    where: { userId },
  });

  const preferences: UserPreferences = {
    newsCategories: userPrefs?.newsCategories || ['technology'],
    musicMoods: userPrefs?.musicMoods || ['focus'],
    interruptionLevel: (userPrefs?.interruptionLevel as any) || 'moderate',
  };

  // 3. Get calendar events
  let calendarEvents: CalendarEvent[] = [];
  if (googleToken) {
    calendarEvents = await getUpcomingEvents(googleToken, 4);
  }

  // 4. Get news
  const news = await getTopHeadlines(preferences.newsCategories, 5);

  // 5. Generate timeline hour by hour
  let currentTime = new Date(startTime);
  const items: any[] = [];

  while (currentTime < endTime) {
    const hourEnd = new Date(currentTime.getTime() + 60 * 60 * 1000);

    // Analyze this hour with AI
    const { strategy, voiceContent, musicRecommendation } = await analyzeBlock(
      calendarEvents,
      news,
      preferences,
      currentTime,
      musicProfile
    );

    console.log(`🎯 ${currentTime.toLocaleTimeString()}: ${strategy.musicStyle} - ${musicRecommendation}`);

    // Get personalized tracks for this hour
    // Try recommendations first, fall back to user's actual library
    let tracks;
    try {
      tracks = await getPersonalizedRecommendations(
        spotifyToken,
        musicProfile,
        strategy.musicStyle,
        preferences.explorationLevel as any || 'balanced',
        15
      );
    } catch (error) {
      console.log('Using tracks from user library instead of recommendations');
      // Use user's top tracks mixed with recent plays
      tracks = [
        ...musicProfile.topTracks.slice(0, 10),
        ...musicProfile.recentlyPlayed.slice(0, 5),
      ].map(t => ({
        uri: t.uri,
        name: t.name,
        artists: [{ name: t.artist }],
        duration_ms: 200000, // ~3:20
        album: { images: [] },
      }));
    }

    // Add tracks to timeline
    let trackTime = new Date(currentTime);
    for (const track of tracks.slice(0, 10)) { // ~10 tracks per hour
      if (trackTime >= hourEnd) break;

      items.push({
        timelineId,
        type: 'spotify_track', // Updated type for flexibility
        timestamp: new Date(trackTime),
        duration: Math.floor(track.duration_ms / 1000),
        locked: lockAll || trackTime < new Date(), // Lock if generating past or if in the past
        title: track.name,
        artist: track.artists[0]?.name,
        imageUrl: track.album?.images[0]?.url,
        spotifyUri: track.uri,
        mood: strategy.musicStyle,
        volume: strategy.musicVolume,
      });

      trackTime = new Date(trackTime.getTime() + track.duration_ms);
    }

    // Add voice segments
    for (const voice of voiceContent) {
      const voiceTime = new Date(currentTime.getTime() + voice.timing * 1000);
      if (voiceTime >= hourEnd) break;

      items.push({
        timelineId,
        type: 'voice',
        timestamp: voiceTime,
        duration: voice.duration,
        locked: lockAll || voiceTime < new Date(),
        title: 'DJ Update',
        voiceContent: voice.content,
        priority: voice.priority,
        mood: strategy.musicStyle,
      });
    }

    currentTime = hourEnd;
  }

  // Bulk create all items
  await prisma.timelineItem.createMany({
    data: items,
  });

  console.log(`✅ Generated ${items.length} timeline items`);
}

/**
 * Lock all items in the past
 */
async function lockPastItems(timelineId: string) {
  const now = new Date();
  
  await prisma.timelineItem.updateMany({
    where: {
      timelineId,
      timestamp: { lt: now },
      locked: false,
    },
    data: {
      locked: true,
    },
  });
}

/**
 * Regenerate future timeline items
 */
async function regenerateFuture(
  timelineId: string,
  userId: string,
  spotifyToken: string,
  googleToken?: string
) {
  const now = new Date();
  const fourHoursAhead = new Date(now.getTime() + 4 * 60 * 60 * 1000);

  // Delete unlocked future items
  await prisma.timelineItem.deleteMany({
    where: {
      timelineId,
      timestamp: { gte: now },
      locked: false,
    },
  });

  // Generate new future items
  await generateTimelineItems(timelineId, userId, now, fourHoursAhead, spotifyToken, googleToken);

  // Update timeline's generatedUntil
  await prisma.timeline.update({
    where: { id: timelineId },
    data: { generatedUntil: fourHoursAhead },
  });
}

/**
 * Get current item playing based on timestamp
 */
export async function getCurrentItem(timelineId: string) {
  const now = new Date();

  // Find the item that should be playing now
  const item = await prisma.timelineItem.findFirst({
    where: {
      timelineId,
      timestamp: { lte: now },
    },
    orderBy: { timestamp: 'desc' },
  });

  return item;
}

/**
 * Get upcoming items in timeline
 */
export async function getUpcomingItems(timelineId: string, limit: number = 10) {
  const now = new Date();

  return prisma.timelineItem.findMany({
    where: {
      timelineId,
      timestamp: { gt: now },
    },
    orderBy: { timestamp: 'asc' },
    take: limit,
  });
}

/**
 * Get timeline items for a time range (for replaying past)
 */
export async function getTimelineRange(
  timelineId: string,
  startTime: Date,
  endTime: Date
) {
  return prisma.timelineItem.findMany({
    where: {
      timelineId,
      timestamp: {
        gte: startTime,
        lt: endTime,
      },
    },
    orderBy: { timestamp: 'asc' },
  });
}

/**
 * Update timeline position (playhead)
 */
export async function updatePlayheadPosition(timelineId: string, position: Date) {
  return prisma.timeline.update({
    where: { id: timelineId },
    data: { currentPosition: position },
  });
}

