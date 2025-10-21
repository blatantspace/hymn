// Get current timeline for logged-in user

import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateTimeline, getCurrentItem, getUpcomingItems } from '@/lib/timelineEngine';

export async function GET(request: NextRequest) {
  try {
    const spotifyToken = request.cookies.get('spotify_access_token')?.value;
    const googleToken = request.cookies.get('google_access_token')?.value;

    if (!spotifyToken) {
      return NextResponse.json(
        { error: 'Not authenticated with Spotify' },
        { status: 401 }
      );
    }

    // For now, use a demo user ID (in production, this would come from session)
    const userId = 'demo-user';

    // Get or create today's timeline
    const timeline = await getOrCreateTimeline(userId, spotifyToken, googleToken);

    if (!timeline) {
      return NextResponse.json({ error: 'Failed to create timeline' }, { status: 500 });
    }

    // Get current item
    const currentItem = await getCurrentItem(timeline.id);

    // Get upcoming items
    const upcomingItems = await getUpcomingItems(timeline.id, 20);

    return NextResponse.json({
      timeline: {
        id: timeline.id,
        date: timeline.date,
        currentPosition: timeline.currentPosition,
        generatedUntil: timeline.generatedUntil,
      },
      currentItem,
      upcomingItems,
      allItems: timeline.items,
    });
  } catch (error) {
    console.error('Timeline fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

