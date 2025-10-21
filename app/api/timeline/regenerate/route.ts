// Regenerate future timeline (called every 5 minutes)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { timelineId } = await request.json();
    
    const spotifyToken = request.cookies.get('spotify_access_token')?.value;
    const googleToken = request.cookies.get('google_access_token')?.value;

    if (!spotifyToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const timeline = await prisma.timeline.findUnique({
      where: { id: timelineId },
    });

    if (!timeline) {
      return NextResponse.json({ error: 'Timeline not found' }, { status: 404 });
    }

    // Import and use regeneration logic
    const { getOrCreateTimeline } = await import('@/lib/timelineEngine');
    await getOrCreateTimeline(timeline.userId, spotifyToken, googleToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Regeneration error:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate timeline' },
      { status: 500 }
    );
  }
}

